import { siteConfig } from "./site";

// Home's words are in src/content/pages/home.json (docs/website-rev8.md, B1). What stays here is read by other code:
// the page title and description (root layout, JSON-LD) and the app screens and talk pairs that /systems still shows.

export const homeMeta = {
  title: "Huston Logic | Personal Software and Websites for Small Businesses",
  description: siteConfig.oneLiner,
};

/**
 * The follow-up app's phone screenshots (docs/website-rev8.md, Section D): seeded demo data, 390 × 844, in
 * public/work/pipeline-<key>.{avif,webp}. Home shows three; /systems shows all four.
 */
export const appScreens = {
  today: { key: "today", label: "Today", alt: "The Today screen of the follow-up app, with demo data" },
  pipeline: { key: "pipeline", label: "Pipeline", alt: "The Pipeline screen of the follow-up app, with demo data" },
  brief: { key: "brief", label: "Brief", alt: "The Brief screen of the follow-up app, with demo data" },
  rule: { key: "rule", label: "Rule preview", alt: "A rule preview in the follow-up app, with demo data" },
} as const;

/** B1 section 2. The bubbles keep the quotation marks B1 writes around them. */
export const installing = {
  eyebrow: "What I'm installing now",
  heading: "A sales follow-up system you run by talking.",
  pairs: [
    { said: "“Just talked to Dana. She wants a quote for three units by Friday.”", result: "Notes saved. Follow-up set for Friday." },
    { said: "“Who do I need to talk to today?”", result: "A short list, with what was said last time." },
    {
      said: "“From now on, nudge me three days after any proposal with no reply.”",
      result: "The rule is added, in plain English. Changed your mind? “Undo that.”",
    },
  ],
  screens: [appScreens.today, appScreens.pipeline, appScreens.brief],
  /** Approved interface string: the accessible name of the screenshots' swipe row. */
  screensLabel: "App screens, demo data",
  /** The visible line under the screenshots (AGENTS.md: mocked screenshots are labelled "Demo data"). */
  screensNote: "Demo data",
  line: "I set it up, host it for you, and tune it for 30 days. Your data stays yours, and if you ever want to run it yourself, I hand it all over.",
  link: { label: "See how the install works →", href: "/systems" },
};

