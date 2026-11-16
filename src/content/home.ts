import type { DetailedStep } from "@/components/hl/DetailedSteps";
import { fw } from "@/lib/framework";
import { bookCallLabel, bookCallShortLabel } from "./site";

export type ProofStripContent = {
  stats: { value: string; label: string }[];
  footnote: string;
};

// docs/website-plan.md, B1 (Revision 7.1): the SEO title and description, word for word. The description keeps its
// literal $750 until the price is confirmed (E9 #1).
export const homeMeta = {
  title: "Huston Logic | Custom Websites & Workflow Consulting for Small Businesses",
  description:
    "Custom websites from $750 with a contact form that writes back, plus workflow consulting for small businesses. You see the price before I build.",
};

// B1 hero. Both H1 lines are Grant's final copy. The doors use typographic quotes (docs/STYLE-GUIDE.md §3).
export const heroContent = {
  eyebrow: "Hi, I'm Grant. Websites and workflows for small businesses.",
  line1: "The site brings them in.",
  line2: "The system answers.",
  subhead:
    "Someone fills in your contact form at 9:41 at night. They get a reply right away, and the inquiry lands in your inbox. Custom sites start at $750.",
  supportingLine: "AI-accelerated, checked by hand.",
  /** Phones only, under the compact doors (Rev 7.1 E8). */
  callLink: `${bookCallShortLabel} →`,
};

/**
 * The two doors (B1): small cards in the hero (`title`, the quote), full doors in the band below the arc (`heading`
 * as the H2, `line` as the blurb).
 */
export const doors = [
  {
    title: "“I need a website.”",
    heading: "A custom website, from $750.",
    line: "Up to 7 pages, built in 2 to 4 weeks, with a contact form that writes back.",
    button: "Start a website →",
    href: "/contact?topic=website",
  },
  {
    title: "“Things keep slipping.”",
    heading: "A Workflow Review, for a fixed fee.",
    line: "I look at one process and up to two tools, then write up what's worth fixing. The fee is credited in full if you hire me for the fix.",
    button: "Fix a workflow →",
    href: "/contact?topic=workflow",
  },
] as const;

/** Approved interface string for the door band's accessible name (docs/STYLE-GUIDE.md §7.8). */
export const doorBandLabel = "Two ways to start";

// The hero's card stack (docs/STYLE-GUIDE.md §5.1): a small local bakery's website in front; behind it the owner's
// inbox, a spreadsheet row and an automatic reply, all set off by one message through the contact form.
// Stand-in: the bakery, the person and the dates are invented, and no real business or person's data is used.
export const heroStack = {
  ariaLabel:
    "A small bakery’s website in front. Behind it: the owner’s inbox, a spreadsheet row and an automatic reply, all set off by one message through the contact form.",
  inbox: { tag: "Your inbox", title: "New inquiry from the website", time: "9:41 pm", preview: "Dana Ortiz: Cake for June 6. Are you free?" },
  reply: {
    tag: "An automatic reply, right away",
    title: "Got it, thanks",
    time: "9:41 pm",
    body: "Hi Dana, your note reached the bakery. You’ll hear back within one business day.",
  },
  sheet: {
    tag: "A spreadsheet you own",
    rows: [
      ["Nov 28", "R. Alvarez", "Catering, Jan 17"],
      ["Dec 1", "Kim Lee", "Birthday cake"],
      ["Dec 3", "Dana Ortiz", "Cake, June 6"],
    ],
  },
  site: {
    address: "cornerloaf.example",
    name: "Corner Loaf",
    nav: ["Menu", "Hours", "Order"],
    headline: "Fresh bread, before the sun is up.",
    shows: [
      { date: "Tue–Sat", venue: "7 am to 3 pm" },
      { date: "Sunday", venue: "8 am to 1 pm" },
    ],
    formLabel: "Order for an event",
    formName: "Dana Ortiz",
    message: "Cake for June 6. Are you free?",
    send: "Send",
  },
  chip: { figure: "5/5 on handoff & training", label: "Systems projects, 2024–2025" },
};

