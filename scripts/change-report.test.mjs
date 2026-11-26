// Tests for the pure parts of scripts/change-report.mjs (which pages a change touches, option parsing, the markdown).
// The screenshots themselves need a browser and are checked by hand. Run with:
//   node --test scripts/change-report.test.mjs   (or `npm run test:scripts`)
import assert from "node:assert/strict";
import { test } from "node:test";
import { rules } from "./change-scope-rules.mjs";
import { evaluateChange, formatReport } from "./check-change-scope.mjs";
import { affectedPages, buildReportMarkdown, collectionBlockTypes, extractOptions, findImporters, formForFile, itemForFile, itemInfoFromTexts, pageInfoFromTexts, routeForPageFile, slugForRoute } from "./change-report.mjs";
import { registry } from "../src/blocks/definitions.ts";

const allRoutes = ["/", "/services", "/about", "/contact", "/privacy", "/contact/thanks", "/blocks"];
const pageRoutes = {
  "src/app/(site)/page.tsx": "/",
  "src/app/(site)/services/page.tsx": "/services",
  "src/app/(site)/about/page.tsx": "/about",
  "src/app/(site)/contact/page.tsx": "/contact",
  "src/app/(site)/privacy/page.tsx": "/privacy",
  "src/app/(site)/contact/thanks/page.tsx": "/contact/thanks",
};
const sources = {
  "src/app/(site)/page.tsx": 'import { homeHero } from "@/content/home";\nimport { Hero } from "@/components/hl/Hero";',
  "src/app/(site)/about/page.tsx": "import { aboutBody } from '@/content/about';\nimport { Button } from \"@/components/hl/Button\";",
  "src/app/(site)/services/page.tsx": 'import { servicesHero } from "@/content/services";\nimport { Button } from "@/components/hl/Button";',
  "src/app/(site)/contact/page.tsx": 'import { contactHero } from "@/content/contact";',
  "src/app/(site)/privacy/page.tsx": 'import { privacy } from "@/content/privacy";',
  "src/app/(site)/contact/thanks/page.tsx": 'import { thanks } from "@/content/contact";',
  "src/app/(site)/layout.tsx": 'import { SiteChrome } from "@/components/layout/SiteChrome";',
  "src/components/layout/SiteChrome.tsx": 'import { nav } from "@/content/nav";\nimport { Footer } from "./Footer";',
  "src/components/layout/Footer.tsx": "export function Footer() {}",
  "src/components/hl/Accordion.tsx": "export function Accordion() {}",
  "src/blocks/library/faq/Faq.tsx": 'import { Accordion } from "@/components/hl/Accordion";',
  "src/blocks/library/video/VideoFacade.tsx": 'import { Play } from "@/components/hl/Play";',
  "src/blocks/library/video-grid/VideoGridBlock.tsx": 'import { VideoFacade } from "../video/VideoFacade";',
  "src/components/hl/Play.tsx": "export function Play() {}",
  "src/site-blocks/hero/Hero.tsx": "export function Hero() {}",
  "src/components/hl/Button.tsx": "export function Button() {}",
  "src/components/hl/Hero.tsx": 'import { homeBackdrop } from "@/content/home-art";',
  "src/content/home.ts": 'export const homeHero = { image: "/images/home/hero.jpg" };',
  "src/content/home-art.ts": 'import { base } from "./home";',
  "src/content/about.ts": 'export const aboutBody = { photo: "/images/about/portrait.webp" };',
  "src/content/nav.ts": "export const nav = [];",
  "src/content/contact.ts": 'import { providers } from "./providers";',
  "src/content/providers.ts": "export const providers = {};",
};
const change = (...entries) => entries.map(([status, path]) => ({ status, path }));
const live = (...types) => ({ status: "live", types });
const archived = (...types) => ({ status: "archived", types });
const pagesBefore = { "/": live("hero", "highlights"), "/about": live("hero", "prose", "closing-cta"), "/services": live("hero", "faq"), "/privacy": live("hero", "legal-sections"), "/contact": live("hero", "contact-form") };
const pages = (files, pagesHead = pagesBefore, pagesBase = pagesBefore) => affectedPages({ files, sources, pageRoutes, allRoutes, pagesHead, pagesBase });
const routes = (files) => pages(files).map((p) => p.route);

