import { test } from "node:test";
import assert from "node:assert/strict";
import { get } from "node:http";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import { startPreviewServer } from "./preview.mjs";

function fixtureSite() {
  const dir = mkdtempSync(join(tmpdir(), "preview-test-"));
  writeFileSync(join(dir, "index.html"), "<!doctype html><p>home</p>");
  writeFileSync(join(dir, "404.html"), "<!doctype html><p>missing</p>");
  writeFileSync(join(dir, "app.js"), "console.log('x');".repeat(50));
  writeFileSync(join(dir, "photo.webp"), Buffer.from([0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4]));
  writeFileSync(join(dir, "font.woff2"), Buffer.from([0x77, 0x4f, 0x46, 0x32, 9, 9]));
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

test("text files are gzipped when the browser accepts gzip, and plain when it does not", async () => {
  const server = await startPreviewServer({ outDir: fixtureSite(), port: 0 });
  try {
    const zipped = await fetchRaw(server.port, "/app.js", { "accept-encoding": "gzip, deflate, br" });
    assert.equal(zipped.headers["content-encoding"], "gzip");
    assert.equal(gunzipSync(zipped.body).toString(), "console.log('x');".repeat(50));
    assert.equal(zipped.headers.vary, "Accept-Encoding");
    const plain = await fetchRaw(server.port, "/app.js");
    assert.equal(plain.headers["content-encoding"], undefined);
    assert.equal(plain.headers.vary, "Accept-Encoding");
    assert.equal(plain.body.toString(), "console.log('x');".repeat(50));
    const page = await fetchRaw(server.port, "/", { "accept-encoding": "gzip" });
    assert.equal(page.headers["content-encoding"], "gzip");
    assert.match(gunzipSync(page.body).toString(), /home/);
  } finally {
    await server.close();
  }
});

test("images and fonts are never re-compressed", async () => {
  const server = await startPreviewServer({ outDir: fixtureSite(), port: 0 });
  try {
    for (const path of ["/photo.webp", "/font.woff2"]) {
      const res = await fetchRaw(server.port, path, { "accept-encoding": "gzip" });
      assert.equal(res.headers["content-encoding"], undefined, path);
    }
  } finally {
    await server.close();
  }
});

test("the 404 page keeps its status when it is compressed", async () => {
  const server = await startPreviewServer({ outDir: fixtureSite(), port: 0 });
  try {
    const res = await fetchRaw(server.port, "/nope", { "accept-encoding": "gzip" });
    assert.equal(res.status, 404);
    assert.match(gunzipSync(res.body).toString(), /missing/);
  } finally {
    await server.close();
  }
});
