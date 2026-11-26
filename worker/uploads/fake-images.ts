/** A fake Images binding for tests: no decoding, fake WebP and JPEG bytes of a chosen size. Nothing touches the network. */

const text = (value: string): number[] => [...value].map((char) => char.charCodeAt(0));

const u32 = (value: number): number[] => [value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255];

function chunk(id: string, data: Uint8Array): number[] {
  return [...text(id), ...u32(data.length), ...data, ...(data.length % 2 ? [0] : [])];
}

/**
 * A minimal RIFF WEBP: a VP8 chunk padded so the whole file is about `size` bytes (rounded up to an even number), with
 * optional EXIF and XMP chunks (and the VP8X header that announces them) on top.
 */
export function makeWebp(options: { size?: number; exif?: boolean; xmp?: boolean } = {}): Uint8Array {
  const extras: number[] = [];
  const flags = (options.exif ? 0x08 : 0) | (options.xmp ? 0x04 : 0);
  if (options.exif) extras.push(...chunk("EXIF", Uint8Array.from(text("Exif\0\0GPS-SECRET"))));
  if (options.xmp) extras.push(...chunk("XMP ", Uint8Array.from(text("<x:xmpmeta>author</x:xmpmeta>"))));
  const header = flags ? chunk("VP8X", Uint8Array.from([flags, 0, 0, 0, 9, 0, 0, 9, 0, 0])) : [];
  const overhead = 12 + header.length + 8 + extras.length;
  const payload = Math.max(10, (options.size ?? 2000) - overhead);
  const picture = chunk("VP8 ", new Uint8Array(payload).fill(7));
  const body = [...text("WEBP"), ...header, ...picture, ...extras];
  return Uint8Array.from([...text("RIFF"), ...u32(body.length), ...body]);
}

export type ImagesCall = { width?: number; height?: number; fit?: string; format: string; quality?: number };

export interface FakeImagesOptions {
  /** What `info()` reports. Default: a 4000 x 3000 JPEG. */
  info?: { format: string; width: number; height: number; fileSize?: number };
  /** The size of each web WebP attempt, in order; the last one repeats. Default: one attempt of 100 KB. */
  webpSizes?: number[];
  /** Put EXIF and XMP chunks in the WebP output, as a misbehaving binding might. */
  exif?: boolean;
  /** Throw this from `info()` or from the transform. */
  infoError?: Error;
  outputError?: Error;
}

export interface FakeImages {
  images: ImagesBinding;
  calls: ImagesCall[];
}

/** An error shaped like the binding's ImagesError. */
export function imagesError(code: number, message = `images error ${code}`): Error {
  return Object.assign(new Error(message), { code });
}

export function createFakeImages(options: FakeImagesOptions = {}): FakeImages {
  const calls: ImagesCall[] = [];
  let webpAttempts = 0;
  const info = options.info ?? { format: "image/jpeg", width: 4000, height: 3000 };
  const sizes = options.webpSizes ?? [100_000];
  const images = {
    async info(): Promise<unknown> {
      if (options.infoError) throw options.infoError;
      return info.format === "image/svg+xml" ? { format: info.format } : { fileSize: 1, ...info };
    },
    input() {
      let transform: { width?: number; height?: number; fit?: string } = {};
      const handle = {
        transform(next: { width?: number; height?: number; fit?: string }) {
          transform = next;
          return handle;
        },
        async output(output: { format: string; quality?: number }) {
          if (options.outputError) throw options.outputError;
          calls.push({ ...transform, format: output.format, quality: output.quality });
          let bytes: Uint8Array;
          if (output.format === "image/webp") {
            const size = sizes[Math.min(webpAttempts, sizes.length - 1)];
            webpAttempts += 1;
            bytes = makeWebp({ size, exif: options.exif, xmp: options.exif });
          } else bytes = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, ...new Array<number>(500).fill(1), 0xff, 0xd9]);
          return {
            contentType: () => output.format,
            image: () => new Blob([bytes as Uint8Array<ArrayBuffer>]).stream(),
            response: () => new Response(bytes as Uint8Array<ArrayBuffer>),
          };
        },
      };
      return handle;
    },
  };
  return { images: images as unknown as ImagesBinding, calls };
}
