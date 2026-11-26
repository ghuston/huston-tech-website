import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { extraPageNumbers, formatDate, indexPath, postJsonLd, postPages } from "./blog.ts";

const posts = (n: number) => Array.from({ length: n }, (_, i) => `p${i + 1}`);

describe("postPages", () => {
  it("10 posts fit one page, so there is no page 2", () => {
    assert.equal(postPages(posts(10)).length, 1);
    assert.deepEqual(extraPageNumbers(10), []);
  });
  it("11 posts make page 2 with 1 post", () => {
    const pages = postPages(posts(11));
    assert.equal(pages.length, 2);
    assert.deepEqual(pages[1], ["p11"]);
    assert.deepEqual(extraPageNumbers(11), [2]);
  });
  it("never generates page 1 as an extra page, and keeps order", () => {
    assert.deepEqual(extraPageNumbers(35), [2, 3, 4]);
    assert.deepEqual(postPages(posts(25))[1]?.[0], "p11");
  });
  it("an empty blog still has page 1", () => {
    assert.deepEqual(postPages([]), [[]]);
    assert.deepEqual(extraPageNumbers(0), []);
  });
  it("takes another page size", () => {
    assert.equal(postPages(posts(5), 2).length, 3);
  });
});

describe("indexPath and formatDate", () => {
  it("page 1 is /blog", () => {
    assert.equal(indexPath(1), "/blog");
    assert.equal(indexPath(3), "/blog/page/3");
  });
  it("reads a date without a time zone shift", () => {
    assert.equal(formatDate("2026-03-27"), "March 27, 2026");
    assert.equal(formatDate("2026-01-01"), "January 1, 2026");
  });
});

describe("postJsonLd", () => {
  it("carries the real dates and address only", () => {
    const data = postJsonLd({ url: "https://x.test/blog/a", title: "A post", date: "2026-03-27", updated: "2026-04-02" });
    assert.deepEqual(data, { "@context": "https://schema.org", "@type": "BlogPosting", headline: "A post", datePublished: "2026-03-27", dateModified: "2026-04-02", url: "https://x.test/blog/a" });
  });
  it("leaves out dateModified when the post was not updated", () => {
    assert.equal(postJsonLd({ url: "u", title: "A post", date: "2026-03-27" })?.["dateModified"], undefined);
  });
  it("has none while the title is a placeholder", () => {
    assert.equal(postJsonLd({ url: "u", title: "[[Post title]]", date: "2026-03-27" }), null);
  });
});
