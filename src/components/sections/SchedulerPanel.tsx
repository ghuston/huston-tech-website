import { BookCallButton } from "@/components/ui/BookCallButton";
import { Text } from "@/components/ui/Text";
import { scheduler } from "@/content/contact";
import { siteConfig } from "@/content/site";

/** Link-out scheduler. When `schedulerUrl` is null, shows a marked placeholder and a disabled button. */
export function SchedulerPanel() {
  return (
    <div id="book" className="scroll-mt-28 rounded-[14px] border border-line bg-surface p-6 sm:p-8">
      <h2 className="text-2xl sm:text-3xl">{scheduler.heading}</h2>
      <p className="mt-3 text-ink/85">{scheduler.body}</p>
      <div className="mt-6">
        {siteConfig.schedulerUrl ? (
          <BookCallButton label={scheduler.buttonLabel} fullWidthOnMobile />
        ) : (
          <>
            <button
              type="button"
              disabled
              className="min-h-12 w-full cursor-not-allowed rounded-[10px] bg-line px-6 py-3 font-semibold text-muted sm:w-auto"
            >
              {scheduler.buttonLabel}
            </button>
            <p className="mt-4 text-sm">
              <Text>{scheduler.placeholder}</Text>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
