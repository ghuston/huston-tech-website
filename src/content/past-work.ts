import type { FrameworkStepKey } from "./site";
import { fw } from "@/lib/framework";

export const pastWorkMeta = {
  title: "Past Work & Client Results | Huston Tech",
  description:
    "Real projects for a group therapy practice and a personal training studio, client testimonials, and agency experience across 21 client accounts. See what Grant Huston has built.",
};

export const pastWorkHero = {
  eyebrow: "Past work",
  title: "Proof beats promises.",
  intro:
    "I'd rather show you what I've built than tell you how great I am. Here are real projects, in my clients' own words.",
  howToRead: {
    title: "How to read this page",
    items: [
      "**Client projects (2024–2025):** scoped, designed, built and supported by me.",
      "**Agency experience (2026):** delivered while employed at a Zoho consulting partner, often leading a team of developers. Client names withheld.",
    ],
  },
};

export type CasePhases = Record<FrameworkStepKey, string>;

/** The strip describes what happened in each phase. Neither project claims a formal paid Review took place. */
export const casePhasesHeading = fw("{shorts} at a glance");

export type CaseStudyContent = {
  id: "hideout-fitness" | "irvine-family-counseling";
  heading: string;
  client: string;
  meta: string[];
  testimonialId: string;
  quoteHeading: string;
  screenshots: string[];
  phases: CasePhases;
  challenge: string;
  builtHeading: string;
  built: string[];
  resultsLabel: string;
  results: string[];
};

export const caseStudies: CaseStudyContent[] = [
  {
    id: "hideout-fitness",
    heading: "Personal training studio: owner reporting fed by a nightly sync",
    client: "Hideout Fitness",
    meta: ["Personal training", "Owner plus a team of coaches", "2025"],
    testimonialId: "T1-hideout",
    quoteHeading: "In his words",
    screenshots: [
      "[[SCREENSHOT: Hideout owner dashboard. Grant to supply; blur client and coach names]]",
      "[[SCREENSHOT: session review queue or coach-pay view. Grant to supply; blur names]]",
    ],
    phases: {
      find: "The owner had no reliable view of attrition, retention by coach, or revenue and profit per client. His session data was locked in a scheduling app that couldn't sync in real time, and coach pay depended on three variables.",
      fix: "An owner app and dashboards, a nightly sync that tells cancellations from deactivated clients, and automatic coach-rate calculations.",
      flick:
        "Handed over to the owner, the app's only user, with a quick review queue for the few sessions that need a human eye. Handoff and training rated 5/5 in his wrap-up survey.",
    },
    challenge:
      "The owner wanted a clear picture of his business: client attrition, new client generation, income, retention by coach, and revenue and profit per client. His scheduling lived in Trainerize, which couldn't sync data in real time. Coach pay also depended on several factors: the session type (four of them), how many clients were in the session, and the coach.",
    builtHeading: "What I built",
    built: [
      "A custom owner app and dashboards built around his existing scheduling system, without replacing it.",
      "A scheduled nightly sync that refreshes up to 60 days of session data.",
      "Logic for a tricky detail: when a session disappears from the scheduling data, the system works out whether it was cancelled or the client was deactivated, and flags unclear cases for a quick review. Dedicated screens keep that review to a few clicks.",
      "Automatic coach-rate calculations that re-check affected sessions every night when a session or coach changes.",
      "A review list that catches clients with sessions but no rate set, so nothing gets missed.",
    ],
    resultsLabel: "Results (client-reported, wrap-up survey)",
    results: ["Goals met", "Delivered on time", "10/10 likely to recommend"],
  },
  {
    id: "irvine-family-counseling",
    heading: "Group therapy practice: from \"I do everything\" to a team that runs on systems",
    client: "Irvine Family Counseling",
    meta: ["Group therapy practice", "10 practitioners", "2024–2025"],
    testimonialId: "T3-ifc",
    quoteHeading: "In her words",
    screenshots: [
      "[[SCREENSHOT: clinician performance or referral dashboard. Grant to supply; blur clinician and client names]]",
      "[[SCREENSHOT: staff app or inquiry pipeline. Grant to supply; blur names]]",
    ],
    phases: {
      find: "The owner was handling most of the administration, supervision, policy work and her own clients herself, and most processes were manual.",
      fix: "A staff app with role-based access, twice-monthly payroll submissions with owner approval, a CRM inquiry pipeline and performance dashboards.",
      flick: "Training sessions for every employee at handoff, then ongoing enhancements as the practice grew. Handoff and training rated 5/5.",
    },
    challenge:
      "The owner was doing most of the work herself, from administration and supervision to policy and her own clients. Growth opportunities were piling up faster than she could act on them.",
    builtHeading: "What I built",
    built: [
      "**A staff app** with individual logins and role-based access. Admins see everything; clinicians see what they need. It includes an employee directory and profiles covering licenses, pay history, goals and whether each clinician is taking new clients.",
      "**Payroll submissions:** the app creates pay records for every clinician twice a month. Clinicians fill in their hours and submit, and the owner approves, all in one place.",
      "**Inquiry pipeline:** website inquiries flow straight into a CRM. The admin gets notified, the person inquiring gets a confirmation, and each inquiry moves through clear stages. Assigning a clinician notifies that clinician automatically.",
      "**Performance dashboards:** sessions, average rate and monthly revenue against targets for each clinician, quarterly trends, comparisons with company averages, and a referral dashboard that follows each inquiry from first contact onward.",
      "**Training** for every employee at handoff.",
    ],
    resultsLabel: "Results (client-reported)",
    results: [
      "The practice grew from 5 to 10 employees. In Monica's words: \"This investment had to happen to grow from a 5 to a 10 employee business.\"",
      "The dashboards get used \"a few times a day.\"",
      "\"Based on numbers, I made business decisions to expand.\"",
    ],
  },
];

