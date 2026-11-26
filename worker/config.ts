import { siteConfig } from "../site.config.ts";
import { DEFAULT_FORM_SETTINGS, type FormSettings } from "../src/forms/schema.ts";
import type { UploadsConfig } from "./uploads/types.ts";

/**
 * The slice of site.config.ts the editor reads. A structural type (not `typeof siteConfig`, whose values are literal
 * types), so the tests can build a Worker from a fixture instead of the real config. The contact Worker does not read it:
 * it keeps its own settings (worker/contact.ts), so neither the editor nor the forms route changes what the contact form does.
 */
export interface WorkerSiteConfig {
  domain: { url: string; workerName: string; previewHostSuffix: string; productionBranch?: string };
  /** `timeZone` is optional so an older fixture still compiles; missing means UTC. */
  business: { name: string; tagline: string; timeZone?: string };
  /** Optional so an older fixture still compiles; missing means the editor is disabled. */
  editor?: EditorSiteConfig;
  /** Optional so an older fixture still compiles; missing means the defaults. */
  forms?: FormSettings;
  /** Optional so an older fixture still compiles. Only the forms route (worker/forms.ts) reads it; the contact Worker keeps its own settings. */
  contact?: FormsContactSiteConfig;
}

/** The slice of `contact` in site.config.ts that the forms route reads. */
export interface FormsContactSiteConfig {
  siteEmail: string | null;
  fromName: string;
  replyFromName: string;
  pipelineUrl: string | null;
  sheetTabs: { forms: string; formsPreview: string };
}

/** What the forms route needs from `contact`, resolved once. */
export interface FormsContact {
  siteEmail: string | null;
  fromName: string;
  replyFromName: string;
  pipelineUrl: string | null;
  sheetTabs: { forms: string; formsPreview: string };
}

/** The `editor` block of site.config.ts as the Worker reads it. Optional on WorkerSiteConfig: missing means disabled. */
export interface EditorSiteConfig {
  enabled: boolean;
  ownerEmails: string[];
  access: { teamDomain: string | null; aud: string | null };
  github: {
    owner: string | null;
    repo: string | null;
    appId: string | null;
    installationId: string | null;
    botLogin: string | null;
  };
  workersSubdomain: string | null;
  dailyChangeLimit: number;
  ignoredChecks: string[];
  /** Optional so an older fixture still compiles; missing means the spec defaults with `enabled` false. */
  uploads?: UploadsConfig;
}

/** Everything the owner's chat tools need, resolved once. */
export interface EditorConfig {
  enabled: boolean;
  /** Trimmed and lower-cased. */
  ownerEmails: string[];
  /** `domain.url` without a trailing slash. */
  siteUrl: string;
  /** The hostname of `siteUrl`: the only host the editor answers on. */
  host: string;
  siteName: string;
  /** The business's IANA time zone (`business.timeZone`): the day a notice's last day is judged in. */
  timeZone: string;
  workerName: string;
  access: { teamDomain: string | null; aud: string | null };
  github: {
    owner: string | null;
    repo: string | null;
    appId: string | null;
    installationId: string | null;
    botLogin: string | null;
  };
  workersSubdomain: string | null;
  dailyChangeLimit: number;
  ignoredChecks: string[];
  productionBranch: string;
  uploads: UploadsConfig;
}

/** The spec's defaults (docs/superpowers/specs/2026-11-25-uploads-and-photos-design.md, "Settings"). */
export const DEFAULT_UPLOADS: UploadsConfig = {
  enabled: false,
  bucket: null,
  maxPhotoBytes: 20_000_000,
  maxPdfBytes: 10_000_000,
  maxTotalBytes: 200_000_000,
  maxPerDay: 50,
  expireDays: 30,
  types: ["jpeg", "png", "webp", "heic", "pdf"],
};
export interface WorkerConfig {
  businessName: string;
  workerName: string;
  previewHostSuffix: string;
  forms: FormSettings;
  contact: FormsContact;
  editor: EditorConfig;
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

export function buildEditorConfig(config: WorkerSiteConfig): EditorConfig {
  const editor = config.editor;
  const siteUrl = config.domain.url.replace(/\/+$/, "");
  return {
    enabled: editor?.enabled ?? false,
    ownerEmails: (editor?.ownerEmails ?? []).map((email) => email.trim().toLowerCase()),
    siteUrl,
    host: hostOf(siteUrl),
    siteName: config.business.name,
    timeZone: config.business.timeZone ?? "UTC",
    workerName: config.domain.workerName,
    access: { teamDomain: editor?.access.teamDomain ?? null, aud: editor?.access.aud ?? null },
    github: {
      owner: editor?.github.owner ?? null,
      repo: editor?.github.repo ?? null,
      appId: editor?.github.appId ?? null,
      installationId: editor?.github.installationId ?? null,
      botLogin: editor?.github.botLogin ?? null,
    },
    workersSubdomain: editor?.workersSubdomain ?? null,
    dailyChangeLimit: editor?.dailyChangeLimit ?? 10,
    ignoredChecks: [...(editor?.ignoredChecks ?? [])],
    productionBranch: config.domain.productionBranch ?? "main",
    uploads: { ...DEFAULT_UPLOADS, ...(editor?.uploads ?? {}), types: [...(editor?.uploads?.types ?? DEFAULT_UPLOADS.types)] },
  };
}

export function buildWorkerConfig(config: WorkerSiteConfig): WorkerConfig {
  const { domain } = config;
  return {
    businessName: config.business.name,
    workerName: domain.workerName,
    previewHostSuffix: domain.previewHostSuffix,
    forms: { ...DEFAULT_FORM_SETTINGS, ...(config.forms ?? {}) },
    contact: {
      siteEmail: config.contact?.siteEmail ?? null,
      fromName: config.contact?.fromName ?? config.business.name,
      replyFromName: config.contact?.replyFromName ?? config.business.name,
      pipelineUrl: config.contact?.pipelineUrl ?? null,
      sheetTabs: { forms: config.contact?.sheetTabs.forms ?? "Forms", formsPreview: config.contact?.sheetTabs.formsPreview ?? "Forms preview" },
    },
    editor: buildEditorConfig(config),
  };
}

/** The Worker's settings, from the real site.config.ts. */
export const workerConfig: WorkerConfig = buildWorkerConfig(siteConfig);
