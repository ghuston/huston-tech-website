/** Visible marker for content that only Grant can supply or confirm. See `npm run check:placeholders`. */
export function Placeholder({ children }: { children: string }) {
  return (
    <mark className="placeholder-mark" title="Placeholder: needs a real value before launch">
      {children}
    </mark>
  );
}
