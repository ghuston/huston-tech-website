import { existsSync, readdirSync, readFileSync } from "node:fs";
import { DEFAULT_UPLOADS, type EditorConfig } from "../config.ts";
import { registry as libraryRegistry } from "../../src/blocks/definitions.ts";
import type { AnyBlockDefinition } from "../../src/blocks/schema.ts";
import { COLLECTION_KINDS } from "../../src/collections/schema.ts";
import { FakeGitHub } from "./fake-github.ts";
import { createEditor } from "./service.ts";
import type { AssetsLike, Editor, EditorDeps } from "./types.ts";

/** Fakes and a small realistic site for the editor's tests (service, MCP endpoint, owner page). Nothing touches the network. */

export const TEST_NOW = "2026-01-01T12:00:00.000Z";

export const testEditorConfig = (overrides: Partial<EditorConfig> = {}): EditorConfig => ({
  enabled: true,
  ownerEmails: ["owner@example.test"],
  siteUrl: "https://example.test",
  host: "example.test",
  siteName: "Example Co",
  timeZone: "UTC",
  workerName: "example-site",
  access: { teamDomain: null, aud: null },
  github: { owner: "example", repo: "site", appId: "1", installationId: "2", botLogin: "editor-bot[bot]" },
  workersSubdomain: "acct",
  dailyChangeLimit: 10,
  ignoredChecks: ["change-report", "change-scope", "Workers Builds"],
  productionBranch: "main",
  uploads: DEFAULT_UPLOADS,
  ...overrides,
});

interface StoredValue {
  value: string;
  ttl: number | undefined;
}

/** A Map-backed KV: get(key, "json" | "text"), put with a recorded TTL, delete and list by prefix. */
export class FakeKv {
  readonly store = new Map<string, StoredValue>();
  readonly puts: { key: string; ttl: number | undefined }[] = [];

  async get(key: string, type?: "json" | "text"): Promise<unknown> {
    const entry = this.store.get(key);
    if (!entry) return null;
    return type === "json" ? JSON.parse(entry.value) : entry.value;
  }

  async put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void> {
    this.store.set(key, { value, ttl: options?.expirationTtl });
    this.puts.push({ key, ttl: options?.expirationTtl });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async list(options?: { prefix?: string }): Promise<{ keys: { name: string }[]; list_complete: true }> {
    const prefix = options?.prefix ?? "";
    return { keys: [...this.store.keys()].filter((name) => name.startsWith(prefix)).map((name) => ({ name })), list_complete: true };
  }

  ttlOf(key: string): number | undefined {
    return this.store.get(key)?.ttl;
  }

  asNamespace(): KVNamespace {
    return this as unknown as KVNamespace;
  }
}

/** The deployed site's `site-version.json`, through a fake ASSETS binding. `commit: null` means the build could not name one. */
export class FakeAssets implements AssetsLike {
  commit: string | null = null;
  broken = false;