// B1 "How it works" compact block: the hidden H2. The three steps themselves come from `framework.steps`.
export const arcContent = {
  srHeading: fw("How it works: {stepsList}"),
};

// ---- Below the doors: docs/website-plan.md, B1 (Revision 7.1), word for word. ----

export const problems = {
  eyebrow: "You might recognize a few of these.",
  line1: "You've been busy with the real work.",
  line2: "Your website and your inbox can tell.",
  items: [
    {
      title: "You send someone your website and wince a little.",
      line: "The business has moved on since the site went up. The site hasn't.",
    },
    {
      title: "Someone filled in your contact form on Friday. You found it Tuesday.",
      line: "New business slips between the website, the inbox and the calendar.",
    },
    {
      title: "Payroll means a weekend with three spreadsheets and a calculator.",
      line: "Staff pay follows rules nobody wants to work out by hand twice a month.",
    },
    {
      title: "A payment failed, and nobody knows who's supposed to chase it.",
      line: "Exceptions sit in a report until they turn into a problem.",
    },
    {
      title: "You pay for a CRM and use it as a very expensive address book.",
      line: "The setup was never finished, or it was finished for the business you used to be.",
    },
    {
      title: "It all works, as long as you're the one doing it.",
      line: "You hired a team. The process still lives in your head.",
    },
  ],
  after: "If two of these sounded familiar, that's a good 20-minute call.",
  cta: `${bookCallShortLabel} →`,
};

export const whatIDo = {
  heading: "What you can hire me for",
  intro:
    "I build custom websites, and I fix the workflows behind small businesses: how an inquiry gets answered, how staff get paid, how the numbers reach you. You can start with either one.",
  groups: [
    {
      heading: "Websites",
      items: [
        {
          title: "A custom site, from $750",
          body: "Designed for your business from scratch, on your own domain, in accounts you own. Checked for speed, accessibility, security and search basics before it goes live.",
        },
        {
          title: "You're looking at one.",
          body: "This site was built the same way I'll build yours. The first three client sites are being built now.",
        },
        {
          title: "A contact form that writes back",
          body: "Every inquiry lands in your inbox and in a spreadsheet you own, and the person gets an automatic reply right away. A personalized follow-up sequence and online booking are add-ons.",
        },
        {
          title: "Someone looking after it",
          body: "Site Care covers updates, monitoring and small changes after launch, if you want it.",
        },
      ],
      link: { label: "See what's included →", href: "/services#websites" },
    },
    {
      heading: "Workflows & systems",
      items: [
        {
          title: "Follow-up that doesn't slip",
          body: "Every inquiry gets an owner, a useful reply and a clear path to a first appointment.",
        },
        {
          title: "Numbers you can see",
          body: "Owner dashboards for revenue, retention, staff performance and pay, from the tools you already use.",
        },
        {
          title: "Payments and staff pay",
          body: "Failed payments get flagged and owned. Pay follows your rules and gets checked before anyone is paid.",
        },
        {
          title: "Software that pulls its weight",
          body: "CRM setup and cleanup, automations, integrations, and custom tools when off-the-shelf doesn't fit.",
        },
      ],
      link: { label: "See workflow work →", href: "/services#workflows" },
    },
  ],
  zoho: {
    lead: "Already on Zoho?",
    body: "It's my deepest specialty. I fix underused and messy Zoho setups without starting over.",
    link: { label: "See how →", href: "/services#zoho" },
  },
};

export const proof = {
  heading: "What clients said afterward",
  /** Said once under the heading instead of as a pill on each quote: the three so far are systems projects, never website proof. */
  note: "All three are from systems projects.",
  teasers: [
    {
      name: "Hideout Fitness",
      body: "An owner dashboard that tracks retention, revenue and profit by coach and client, fed by a nightly sync from the studio's existing scheduling app.",
      href: "/past-work#hideout-fitness",
    },
    {
      name: "Irvine Family Counseling",
      body: "A staff app, payroll submissions, an inquiry pipeline and performance dashboards for a 10-practitioner practice that had outgrown doing everything by hand.",
      href: "/past-work#irvine-family-counseling",
    },
  ],
  teaserLinkLabel: "Read the project →",
};

