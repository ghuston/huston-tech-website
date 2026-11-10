type Props = { title: string; body: string; index: number };

const rotations = ["-rotate-[1.4deg]", "rotate-[1deg]", "-rotate-[0.6deg]", "rotate-[1.5deg]", "-rotate-[1deg]", "rotate-[0.7deg]"];

/** Styled as a sticky note, deliberately not as a testimonial: no quotation marks, no names. */
export function StickyNoteCard({ title, body, index }: Props) {
  return (
    <li
      className={`relative bg-note px-6 pb-7 pt-8 shadow-note transition-transform duration-200 hover:rotate-0 motion-reduce:transition-none ${rotations[index % rotations.length]}`}
    >
      <span aria-hidden="true" className="absolute -top-2.5 left-1/2 h-5 w-16 -translate-x-1/2 rotate-[-2deg] bg-signal/20" />
      <h3 className="text-xl leading-snug">{title}</h3>
      <p className="mt-3 text-[0.98rem] text-ink/80">{body}</p>
    </li>
  );
}