test("routeForPageFile and slugForRoute", () => {
  assert.equal(routeForPageFile("src/content/pages/home.json"), "/");
  assert.equal(routeForPageFile("src/content/pages/about.json"), "/about");
  assert.equal(routeForPageFile("src/content/pages/our-team.json"), "/our-team");
  assert.equal(routeForPageFile("src/content/pages/sub/about.json"), null);
  assert.equal(routeForPageFile("src/content/pages/about.draft.json"), null);
  assert.equal(routeForPageFile("src/content/contact.ts"), null);
  assert.equal(routeForPageFile("src/app/(site)/page.tsx"), null);
  assert.equal(slugForRoute("/"), "home");
  assert.equal(slugForRoute("/contact/thanks"), "contact-thanks");
  assert.equal(slugForRoute("/about"), "about");
});

test("findImporters finds alias, relative and image-path references", () => {
  assert.deepEqual(findImporters("src/content/about.ts", sources), ["src/app/(site)/about/page.tsx"]);
  assert.deepEqual(findImporters("src/content/home.ts", sources).sort(), ["src/app/(site)/page.tsx", "src/content/home-art.ts"].sort());
  assert.deepEqual(findImporters("public/images/about/portrait.webp", sources), ["src/content/about.ts"]);
  assert.deepEqual(findImporters("public/images/unused.jpg", sources), []);
  assert.deepEqual(findImporters("site.config.ts", sources), []);
});

test("a content change touches only the pages that use it", () => {
  assert.deepEqual(routes(change(["M", "src/content/about.ts"])), ["/about"]);
  assert.deepEqual(routes(change(["M", "src/content/services.ts"])), ["/services"]);
});

test("content used through other modules reaches the pages that import those", () => {
  // home.ts is imported by the home page and by home-art.ts, which the Hero component imports; the home page imports Hero.
  assert.deepEqual(routes(change(["M", "src/content/home.ts"])), ["/"]);
  // contact.ts is imported by the contact and thanks pages directly.
  assert.deepEqual(routes(change(["M", "src/content/contact.ts"])), ["/contact", "/contact/thanks"]);
});

test("a change that reaches the shared layout touches every page", () => {
  assert.deepEqual(routes(change(["M", "src/content/nav.ts"])), [...allRoutes].sort());
});

test("a page file maps to its own route, the home page file to /", () => {
  assert.deepEqual(pages(change(["M", "src/content/pages/about.json"])).map((p) => [p.route, p.before, p.after, p.reason]), [["/about", true, true, "src/content/pages/about.json changed"]]);
  assert.deepEqual(routes(change(["M", "src/content/pages/home.json"])), ["/"]);
  assert.deepEqual(routes(change(["M", "src/content/pages/home.json"], ["M", "src/content/pages/services.json"])), ["/", "/services"]);
});

test("a new page file is photographed on both sides: the base build says whether the page was there (a 404 is skipped)", () => {
  const head = { ...pagesBefore, "/our-team": live("hero", "closing-cta") };
  const [page] = pages(change(["A", "src/content/pages/our-team.json"]), head, pagesBefore);
  assert.deepEqual([page.route, page.slug, page.before, page.after, page.reason], ["/our-team", "our-team", true, true, "new page file"]);
});

test("converting a site to blocks: a page that was code at the base and is a page file now gets a before and an after", () => {
  const head = { "/": live("hero"), "/about": live("hero", "prose") };
  const converted = pages(change(["A", "src/content/pages/home.json"], ["A", "src/content/pages/about.json"]), head, {});
  assert.deepEqual(converted.map((p) => [p.route, p.before, p.after]), [["/", true, true], ["/about", true, true]]);
});

test("a page that goes from live to archived is a page archived: a before only", () => {
  const head = { ...pagesBefore, "/about": archived("hero", "prose", "closing-cta") };
  const [page] = pages(change(["M", "src/content/pages/about.json"]), head, pagesBefore);
  assert.deepEqual([page.route, page.before, page.after, page.reason], ["/about", true, false, "page archived"]);
});

