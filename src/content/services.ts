import { bookCallLabel } from "./site";
import { fw } from "@/lib/framework";

// docs/website-rev8.md, B3 (Revision 8). Word for word.

export const servicesMeta = {
  title: "Services | Accelerated Websites | Huston Logic",
  description:
    "Every site I build is designed from scratch for one business. Fixed, and agreed in writing before I start.",
};

export const servicesHero = {
  eyebrow: "Services",
  title: "Websites, scoped and priced before I start.",
  intro: {
    before:
      "Some people come to me for a website. Some come because work keeps slipping between their tools. ",
    link: { label: "The process is the same either way", href: "/how-i-work" },
    after: ", and you see the price before I build anything.",
  },
};

/** The sticky sub-nav (docs/STYLE-GUIDE.md §7.28). */
export const subNav = [
  { label: "Websites", href: "#websites" },
  { label: "Care", href: "#care" },
  { label: "FAQ", href: "#faq" },
];

export const websites = {
  heading: "Accelerated Websites",
  paragraphs: [
    "Every site I build is designed from scratch for one business. AI does the slow parts of the build, so the price doesn't have to cover them. I design every page and check it myself before you see it.",
  ],
  includesHeading: "What's included",
  includes: [
    "A custom design",
    "A contact form that writes back, and feeds your system if you have one",
    "Fast on phones, and checked for accessibility, security and search basics before launch",
    "Hosting in my own accounts, on a domain that stays in your name",
    "One round of revisions before launch",
  ],
  details: [
    "**After launch:** for six weeks, small changes are included, and I fix anything that doesn't work as agreed. Want something changed? Say it in a sentence. I make the change, it passes the same checks, and it goes live. Bigger changes get a quote first.",
    "**Price:** fixed, and agreed in writing before I start. I'll quote it after the call. Payment is 50% to start and 50% at launch. Hosting is a flat fee, paid monthly or yearly, and it's in the quote.",
  ],
  cta: { label: "Start a website →", href: "/contact?topic=website" },
};

export type ServiceItem = {
  title: string;
  paragraph: string;
};

export const care = {
  heading: "After launch",
  items: [
    {
      title: "Site Care (websites)",
      paragraph:
        "Updates, monitoring and small changes to your site, with a clear monthly scope. Hosting is separate, and either way I hand everything over whenever you ask.",
    },
    {
      title: "Care plan (systems)",
      paragraph:
        "After the 30 days, a care plan is optional: updates, keeping the AI connection working, and a tune-up each quarter. Cancel it and the system keeps running.",
    },
  ] satisfies ServiceItem[],
  closing: "Both are optional, and I offer them only when there's a real need. Prices are in the plan, never sprung on you later.",
};

export const everyProject = {
  heading: "What every project includes",
  groups: [
    {
      label: fw("{scope}"),
      items: [
        "A written plan or scope, so you know what \"done\" means before I start",
      ],
    },
    {
      label: fw("{shape}"),
      items: ["Testing before anything touches your live site or system"],
    },
    {
      label: fw("{ship}"),
      items: [
        "A handoff guide, and training for the people who'll use it",
        "Your domain, email and data in your name, and a full handover whenever you ask",
      ],
    },
  ],
};

export const whatIDontDo = {
  heading: "What I don't do (so you can find the right person)",
  body: "Clinical, medical-coding or insurance-billing advice · debt collection · running payroll · 24/7 emergency support. If you need one of these, I'll point you somewhere useful.",
};

export type FaqItem = { question: string; answer: string };

export const faq = {
  heading: "Questions people ask",
  items: [
    {
      question: "What does it cost?",
      answer:
        "A fixed price, in writing, before I start. A system is a one-time install with an optional care plan. Hosting, for a website or a system, is a flat fee, paid monthly or yearly.",
    },
    {
      question: "Do you use AI?",
      answer: "Yes, to build faster. I design, decide and check every page and every system myself.",
    },
    {
      question: "Who owns it?",
      answer:
        "You do. Your domain and email stay in your name, and your data stays yours. I host the site, or your copy of the system, in my own accounts. Ask any time and I hand over everything, current code included, and move it to your own accounts. From then on you run it, and my responsibility ends.",
    },
    {
      question: "Can I change it myself?",
      answer:
        "A system, yes: add rules, stages and fields by asking. A website: tell me what you want changed, and I make it through the same checks. Small changes are included for six weeks after launch.",
    },
    {
      question: "Which AI app does it work with?",
      answer: "I'll check yours on the call. It needs an AI app that can connect to your own tools.",
    },
    {
      question: "We handle health or other protected information. Can you help?",
      answer: "With a website, yes, carefully. The talking system isn't set up for protected records yet.",
    },
    {
      question: "Who does the work?",
      answer: "I do, from the first call to the handoff.",
    },
    {
      question: "Do you work remotely?",
      answer:
        "Yes, all of it can be done over video and screen-share. I'm based in Southern California and happy to meet in person locally.",
    },
    {
      question: "What do you need from me?",
      answer:
        "For a website: your words, photos and logo, two or three sites you like, and access to your domain. For a system: an hour for the design call, and a spreadsheet of your contacts if you have one.",
    },
  ] satisfies FaqItem[],
};

export const servicesClosingCta = {
  heading: "Bring the problem. The label can wait.",
  body: "Website, system or both: the free call sorts out which.",
  cta: `${bookCallLabel} →`,
};
