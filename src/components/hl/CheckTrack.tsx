import { CheckTick } from "./Tick";

type Stop = { title: string; line?: string };

/**
 * The checks every build passes, on a piece of the logo's track (docs/website-rev8.md B1 §4): from 1200px a horizontal
 * 16px white track with a 60px white station and a tick for each check, and the rust dot resting in the gap at the
 * last stop ("Then it goes live."). Below 1200px the same track runs down the left, like DetailedSteps. The stops are
 * a real sequence, so it is an ordered list. Geometry lives in hl.css (`.hl-track`), where the section's in-view
 * moment (§9.4) hooks onto the stations' `data-tick` and the dot.
 */
export function CheckTrack({ stops }: { stops: readonly Stop[] }) {
  return (
    <ol className="hl-track">
      {stops.map((stop, index) => {
        const last = index === stops.length - 1;
        return (
          <li key={stop.title} className={last ? "hl-stop hl-stop-end" : "hl-stop"}>
            <span aria-hidden="true" className="hl-stop-bar" />
            {last ? (
              <span aria-hidden="true" className="hl-track-dot" />
            ) : (
              <span aria-hidden="true" className="hl-stop-st">
                <CheckTick draw className="hl-stop-tick" />
              </span>
            )}
            <p className="hl-stop-text">
              <b className="block font-ui font-semibold text-ink">{stop.title}</b>
              {stop.line ? <span className="mt-0.5 block text-[15px] leading-[1.45] text-ink-2 min-[1200px]:mt-1">{stop.line}</span> : null}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
