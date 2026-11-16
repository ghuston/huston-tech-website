import { readFile } from "node:fs/promises";
import path from "node:path";
import { card } from "@/content/card";
import { siteConfig } from "@/content/site";
import { buildVCard } from "@/lib/vcard";

export const dynamic = "force-static";

/**
 * Grant's contact card, generated at build time and served as /grant.vcf. The photo is the site headshot re-encoded as a
 * 360px JPEG (src/assets/card) to keep the file under 100 KB. On Cloudflare the Content-Type and Content-Disposition
 * come from public/_headers; the headers here only apply to `npm run dev`.
 */
export async function GET() {
  const photoJpeg = await readFile(path.join(process.cwd(), "src/assets/card/grant-huston.jpg"));
  const body = buildVCard({
    givenName: card.givenName,
    familyName: card.familyName,
    formattedName: card.name,
    org: siteConfig.name,
    title: card.jobTitle,
    phone: card.phone,
    email: card.email,
    url: siteConfig.url,
    photoJpeg,
  });
  return new Response(body, {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${card.vcardFileName}"`,
    },
  });
}
