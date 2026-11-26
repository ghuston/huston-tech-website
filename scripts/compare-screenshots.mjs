// Compares the before and after screenshots that `npm run report:changes` writes (change-report/<page>/before-<width>.png
// and after-<width>.png) pixel by pixel. Prints "identical" or the number of changed pixels and where; exits 1 on any
// difference. Usage: npm run compare:screens -- [folder]   (default folder: change-report)
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { inflateSync } from "node:zlib";

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const paeth = (a, b, c) => {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
};

/** Decodes an 8-bit, non-interlaced RGB or RGBA PNG to { width, height, data } where data is RGBA, 4 bytes per pixel. */
export function decodePng(buffer) {
  if (buffer.length < 8 || !buffer.subarray(0, 8).equals(SIGNATURE)) throw new Error("not a PNG file");
  let width = 0;
  let height = 0;
  let colorType = -1;
  const idat = [];
  for (let pos = 8; pos + 8 <= buffer.length; ) {
    const length = buffer.readUInt32BE(pos);
    const type = buffer.toString("latin1", pos + 4, pos + 8);
    const body = buffer.subarray(pos + 8, pos + 8 + length);
    if (type === "IHDR") {
      width = body.readUInt32BE(0);
      height = body.readUInt32BE(4);
      if (body[8] !== 8) throw new Error(`unsupported PNG bit depth ${body[8]} (need 8)`);
      colorType = body[9];
      if (colorType !== 2 && colorType !== 6) throw new Error(`unsupported PNG color type ${colorType} (need RGB or RGBA)`);
      if (body[12] !== 0) throw new Error("interlaced PNGs are not supported");
    } else if (type === "IDAT") idat.push(body);
    else if (type === "IEND") break;
    pos += 12 + length;
  }
  if (width === 0 || height === 0) throw new Error("PNG has no image header");
  const bpp = colorType === 6 ? 4 : 3;
  const stride = width * bpp;
  const raw = inflateSync(Buffer.concat(idat));
  if (raw.length < (stride + 1) * height) throw new Error("PNG image data is too short");
  const pixels = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y += 1) {
    const filter = raw[y * (stride + 1)];
    const src = y * (stride + 1) + 1;
    const dst = y * stride;
    for (let x = 0; x < stride; x += 1) {
      const left = x >= bpp ? pixels[dst + x - bpp] : 0;
      const up = y > 0 ? pixels[dst - stride + x] : 0;
      const upLeft = y > 0 && x >= bpp ? pixels[dst - stride + x - bpp] : 0;
      let value = raw[src + x];
      if (filter === 1) value += left;
      else if (filter === 2) value += up;
      else if (filter === 3) value += (left + up) >> 1;
      else if (filter === 4) value += paeth(left, up, upLeft);
      else if (filter !== 0) throw new Error(`unknown PNG filter ${filter}`);
      pixels[dst + x] = value & 255;
    }
  }
  if (bpp === 4) return { width, height, data: pixels };
  const data = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i += 1) {
    data[i * 4] = pixels[i * 3];
    data[i * 4 + 1] = pixels[i * 3 + 1];
    data[i * 4 + 2] = pixels[i * 3 + 2];
    data[i * 4 + 3] = 255;
  }
  return { width, height, data };
}

/**
 * { identical, changedPixels, maxDelta, box: {x, y, width, height} | null, note? }. A pixel counts as changed when any
 * channel differs by more than `tolerance` (default 0: exact). maxDelta is the largest channel difference seen. Different
 * sizes are never identical.
 */
export function comparePngs(a, b, tolerance = 0) {
  if (a.width !== b.width || a.height !== b.height) {
    return { identical: false, changedPixels: 0, maxDelta: 255, box: null, note: `sizes differ: ${a.width} x ${a.height} before, ${b.width} x ${b.height} after` };
  }
  let changedPixels = 0;
  let maxDelta = 0;
  let minX = a.width;
  let minY = a.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < a.height; y += 1) {
    for (let x = 0; x < a.width; x += 1) {
      const i = (y * a.width + x) * 4;
      let delta = 0;
      for (let c = 0; c < 4; c += 1) delta = Math.max(delta, Math.abs(a.data[i + c] - b.data[i + c]));
      if (delta > maxDelta) maxDelta = delta;
      if (delta > tolerance) {
        changedPixels += 1;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (changedPixels === 0) return { identical: true, changedPixels: 0, maxDelta, box: null };
  return { identical: false, changedPixels, maxDelta, box: { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 } };
}

/** Compares every <page>/before-<name>.png with <page>/after-<name>.png in a change-report folder. Returns report lines. */
export function compareFolder(folder, tolerance = 0) {
  const lines = [];
  let allIdentical = true;
  let compared = 0;
  for (const page of readdirSync(folder, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort()) {
    const dir = join(folder, page);
    for (const file of readdirSync(dir).filter((f) => /^before-.+\.png$/.test(f)).sort()) {
      const name = file.slice("before-".length, -".png".length);
      const afterPath = join(dir, `after-${name}.png`);
      if (!existsSync(afterPath)) {
        lines.push(`${page} ${name}: no after screenshot`);
        allIdentical = false;
        continue;
      }
      const result = comparePngs(decodePng(readFileSync(join(dir, file))), decodePng(readFileSync(afterPath)), tolerance);
      compared += 1;
      if (result.identical) lines.push(result.maxDelta === 0 ? `${page} ${name}: identical` : `${page} ${name}: identical within ${tolerance} (largest channel difference ${result.maxDelta} of 255)`);
      else {
        allIdentical = false;
        const where = result.box ? `${result.changedPixels} changed pixels, box x ${result.box.x} y ${result.box.y}, ${result.box.width} x ${result.box.height}, largest channel difference ${result.maxDelta} of 255` : result.note;
        lines.push(`${page} ${name}: DIFFERENT, ${where}`);
      }
    }
  }
  if (compared === 0 && allIdentical) {
    lines.push("no before/after pairs found");
    allIdentical = false;
  }
  return { lines, allIdentical };
}

// Usage: compare-screenshots.mjs [folder] [--tolerance N]. Exact by default. A tolerance (for example 2, the
// gradient rasterisation noise seen in soft glows between two runs of the same build) is for a person who has looked
// at the pictures; say so in the PR.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const at = args.indexOf("--tolerance");
  const tolerance = at >= 0 ? Number(args[at + 1]) : 0;
  const folderArg = args.find((arg, i) => !arg.startsWith("--") && (at < 0 || i !== at + 1));
  const folder = resolve(folderArg ?? "change-report");
  if (!Number.isInteger(tolerance) || tolerance < 0 || tolerance > 255) {
    console.error("--tolerance takes a whole number from 0 to 255.");
    process.exitCode = 2;
  } else if (!existsSync(folder)) {
    console.error(`No folder ${folder}. Run npm run report:changes first.`);
    process.exitCode = 1;
  } else {
    const { lines, allIdentical } = compareFolder(folder, tolerance);
    for (const line of lines) console.log(line);
    process.exitCode = allIdentical ? 0 : 1;
  }
}
