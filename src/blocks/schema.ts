// Block schema: what a block is, what fields it takes and how a page file is shaped. Import-free (plain Node and Next
// both load it), so no aliases, enums or parameter properties. Content types are inferred from the field schema, so a
// component's props and the content check can never disagree.
import type { CollectionKind } from "../collections/schema.ts";
import type { siteRhythms } from "../site-blocks/design.ts";

export const MENU_PLACES = ["header", "footer", "legal"] as const;
export type MenuPlace = (typeof MENU_PLACES)[number];

/** Paths a page may not take: routes the site already owns. */
export const RESERVED_PATHS = ["/blocks", "/api", "/contact/thanks", "/og.png", "/icon.svg", "/sitemap.xml", "/robots.txt", "/404", "/index", "/_not-found", "/_next"] as const;
/** Pages that must exist and be live: the booking fallback and the form live on /contact. */
export const REQUIRED_LIVE = ["/", "/contact"] as const;
/** The site's booking link (the scheduler, else /contact#book). */
export const BOOKING_LINK = "@booking";

/** Alt text that says nothing. Same entries as `genericAltText` in scripts/change-scope-rules.mjs (a test keeps them equal). */
export const GENERIC_ALT_WORDS = [
  "image",
  "img",
  "photo",
  "picture",
  "graphic",
  "icon",
  "logo",
  "alt",
  "alt text",
  "todo",
  "tbd",
  "untitled",
  "placeholder",
];

/** The shapes an image slot can have (width:height). Each image field names one; the picture is cropped to it. */
export const IMAGE_SHAPES = ["3:2", "4:3", "4:5", "1:1", "16:9"] as const;
export type ImageShape = (typeof IMAGE_SHAPES)[number];
/** Where a cropped picture keeps its focus. */
export const IMAGE_FOCUS = ["center", "top", "bottom", "left", "right"] as const;
export type ImageFocus = (typeof IMAGE_FOCUS)[number];
/** A PDF a link may point to: /files/<lowercase words and digits joined by hyphens>.pdf */
export const FILE_LINK_RE = /^\/files\/[a-z0-9]+(?:-[a-z0-9]+)*\.pdf$/;

type FieldBase = { label: string; help?: string };
/** A field is required unless it says `required: false`. */
type Optionality = { required?: boolean };

export type TextField = FieldBase & Optionality & { kind: "text"; max: number; min?: number };
export type LinkField = FieldBase & Optionality & { kind: "link" };
export type ActionField = FieldBase & Optionality & { kind: "action"; labelMax: number };
export type ImageField = FieldBase & Optionality & { kind: "image"; shape: ImageShape };
export type VideoField = FieldBase & Optionality & { kind: "video" };
export type BooleanField = FieldBase & Optionality & { kind: "boolean" };
export type ChoiceField = FieldBase & Optionality & { kind: "choice"; options: readonly string[] };
export type ListField = FieldBase & Optionality & {
  kind: "list";
  of: Field;
  min: number;
  max: number;
  /** Optional fields of the list's items that every item gives or none does (for example a photo on every idea). */
  together?: readonly string[];
};
export type ObjectField = FieldBase & Optionality & { kind: "object"; fields: Fields };
/** A calendar date written YYYY-MM-DD. */
export type DateField = FieldBase & Optionality & { kind: "date" };
/** A whole number from `min` to `max`. */
export type NumberField = FieldBase & Optionality & { kind: "number"; min: number; max: number };
/** The id of a live form (src/content/forms/<id>.json) other than the contact form. */
export type FormRefField = FieldBase & Optionality & { kind: "form" };
/** A Spotify or Apple Podcasts episode address (the audio allowlist in embeds.ts). */
export type AudioField = FieldBase & Optionality & { kind: "audio" };
/** A post body: a list of parts (see BodyPart). */
export type BodyField = FieldBase & Optionality & { kind: "body"; maxParts: 200; maxChars: 40000 };

export type Field =
  | TextField
  | LinkField
  | ActionField
  | ImageField
  | VideoField
  | BooleanField
  | ChoiceField
  | ListField
  | ObjectField
  | DateField
  | NumberField
  | AudioField
  | BodyField
  | FormRefField;
export type Fields = { readonly [name: string]: Field };

/** Text with links in it: a string, or a list of strings and link objects. Text allows only **bold** and [[placeholder]]. */
export type Inline = string | (string | { text: string; href: string })[];

export const BODY_HEADING_LEVELS = [2, 3] as const;
export const BODY_LIST_STYLES = ["bullet", "number"] as const;
export const BODY_LIST_ITEMS_MAX = 30;

