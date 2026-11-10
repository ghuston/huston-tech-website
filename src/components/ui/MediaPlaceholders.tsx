import { Text } from "./Text";

/** Browser-chrome frame holding a screenshot placeholder, until Grant supplies blurred images. */
export function ScreenshotPlaceholder({ label }: { label: string }) {
  return (
    <figure className="overflow-hidden rounded-[14px] border border-line bg-surface shadow-lift">
      <div className="flex items-center gap-1.5 border-b border-line bg-paper px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-line" />
        <span className="size-2.5 rounded-full bg-line" />
        <span className="size-2.5 rounded-full bg-line" />
        <span className="ml-3 h-4 flex-1 rounded-full bg-line/70" />
      </div>
      <div className="grid min-h-48 place-items-center bg-[repeating-linear-gradient(135deg,var(--color-paper),var(--color-paper)_12px,var(--color-surface)_12px,var(--color-surface)_24px)] p-6 text-center sm:min-h-64">
        <p className="max-w-md text-sm">
          <Text>{label}</Text>
        </p>
      </div>
    </figure>
  );
}

export function PhotoPlaceholder({ label }: { label: string }) {
  return (
    <figure className="relative mx-auto aspect-[4/5] w-full max-w-sm rotate-[1.5deg] rounded-[14px] border border-line bg-surface p-3 shadow-lift">
      <div className="grid h-full place-items-center rounded-[10px] bg-sage-tint p-6 text-center text-sm">
        <p>
          <Text>{label}</Text>
        </p>
      </div>
    </figure>
  );
}