export const proofStrip: ProofStripContent = {
  stats: [
    { value: "3 of 3", label: "clients said the project met the goals set at kickoff" },
    { value: "5/5", label: "on communication" },
    { value: "5/5", label: "on handoff & training" },
  ],
  footnote:
    "From client wrap-up surveys, 2024–2025. Three projects, three perfect scores. A small sample, I know. I'm working on making it bigger.",
};

export const howItWorks = {
  eyebrow: fw("{steps}"),
  line1: "Same three steps,",
  line2: "website or workflow.",
  /** The unnumbered step zero: the free call. It is never a fourth step. */
  stepZero:
    "Nothing starts until you've seen the plan and the price. It begins with a free 20-minute call: tell me what you need and what you use today, and I'll tell you straight whether I can help.",
  cta: `${bookCallLabel} →`,
  labels: { website: "Website", workflow: "Workflow" },
  steps: [
    {
      key: "scope",
      website: { paragraph: "A short brief, then a written plan and a fixed price." },
      workflow: { paragraph: "A fixed-fee Workflow Review, with written findings and a plan. **You can stop here.**" },
    },
    {
      key: "shape",
      website: { paragraph: "A private preview, one round of changes, then testing on your phone and mine." },
      workflow: { paragraph: "Built in your tools where possible, and tested with safe sample data against checks agreed in advance." },
    },
    {
      key: "ship",
      website: { paragraph: "Live on your domain, with the accounts in your name and 14 days of fixes." },
      workflow: { paragraph: "Your team trained, the process written down, and 14 days of corrections." },
    },
  ] satisfies DetailedStep[],
  link: { label: "See how each step works →", href: "/how-i-work" },
};

export const why = {
  heading: "Why people hire me",
  items: [
    {
      title: "Nothing goes live untested.",
      body: "Every change has to pass automatic checks for security, accessibility and speed before it goes live. That's how big software teams work. I set it up once and use it on every project, so it isn't a line on your invoice.",
    },
    {
      title: "You work with me.",
      body: "Not an account manager or a junior team. The person on the call is the person doing the work.",
    },
    {
      title: "You see the price first.",
      body: "Fixed prices, agreed in writing before I start. No meter running in the background.",
    },
    {
      title: "You own it.",
      body: "The domain, the hosting account, the data and the logins are in your name from day one.",
    },
    {
      title: "I start with what you have.",
      body: "New software isn't always the answer. Often the fix is a setting, a process or a connection between tools you already pay for.",
    },
  ],
};

export const aboutTeaser = {
  heading: "A bit about me",
  paragraphs: [
    "I've built business systems for small teams since 2024, starting with a group therapy practice that had outgrown doing everything by hand. Before Huston Logic, I led delivery for 21 client accounts at a Zoho consulting partner, in industries from healthcare to wholesale to local government. Now I build websites too. This one was first.",
    "I've worked in software since 2020, at startups and at big corporations. At a global consulting firm, I ran the app that 50-plus consultants used on large bankruptcy cases. Its reports went to court, so every release was tested first. AI does the slow parts of that kind of build now, which is why a custom site starts at $750.",
  ],
  link: { label: "More about me →", href: "/about" },
  /** Alt text for the ring headshot (docs/STYLE-GUIDE.md §7.22). */
  photoAlt: "Grant Huston",
};

export const closingCta = {
  line1: "Twenty minutes.",
  line2: "Worst case, you get one good idea.",
  body: "Tell me what's going on with your website or your workflow. If I'm not the right person, I'll tell you who is.",
  cta: `${bookCallLabel} →`,
  secondary: { label: "Send a quick note →", href: "/contact" },
  note: "Not a business, exactly? Solo pros are welcome too.",
};
