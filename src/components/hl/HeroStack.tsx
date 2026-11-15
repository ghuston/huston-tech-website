import type { heroStack } from "@/content/home";
import { DOT_PATH, RING_PATH } from "./Marks";
import { StackTilt } from "./PointerTilt";

/**
 * The H1 drawn as a picture (docs/STYLE-GUIDE.md §5.1 and §5.2): in front, a client's website; behind it, the workflow
 * it feeds. One image with one accessible name; everything inside is decorative, so nothing is read twice.
 * The words on the cards live in src/content/home.ts and are stand-ins until a real client site is approved.
 */
export function HeroStack({ content }: { content: typeof heroStack }) {
  const { inbox, reply, sheet, site, chip } = content;
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
        <div className="hl-card hl-c-inbox">
          <span className="hl-tag">{inbox.tag}</span>
          <div className="hl-row">
            <b>{inbox.title}</b>
            <span className="hl-muted">{inbox.time}</span>
          </div>
          <div className="hl-muted">{inbox.preview}</div>
        </div>
        <div className="hl-card hl-c-reply">
          <span className="hl-tag">{reply.tag}</span>
          <div className="hl-row">
            <b>{reply.title}</b>
            <span className="hl-muted">{reply.time}</span>
          </div>
          <div className="hl-muted">{reply.body}</div>
        </div>
        <div className="hl-card hl-c-sheet">
          <span className="hl-tag">{sheet.tag}</span>
          <table>
            <tbody>
              {sheet.rows.map((row, index) => (
                <tr key={row[1]} className={index === sheet.rows.length - 1 ? "hl-new" : "hl-old"}>
                  {row.map((cell) => (
                    <td key={cell}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* The one place other colors appear: the client's own palette, scoped to this card (hl.css). */}
        <div className="hl-card hl-c-site hl-client-site">
          <div className="hl-site-bar">
            <i />
            {site.address}
          </div>
          <div className="hl-site-body">
            <div className="hl-site-nav">
              <b>{site.name}</b>
              {site.nav.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
            <div>
              <p className="hl-site-h">{site.headline}</p>
              <ul className="hl-site-shows">
                {site.shows.map((show) => (
                  <li key={show.date}>
                    <time>{show.date}</time>
                    {show.venue}
                  </li>
                ))}
              </ul>
            </div>
            <div className="hl-site-form">
              <span className="hl-lab">{site.formLabel}</span>
              <span className="hl-in">{site.formName}</span>
              <span className="hl-in">{site.message}</span>
              <span className="hl-sbtn">{site.send}</span>
            </div>
          </div>
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
