import { bookCallLabel } from "./site";
import { fw } from "@/lib/framework";

// docs/website-plan.md, B2 (Revision 7.1). Word for word. [[$750]] stays a placeholder until the price is confirmed (E9 #1).

export const servicesMeta = {
  title: "Services | Custom Websites & Workflow Consulting | Huston Logic",
  description:
    "Custom websites from [[$750]] with a contact form that writes back, plus workflow consulting: follow-up, payments, reporting, CRM cleanup and automations. Fixed prices, agreed before I start.",
};

export const servicesHero = {
  eyebrow: "Services",
  title: "Websites and workflows, scoped and priced before I start.",
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
  { label: "Workflows", href: "#workflows" },
  { label: "Care", href: "#care" },
  { label: "FAQ", href: "#faq" },
];

export const websites = {
  heading: "Custom websites, from [[$750]]",
  paragraphs: [
    "Every site I build is designed from scratch for one business or band. No templates, and no page builder you're stuck with afterward.",
    "AI does the slow parts of the build, so the price doesn't have to cover them. I design every page and check it myself before you see it.",
  ],
  includesHeading: "What [[$750]] includes",
  includes: [
    "Up to 7 pages, designed around your brand and two or three sites you like",
    "A contact form that writes back: every inquiry goes to your inbox and to a spreadsheet you own, and the person gets an automatic reply right away",
    "Fast on phones and desktops, and checked for accessibility, security and search basics before launch",
    "Hosting set up in an account in your name, on your own domain",
    "One round of revisions, and 14 days of fixes after launch",
  ],
  details: [
    "**Bigger or unusual sites** get a fixed quote after the call.",
    "**Payment:** 50% to start, 50% at launch.",
    "**Add-ons:** a personalized follow-up sequence (emails in your voice, sent on a schedule after each inquiry) · online booking · a blog you can update yourself · extra pages · help writing the words · Site Care after launch. Each one is priced in the plan before I start.",
    "**Who it's for:** small businesses, solo practices and bands. If people need to find you and get in touch, this is the place to start.",
    "**What I need from you:** your words, photos and logo, two or three websites you like, and access to your domain. No words yet? I can write them with you.",
  ],
  cta: { label: "Start a website →", href: "/contact?topic=website" },
};

export type ServiceItem = {
  id?: string;
  title: string;
  /** Italic line under the title. */
  tagline?: string;
  paragraph: string;
  goodFit?: string;
  /** Italic lead plus an optional sentence, after "Good fit if". */
  afterFit?: { em: string; text?: string };
};

export const workflows = {
  heading: "Workflow consulting",
  intro:
    "Most of this work starts with one stubborn problem: a handoff that keeps failing, a report that eats a weekend, a system nobody trusts.",
  review: {
    heading: "Start with a Workflow Review",
    aside: fw("this is {scope} for a workflow; fixed fee, credited toward the fix"),
    intro:
      "A focused look at one process and the tools involved (up to two), through an interview, a screen-share and a small sample of real data where it's safe and authorized. You get a concise written report:",
    items: [
      "What's actually happening, and the likely cause",
      "What your current tools can already do (often more than you'd guess)",
      "A prioritized plan of practical recommendations",
      "A scoped quote for the fix, if a build makes sense",
    ],
    stop: {
      lead: "You can stop here.",
      body: "Implement the plan yourself, or hire me for the fix. If the honest answer is \"you don't need a build,\" that's still a win. The fee is fixed and agreed before I start, and I'll share it on our call. If you hire me for the fix, it's credited in full toward that project.",
    },
    cta: { label: "Fix a workflow →", href: "/contact?topic=workflow" },
  },
  commonFixes: {
    heading: "Common fixes",
    goodFitLabel: "Good fit if:",
    items: [
      {
        title: "Inquiry-to-first-visit follow-up",
        tagline: "For the gap between \"hello\" and the first appointment.",
        paragraph:
          "I map what happens to an inquiry from the moment it arrives: who sees it, who owns it, how fast a useful reply goes out, and where people drop off before booking. Then I fix the gaps with clear ownership, routing, reminders and follow-up inside the tools you already use. The before and after are measured with your own numbers, not industry averages.",
        goodFit:
          "inquiries come from several places, your team shares intake, or you're not sure how many inquiries become first visits.",
        afterFit: {
          em: "Curious about AI-drafted replies?",
          text: "I can pilot replies written in your business's voice, with a person approving every message before it goes out.",
        },
      },
      {
        title: "Payment exception cleanup",
        tagline: "Know what's actually been collected and what needs attention.",
        paragraph:
          "Failed charges, outstanding balances and unmatched payments get flagged, assigned to someone and followed up on a routine. I configure the reminders and retries your payment tools support, then hand your team a simple recovery process. (Your team stays in charge of collection policy and talking to customers. This is systems work, not debt collection.)",
        goodFit:
          "you have memberships, packages or recurring billing, and \"Successful\" in one report doesn't always match the bank.",
      },
      {
        title: "Owner reporting & staff-pay reconciliation",
        tagline: "See your numbers without the spreadsheet weekend.",
        paragraph:
          "I pull the reports you rely on into one owner view, calculate staff pay from your approved rules, and reconcile it before anyone gets paid. Think revenue by practitioner or coach, retention, referral sources, sessions against targets. If your current software already does some of this, I use it.",
        goodFit: "pay depends on session type, rates or splits, or you make big decisions without numbers you trust.",
        afterFit: { em: "(I prepare and reconcile the numbers; I don't run payroll.)" },
      },
    ] satisfies ServiceItem[],
  },
  systemsWork: {
    heading: "Systems work",
    items: [
      {
        id: "zoho",
        title: "CRM setup, cleanup & rescue",
        paragraph:
          "A CRM should run your day, not sit there as a contact list. I set up new CRMs, clean up duplicates and dead fields, rebuild pipelines that don't match how you really work, and fix automations that quietly stopped working. **Already on Zoho?** This is my deepest specialty. I rescue underused setups without starting over.",
      },
      {
        title: "Automations & integrations",
        paragraph:
          "Connect the tools that should be talking to each other: website forms to your CRM, bookings to invoices, scheduling data to reports. I build in error alerts and a manual fallback, so a hiccup doesn't silently break your process.",
      },
      {
        title: "Custom business apps & dashboards",
        paragraph:
          "When off-the-shelf software doesn't fit, I build focused internal tools: staff directories, payroll submissions with approvals, performance dashboards, review queues. They're sized to your team, with role-based access so people see what they should.",
      },
    ] satisfies ServiceItem[],
  },
};

