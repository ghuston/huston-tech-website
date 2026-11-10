import type { FaqItem } from "@/components/ui/FAQ";

export const servicesMeta = {
  title: "Services | CRM, Automation, Reporting & Workflow Help | Huston Tech",
  description:
    "Workflow Reviews, inquiry follow-up, payment and staff-pay fixes, CRM cleanup, automations, integrations and custom business tools for small teams. No rip-and-replace.",
};

export const servicesHero = {
  eyebrow: "Services",
  title: "Hire me to fix what's slowing your business down.",
  intro:
    "Most of my work starts with one stubborn problem: a handoff that keeps failing, a report that takes all weekend, a system nobody trusts. Here's what you can hire me for, and how we start.",
};

export const subNav = [
  { label: "Start here", href: "#start" },
  { label: "Common fixes", href: "#fixes" },
  { label: "Systems work", href: "#systems" },
  { label: "FAQ", href: "#faq" },
];

export type ServiceBlock = {
  id?: string;
  title: string;
  tagline?: string;
  paragraphs: string[];
  bullets?: string[];
  afterBullets?: string[];
  goodFit?: string;
  note?: string;
};

export const startHere = {
  heading: "Start here",
  blocks: [
    {
      title: "Free 20-minute fit call",
      paragraphs: [
        "A real conversation, not a sales demo. We'll talk through one recurring problem, the tools you use today and who'd own the fix. You'll get my honest take on whether a project makes sense, or whether a settings change, your software vendor's support team or a different specialist is a better bet.",
      ],
    },
    {
      title: "Workflow Review: fixed fee, credited toward the fix",
      paragraphs: [
        "A focused look at one process and the tools involved (up to two). We'll do an interview and a screen-share, and look at a small sample of real data where it's safe and authorized. You get a concise report:",
      ],
      bullets: [
        "What's actually happening, and the likely cause",
        "What your current tools can already do (often more than you think)",
        "Prioritized, practical recommendations",
        "A scoped implementation plan, if a build makes sense",
      ],
      afterBullets: [
        "You can implement the recommendations yourself or hire me to do it. If you hire me, the Review fee is credited toward that project. The fee is fixed and agreed before we start, and I'll share it on our call.",
      ],
    },
  ] satisfies ServiceBlock[],
};

export const commonFixes = {
  heading: "Common fixes",
  blocks: [
    {
      title: "Inquiry-to-first-visit follow-up",
      tagline: "Stop losing new clients between \"hello\" and the first appointment.",
      paragraphs: [
        "I map what happens to an inquiry from the moment it arrives: who sees it, who owns it, how fast a useful reply goes out, and where people drop off before booking. Then I fix the gaps with clear ownership, routing, reminders and follow-up inside the tools you already use. We measure the before and after with your own numbers, not industry averages.",
      ],
      goodFit:
        "inquiries come from several places, your team shares intake, or you're not sure how many inquiries actually become first visits.",
      note: "Curious about AI-drafted replies? We can pilot replies written in your business's voice, with a human approving every message before it goes out.",
    },
    {
      title: "Payment exception cleanup",
      tagline: "Know what's actually been collected and what needs attention.",
      paragraphs: [
        "Failed charges, outstanding balances and unmatched payments get flagged, assigned to someone and followed up on a routine. I configure the reminders and retries your payment tools support, then hand your team a simple recovery process. (Your team stays in charge of collection policy and talking to customers. This is systems work, not debt collection.)",
      ],
      goodFit:
        "you have memberships, packages or recurring billing, and \"Successful\" in one report doesn't always match the bank.",
    },
    {
      title: "Owner reporting & staff-pay reconciliation",
      tagline: "See your numbers without the spreadsheet weekend.",
      paragraphs: [
        "I pull the reports you rely on into one owner view, calculate staff pay from your approved rules, and reconcile it before anyone gets paid. Think revenue by practitioner or coach, retention, referral sources, sessions against targets. If your current software already does some of this, we use it.",
      ],
      goodFit:
        "pay depends on session type, rates or splits, or you make big decisions without numbers you trust.",
      note: "(I prepare and reconcile the numbers; I don't run payroll.)",
    },
  ] satisfies ServiceBlock[],
  goodFitLabel: "Good fit if:",
};

