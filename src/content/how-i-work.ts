import type { DetailedStep } from "@/components/hl/DetailedSteps";
import { fw } from "@/lib/framework";
import { bookCallLabel } from "./site";

// docs/website-plan.md, B1b (Revision 7.1). Word for word.

export const howIWorkMeta = {
  title: "How I Work | Scope It, Shape It, Ship It | Huston Logic",
  description: fw(
    "One process for websites and workflow projects: a free 20-minute call, then {stepsList}. You see the plan and price before I build, and the logins are yours at the end.",
  ),
};

export const howIWorkHero = {
  eyebrow: "How I work",
  title: "You see the price before I build anything.",
  intro:
    "Every project, website or workflow, runs the same three steps. A free 20-minute call comes first. It isn't a step, because it costs nothing and commits you to nothing.",
  cta: `${bookCallLabel} →`,
};

export const stepZero = {
  heading: "Step zero: a free 20-minute call",
  body: "A real conversation, not a sales demo. Tell me what you need: a new site, a workflow that keeps breaking, or both. I'll ask what you use today and who'd own the result, then give you my honest take, including when a settings change, your software vendor's support team or a different specialist is the better bet.",
};

export const stepLabels = { website: "Website", workflow: "Workflow", youGet: "You get:" };

export const howIWorkSteps: DetailedStep[] = [
  {
    key: "scope",
    website: {
      paragraph:
        "After the call, you send me a short brief: what the site has to do, your words, photos and logo, and two or three sites you like. I send back a written plan and a fixed price. This step has no separate fee.",
      youGet: "a page list, what each page does, what I need from you, the price and a launch window.",
    },
    workflow: {
      paragraph:
        "The Workflow Review. I look at one process and up to two tools, through an interview, a screen-share and a small sample of real data where it's safe and authorized. Then I rank what's worth fixing. It's a fixed fee, agreed before I start; I'll share it on the call.",
      youGet:
        "written findings · a prioritized plan · a scoped quote for the fix, if one is worth building. The report is yours to keep, and the fee is credited in full if you hire me for the fix.",
      callout: {
        lead: "You can stop here.",
        body: "Take the plan and run with it yourself, or put it on the shelf for later. If the honest answer is \"you don't need a build,\" that's still a win.",
      },
    },
  },
  {
    key: "shape",
    website: {
      paragraph:
        "I design and build the site and show it to you on a private preview link. You get one round of changes. Then I try to break it: phones and desktops, slow connections, keyboard-only use, and test inquiries through the form, plus automated accessibility, speed and security checks.",
      youGet: "a preview link, one revision round, and a site that has passed its checks.",
    },
    workflow: {
      paragraph:
        "I build the fix, usually in the tools you already pay for, against acceptance tests agreed before I start. I test it with safe sample data before it touches your live system. Any change of scope is written down first.",
      youGet: "a written scope and acceptance tests up front, and the build, tested.",
    },
  },
  {
    key: "ship",
    website: {
      paragraph:
        "The site goes live on your domain, with the domain, hosting and form accounts in your name. You get a short guide to what's where. For 14 days after launch, I fix anything that doesn't work as agreed.",
      youGet: "the live site · every login · a handoff guide · 14 days of fixes.",
    },
    workflow: {
      paragraph:
        "I train the people who'll use it, write down how it works, and make sure someone on your side owns it. For 14 days after launch, I fix anything that doesn't work as agreed.",
      youGet: "team training · documentation · a 14-day correction window · full ownership of your accounts, data and logins.",
    },
  },
];

export const howIWorkProof = {
  text: "All three client wrap-up surveys so far rated handoff and training 5/5.",
  note: "(Systems projects.)",
};

export const afterLaunch = {
  heading: "After launch",
  /** The first paragraph's last sentence links to /services#care (Rev 7.1 B1b), with no words added. */
  care: {
    before:
      "Some clients want someone keeping an eye on things. Site Care covers a website's updates, monitoring and small changes. Care covers a workflow: monitoring, small changes, troubleshooting and a regular check-in. ",
    link: { label: "Both have a clear monthly scope, and neither is required.", href: "/services#care" },
  },
  closing: "I don't make 40-slide strategy decks. You get one useful improvement at a time.",
};

export const howIWorkClosing = {
  heading: "Start with the free call.",
  body: "Twenty minutes is enough to know which column you're in.",
  cta: `${bookCallLabel} →`,
};
