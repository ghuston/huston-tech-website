import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { LoadedItem } from "../collections/schema.ts";
import { rssFeed, xmlEscape } from "./feed.ts";

const post = (slug: string, status: LoadedItem["status"], title: string): LoadedItem => ({ kind: "posts", slug, status, data: { title, description: `About ${slug}`, date: "2026-03-27" } });
const site = { name: "Acme", description: "Plain talk", url: "https://acme.test/" };

describe("xmlEscape", () => {
  it("escapes < & \" ' and >", () => {
    assert.equal(xmlEscape(`<a href="x">Tom & 'Jerry'</a>`), "&lt;a href=&quot;x&quot;&gt;Tom &amp; &apos;Jerry&apos;&lt;/a&gt;");
  });
  it("escapes the ampersand first, once", () => {
    assert.equal(xmlEscape("&lt;"), "&amp;lt;");
  });
});

describe("rssFeed", () => {
  const xml = rssFeed({ site, posts: [post("one", "live", `Fish & <Chips> "now"`), post("two", "draft", "Secret"), post("three", "archived", "Gone")] });
  it("holds only live posts", () => {
    assert.equal(xml.match(/<item>/g)?.length, 1);
    assert.ok(!xml.includes("Secret") && !xml.includes("Gone"));
  });
  it("escapes the text of a post", () => {
    assert.ok(xml.includes("<title>Fish &amp; &lt;Chips&gt; &quot;now&quot;</title>"));
  });
  it("links are absolute, with no double slash", () => {
    assert.ok(xml.includes("<link>https://acme.test/blog/one</link>"));
    assert.ok(xml.includes("<link>https://acme.test/blog</link>"));
    assert.ok(xml.includes('href="https://acme.test/blog/feed.xml"'));
  });
  it("dates are RFC 822", () => {
    assert.ok(xml.includes("<pubDate>Fri, 27 Mar 2026 00:00:00 GMT</pubDate>"));
  });
  it("an empty blog is a valid empty channel", () => {
    assert.equal(rssFeed({ site, posts: [] }).includes("<item>"), false);
  });
});