test("a page that goes from archived to live is a page restored: an after only", () => {
  const base = { ...pagesBefore, "/about": archived("hero") };
  const [page] = pages(change(["M", "src/content/pages/about.json"]), pagesBefore, base);
  assert.deepEqual([page.route, page.before, page.after, page.reason], ["/about", false, true, "page restored"]);
});

test("editing a page that stays archived shows nothing; a new archived page file is only looked for in the base build", () => {
  const archivedBoth = { ...pagesBefore, "/about": archived("hero") };
  assert.deepEqual(pages(change(["M", "src/content/pages/about.json"]), archivedBoth, archivedBoth), []);
  const added = pages(change(["A", "src/content/pages/old.json"]), { ...pagesBefore, "/old": archived("hero") }, pagesBefore);
  assert.deepEqual(added.map((p) => [p.route, p.before, p.after]), [["/old", true, false]], "only the base build is asked, and it skips a 404");
});

test("a block's library folder reaches every page that uses that block type, plus the showcase", () => {
  assert.deepEqual(routes(change(["M", "src/blocks/library/faq/Faq.tsx"])), ["/blocks", "/services"]);
  assert.deepEqual(routes(change(["M", "src/blocks/library/hero/definition.ts"])), ["/", "/about", "/blocks", "/contact", "/privacy", "/services"]);
  assert.deepEqual(routes(change(["M", "src/blocks/library/video/Video.tsx"])), ["/blocks"], "no page uses video yet");
});

test("a page that used the block only before the change is still photographed", () => {
  const head = { ...pagesBefore, "/services": live("hero") };
  assert.deepEqual(pages(change(["M", "src/blocks/library/faq/Faq.tsx"]), head, pagesBefore).map((p) => p.route), ["/blocks", "/services"]);
});

test("any other file under src/blocks or src/site-blocks reaches every page", () => {
  for (const path of ["src/blocks/BlockRenderer.tsx", "src/blocks/schema.ts", "src/blocks/components.tsx", "src/site-blocks/definitions.ts", "src/site-blocks/components.tsx"]) {
    assert.deepEqual(routes(change(["M", path])), [...allRoutes].sort(), path);
  }
});

test("a component used only by the FAQ block maps to pages using faq and /blocks", () => {
  assert.deepEqual(routes(change(["M", "src/components/hl/Accordion.tsx"])), ["/blocks", "/services"]);
});

const withVideoGrid = { ...pagesBefore, "/about": live("hero", "video-grid") };
const routesWith = (files) => pages(files, withVideoGrid, withVideoGrid).map((p) => p.route);

test("a change to video/VideoFacade.tsx reaches pages using video-grid too", () => {
  assert.deepEqual(routesWith(change(["M", "src/blocks/library/video/VideoFacade.tsx"])), ["/about", "/blocks"]);
});

test("a component imported only by video/ reaches video-grid pages too", () => {
  assert.deepEqual(routesWith(change(["M", "src/components/hl/Play.tsx"])), ["/about", "/blocks"]);
});

test("a direct edit under src/site-blocks/<type>/ maps like a library block", () => {
  const head = { ...pagesBefore, "/about": live("prose") };
  assert.deepEqual(pages(change(["M", "src/site-blocks/hero/Hero.tsx"]), head, head).map((p) => p.route), ["/", "/blocks", "/contact", "/privacy", "/services"]);
});

test("a layout component still reaches every page", () => {
  assert.deepEqual(routes(change(["M", "src/components/layout/Footer.tsx"])), [...allRoutes].sort());
});

test("worker/ changes photograph nothing", () => {
  assert.deepEqual(routes(change(["M", "worker/contact.ts"], ["M", "worker/editor/tools.ts"], ["M", "src/lib/first-name.test.ts"], ["M", "scripts/finish-build.test.mjs"])), []);
});

test("pageInfoFromTexts reads status and block types from page file texts, skipping files that are not JSON", () => {
  const info = pageInfoFromTexts([
    { file: "home.json", text: JSON.stringify({ path: "/", status: "live", blocks: [{ type: "hero" }, { type: "hero" }, { type: "faq" }] }) },
    { file: "about.json", text: JSON.stringify({ status: "archived", blocks: [{ type: "prose" }] }) },
    { file: "broken.json", text: "{" },
    { file: "list.json", text: "[]" },
  ]);
  assert.deepEqual(info, { "/": { status: "live", types: ["hero", "faq"] }, "/about": { status: "archived", types: ["prose"] } });
});

