import type { DetailedStep } from "@/components/hl/DetailedSteps";
import { fw } from "@/lib/framework";
import { bookCallLabel } from "./site";

// docs/website-rev8.md, B4. Word for word.

export const howIWorkMeta = {
  title: "How I Work | Scope It, Shape It, Ship It | Huston Logic",
  description: fw(
    "One process for websites and systems: a free 20-minute call, then {stepsList}. You see the plan and price before I build, and the logins are yours at the end.",
  ),
};

export const howIWorkHero = {
  eyebrow: "How I work",
  title: "You see the price before I build anything.",
  intro:
    "Every project, website or system, runs the same three steps. A free 20-minute call comes first. It isn't a step, because it costs nothing and commits you to nothing.",
  cta: `${bookCallLabel} →`,
};

export const stepZero = {
  heading: "Step zero: a free 20-minute call",
  body: "A real conversation, not a sales demo. Tell me what you need: a new site, a system for your business, or both. I'll ask what you use today and who'd own the result, then give you my honest take, including when a settings change, your software vendor's support team or a different specialist is the better bet.",
};

export const stepLabels = { website: "Website", system: "System", youGet: "You get:" };

export const howIWorkSteps: DetailedStep[] = [
  {
    key: "scope",
    website: {
      paragraph:
        "After the call, you send me a short brief: what the site has to do, your words, photos and logo, and two or three sites you like. I send back a written plan and a fixed price. This step has no separate fee.",
      youGet: "a page list, what each page does, what I need from you, the price and a launch window.",
    },
    system: {
      paragraph: "A design call: your stages and follow-up rules. Then a written plan and a fixed price.",
    },
  },
  {
    key: "shape",
    website: {
      paragraph:
        "I design and build the site and show it to you on a private preview link. You get one round of changes. Then I try to break it: phones and desktops, slow connections, keyboard-only use, and test inquiries through the form, plus automated accessibility, speed and security checks.",
      youGet: "a preview link, one revision round, and a site that has passed its checks.",
    },
    system: {
      paragraph:
        "Your own copy set up in your accounts, your form connected, your contacts imported. I test it end to end before you use it.",
    },
  },
  {
    key: "ship",
    website: {
      paragraph:
        "The site goes live on your domain, with the domain, hosting and form accounts in your name. You get a short guide to what's where. For six weeks after launch, small changes are included, and I fix anything that doesn't work as agreed.",
      youGet: "the live site · every login · a handoff guide · six weeks of small changes and fixes.",
    },
    system: {
      paragraph: "30 days of tuning, a one-page handoff, and a full export whenever you want one.",
    },
  },
];

export const howIWorkProof = {
  text: "All three client wrap-up surveys so far rated handoff and training 5/5.",
  note: "(Systems projects.)",
};

export const afterLaunch = {
  heading: "After launch",
  /** The first paragraph's last sentence links to /services#care (Rev 8 B4), with no words added. */
  care: {
    before:
      "Some clients want someone keeping an eye on things. ",
    link: { label: "Site Care for a website, the care plan for a system. Neither is required.", href: "/services#care" },
  },
  closing: "I don't make 40-slide strategy decks. You get one useful improvement at a time.",
};

export const howIWorkClosing = {
  heading: "Start with the free call.",
  body: "Twenty minutes is enough to know which column you're in.",
  cta: `${bookCallLabel} →`,
};
