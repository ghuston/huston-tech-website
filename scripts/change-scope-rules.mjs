// The change-scope allow-list: the ONE place that says what a client change may touch. Read by
// scripts/check-change-scope.mjs (and, through it, scripts/change-report.mjs). Full explanation: docs/CHANGE-SCOPE.md.
//
// Tier 1 = content: copy, photos, pages (one JSON file of blocks per page) and the menu labels.
// Tier 3 = everything else (code, settings, security, packages, workflows, blocks). A change that touches any tier 3 file
// stops for Grant, whatever the request said. Editing this file is itself tier 3.
//
// Plain Node loads it directly: no TypeScript syntax. The only imports are the two import-free lists of settings and
// generated files, shared with the Worker and the build.
import { GENERATED_BRAND_FILES } from "../src/brand/generated.ts";
import { SETTINGS_NAMES, settingsPath } from "../src/settings/names.ts";
import { CONTACT_FORM_ID, FORM_DIR, formFilePath } from "../src/forms/schema.ts";
import { REGISTRY_PATH } from "../src/forms/registry.ts";

export const rules = {
  // ---- Tier 1 ---------------------------------------------------------------------------------------------------
  /** A page file: src/content/pages/<name>.json, top level of that folder only, lowercase words joined by hyphens. */
  pageFile: /^src\/content\/pages\/([a-z0-9]+(?:-[a-z0-9]+)*)\.json$/,
  /** The folder of page files. Any *.json directly inside it is read for the content check, whatever its name. */
  pagesDir: "src/content/pages/",
  /** Copy modules: src/content/<name>.ts, top level only, no dots in the name (so *.test.ts and *.d.ts are not copy). */
  contentFile: /^src\/content\/[A-Za-z0-9_-]+\.ts$/,
  /** Modules inside src/content that are wiring, not copy: they re-export settings, read process.env or feed the Worker. */
  // contact.ts reads the contact form's field words from src/content/forms/contact.json (the contact form's wiring), so it is code, not copy.
  contentWiring: ["src/content/site.ts", "src/content/providers.ts", "src/content/auto-reply.ts", "src/content/contact-fields.ts", "src/content/contact.ts"],
  /** Photos live here. Added, changed and deleted files are tier 1, subject to the image rules below. */
  imageDir: "public/images/",
  /** Single files a client change may edit besides the content modules: the menu labels. */
  tier1Files: ["src/content/nav.ts"],
  /**
   * Tier 1 .ts files (content modules, nav.ts) are code that runs at build time, so they are parsed and must be plain data:
   * imports of sibling content modules (or type-only imports), type declarations and `const` values built from literals,
   * arrays and objects. No calls, functions, classes or other statements. A page file is JSON, so it runs nothing; the
   * content check (src/blocks/validate.ts) judges it instead.
   */
  /** Names no tier 1 file may use. Static analysis is best effort; CodeQL and the preview are the other layers. */
  denyIdentifiers: [
    "eval", "Function", "setTimeout", "setInterval", "setImmediate", "queueMicrotask", "require", "process", "globalThis",
    "global", "window", "self", "document", "navigator", "location", "localStorage", "sessionStorage", "indexedDB", "fetch",
    "XMLHttpRequest", "WebSocket", "EventSource", "Worker", "SharedWorker", "WebAssembly", "Reflect", "Proxy", "Atomics",
    "module", "exports", "__dirname", "__filename", "Buffer", "importScripts", "dangerouslySetInnerHTML", "srcDoc",
  ],
  /** Property names that reach the Function constructor or the prototype chain. */
  denyProperties: ["constructor", "__proto__", "prototype"],
  /** Method names that turn any function value into a generic call primitive. Denied when READ (x.call) or destructured, not as data keys. */
  denyMethodReads: ["call", "apply", "bind", "__lookupGetter__", "__lookupSetter__", "__defineGetter__", "__defineSetter__"],
  /** The folder of collection items: src/content/collections/<kind>/<slug>.json. The kinds and the slug rule are in src/collections/schema.ts (a test keeps the two in step). */
  itemDir: "src/content/collections/",
  /** An item file: exactly one folder (the kind) below the collections folder. The kind and the slug are judged by check-change-scope.mjs. */
  itemFile: /^src\/content\/collections\/([^/]+)\/([^/]+)\.json$/,
  /** The three settings files. Tier 1 when they pass the content check at the head commit. */
  settingsFiles: SETTINGS_NAMES.map(settingsPath),
  /** Files generated from brand.json. Tier 1 only when byte-equal to what brand.json generates at the head commit. */
  generatedFiles: [...GENERATED_BRAND_FILES],
  /** The settings file whose change reaches every page, and so needs a preview before the yes. */
  brandFile: "src/content/brand.json",
  /** The folder of form files: src/content/forms/<id>.json. */
  formDir: `${FORM_DIR}/`,
  /** A form file: directly in the forms folder, an id of lowercase words joined by hyphens. Tier 1 when the site check passes at the head. */
  formFile: /^src\/content\/forms\/([a-z0-9]+(?:-[a-z0-9]+)*)\.json$/,
  /** The contact form's file wires the Worker (its fields feed the notification and the Sheet row), so it is tier 3. */
  contactFormFile: formFilePath(CONTACT_FORM_ID),
  /** The generated list of form files. Tier 1 only when byte-equal to what the head's form files generate. */
  registryFile: REGISTRY_PATH,
  /** Why deleting (or renaming) a form file is tier 3. */
  formArchiveReason: 'forms are archived, not deleted: set its status to "archived" instead',
  /** Why a registry that is not what the form files generate is tier 3. */
  registryMismatchReason: "the form registry does not match the form files. Add or change a form file and run `npm run sync:config`, never edit this file by hand",
  /** Why deleting (or renaming) an item or a settings file is tier 3. */
  itemArchiveReason: 'items are archived, not deleted: set its status to "archived" instead (a settings file is never deleted)',
  /** Why a generated brand file that is not what brand.json generates is tier 3. */
  generatedMismatchReason: "a generated brand file that does not match brand.json. Change brand.json and run `npm run sync:config`, never edit this file by hand",
  /** Why deleting (or renaming) a page file is tier 3. */
  archiveReason: 'pages are archived, not deleted: set its status to "archived" instead',

  // ---- Image rules (blocking on change branches) -------------------------------------------------------------------
  /** Extension, with the first bytes the file must start with. SVG is never allowed: it can carry code. */
  imageTypes: {
    ".jpg": "jpeg",
    ".jpeg": "jpeg",
    ".png": "png",
    ".webp": "webp",
  },
  maxImageBytes: 500 * 1024,
  /**
   * Hidden camera, location and editing data (EXIF, XMP, IPTC, comments, thumbnails) must be gone from every added or changed
   * image. `npm run strip:images` removes it (scripts/strip-image-metadata.mjs); scripts/image-metadata.mjs says what counts.
   */
  /** Every added or changed image must be used with alt text written next to it. These words say nothing, so they do not count. */
  genericAltText: ["image", "img", "photo", "picture", "graphic", "icon", "logo", "alt", "alt text", "todo", "tbd", "untitled", "placeholder"],
  /** Where an image's URL (such as /images/team/sam.jpg) is looked for, to find the alt text beside it. */
  imageReferenceDir: "src",

  // ---- PDF rules (blocking on change branches) ---------------------------------------------------------------------
  /** Downloadable files live here, one level, and only PDFs. They are served as downloads (public/_headers, /files/*). */
  fileDir: "public/files/",
  pdfFile: /^public\/files\/[a-z0-9]+(?:-[a-z0-9]+)*\.pdf$/,
  maxPdfBytes: 10 * 1000 * 1000,
  /** PDF names (written /Name in the file) that run code or carry files. Matched whole, after #xx escapes are decoded. */
  pdfActiveNames: ["JavaScript", "JS", "Launch", "EmbeddedFile", "EmbeddedFiles", "RichMedia", "XFA", "AA", "SubmitForm", "ImportData", "GoToR", "GoToE", "Rendition", "Movie", "Sound"],
  /** Where a PDF's address (such as /files/price-sheet.pdf) is looked for: it must be used. No alt text is needed. */
  fileReferenceDir: "src",
  /** Why anything else in public/files/ is tier 3. */
  fileNameReason: "only PDFs named in lowercase words joined by hyphens can go in public/files/",

  // ---- Leftover placeholders (blocking on change branches) ---------------------------------------------------------
  /** Same folders, file types and pattern as scripts/check-placeholders.mjs; only lines ADDED by the change count. */
  placeholderDirs: ["src/content/", "src/app/"],
  placeholderFiles: /\.(ts|tsx|md|mdx|json)$/,
  placeholderPattern: /\[\[([^\]]+)\]\]/g,

  // ---- Plain-English reasons shown for tier 3 files. First match wins; the last entry is the catch-all. ----------------
  tier3Labels: [
    [/^worker\//, "the contact form's server code"],
    [/^public\/_headers$/, "the security headers"],
    [/^public\/_redirects$/, "the redirect rules"],
    [/^wrangler\.jsonc$/, "the deploy settings"],
    [/^site\.config\.ts$/, "the site settings"],
    [/^package(-lock)?\.json$/, "the package list"],
    [/^\.github\//, "the CI workflows"],
    [/^\.claude\//, "the Claude hooks and agents"],
    [/^src\/components\//, "a shared component"],
    [/^src\/content\/forms\/contact\.json$/, "the contact form's wiring"],
    [/^src\/content\/forms\//, "not a form file: a form is src/content/forms/<id>.json, an id of lowercase words joined by hyphens, directly in that folder"],
    [/^src\/forms\//, "form rules (code)"],
    [/^src\/blocks\/|^src\/site-blocks\//, "a block's design (code)"],
    [/^src\/lib\//, "site code"],
    [/^src\/content\/(site|providers|auto-reply|contact-fields|contact)\.ts$/, "site wiring, not copy"],
    [/^src\/content\/collections\//, "not an item file: an item is src/content/collections/<kind>/<slug>.json, with a known kind and a slug of lowercase words joined by hyphens, directly in that folder"],
    [/^src\/content\/pages\//, "not a page file: a page is src/content/pages/<name>.json, lowercase words joined by hyphens, directly in that folder"],
    [/./, "not on the client-change allow-list"],
  ],
};
