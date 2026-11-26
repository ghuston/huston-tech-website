import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildOrganizationJsonLd } from "./organization-builder.ts";
import { serializeJsonLd } from "./serialize-jsonld.ts";

const full = {
  name: "Acme Studio",
  url: "https://acme.example",
  description: "Websites for small shops.",
  email: "hello@acme.example",
  logoPath: "/brand/logo.png",
  founderName: "Jane Doe",
  founderJobTitle: "Founder",
};

const FORBIDDEN = [
  "address", "geo", "priceRange", "aggregateRating", "rating", "review", "areaServed", "sameAs", "telephone", "contactPoint",
];

describe("buildOrganizationJsonLd", () => {
  it("emits every field when all are usable", () => {
    assert.deepEqual(buildOrganizationJsonLd(full), {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": "https://acme.example/#organization",
      name: "Acme Studio",
      url: "https://acme.example",
      logo: "https://acme.example/brand/logo.png",
      description: "Websites for small shops.",
      email: "hello@acme.example",
      founder: { "@type": "Person", name: "Jane Doe", jobTitle: "Founder" },
    });
  });

  it("trims a trailing slash on the URL", () => {
    const data = buildOrganizationJsonLd({ ...full, url: "https://acme.example/" });
    assert.equal(data?.url, "https://acme.example");
    assert.equal(data?.["@id"], "https://acme.example/#organization");
    assert.equal(data?.logo, "https://acme.example/brand/logo.png");
  });

  it("skips a field that still holds a [[placeholder]]", () => {
    const data = buildOrganizationJsonLd({
      ...full,
      description: "[[One-line description of the business]]",
      email: "[[Email]]",
      logoPath: "/brand/[[logo]].png",
      founderJobTitle: "[[Owner role]]",
    });
    assert.ok(data);
    assert.equal("description" in data, false);
    assert.equal("email" in data, false);
    assert.equal("logo" in data, false);
    assert.deepEqual(data.founder, { "@type": "Person", name: "Jane Doe" });
  });

  it("omits the founder when the name is a placeholder, even if the role is usable", () => {
    const data = buildOrganizationJsonLd({ ...full, founderName: "[[Owner name]]" });
    assert.ok(data);
    assert.equal("founder" in data, false);
  });

  it("skips empty, blank, null and undefined fields", () => {
    const data = buildOrganizationJsonLd({
      name: "Acme Studio",
      url: "https://acme.example",
      description: "",
      email: "   ",
      logoPath: null,
      founderName: undefined,
    });
    assert.deepEqual(data, {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": "https://acme.example/#organization",
      name: "Acme Studio",
      url: "https://acme.example",
    });
  });

  it("skips a logo path that is not site-relative", () => {
    assert.equal(buildOrganizationJsonLd({ ...full, logoPath: "brand/logo.png" })?.logo, undefined);
    assert.equal(buildOrganizationJsonLd({ ...full, logoPath: "https://cdn.example/logo.png" })?.logo, undefined);
  });

  it("returns null when the name is missing, empty or a placeholder", () => {
    assert.equal(buildOrganizationJsonLd({ ...full, name: undefined }), null);
    assert.equal(buildOrganizationJsonLd({ ...full, name: "" }), null);
    assert.equal(buildOrganizationJsonLd({ ...full, name: "[[Business name]]" }), null);
  });

  it("returns null when the URL is missing, empty, a placeholder or not http(s)", () => {
    assert.equal(buildOrganizationJsonLd({ ...full, url: undefined }), null);
    assert.equal(buildOrganizationJsonLd({ ...full, url: "" }), null);
    assert.equal(buildOrganizationJsonLd({ ...full, url: "https://[[DOMAIN]]" }), null);
    assert.equal(buildOrganizationJsonLd({ ...full, url: "acme.example" }), null);
  });

  it("never emits a forbidden field, even if the input carries one", () => {
    const hostile = { ...full } as Record<string, unknown>;
    for (const key of FORBIDDEN) hostile[key] = "x";
    const data = buildOrganizationJsonLd(hostile as typeof full);
    assert.ok(data);
    const text = JSON.stringify(data);
    for (const key of FORBIDDEN) {
      assert.equal(key in data, false, `${key} must not be a top-level field`);
      assert.equal(text.includes(`"${key}"`), false, `${key} must not appear anywhere in the output`);
    }
    assert.deepEqual(Object.keys(data).sort(), [
      "@context", "@id", "@type", "description", "email", "founder", "logo", "name", "url",
    ]);
  });
});

describe("serializeJsonLd", () => {
  it("leaves no raw < in the output, so a value cannot close the script tag", () => {
    const data = buildOrganizationJsonLd({ ...full, name: "A</script><b>", description: "<img src=x onerror=alert(1)>" });
    assert.ok(data);
    const json = serializeJsonLd(data);
    assert.equal(json.includes("<"), false);
    assert.ok(json.includes("\\u003c/script>"));
    assert.equal(JSON.parse(json).name, "A</script><b>");
  });
});
