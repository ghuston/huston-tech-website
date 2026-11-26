/** Reads the body as bytes, stopping as soon as it passes the limit. Returns null when it is too large. */
export async function readBytes(request: Request, limit: number): Promise<Uint8Array | null> {
  if (!request.body) return new Uint8Array(0);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

/** Reads the body as text, stopping as soon as it passes the limit. Returns null when it is too large. */
export async function readBody(request: Request, limit: number): Promise<string | null> {
  const bytes = await readBytes(request, limit);
  return bytes === null ? null : new TextDecoder().decode(bytes);
}
