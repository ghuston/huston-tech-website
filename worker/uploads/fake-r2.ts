/** An in-memory R2 bucket for tests: put, get, head, list (prefix, cursor, limit, custom metadata) and delete. */

interface Entry {
  bytes: Uint8Array;
  customMetadata: Record<string, string>;
  uploaded: Date;
}

export interface FakeR2 {
  bucket: R2Bucket;
  objects: Map<string, Entry>;
  /** Makes the next put to a key containing this text throw (to test a failed save). */
  failPutOn: { match: string | null };
}

const toBytes = async (value: unknown): Promise<Uint8Array> => {
  if (typeof value === "string") return new TextEncoder().encode(value);
  if (value instanceof Uint8Array) return Uint8Array.from(value);
  if (value instanceof ArrayBuffer) return new Uint8Array(value.slice(0));
  throw new Error("fake R2 takes strings and bytes only");
};

export function createFakeR2(): FakeR2 {
  const objects = new Map<string, Entry>();
  const failPutOn: { match: string | null } = { match: null };
  const meta = (key: string, entry: Entry) => ({ key, size: entry.bytes.length, uploaded: entry.uploaded, customMetadata: { ...entry.customMetadata } });
  const bucket = {
    async put(key: string, value: unknown, options?: { customMetadata?: Record<string, string> }) {
      if (failPutOn.match !== null && key.includes(failPutOn.match)) throw new Error("fake R2 put failed");
      const entry = { bytes: await toBytes(value), customMetadata: { ...(options?.customMetadata ?? {}) }, uploaded: new Date(0) };
      objects.set(key, entry);
      return meta(key, entry);
    },
    async head(key: string) {
      const entry = objects.get(key);
      return entry ? meta(key, entry) : null;
    },
    async get(key: string) {
      const entry = objects.get(key);
      if (!entry) return null;
      return {
        ...meta(key, entry),
        bytes: async () => Uint8Array.from(entry.bytes),
        arrayBuffer: async () => Uint8Array.from(entry.bytes).buffer,
      };
    },
    async delete(keys: string | string[]) {
      for (const key of Array.isArray(keys) ? keys : [keys]) objects.delete(key);
    },
    async list(options: { prefix?: string; cursor?: string; limit?: number; include?: string[] } = {}) {
      const prefix = options.prefix ?? "";
      const limit = options.limit ?? 1000;
      const keys = [...objects.keys()].filter((key) => key.startsWith(prefix)).sort();
      const start = options.cursor ? Number(options.cursor) : 0;
      const page = keys.slice(start, start + limit);
      const truncated = start + limit < keys.length;
      return {
        objects: page.map((key) => meta(key, objects.get(key) as Entry)),
        truncated,
        ...(truncated ? { cursor: String(start + limit) } : {}),
        delimitedPrefixes: [],
      };
    },
  };
  return { bucket: bucket as unknown as R2Bucket, objects, failPutOn };
}