/** One part of a post body. */
export type BodyPart =
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "paragraph"; text: Inline }
  | { type: "list"; style: "bullet" | "number"; items: Inline[] }
  | { type: "quote"; text: string; source?: string }
  | { type: "photo"; image: { src: string; alt: string; focus?: ImageFocus }; caption?: string };

type Simplify<T> = { [K in keyof T]: T[K] } & {};
type RequiredKeys<F> = { [K in keyof F]: F[K] extends { required: false } ? never : K }[keyof F];
type OptionalKeys<F> = { [K in keyof F]: F[K] extends { required: false } ? K : never }[keyof F];

type ValueOf<T> = T extends { kind: "text" | "link" | "video" | "date" | "audio" | "form" }
  ? string
  : T extends { kind: "number" }
    ? number
    : T extends { kind: "body" }
      ? BodyPart[]
  : T extends { kind: "action" }
    ? { label: string; href: string }
    : T extends { kind: "image" }
      ? { src: string; alt: string; focus?: ImageFocus }
      : T extends { kind: "boolean" }
        ? boolean
        : T extends { kind: "choice"; options: infer O extends readonly string[] }
          ? O[number]
          : T extends { kind: "list"; of: infer I }
            ? ValueOf<I>[]
            : T extends { kind: "object"; fields: infer G extends Fields }
              ? ContentOf<G>
              : never;

/** The content a block holds, inferred from its fields: required fields are plain, optional ones are `?`. */
export type ContentOf<F extends Fields> = Simplify<{ [K in RequiredKeys<F>]: ValueOf<F[K]> } & { [K in OptionalKeys<F>]?: ValueOf<F[K]> }>;

/** The template's three rhythms plus the ones this site adds in src/site-blocks/design.ts (`siteRhythms`). */
export type RhythmName = "hero" | "section" | "compact" | keyof typeof siteRhythms;

export type Placement = {
  position: "first" | "last" | "any";
  maxPerPage: number;
  rhythm: RhythmName;
  joinsHero?: boolean;
  /** The one page path this block may be used on (for example the post index on /blog). */
  onlyOn?: string;
  /**
   * The renderer's wrapper is not `position: relative`. For a site block whose section was not positioned before the
   * page became blocks and draws nothing absolutely placed: a positioned wrapper at a fractional offset paints
   * sub-pixels differently (the headshot ring), so this keeps such a section's pixels exactly.
   */
  plainWrapper?: boolean;
};

export type Motion = ({ entrance: "default" } | { entrance: "none"; reason: string }) & {
  /** The page's one focal animation: names an @keyframes hl-signature-<keyframes> in hl.css. */
  signature?: { keyframes: string; reason: string };
};

export type Variant = { name: string; description: string };

export type BlockDefinition<F extends Fields = Fields> = {
  type: string;
  title: string;
  description: string;
  source: "library" | "site";
  fields: F;
  variants: readonly Variant[];
  placement: Placement;
  motion: Motion;
  fixedAnchor?: string;
  /** Why the block needs client JavaScript; required when its folder holds a "use client" file. */
  interactive?: string;
  /** The collection a list block reads its items from; the renderer resolves them. */
  collection?: CollectionKind;
  example: ContentOf<F>;
};

/** A definition of any block, as the registry and the check see it. */
export type AnyBlockDefinition = Omit<BlockDefinition, "example"> & { example: unknown };

/** Declares a block. The `const` parameter keeps the field schema exact so `ContentOf` can read it. */
export function defineBlock<const F extends Fields>(definition: BlockDefinition<F>): BlockDefinition<F> {
  return definition;
}

export type BlockInstance = {
  type: string;
  variant?: string;
  anchor?: string;
  content: Record<string, unknown>;
};

/** A menu link's anchor: a lowercase slug, so the link is `path#anchor` (for example /services#websites or /#hello). */
export type PageMenu = { label: string; order: number; places: readonly MenuPlace[]; anchor?: string };

/** The address a menu link points to: the page path, then `#anchor` when the menu entry has one. */
export function menuHref(path: string, anchor?: string): string {
  return anchor === undefined ? path : `${path}#${anchor}`;
}

export type PageData = {
  path: string;
  title: string;
  description: string;
  status: "live" | "archived";
  menu?: PageMenu;
  blocks: BlockInstance[];
};

/** The path a page file holds: `home.json` is `/`, `about.json` is `/about`. */
export function pathForFile(file: string): string {
  const name = file.replace(/^.*\//, "").replace(/\.json$/, "");
  return name === "home" ? "/" : `/${name}`;
}

/** The file name for a path: `/` is `home.json`, `/about` is `about.json`. */
export function fileForPath(path: string): string {
  return path === "/" ? "home.json" : `${path.slice(1)}.json`;
}
