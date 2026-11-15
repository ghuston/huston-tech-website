/** Visible marker for content that only Grant can supply or confirm. See `npm run check:placeholders`. Styled by `.ph` in hl.css. */
export function Placeholder({ children }: { children: string }) {
  return (
    <mark className="ph" title="Placeholder: needs a real value before launch">
      {children}
    </mark>
  );
}
