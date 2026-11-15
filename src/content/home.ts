import type { DetailedStepContent, StepZeroContent } from "@/components/ui/ProcessSteps";
import { fw } from "@/lib/framework";
import { bookCallShortLabel } from "./site";

export type ProofStripContent = {
  stats: { value: string; label: string }[];
  footnote: string;
};

// docs/website-plan.md, B1 (Revision 7.1): the SEO title and description, word for word. The description keeps its
// literal [[$750]] until the price is confirmed (E9 #1).
export const homeMeta = {
  title: "Huston Logic | Custom Websites & Workflow Consulting for Small Businesses",
  description:
    "Custom websites from [[$750]] with a contact form that writes back, plus workflow consulting for small businesses and bands. You see the price before I build.",
};

// B1 hero. Both H1 lines are Grant's final copy. The doors use typographic quotes (docs/STYLE-GUIDE.md §3).
export const heroContent = {
  eyebrow: "Websites and workflows for small businesses",
  line1: "The site brings them in.",
  line2: "The system answers.",
  subhead: "Custom websites for small businesses, and the follow-up that turns an inquiry into a booking.",
  supportingLine: "AI-accelerated, checked by hand.",
  /** Phones only, under the compact doors (Rev 7.1 E8). */
  callLink: `${bookCallShortLabel} →`,
};

/** The two doors (B1): small cards in the hero, full doors in the band below the arc. */
export const doors = [
  {
    title: "“I need a website.”",
    line: "Custom, from [[$750]]. The contact form writes back.",
    button: "Start a website →",
    href: "/contact?topic=website",
  },
  {
    title: "“Things keep slipping.”",
    line: "A fixed-fee Workflow Review, credited toward the fix.",
    button: "Fix a workflow →",
    href: "/contact?topic=workflow",
  },
] as const;

/** Approved interface string for the door band's accessible name (docs/STYLE-GUIDE.md §7.8). */
export const doorBandLabel = "Two ways to start";

// The hero's card stack (docs/STYLE-GUIDE.md §5.1): a band's website in front; behind it the owner's inbox, a
// spreadsheet row and an automatic reply, all set off by one message through the contact form.
// stand-in until W3 approved: the band, the person and the dates are invented, and no real person's data is used.
export const heroStack = {
  ariaLabel:
    "A band’s website in front. Behind it: the owner’s inbox, a spreadsheet row and an automatic reply, all set off by one message through the contact form.",
  inbox: { tag: "Your inbox", title: "New inquiry from the website", time: "9:41 pm", preview: "Dana Ortiz: Wedding, June 6. Are you free?" },
  reply: {
    tag: "An automatic reply, right away",
    title: "Got it, thanks",
    time: "9:41 pm",
    body: "Hi Dana, your note reached the band. You’ll hear back within one business day.",
  },
  sheet: {
    tag: "A spreadsheet you own",
    rows: [
      ["Nov 28", "R. Alvarez", "Bar, Jan 17"],
      ["Dec 1", "Kim Lee", "Private party"],
      ["Dec 3", "Dana Ortiz", "Wedding, June 6"],
    ],
  },
  site: {
    address: "thenightherons.example",
    name: "The Night Herons",
    nav: ["Shows", "Music", "Book us"],
    headline: "Blues that stays up late.",
    shows: [
      { date: "Fri 12 Dec", venue: "The Harbor Room" },
      { date: "Sat 20 Dec", venue: "Linden Hall" },
    ],
    formLabel: "Book the band",
    formName: "Dana Ortiz",
    message: "Wedding, June 6. Are you free?",
    send: "Send",
  },
  chip: { figure: "5/5 on handoff & training", label: "Systems projects, 2024–2025" },
};

// B1 "How it works" compact block: the hidden H2. The three steps themselves come from `framework.steps`.
export const arcContent = {
  srHeading: fw("How it works: {stepsList}"),
};

export const problems = {
  eyebrow: "Sound familiar?",
  heading: "Your business grew. Your systems didn't get the memo.",
  notes: [
    {
      title: "A new client inquiry came in Friday. Nobody saw it until Tuesday.",
      body: "New business slips through the cracks between your website, inbox and calendar.",
    },
    {
      title: "Payroll means a weekend with three spreadsheets and a calculator.",
      body: "Staff pay depends on rules nobody wants to calculate by hand twice a month.",
    },
    {
      title: "The payment failed. Nobody knows who's supposed to chase it.",
      body: "Exceptions sit in a report until they become a problem.",
    },
    {
      title: "We pay for a CRM. We use it as a very expensive address book.",
      body: "The setup was never finished, or it was finished for a business you no longer are.",
    },
    {
      title: "Every number I need lives in a different app.",
      body: "You make big decisions on gut feel because pulling the real numbers takes too long.",
    },
    {
      title: "Everything works… as long as I'm the one doing it.",
      body: "You hired a team, but the processes still live in your head.",
    },
  ],
  after: "If you nodded at two or more of these, we should talk.",
};

