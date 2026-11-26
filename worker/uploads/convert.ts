import { log } from "../env.ts";
import { cleanWebp } from "./webp-clean.ts";

export const MAX_WEB_BYTES = 450 * 1024;
const LONG_SIDE = 1600;
const PREVIEW_SIDE = 480;
/** Long side and WebP quality, in the order tried; the first result within MAX_WEB_BYTES wins. */
const LADDER: readonly (readonly [number, number])[] = [
  [1600, 82],
  [1600, 75],
  [1280, 72],
  [1280, 60],
];

export type ConvertResult =
  | { ok: true; web: Uint8Array; preview: Uint8Array; width: number; height: number }
  | { ok: false; reason: "not_image" | "too_detailed" | "quota" | "damaged" };

/** A one-chunk stream over the same bytes (no copy), for each Images call. */
const streamOf = (bytes: Uint8Array): ReadableStream<Uint8Array> =>
  new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });

const isQuota = (error: unknown): boolean => {
  if (typeof error !== "object" || error === null) return false;
  const { code, message } = error as { code?: unknown; message?: unknown };
  return code === 9422 || String(code).includes("9422") || (typeof message === "string" && message.includes("9422"));
};

async function readAll(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Turns a phone photo (JPEG, PNG, WebP, HEIC) into a web-ready WebP of at most 450 KB, plus a small JPEG preview. */
export async function convertPhoto(images: ImagesBinding, bytes: Uint8Array): Promise<ConvertResult> {
  try {
    const info = await images.info(streamOf(bytes));
    if (info.format === "image/svg+xml" || !("width" in info)) return { ok: false, reason: "not_image" };
    if (!(info.width > 0) || !(info.height > 0)) return { ok: false, reason: "damaged" };
    let web: Uint8Array | null = null;
    let longSide = LONG_SIDE;
    for (const [side, quality] of LADDER) {
      const result = await images
        .input(streamOf(bytes))
        .transform({ width: side, height: side, fit: "scale-down" })
        .output({ format: "image/webp", quality });
      const out = await readAll(result.image());
      if (out.length <= MAX_WEB_BYTES) {
        web = out;
        longSide = side;
        break;
      }
    }
    if (!web) return { ok: false, reason: "too_detailed" };
    const cleaned = cleanWebp(web);
    if (!cleaned) return { ok: false, reason: "damaged" };
    const previewResult = await images
      .input(streamOf(bytes))
      .transform({ width: PREVIEW_SIDE, height: PREVIEW_SIDE, fit: "scale-down" })
      .output({ format: "image/jpeg", quality: 70 });
    const preview = await readAll(previewResult.image());
    const scale = Math.min(1, longSide / info.width, longSide / info.height);
    return { ok: true, web: cleaned, preview, width: Math.max(1, Math.round(info.width * scale)), height: Math.max(1, Math.round(info.height * scale)) };
  } catch (error) {
    if (isQuota(error)) {
      log("uploads_quota");
      return { ok: false, reason: "quota" };
    }
    return { ok: false, reason: "not_image" };
  }
}
