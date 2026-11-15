import { FadingDivider } from "./FadingDivider";

type CellDividersProps = {
  index: number;
  total: number;
  /** Columns at md (768px and up) and, optionally, at lg (1024px and up). One column below md. */
  md: number;
  lg?: number;
};

/**
 * The fading lines between the cells of a grid of ideas (docs/STYLE-GUIDE.md §4: lists of ideas are not boxed). Each
 * cell carries its own: a vertical line in the gap to its left (not first in its row) and a horizontal line in the gap
 * below it (not in the last row). Place inside a `relative` cell; the grid's column gap is 48px and its row gap 56px.
 */
export function CellDividers({ index, total, md, lg }: CellDividersProps) {
  const layers = [
    { cols: 1, show: "md:hidden" },
    { cols: md, show: lg ? "hidden md:block lg:hidden" : "hidden md:block" },
    ...(lg ? [{ cols: lg, show: "hidden lg:block" }] : []),
  ];
  return (
    <>
      {layers.map(({ cols, show }) => {
        const column = index % cols;
        const lastRowStart = Math.floor((total - 1) / cols) * cols;
        return (
          <span key={cols} aria-hidden="true" className={show}>
            {column > 0 ? <FadingDivider direction="vertical" className="absolute -left-6 bottom-0 top-0" /> : null}
            {index < lastRowStart ? <FadingDivider className="absolute -bottom-7 left-0 w-full" /> : null}
          </span>
        );
      })}
    </>
  );
}