  async fetch(request: Request): Promise<Response> {
    if (this.broken || !new URL(request.url).pathname.endsWith("/site-version.json")) return new Response("not found", { status: 404 });
    return Response.json({ commit: this.commit });
  }
}

const REPO = new URL("../../", import.meta.url);
// The settings files, example items and /blog page the tests seed come from worker/editor/fixtures (the template's own
// examples), not from src/content: this site's real settings and items are its own, and the tests must not depend on them.
const FIXTURES = new URL("./fixtures/", import.meta.url);
const template = (path: string): string => readFileSync(new URL(path, FIXTURES), "utf8");
const repoFile = (path: string): string => readFileSync(new URL(path, REPO), "utf8");

/** The template's own settings files and example items, so the seeded site tracks the real template. Posts are left out (see blogFiles). */
function templateDocuments(): Record<string, string> {
  const files: Record<string, string> = {};
  for (const name of ["business", "brand", "notice"]) files[`src/content/${name}.json`] = template(`src/content/${name}.json`);
  files["src/content/forms/contact.json"] = repoFile("src/content/forms/contact.json");
  files["src/forms/registry.generated.ts"] = repoFile("src/forms/registry.generated.ts");
  for (const kind of COLLECTION_KINDS) {
    if (kind === "posts") continue;
    const dir = `src/content/collections/${kind}`;
    if (!existsSync(new URL(dir, FIXTURES))) continue;
    for (const file of readdirSync(new URL(dir, FIXTURES))) if (file.endsWith(".json")) files[`${dir}/${file}`] = template(`${dir}/${file}`);
  }
  // Example items may hold photos; the seeded site needs those image files to exist, as blogFiles does for posts.
  for (const text of Object.values(files)) {
    for (const [, src] of text.matchAll(/"src": "(\/images\/[^"]+)"/g)) files[`public${src}`] = "image-bytes";
  }
  return files;
}

/** A live blog: the template's /blog page and example posts. Posts are live, so the site needs the page (the build rule). */
export function blogFiles(): Record<string, string> {
  const files: Record<string, string> = {};
  const dir = "src/content/collections/posts";
  if (existsSync(new URL(dir, FIXTURES))) for (const file of readdirSync(new URL(dir, FIXTURES))) if (file.endsWith(".json")) files[`${dir}/${file}`] = template(`${dir}/${file}`).replace('"status": "draft"', '"status": "live"');
  for (const text of Object.values(files)) {
    for (const [, src] of text.matchAll(/"src": "(\/images\/[^"]+)"/g)) files[`public${src}`] = "image-bytes";
  }
  files["src/content/pages/blog.json"] = existsSync(new URL("src/content/pages/blog.json", FIXTURES))
    ? template("src/content/pages/blog.json")
    : JSON.stringify(
        {
          path: "/blog",
          title: "Blog",
          description: "Posts from the shop.",
          status: "live",
          menu: { label: "Blog", order: 50, places: ["footer"] },
          blocks: [
            { type: "hero", content: { title: "The blog" } },
            { type: "post-index", content: { emptyText: "No posts yet." } },
          ],
        },
        null,
        2,
      ) + "\n";
  return files;
}

/** The real block registry. */
export const registry: AnyBlockDefinition[] = [...libraryRegistry];

const hours = (extra: string[] = []) => ({
  path: "/hours",
  title: "Opening hours",
  description: "When the shop is open.",
  status: "live",
  menu: { label: "Hours", order: 40, places: ["footer"] },
  blocks: [
    { type: "hero", content: { title: "Opening hours" } },
    { type: "prose", content: { heading: "This week", paragraphs: ["Monday to Thursday: 9 to 5", "Friday: 9 to 5", ...extra] } },
  ],
});

const pages = {
  "home.json": {
    path: "/",
    title: "Example Co",
    description: "A small shop that does things well.",
    status: "live",
    blocks: [
      { type: "hero", content: { eyebrow: "Welcome", title: "Things done well", intro: "A short line about the shop." } },
      { type: "prose", content: { heading: "Who we are", paragraphs: ["We have been here a while."] } },
      { type: "closing-cta", content: { heading: "Say hello", action: { label: "Get in touch", href: "/contact" } } },
    ],
  },
  "contact.json": {
    path: "/contact",
    title: "Contact",
    description: "How to reach the shop.",
    status: "live",
    menu: { label: "Contact", order: 30, places: ["header", "footer"] },
    blocks: [
      { type: "hero", content: { title: "Get in touch" } },
      { type: "contact-form", content: { heading: "Book a call", body: "Pick a time that suits you.", buttonLabel: "Book a time", unsetNote: "Booking is not set up yet." } },
    ],
  },
  "services.json": {
    path: "/services",
    title: "Services",
    description: "What the shop offers.",
    status: "live",
    menu: { label: "Services", order: 10, places: ["header", "footer"] },
    blocks: [
      { type: "hero", content: { title: "What we offer" } },
      {
        type: "faq",
        content: {
          heading: "Common questions",
          items: [
            { question: "How long does it take?", answer: "About two weeks." },
            { question: "Do you work weekends?", answer: "Not usually." },
          ],
        },
      },
      { type: "closing-cta", content: { heading: "Ready?", action: { label: "Book a call", href: "@booking" } } },
    ],
  },
  "careers.json": {
    path: "/careers",
    title: "Careers",
    description: "Work with us.",
    status: "live",
    menu: { label: "Careers", order: 20, places: ["header"] },
    blocks: [
      { type: "hero", content: { title: "Join us" } },
      { type: "prose", content: { heading: "Open roles", paragraphs: ["There are none right now."] } },
    ],
  },
  "hours.json": hours(),
};

/** The repo's files: five pages, the two guides and one image. Override or add any file by path. */
export function seedFiles(overrides: Record<string, string> = {}): Record<string, string> {
  const files: Record<string, string> = {
    "docs/EDITING-LANES.md": "# What you can change on your site\n\nMost text works today.\n",
    "docs/VOICE-GUIDE.md": "# Voice\n\nFirst person, plain words.\n",
    "public/images/team.png": "png-bytes",
  };
  for (const [file, page] of Object.entries(pages)) files[`src/content/pages/${file}`] = JSON.stringify(page, null, 2) + "\n";
  return { ...files, ...templateDocuments(), ...overrides };
}

export const seedSite = (overrides: Record<string, string> = {}): FakeGitHub => new FakeGitHub(seedFiles(overrides));

export interface TestEditor {
  editor: Editor;
  github: FakeGitHub;
  kv: FakeKv;
  assets: FakeAssets;
  now: { value: Date };
}

/** An editor on a seeded site with ids p0000001, p0000002, ... and a movable clock. */
export function makeTestEditor(options: { github?: FakeGitHub; config?: Partial<EditorConfig>; deps?: Partial<EditorDeps> } = {}): TestEditor {
  const github = options.github ?? seedSite();
  const kv = new FakeKv();
  const assets = new FakeAssets();
  const now = { value: new Date(TEST_NOW) };
  github.useClock(() => now.value.getTime());
  let counter = 0;
  const editor = createEditor({
    config: testEditorConfig(options.config),
    github,
    kv: kv.asNamespace(),
    assets,
    registry,
    thanksLinks: [],
    now: () => now.value,
    randomId: () => `p${String(++counter).padStart(7, "0")}`,
    ...options.deps,
  });
  return { editor, github, kv, assets, now };
}