export const systemsWork = {
  heading: "Systems work",
  blocks: [
    {
      id: "zoho",
      title: "CRM setup, cleanup & rescue",
      paragraphs: [
        "A CRM should run your day, not sit there as a contact list. I set up new CRMs, clean up duplicates and dead fields, rebuild pipelines that don't match how you really work, and fix automations that quietly stopped working. **Already on Zoho?** This is my deepest specialty. I rescue underused setups without starting over.",
      ],
    },
    {
      title: "Automations & integrations",
      paragraphs: [
        "Connect the tools that should be talking to each other: website forms to your CRM, bookings to invoices, scheduling data to reports. I build in error alerts and a manual fallback, so a hiccup doesn't silently break your process.",
      ],
    },
    {
      title: "Custom business apps & dashboards",
      paragraphs: [
        "When off-the-shelf software doesn't fit, I build focused internal tools: staff directories, payroll submissions with approvals, performance dashboards, review queues. They're sized to your team, with role-based access so people see what they should.",
      ],
    },
    {
      title: "Ongoing support",
      paragraphs: [
        "After a project, I offer a small monthly support plan for clients who want someone keeping an eye on things: monitoring, small changes, troubleshooting and a regular check-in. It has a clear scope and no surprise invoices.",
      ],
    },
  ] satisfies ServiceBlock[],
};

export const everyProject = {
  heading: "What every project includes",
  items: [
    "A written scope with clear acceptance tests, so we agree on what \"done\" means",
    "Testing with safe sample data before anything touches your live system",
    "Documentation and a training session for the people who'll use it",
    "A 14-day correction window after launch for anything that doesn't work as agreed",
    "You keep ownership of your accounts, data and logins",
  ],
};

export const platforms = {
  heading: "Platforms I know well",
  body: "I'm platform-agnostic. The right tool is the one that fits your business, and very often it's one you already have. **Zoho** is my deepest toolkit (CRM, Creator, Analytics, Books, Desk, Flow, Forms, Bookings and more). I've also worked with tools like QuickBooks Online, Trainerize, Mailchimp, Zapier, Shopify, Google Workspace and RingCentral.",
};

export const whatIDontDo = {
  heading: "What I don't do (so you can find the right person)",
  body: "Clinical, coding or insurance-billing advice · debt collection · running payroll · 24/7 emergency support. If you need one of these, I'm happy to point you somewhere useful.",
};

export const faq = {
  heading: "Questions owners ask",
  items: [
    {
      question: "Do I have to switch to Zoho?",
      answer: "No. I'll work with what you have whenever it can do the job. Zoho is a strength of mine, not a sales target.",
    },
    {
      question: "How much does this cost?",
      answer:
        "Every engagement gets a fixed quote before work starts. The Workflow Review has a set fee, which I'll share on our call, and it's credited toward any project that comes out of it. No hourly meter running in the background.",
    },
    {
      question: "What if the Review says I don't need a project?",
      answer:
        "Then you've saved yourself money and a headache, and you keep the report. That's a perfectly good outcome.",
    },
    {
      question: "We handle sensitive client or health information. Can you help?",
      answer:
        "Yes, carefully. Before I touch any protected data, we put the right agreements in place (like a Business Associate Agreement where required) and set up access controls. I'll never ask you to send client records over email or a website form.",
    },
    {
      question: "Do you work with businesses outside health & wellness?",
      answer:
        "Absolutely: coffee shops, professional services, wholesale, trades and more. If the problem involves processes and software, I'm interested.",
    },
    {
      question: "Who actually does the work?",
      answer: "I do. You'll work directly with me from the first call to the handoff.",
    },
    {
      question: "Do you work remotely?",
      answer:
        "Yes, everything can be done over video and screen-share. [[If true: I'm based in Orange County and happy to meet in person locally.]]",
    },
    {
      question: "What do you need from me?",
      answer:
        "An hour or two of your time for the Review, access to the tools involved, and someone on your team who'll own the process afterward.",
    },
  ] satisfies FaqItem[],
};

export const servicesClosingCta = {
  heading: "Not sure which of these you need?",
  body: "That's what the free call is for. Bring the problem; we'll figure out the label later.",
};
