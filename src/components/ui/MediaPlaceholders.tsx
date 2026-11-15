import { Text } from "./Text";

export function PhotoPlaceholder({ label }: { label: string }) {
  return (
    <figure className="relative mx-auto aspect-[4/5] w-full max-w-sm rotate-[1.5deg] rounded-[14px] border border-line bg-surface p-3 shadow-lift-v1">
      <div className="grid h-full place-items-center rounded-[10px] bg-sage-tint p-6 text-center text-sm">
        <p>
          <Text>{label}</Text>
        </p>
      </div>
    </figure>
  );
}