export const care = {
  heading: "After launch",
  items: [
    {
      title: "Site Care (websites)",
      paragraph:
        "Updates, monitoring and small changes to your site, with a clear monthly scope. You keep every login either way.",
    },
    {
      title: "Care (workflows)",
      paragraph: fw(
        "For clients who want someone keeping an eye on a system after {ship}: monitoring, small changes, troubleshooting and a regular check-in, with a clear scope and no surprise invoices.",
      ),
    },
  ] satisfies ServiceItem[],
  closing: "Both are optional, and I offer them only when there's a real need. Prices are in the plan, never sprung on you later.",
};

export const everyProject = {
  heading: "What every project includes",
  groups: [
    {
      label: fw("{shape}"),
      items: [
        "A written plan or scope, so you know what \"done\" means before I start",
        "Testing before anything touches your live site or system",
        "For workflows, the Review fee credited toward the project",
      ],
    },
    {
      label: fw("{ship}"),
      items: [
        "A handoff guide, and training for the people who'll use it",
        "14 days of fixes after launch for anything that doesn't work as agreed",
        "Ownership of your accounts, data and logins",
      ],
    },
  ],
};

export const platforms = {
  heading: "Platforms I know well",
  body: "I'm platform-agnostic. The right tool is the one that fits your business, and very often it's one you already have. **Zoho** is my deepest toolkit (CRM, Creator, Analytics, Books, Desk, Flow, Forms, Bookings and more). I've also worked with tools like QuickBooks Online, Trainerize, Mailchimp, Zapier, Shopify, Google Workspace and RingCentral. Websites are hosted on Cloudflare, in an account in your name.",
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
      question: "How much does a website cost?",
      answer:
        "From [[$750]] for a custom site of up to 7 pages with a contact form that writes back. Bigger or unusual sites get a fixed quote after the call. Either way, the price is agreed in writing before I start, and you pay 50% to start and 50% at launch.",
    },
    {
      question: "Do you use AI?",
      answer: "Yes, to build faster. I design, decide and check every page myself.",
    },
    {
      question: "Who owns the website?",
      answer:
        "You do. The domain, the hosting account, the form and the logins are in your name from day one. If you stop working with me, the site stays yours.",
    },
    {
      question: "Where is it hosted?",
      answer: "On Cloudflare, in an account set up in your name. [[Typical yearly hosting and domain cost, once confirmed.]]",
    },
    {
      question: "Can I edit it myself?",
      answer:
        "With the blog add-on, you can write and edit articles yourself. Other changes are covered by Site Care, or quoted when you need them.",
    },
    {
      question: "How long does a website take?",
      answer: "[[Timeline, once the first three sites are done.]]",
    },
    {
      question: "How much does workflow work cost?",
      answer:
        "You get a fixed quote before any paid work starts. The Workflow Review has a set fee, which I'll share on our call, and it's credited toward the fix if you go ahead. No hourly meter running in the background.",
    },
    {
      question: "What if the Review shows I don't need a build?",
      answer:
        "Then that's where it ends. You keep the report and save yourself the money and the headache. If the honest answer is \"you don't need a build,\" that's still a win.",
    },
    {
      question: "Do I have to switch to Zoho?",
      answer: "No. I'll work with what you have whenever it can do the job. Zoho is a strength of mine, not a sales target.",
    },
    {
      question: "We handle sensitive client or health information. Can you help?",
      answer:
        "Yes, carefully. Before I touch any protected data, the right agreements go in place (like a Business Associate Agreement where required) and access controls get set up. I'll never ask you to send client records over email or a website form.",
    },
    {
      question: "What kinds of clients do you work with?",
      answer:
        "Small businesses, solo professionals and creatives, from therapy practices and training studios to engineering firms and bands. If it involves a website or a messy process, I'm interested.",
    },
    {
      question: "Who actually does the work?",
      answer: "I do. You'll work directly with me from the first call to the handoff.",
    },
    {
      question: "Do you work remotely?",
      answer:
        "Yes, all of it can be done over video and screen-share. [[If true: I'm based in Orange County and happy to meet in person locally.]]",
    },
    {
      question: "What do you need from me?",
      answer:
        "For a website: your words, photos and logo, two or three sites you like, and access to your domain. For a workflow: an hour or two of your time for the Review, access to the tools involved, and someone on your team who'll own the process afterward.",
    },
  ] satisfies FaqItem[],
};

export const servicesClosingCta = {
  heading: "Bring the problem. The label can wait.",
  body: "Website, workflow or both: the free call sorts out which.",
  cta: `${bookCallLabel} →`,
};
