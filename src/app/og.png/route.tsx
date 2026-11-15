import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { siteConfig } from "@/content/site";

export const dynamic = "force-static";

const size = { width: 1200, height: 630 };

// Hex values mirror the v3 tokens in src/app/hl.css. ImageResponse cannot read CSS variables.
const color = { silver: "#f3f5f4", ink: "#29332d", ink2: "#4a5750", green: "#2b6455", rust: "#994d34" };

/** Reads the badge geometry from public/brand so the mark is never redrawn here. */
async function loadBadge() {
  const svg = await readFile(path.join(process.cwd(), "public/brand/huston-logic-badge-black.svg"), "utf8");
  const viewBox = /viewBox="([^"]+)"/.exec(svg)?.[1];
  const d = /<path[^>]* d="([^"]+)"/.exec(svg)?.[1];
  if (!viewBox || !d) throw new Error("Could not read the badge SVG in public/brand.");
  return { viewBox, d };
}

/** Brand-styled social preview (style guide v3), generated at build time and served as /og.png. */
export async function GET() {
  const [badge, regular, semiBold] = await Promise.all([
    loadBadge(),
    readFile(path.join(process.cwd(), "src/assets/og/Outfit-Regular.ttf")),
    readFile(path.join(process.cwd(), "src/assets/og/Outfit-SemiBold.ttf")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          background: color.silver,
          color: color.ink,
          padding: "0 96px",
          gap: 72,
          fontFamily: "Outfit",
        }}
      >
        <svg width={360} height={360} viewBox={badge.viewBox} xmlns="http://www.w3.org/2000/svg">
          <path d={badge.d} fill={color.green} fillRule="evenodd" />
        </svg>
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ fontSize: 112, fontWeight: 600, lineHeight: 1.05, letterSpacing: -2 }}>{siteConfig.name}</div>
          <div style={{ width: 96, height: 8, background: color.rust, margin: "32px 0" }} />
          <div style={{ fontSize: 44, fontWeight: 400, lineHeight: 1.25, color: color.ink2 }}>
            {siteConfig.tagline}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Outfit", data: regular, weight: 400, style: "normal" },
        { name: "Outfit", data: semiBold, weight: 600, style: "normal" },
      ],
    },
  );
}