export const agencyExperience = {
  heading: "Before Huston Tech: leading projects at a Zoho consulting partner",
  intro:
    "In 2026 I worked at a Zoho consulting partner, first as a developer and then as a business systems consultant. I led delivery for **21 client accounts**, often directing a bench of developers. A few snapshots (client names withheld):",
  snapshots: [
    "**Disability services provider (healthcare):** led the team that built an automated pipeline from the provider's clinical system into reporting. It runs three times a day and feeds the monthly compliance reports.",
    "**Newly formed equipment distributor:** took parts operations from plan to live. The operations lead was soon running orders through to invoice himself, and field-service dispatch was in use about three weeks after scoping began.",
    "**Interior design firm:** designed a quote-to-cash flow connecting booking deposits, quotes, invoices and purchase orders, while keeping the firm's existing accounting software.",
    "**B2B food wholesaler:** turned a CRM the team used as a contact list into a daily sales tool, with reorder alerts, lead temperature and revenue against target. The owner reported higher CRM use and said the project met his main objectives.",
    "**Cleaning services company:** replaced hand-tracked vendor scoring with a system that captures bid response times and post-job survey scores automatically.",
    "**Trade show organizer:** redesigned a CRM that needed reworking every year into one that rolls over cleanly each season.",
    "**Benefits brokerage:** designed the CRM data model and the HIPAA groundwork, including coordinating the software vendor's Business Associate Agreement and marking protected fields. I also directed a help-desk build with 13 ticket layouts.",
    "**Behavioral health program:** moved intake and case tracking from forms and spreadsheets into a CRM, with portal access so caseworkers could work in the system without paid seats.",
  ],
  footnote:
    "These projects were delivered as part of a team at a former employer; my role on each is described accurately above. Industries also included HR outsourcing, B2B marketing, real estate, municipal government and nonprofit housing.",
};

export const pastWorkClosing = {
  heading: "Want to be the next project on this page?",
};