test("a photo is traced to the pages that show it; an unreferenced one touches every page", () => {
  assert.deepEqual(routes(change(["A", "public/images/about/portrait.webp"])), ["/about"]);
  assert.deepEqual(routes(change(["M", "public/images/about/portrait.webp"])), ["/about"]);
  assert.deepEqual(routes(change(["A", "public/images/unused.jpg"])), [...allRoutes].sort());
});

test("files that cannot be traced touch every page, and files with no visual effect touch none", () => {
  assert.deepEqual(routes(change(["M", "site.config.ts"])), [...allRoutes].sort());
  assert.deepEqual(routes(change(["M", "docs/STATUS.md"], ["M", "scripts/preview.mjs"], ["M", ".github/workflows/ci.yml"], ["M", "tests/a11y/x.ts"], ["M", "README.md"], ["M", "src/lib/routes.ts"])), []);
});

test("a deleted page file has a before only", () => {
  const head = { ...pagesBefore };
  delete head["/privacy"];
  const deleted = pages(change(["D", "src/content/pages/privacy.json"]), head, pagesBefore);
  assert.deepEqual(deleted.map((p) => [p.route, p.before, p.after, p.reason]), [["/privacy", true, false, "page deleted"]]);
});

test("every page carries its slug and the reason it was picked", () => {
  const [about] = pages(change(["M", "src/content/about.ts"]));
  assert.equal(about.slug, "about");
  assert.match(about.reason, /src\/content\/about\.ts/);
});

test("extractOptions splits the report's own options from the scope check's", () => {
  assert.deepEqual(extractOptions(["--base", "main", "--base-out", "/tmp/b", "--out", "r", "--head-out", "o", "--ci"]), {
    options: { baseOut: "/tmp/b", out: "r", headOut: "o" },
    rest: ["--base", "main", "--ci"],
  });
  assert.deepEqual(extractOptions([]), { options: { baseOut: undefined, out: "change-report", headOut: "out" }, rest: [] });
  assert.match(extractOptions(["--out"]).error, /--out/);
});

