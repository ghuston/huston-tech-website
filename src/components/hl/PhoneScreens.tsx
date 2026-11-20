import { Picture } from "./Picture";
import { TiltCard } from "./PointerTilt";

export type AppScreenKey = "today" | "pipeline" | "brief" | "rule";

type PhoneScreensProps = {
  /** Each screen is public/work/pipeline-<key>.{avif,webp}, 390 × 844, seeded demo data (docs/website-rev8.md §D). */
  screens: readonly { key: AppScreenKey; alt: string }[];
  /** The row's accessible name. On phones it is a swipe row, so it is a focusable, named region. */
  label: string;
  /** From 1280px the frames share the row's width instead of keeping 156px (Home, where the row is a narrow column). */
  fluid?: boolean;
};

/**
 * The follow-up app's screens in phone-shaped frames: a row on wider screens, a swipe row on phones. Each frame is a
 * tilt-and-glow card (docs/STYLE-GUIDE.md §6.3), since it shows real work. Lazy-loaded; never in the first screen.
 */
export function PhoneScreens({ screens, label, fluid = false }: PhoneScreensProps) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className="-mx-5 snap-x snap-mandatory scroll-px-5 overflow-x-auto px-5 pb-2 md:mx-0 md:px-0"
    >
      <ul className={`flex w-max gap-3.5 md:gap-4 ${fluid ? "xl:grid xl:w-full xl:auto-cols-fr xl:grid-flow-col" : ""}`}>
        {screens.map((screen) => (
          <li key={screen.key} className={`w-[150px] flex-none snap-start md:w-[156px] ${fluid ? "xl:w-auto" : ""}`}>
            <TiltCard className="rounded-panel p-1.5">
              <Picture
                src={`/work/pipeline-${screen.key}`}
                width={390}
                height={844}
                alt={screen.alt}
                className="block h-auto w-full rounded-card"
              />
            </TiltCard>
          </li>
        ))}
      </ul>
    </div>
  );
}
