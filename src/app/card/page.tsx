import type { Metadata } from "next";
import { RingHeadshot } from "@/components/hl/AboutTeaser";
import { Button } from "@/components/hl/Button";
import { Glow } from "@/components/hl/Glow";
import { Badge, MarkSprite } from "@/components/hl/Marks";
import { OutlineButton } from "@/components/hl/OutlineButton";
import { TextLink } from "@/components/hl/TextLink";
import { card } from "@/content/card";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: card.meta.title,
  description: card.meta.description,
  path: "/card",
  noindex: true,
});

/**
 * The page behind Grant's NFC tag: one phone screen, no site header or footer. It sits outside the (site) route group,
 * so it renders its own `main#main` (the skip link in the root layout targets it) and its own logo sprite.
 * Who and what at the top; the actions sit at the bottom of the screen, where a thumb reaches them.
 */
export default function CardPage() {
  const { phone } = card;
  return (
    <main id="main" tabIndex={-1} className="flex flex-1 flex-col overflow-x-clip outline-none">
      <MarkSprite />
      <div className="relative mx-auto flex w-full max-w-[440px] flex-1 flex-col px-5 pb-8 pt-6">
        {/* Behind the headshot, the way the hero glow sits behind the card stack (§2). */}
        <Glow variant="green" className="-left-[170px] -top-[110px] size-[500px]" />
        <div className="relative z-10 flex flex-1 flex-col">
          <Badge className="size-8 text-ink" />

          <div className="mt-7 flex items-center gap-4 short:mt-4">
            <div className="w-[124px] shrink-0 short:w-[96px]">
              <RingHeadshot eager />
            </div>
            <div>
              <h1 className="font-ui text-h3 font-bold">{card.name}</h1>
              <p className="mt-1 text-body leading-snug text-ink-2">{card.role}</p>
            </div>
          </div>

          <p className="mt-7 short:mt-5">
            <span className="block font-ui text-item font-semibold">{card.lines[0]}</span>
            <span className="mt-1 block font-voice text-quote italic">{card.lines[1]}</span>
          </p>

          <div className="mt-auto pt-8 short:pt-6">
            <Button href={card.vcardPath} className="w-full justify-center">
              {card.saveLabel}
            </Button>
            <ul className="mt-3 grid grid-cols-3 gap-3">
              <li>
                <OutlineButton href={`tel:${phone}`} className="w-full">
                  {card.actions.call}
                </OutlineButton>
              </li>
              <li>
                <OutlineButton href={`sms:${phone}`} className="w-full">
                  {card.actions.text}
                </OutlineButton>
              </li>
              {card.email ? (
                <li>
                  <OutlineButton href={`mailto:${card.email}`} className="w-full">
                    {card.actions.email}
                  </OutlineButton>
                </li>
              ) : null}
            </ul>
            <ul className="mt-3 flex flex-wrap justify-between gap-x-6">
              {card.links.map((link) => (
                <li key={link.href}>
                  <TextLink href={link.href}>{link.label}</TextLink>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
