import { LineIcon } from "@/components/illustrations/LineIcon";
import { InViewOnce } from "@/components/ui/InViewOnce";
import { framework } from "@/content/site";
import { Container } from "./Container";
import { Glow } from "./Glow";

// Where each station and its text block sit, as percentages of the 1240 × 470 arc box (docs/STYLE-GUIDE.md §7.7).
const positions = [
  { station: { left: 8.95, top: 17.11 }, text: { left: 13.95, top: -3.32 } },
  { station: { left: 38.07, top: 63.13 }, text: { left: 42.59, top: 31.21 } },
  { station: { left: 74.23, top: 86.9 }, text: { left: 71.81, top: 44.35 } },
] as const;

/**
 * The three steps on a piece of the logo's ring (docs/STYLE-GUIDE.md §7.7). The rust dot travels the track into its
 * gap once, when 35% of the block is in view, and each icon plays as the dot reaches it. Below 900px the arc becomes a
 * vertical track. Step zero (the free call) is not on it: it is never a numbered step. The names and lines come from
 * `framework.steps`, so they are defined only in site.ts.
 */
export function ArcSteps({ srHeading }: { srHeading: string }) {
  return (
    <InViewOnce as="section" threshold={0.35} className="hl-steps">
      <Glow variant="white" className="-left-[380px] top-[520px]" />
      <Container className="relative z-[1]">
        <h2 className="sr-only">{srHeading}</h2>
        <ol className="hl-arcbox">
          {framework.steps.map((step, index) => {
            const at = positions[index];
            return (
              <li key={step.key}>
                <span className="hl-st" style={{ left: `${at.station.left}%`, top: `${at.station.top}%` }}>
                  <LineIcon step={step.key} className="w-[52px] text-green" />
                </span>
                <div className="hl-tx" style={{ left: `${at.text.left}%`, top: `${at.text.top}%` }}>
                  <span className="hl-n" aria-hidden="true">
                    {step.number}
                  </span>
                  <h3>{step.label}</h3>
                  <p>{step.oneLiner}</p>
                </div>
              </li>
            );
          })}
        </ol>
        <svg className="hl-arc" viewBox="0 0 1240 470" aria-hidden="true">
          <path className="hl-track" d="M 46.5 25.1 A 1500 1500 0 0 0 1104.9 413.6" />
          <path className="hl-track" d="M 1152.0 411.3 A 1500 1500 0 0 0 1287.0 396.3" />
          <g className="hl-arc-orbit" style={{ transformOrigin: "1054.7px -1085.6px" }}>
            <circle className="hl-arc-dot" cx="1128.4" cy="412.6" r="8" />
          </g>
        </svg>
      </Container>
    </InViewOnce>
  );
}