test("the markdown report lists the scope result and a before and after for each page", () => {
  const md = buildReportMarkdown({
    scopeText: "Tier 1: this change only touches content (1 file).\nResult: PASS.",
    base: "origin/main",
    head: "HEAD",
    pages: [
      { route: "/about", slug: "about", before: true, after: true, reason: "src/content/about.ts changed" },
      { route: "/faq", slug: "faq", before: false, after: true, reason: "new page" },
    ],
    viewports: [{ name: "phone", width: 390, height: 844 }, { name: "desktop", width: 1440, height: 900 }],
  });
  assert.match(md, /^# Change report/);
  assert.match(md, /Tier 1: this change only touches content/);
  assert.match(md, /### \/about/);
  assert.match(md, /!\[before, phone\]\(about\/before-phone\.png\)/);
  assert.match(md, /!\[after, desktop\]\(about\/after-desktop\.png\)/);
  assert.match(md, /### \/faq/);
  assert.doesNotMatch(md, /faq\/before-/);
  assert.match(md, /not live before/i);
  assert.match(md, /390 × 844/);
});

test("a photo change puts its alt text and its problems in the report, and photographs the pages that show it", () => {
  const photo = (path, head, extra = {}) => ({ path, status: "A", added: [], removed: [], head, size: 1000, ...extra });
  const jpegHead = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46, 0, 1]);
  const used = [{ path: "src/content/home.ts", content: 'export const homeHero = { image: "/images/home/hero.jpg", alt: "Dylan at the front counter" };\n' }];
  const result = evaluateChange(
    {
      files: [photo("public/images/home/hero.jpg", jpegHead), photo("public/images/home/leak.jpg", jpegHead, { metadata: { removed: ["EXIF (camera and location data)"] } })],
      imageRefs: { "public/images/home/hero.jpg": used },
    },
    rules,
  );
  const scopeText = formatReport(result, { mode: "strict", base: "origin/main", head: "HEAD" });
  const md = buildReportMarkdown({ scopeText, base: "origin/main", head: "HEAD", pages: [], viewports: [] });
  assert.match(md, /public\/images\/home\/hero\.jpg: alt "Dylan at the front counter"/);
  assert.match(md, /Alt text problems/);
  assert.match(md, /leak\.jpg.*not used/);
  assert.match(md, /npm run strip:images/);
  const pages = affectedPages({ files: [{ status: "A", path: "public/images/home/hero.jpg" }], sources, pageRoutes, allRoutes });
  assert.deepEqual(pages.map((p) => p.route), ["/"]);
});

test("the markdown report says so when no page is affected", () => {
  const md = buildReportMarkdown({ scopeText: "x", base: "a", head: "b", pages: [], viewports: [] });
  assert.match(md, /No visible page is affected/i);
});

test("the markdown report's code fence cannot be closed by backticks inside the scope text", () => {
  const md = buildReportMarkdown({ scopeText: "evil ``` still inside\n## fake heading", base: "a", head: "b", pages: [], viewports: [] });
  assert.match(md, /````text\nevil ``` still inside\n## fake heading\n````\n/);
});

// ---- collections and settings (ruling 29) ----------------------------------------------------------------------

const blogPages = { ...pagesBefore, "/": live("hero", "latest-posts"), "/blog": live("hero", "post-index"), "/team": live("hero", "team"), "/podcast": live("hero", "episode-list") };
const routesOf = (list) => list.map((p) => p.route);
const collectionTypes = { posts: ["latest-posts", "post-index"], team: ["team"], episodes: ["episode-list"] };
const itemPages = (files, { head = {}, base = {} } = {}) =>
  affectedPages({ files, sources, pageRoutes, allRoutes: [...allRoutes, "/blog", "/team", "/podcast"], pagesHead: blogPages, pagesBase: blogPages, itemsHead: head, itemsBase: base, collectionTypes });

test("itemForFile and itemInfoFromTexts read the kind, slug and status", () => {
  assert.deepEqual(itemForFile("src/content/collections/posts/spring.json"), { kind: "posts", slug: "spring" });
  assert.equal(itemForFile("src/content/collections/posts/deep/spring.json"), null);
  assert.equal(itemForFile("src/content/pages/home.json"), null);
  const info = itemInfoFromTexts([
    { path: "src/content/collections/posts/a.json", text: '{"status":"live"}' },
    { path: "src/content/collections/posts/b.json", text: "{" },
    { path: "src/content/collections/team/c.json", text: '{"status":"draft"}' },
  ]);
  assert.deepEqual(info, { "posts/a": "live", "team/c": "draft" });
});

test("collectionBlockTypes comes from the registry: each list block's collection", () => {
  const types = collectionBlockTypes(registry);
  assert.ok(types.posts.includes("post-index") && types.posts.includes("latest-posts"));
  assert.deepEqual(types.team, ["team"]);
});

test("a post maps to its own page, the blog and every page listing posts", () => {
  const result = itemPages(change(["M", "src/content/collections/posts/spring.json"]), { head: { "posts/spring": "live" }, base: { "posts/spring": "live" } });
  assert.deepEqual(routesOf(result), ["/", "/blog", "/blog/spring"]);
  const own = result.find((p) => p.route === "/blog/spring");
  assert.equal(own.before, true);
  assert.equal(own.after, true);
});

test("a new, archived or restored post shows like a page does: no before, or no after", () => {
  const added = itemPages(change(["A", "src/content/collections/posts/new.json"]), { head: { "posts/new": "live" } });
  const post = added.find((p) => p.route === "/blog/new");
  assert.deepEqual([post.before, post.after, post.reason], [false, true, "new post"]);
  const archived = itemPages(change(["M", "src/content/collections/posts/old.json"]), { head: { "posts/old": "archived" }, base: { "posts/old": "live" } });
  const gone = archived.find((p) => p.route === "/blog/old");
  assert.deepEqual([gone.before, gone.after, gone.reason], [true, false, "post archived or unpublished"]);
  const draft = itemPages(change(["M", "src/content/collections/posts/wip.json"]), { head: { "posts/wip": "draft" }, base: { "posts/wip": "draft" } });
  assert.equal(draft.some((p) => p.route === "/blog/wip"), false, "a draft post has no page to photograph");
  const restored = itemPages(change(["M", "src/content/collections/posts/back.json"]), { head: { "posts/back": "live" }, base: { "posts/back": "archived" } });
  assert.equal(restored.find((p) => p.route === "/blog/back").reason, "post published or restored");
});

test("any other item maps to every page holding a list block of its kind, and no other page", () => {
  assert.deepEqual(routesOf(itemPages(change(["M", "src/content/collections/team/sam.json"]))), ["/team"]);
  assert.deepEqual(routesOf(itemPages(change(["A", "src/content/collections/episodes/e1.json"]))), ["/podcast"]);
  assert.deepEqual(routesOf(itemPages(change(["M", "src/content/collections/videos/v.json"]))), []);
});

test("business.json, brand.json, notice.json, palette.css and fonts.ts reach every page", () => {
  for (const path of ["src/content/business.json", "src/content/brand.json", "src/content/notice.json", "src/app/palette.css", "src/lib/fonts.ts"]) {
    const result = itemPages(change(["M", path]));
    assert.deepEqual(routesOf(result), [...allRoutes, "/blog", "/team", "/podcast"].sort(), path);
    assert.match(result[0].reason, /it reaches every page/);
  }
});

// ---- forms (Forms and downloads, task 5) --------------------------------------------------------------------------------

const formPage = (...ids) => ({ status: "live", types: ["hero", "form"], forms: ids });
const formPages = { ...pagesBefore, "/quote": formPage("quote"), "/hire": formPage("quote", "newsletter"), "/join": formPage("newsletter") };

test("formForFile reads the id of a form file", () => {
  assert.equal(formForFile("src/content/forms/quote.json"), "quote");
  assert.equal(formForFile("src/content/forms/deep/quote.json"), null);
  assert.equal(formForFile("src/content/pages/quote.json"), null);
});

test("pageInfoFromTexts lists the forms a page's form blocks name, and omits the list when there are none", () => {
  const info = pageInfoFromTexts([
    { file: "quote.json", text: JSON.stringify({ path: "/quote", status: "live", blocks: [{ type: "form", content: { form: "quote" } }, { type: "form", content: { form: "quote" } }, { type: "form", content: {} }] }) },
    { file: "plain.json", text: JSON.stringify({ path: "/plain", status: "live", blocks: [{ type: "hero" }] }) },
  ]);
  assert.deepEqual(info["/quote"], { status: "live", types: ["form"], forms: ["quote"] });
  assert.deepEqual(info["/plain"], { status: "live", types: ["hero"] });
});

test("a changed form file traces to the pages whose form blocks name it, and no other page", () => {
  const result = affectedPages({ files: change(["M", "src/content/forms/quote.json"]), sources, pageRoutes, allRoutes: [...allRoutes, "/quote", "/hire", "/join"], pagesHead: formPages, pagesBase: formPages });
  assert.deepEqual(result.map((p) => p.route), ["/hire", "/quote"]);
  assert.match(result[0].reason, /"quote" form/);
});

test("a form file's pages come from the base side too, and the registry photographs nothing", () => {
  const head = { ...formPages };
  delete head["/quote"];
  const result = affectedPages({ files: change(["M", "src/content/forms/quote.json"]), sources, pageRoutes, allRoutes, pagesHead: head, pagesBase: formPages });
  assert.ok(result.some((p) => p.route === "/quote"));
  assert.deepEqual(affectedPages({ files: change(["M", "src/forms/registry.generated.ts"]), sources, pageRoutes, allRoutes, pagesHead: formPages, pagesBase: formPages }), []);
});

test("a changed contact form file traces to the pages that use the contact-form block", () => {
  const result = affectedPages({ files: change(["M", "src/content/forms/contact.json"]), sources, pageRoutes, allRoutes: [...allRoutes, "/quote"], pagesHead: formPages, pagesBase: formPages });
  assert.deepEqual(result.map((p) => p.route), ["/contact"]);
});
