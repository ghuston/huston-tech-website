import type { heroStack } from "@/content/home";
import { DOT_PATH, RING_PATH } from "./Marks";
import { StackTilt } from "./PointerTilt";

/**
 * The H1 drawn as a picture (docs/STYLE-GUIDE.md §5.1, Revision 8): in front, the owner's board with the new
 * follow-up for Dana; around it, the spoken note that created it, the brief before the next call and a rule added by
 * asking. One image with one accessible name; everything inside is decorative, so nothing is read twice.
 * The names on the cards live in src/content/home.ts and are invented stand-ins.
 */
export function HeroStack({ content }: { content: typeof heroStack }) {
  const { board, say, brief, rule, chip } = content;
  return (
    <figure role="img" aria-label={content.ariaLabel} className="hl-stage">
      {/* The badge's ring, with the dot travelling it into its gap on load. Same path data as the logo. */}
      <svg className="hl-ringbg" viewBox="-380.18 -380.18 760.36 760.36" aria-hidden="true">
        <g transform="translate(-766.97 -435.17)">
          <path className="hl-ring-r" d={RING_PATH} />
        </g>
        <g className="hl-orbit">
          <g transform="translate(-766.97 -435.17)">
            <path className="hl-ring-d" d={DOT_PATH} />
          </g>
        </g>
      </svg>
      <StackTilt max={5}>
        <div className="hl-card hl-c-say">
          <span className="hl-tag">{say.tag}</span>
          <p className="hl-say-bubble">{say.said}</p>
        </div>
        {/* DOM order is paint order on phones (no 3D): the brief sits over the rule card. */}
        <div className="hl-card hl-c-rule">
          <span className="hl-tag">{rule.tag}</span>
          <p>
            <b>{rule.rule}</b>
          </p>
          <p className="hl-muted mt-1">{rule.undo}</p>
        </div>
        <div className="hl-card hl-c-brief">
          <span className="hl-tag">{brief.tag}</span>
          <div className="hl-row">
            <b>{brief.name}</b>
            <span className="hl-muted">{brief.time}</span>
          </div>
          <p className="hl-muted mt-1">{brief.line}</p>
        </div>
        <div className="hl-card hl-c-board">
          <p className="hl-board-h">{board.heading}</p>
          <ul className="hl-board-rows">
            {board.rows.map((row) => (
              <li key={row.name} className={row.highlighted ? "hl-row-new" : undefined}>
                <span>
                  <b>{row.name}</b>
                  <br />
                  {row.detail}
                </span>
                <span className="hl-board-status">{row.status}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="hl-chip">
          <i />
          <span>
            <b>{chip.figure}</b>
            {chip.label}
          </span>
        </div>
      </StackTilt>
    </figure>
  );
}
