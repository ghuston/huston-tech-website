import { fw } from "@/lib/framework";

export const aboutMeta = {
  title: "About Grant Huston | Huston Tech",
  description:
    "Grant Huston is a hands-on business systems consultant who helps small teams fix follow-up, reporting and messy software. Zoho specialist, platform-agnostic, refreshingly honest.",
};

export const aboutHero = {
  eyebrow: "About",
  title: "Hi, I'm Grant. I like messy problems.",
  intro: "Specifically, the kind that live in the gaps between your booking app, your spreadsheet and your inbox.",
  photoLabel: "[[PHOTO: headshot of Grant, natural light. Grant to supply]]",
};

export const aboutSections = {
  shortVersion: {
    heading: "The short version",
    body: "I'm the founder of Huston Tech and, for now, the whole team. I help owner-led businesses get their systems to do more of the work: follow-up that doesn't slip, numbers you can see, staff pay that adds up, and software that finally earns its subscription fee.",
  },
  howIGotHere: {
    heading: "How I got here",
    paragraphs: [
      "My background is in business analysis, QA and application support. Basically, I've spent my career finding where things break and why. [[Confirm wording and add one line of detail, such as years or the type of company.]]",
      "In 2024 I started building systems for small businesses. My first big project was a group therapy practice that had outgrown doing everything by hand. I built the team a staff app, payroll submissions, an inquiry pipeline and dashboards, and the practice went on to grow from 5 to 10 people. Next came a personal training studio whose owner wanted real numbers on his coaches and clients, without giving up the scheduling app his team already used.",
      "In 2026 I joined a Zoho consulting partner as a developer and moved into a consulting role within a few months. There, I led delivery for 21 client accounts: a Medicaid disability services provider, an interior design firm, a newly formed distributor, a wholesaler, a municipal government and more, often directing a team of developers. I learned a lot about what makes projects succeed, and about what happens when a business gets a system that's bigger than its problem.",
      "So I started Huston Tech to do the kind of work I love most: close to the owner, focused on the real problem, and sized to the business.",
    ],
  },
  workingWithMe: {
    heading: "What working with me is like",
    intro: fw("Every engagement runs the same three steps: **{stepsList}.** In practice, that means:"),
    items: [
      "**I listen first.** Before I suggest anything, I make sure I understand how your business actually works.",
      fw("**I tell you the truth.** If {find} shows you don't need a build, I'll say so."),
      "**I keep scope clear.** You'll always know what's included, what isn't, and what it costs before work begins.",
      fw("**I don't vanish at launch.** {flick} means your team is trained, the documentation is written, and someone on your side owns it."),
    ],
  },
  whatIBring: {
    heading: "What I bring",
    items: [
      "Zoho, deeply: CRM, Creator, Analytics, Books, Desk, Flow, Forms and the rest of the suite",
      "Integrations and automations across many other tools",
      "Dashboards and reporting people actually use",
      "Requirements, process mapping, QA and training",
      "Experience with healthcare and other sensitive data, where the agreements and access controls come first",
      "[[Certifications, e.g. CAPM / CSM, only if current and verified. Otherwise delete this line.]]",
    ],
  },
  offTheClock: {
    heading: "Off the clock",
    paragraphs: [
      "I'm also a musician [[instrument/genre]], which turns out to be decent training for this work: listen first, keep time, and make the parts fit together. [[One personal line: where you live, what you're into.]]",
    ],
  },
  partnerBox: {
    title: "Zoho partner agencies:",
    body: "need an experienced, US-based consultant for overflow delivery, scoping or configuration?",
    link: { label: "Let's talk →", href: "/contact?topic=partner" },
  },
};