export const whatIDo = {
  heading: "Practical fixes for the stuff that slows you down",
  intro:
    "I'm a business systems consultant. In plain English, I make your software, data and day-to-day processes work together so your team spends less time chasing and more time doing the work you're actually in business for.",
  items: [
    {
      title: "Follow-up that doesn't fall through the cracks",
      body: "Every inquiry gets an owner, a fast and useful reply, and a clear path to a first appointment.",
    },
    {
      title: "Numbers you can actually see",
      body: "Owner dashboards and reports for revenue, retention, staff performance and pay, pulled together from the tools you already use.",
    },
    {
      title: "Payments and staff pay without the spreadsheet weekend",
      body: "Failed payments get flagged and owned. Pay calculations follow your rules, every time.",
    },
    {
      title: "Software that finally pulls its weight",
      body: "CRM setup and cleanup, automations, integrations, and custom tools when off-the-shelf doesn't fit.",
    },
  ],
  cta: { label: "Explore services →", href: "/services" },
  zoho: {
    lead: "Already on Zoho?",
    body: "It's one of my deepest specialties. I fix underused and messy Zoho setups without starting over.",
    link: { label: "See how →", href: "/services#zoho" },
  },
};

export const proof = {
  heading: "Real projects. Real owners. Their words, not mine.",
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
    { value: "3 of 3", label: "clients said we met the goals set at kickoff" },
    { value: "5/5", label: "on communication" },
    { value: "5/5", label: "on handoff & training" },
  ],
  footnote:
    "From client wrap-up surveys, 2024–2025. Three projects, three perfect scores. A small sample, I know. I'm working on making it bigger.",
};

export const howItWorks = {
  eyebrow: fw("{steps}"),
  heading: "What you get at each step",
  stepZero: {
    body: "Every project runs the same three steps, and nothing starts until you've seen the scope and the price. It all begins with a free 20-minute call: tell me what's bugging you and what you use today, and I'll tell you honestly whether I can help.",
  } satisfies StepZeroContent,
  steps: [
    {
      key: "scope",
      subtitle: "the Workflow Review",
      paragraphs: [
        "I dig into one process: what's happening, why, and what your current tools can already do about it. Then I rank what's worth fixing.",
      ],
      list: {
        label: "You get",
        items: ["Written findings", "A prioritized plan", "A scoped quote for the fix, if one is worth building"],
      },
      afterList: "It's a fixed fee agreed up front, and the report is yours to keep.",
      callout: {
        lead: "You can stop here.",
        body: "Take the plan and run with it yourself, or put it on the shelf for later. If the honest answer is \"you don't need a build,\" that's still a win.",
      },
    },
    {
      key: "shape",
      subtitle: "a clearly scoped project",
      paragraphs: [
        "I build the change, usually in the tools you already pay for, and test it with safe sample data against acceptance tests we agreed on before I started.",
      ],
      list: {
        label: "You get",
        items: [
          "A written scope and acceptance tests up front",
          "The build, tested",
          "The Review fee credited toward the project",
        ],
      },
    },
    {
      key: "ship",
      subtitle: "the handoff",
      paragraphs: [
        "Switched on, handed over, off your plate. I train the people who'll use it, document how it works, and make sure someone on your side owns it.",
      ],
      list: {
        label: "You get",
        items: ["Team training", "Documentation", "A 14-day correction window", "Full ownership of your accounts, data and logins"],
      },
      proof: "All three client wrap-up surveys so far rated handoff and training 5/5.",
    },
  ] satisfies DetailedStepContent[],
  after: "No rip-and-replace. No 40-slide strategy deck. Just one useful improvement at a time.",
  support: {
    lead: "Want me to keep an eye on things after handoff?",
    link: { label: "Ongoing support is available", href: "/services#systems" },
  },
};

export const whyHustonTech = {
  heading: "Why owners work with me",
  items: [
    {
      title: "I start with what you have.",
      body: "New software isn't always the answer. Often the fix is a setting, a process or a connection between tools you already pay for.",
    },
    {
      title: "You work with me.",
      body: "Not an account manager, not a rotating junior team. The person on your call is the person doing the work.",
    },
    {
      title: "You always know what you're paying for.",
      body: "Fixed fees, agreed in writing before work starts. No hourly meter running in the background.",
    },
  ],
};

export const aboutTeaser = {
  heading: "Hi, I'm Grant.",
  body: "I've been building business systems for small teams since 2024. The first was a group therapy practice that had outgrown doing everything by hand. Before starting Huston Logic, I led delivery for 21 client accounts at a Zoho consulting partner, in industries from healthcare to wholesale to local government. I love the moment a messy process finally clicks.",
  link: { label: "More about me →", href: "/about" },
  photoLabel: "[[PHOTO: headshot of Grant. Grant to supply]]",
};

export const insightsTeaser = {
  heading: "Useful stuff, no fluff",
  body: "Practical articles on systems, follow-up, reporting and running a growing team.",
  link: { label: "Read Insights →", href: "/insights" },
  comingSoon: "The first articles are on the way.",
};

export const closingCta = {
  heading: "Let's find the thing that's slowing you down.",
  body: "Twenty minutes, no pitch deck, no pressure. You'll leave with at least one useful idea, even if we never work together.",
  secondary: { label: "send a quick note →", href: "/contact" },
  microcopy:
    "Not in health & wellness? I work with all kinds of small businesses. If it involves messy processes and software, I'm interested.",
};
