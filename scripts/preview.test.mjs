import { test } from "node:test";
import assert from "node:assert/strict";
import { get } from "node:http";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { startPreviewServer } from "./preview.mjs";

function fixtureSite() {
  const dir = mkdtempSync(join(tmpdir(), "preview-test-"));
  writeFileSync(join(dir, "index.html"), "<!doctype html><p>home</p>");
  writeFileSync(join(dir, "404.html"), "<!doctype html><p>missing</p>");
  writeFileSync(join(dir, "app.js"), "console.log('x');");
  writeFileSync(join(dir, "card.vcf"), "BEGIN:VCARD");
  writeFileSync(join(dir, "_headers"), "/*\n  X-Test: all\n\n/card.vcf\n  Content-Disposition: attachment\n\n/wild/*\n  X-Wild: yes\n");
  return dir;
}

function fetchRaw(port, path, headers = {}) {
  return new Promise((resolve, reject) => {
    get({ host: "127.0.0.1", port, path, headers }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
    }).on("error", reject);
  });
}

test("serves clean URLs, applies the /* and exact-path header blocks, and sends 404.html with a 404", async () => {
  const server = await startPreviewServer({ outDir: fixtureSite(), port: 0 });
  try {
    const home = await fetchRaw(server.port, "/");
    assert.equal(home.status, 200);
    assert.equal(home.headers["x-test"], "all");
    assert.match(home.body.toString(), /home/);
    const card = await fetchRaw(server.port, "/card.vcf");
    assert.equal(card.headers["content-disposition"], "attachment");
    assert.equal(card.headers["x-test"], "all");
    const missing = await fetchRaw(server.port, "/nope");
    assert.equal(missing.status, 404);
    assert.match(missing.body.toString(), /missing/);
    assert.equal(missing.headers["content-disposition"], undefined);
  } finally {
    await server.close();
  }
});

test("files are sent as they are: no compression, even when the browser accepts gzip", async () => {
  const server = await startPreviewServer({ outDir: fixtureSite(), port: 0 });
  try {
    const res = await fetchRaw(server.port, "/app.js", { "accept-encoding": "gzip, br" });
    assert.equal(res.headers["content-encoding"], undefined);
    assert.equal(res.body.toString(), "console.log('x');");
  } finally {
    await server.close();
  }
});
