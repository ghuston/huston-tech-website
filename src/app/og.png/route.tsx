import { ImageResponse } from "next/og";
import { siteConfig } from "@/content/site";

export const dynamic = "force-static";

const size = { width: 1200, height: 630 };

/** Brand-styled social preview, generated at build time and served as /og.png. */
export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#F8F5EF",
          color: "#1D2230",
          padding: 72,
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 14,
              background: "#1D2230",
              color: "#FFF1B8",
              fontSize: 42,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            H
          </div>
          <div style={{ fontSize: 40, fontWeight: 700 }}>{siteConfig.name}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05, maxWidth: 980 }}>
            Your business grew. Your systems didn&apos;t get the memo.
          </div>
          <div style={{ display: "flex", gap: 14 }}>
            {["Follow-up", "Payments", "Reporting", "Staff pay"].map((label) => (
              <div
                key={label}
                style={{
                  background: "#FBE3D3",
                  color: "#9A3412",
                  fontSize: 26,
                  padding: "8px 22px",
                  borderRadius: 999,
                  fontFamily: "monospace",
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
