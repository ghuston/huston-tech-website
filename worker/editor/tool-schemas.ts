/** JSON Schemas for the editor's tool arguments, and the by-hand check that holds an arguments object to them. */

export interface Prop {
  type: "string" | "integer" | "array" | "object";
  description?: string;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  minimum?: number;
  minItems?: number;
  maxItems?: number;
  items?: Record<string, unknown>;
}

export interface InputSchema {
  type: "object";
  properties: Record<string, Prop>;
  required: string[];
  additionalProperties: false;
}

export const noArguments: InputSchema = { type: "object", properties: {}, required: [], additionalProperties: false };

const pagePath = { type: "string", description: 'A page path such as "/hours".' };
const itemKey = { type: "string", description: 'An item as "<collection>/<slug>", such as "posts/new-inspection-service".' };
const settingsName = { enum: ["business", "brand", "notice"], description: "One of the settings files." };
const collectionName = { enum: ["posts", "videos", "episodes", "testimonials", "team"], description: "One of the collections." };
const formId = { type: "string", description: 'A form as its id, such as "quote-request". The contact form ("contact") is Huston Logic\'s and cannot be changed.' };
const slug = { type: "string", description: "Lowercase words and digits joined by hyphens, 1 to 60 characters." };
/** What a set, insert_item or remove_item changes: exactly one of page, item or settings. */
const target = {
  page: { type: "string", description: 'A page path such as "/hours".' },
  item: { ...itemKey, description: 'An item as "<collection>/<slug>", such as "posts/new-inspection-service". Pointers may not reach /status (use set_item_status).' },
  settings: { ...settingsName, description: 'A settings file. In "brand" only /logo may be set this way (colors and fonts have their own operations).' },
  form: { ...formId, description: 'A form by id. Pointers may reach /name, /fields, /button, /thanks and /download, never /status (use set_form_status).' },
};
const targeted = (properties: Record<string, unknown>) => ({
  type: "object",
  properties: { ...properties, ...target },
  required: Object.keys(properties),
  additionalProperties: false,
  anyOf: [{ required: ["page"] }, { required: ["item"] }, { required: ["settings"] }, { required: ["form"] }],
});
const position = (what: string) => ({ type: "integer", minimum: 1, description: `${what} (1-based, as the owner sees it).` });
const pointer = {
  type: "string",
  description: 'JSON Pointer inside the page, such as "/blocks/1/content/paragraphs/1" (indexes here start at 0).',
};
const strict = (properties: Record<string, unknown>) => ({
  type: "object",
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});

/** One schema per operation kind, as worker/editor/operations.ts accepts them. */
const operationSchemas: Record<string, unknown>[] = [
  targeted({ op: { const: "set" }, pointer, value: { description: "The new value. Null removes an optional field." } }),
  targeted({ op: { const: "insert_item" }, pointer, at: position("Where the new item goes in the list"), value: { description: "The new list item." } }),
  targeted({ op: { const: "remove_item" }, pointer, at: position("The list item to remove") }),
  strict({
    op: { const: "insert_block" },
    page: pagePath,
    at: position("Where the new section goes on the page"),
    block: {
      type: "object",
      description:
        "The new section: type, content, and optionally variant and anchor. A photo is { src, alt, focus? }: use upload:<id> as src for an upload (focus is center, top, bottom, left or right: where a cropped photo keeps its focus).",
      properties: { type: { type: "string" }, variant: { type: "string" }, anchor: { type: "string" }, content: { type: "object" } },
      required: ["type", "content"],
      additionalProperties: false,
    },
  }),
  strict({ op: { const: "move_block" }, page: pagePath, from: position("The section to move"), to: position("Where it should end up") }),
  strict({ op: { const: "remove_block" }, page: pagePath, block: position("The section to remove") }),
  strict({
    op: { const: "add_page" },
    page: { type: "object", description: "A whole new page: path, title, description, status, optional menu, and blocks." },
  }),
  strict({ op: { const: "archive_page" }, page: pagePath }),
  strict({ op: { const: "restore_page" }, page: pagePath }),
  strict({
    op: { const: "add_item" },
    collection: collectionName,
    slug,
    item: { type: "object", description: 'The new item: "status" ("draft" or "live"; draft unless the owner said to publish) and its fields, as get_collection lists them.' },
  }),
  strict({ op: { const: "set_item_status" }, item: itemKey, status: { enum: ["draft", "live", "archived"], description: "draft: save as a draft; live: publish or restore; archived: archive." } }),
  strict({
    op: { const: "add_form" },
    form: formId,
    definition: {
      type: "object",
      description:
        'The new form: "status": "live", "name" (what the owner calls it), "fields" (1 to 12; each { id, type, label, required, optional help, error, max, purpose, options, display }), "button" and "thanks" (plain text), and optionally "download": { "href": "upload:<id>" of a PDF, "title" }. Field types: short-text, long-text, email (exactly one, required), phone, dropdown (options, 2 to 20), checkbox, consent (never ticked to start). Put field ids and every key as get_form shows them.',
    },
  }),
  strict({ op: { const: "set_form_status" }, form: formId, status: { enum: ["live", "archived"], description: "archived: the form leaves the site and every section that shows it is removed from its pages in the same change; live: restore it." } }),
  strict({ op: { const: "set_brand_color" }, role: { enum: ["brand", "accent"] }, value: { type: "string", pattern: "^#[0-9a-fA-F]{6}$", description: "A #rrggbb color. It is refused if any text or button would stop being readable." } }),
  strict({ op: { const: "set_font" }, role: { enum: ["display", "body", "accent"] }, font: { type: "string", description: "A font id from get_settings (brand)." } }),
];

const uploadId: Prop = { type: "string", pattern: "^[a-z0-9]{8}$", description: "An upload id from list_uploads." };
const proposalId: Prop = { type: "string", pattern: "^[a-z0-9]{8}$", description: "The proposal id that propose_change returned." };
const changeNumber: Prop = { type: "integer", minimum: 1, description: "The change number that publish_change returned." };

export const schemas = {
  getPage: { type: "object", properties: { path: { type: "string", minLength: 1, maxLength: 60, description: 'A page path such as "/hours".' } }, required: ["path"], additionalProperties: false },
  propose: {
    type: "object",
    properties: {
      summary: { type: "string", minLength: 1, maxLength: 100, description: "One short plain line saying what the change is." },
      operations: {
        type: "array",
        minItems: 1,
        maxItems: 40,
        description:
          "Everything the owner asked for, applied in order. To use an upload, write upload:<id> as a photo's src (with alt: what the photo shows) or as a link's href (for a PDF); an image may also carry focus.",
        items: { type: "object", oneOf: operationSchemas },
      },
    },
    required: ["summary", "operations"],
    additionalProperties: false,
  },
  getCollection: { type: "object", properties: { collection: { type: "string", pattern: "^(posts|videos|episodes|testimonials|team)$", description: "One of posts, videos, episodes, testimonials, team." } }, required: ["collection"], additionalProperties: false },
  getItem: {
    type: "object",
    properties: {
      collection: { type: "string", pattern: "^(posts|videos|episodes|testimonials|team)$", description: "One of posts, videos, episodes, testimonials, team." },
      slug: { type: "string", minLength: 1, maxLength: 60, description: "The item's slug." },
    },
    required: ["collection", "slug"],
    additionalProperties: false,
  },
  getForm: { type: "object", properties: { form: { type: "string", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$", maxLength: 60, description: "A form's id from list_forms." } }, required: ["form"], additionalProperties: false },
  getSettings: { type: "object", properties: { name: { type: "string", pattern: "^(business|brand|notice)$", description: "business, brand or notice." } }, required: ["name"], additionalProperties: false },
  upload: { type: "object", properties: { upload_id: uploadId }, required: ["upload_id"], additionalProperties: false },
  preview: { type: "object", properties: { proposal_id: proposalId }, required: ["proposal_id"], additionalProperties: false },
  publish: {
    type: "object",
    properties: {
      proposal_id: proposalId,
      owner_confirmation: { type: "string", minLength: 1, maxLength: 500, description: "The owner's own words saying yes to the change list." },
    },
    required: ["proposal_id", "owner_confirmation"],
    additionalProperties: false,
  },
  change: { type: "object", properties: { change: changeNumber }, required: ["change"], additionalProperties: false },
  request: {
    type: "object",
    properties: {
      request: { type: "string", minLength: 1, maxLength: 2000, description: "What the owner asked for, in their words." },
      lane_reason: { type: "string", minLength: 0, maxLength: 500, description: "Why the site's sections cannot do it." },
    },
    required: ["request"],
    additionalProperties: false,
  },
} satisfies Record<string, InputSchema>;

/** Plain-language problems with an arguments object; an empty list means it fits the schema. */
export function checkArguments(schema: InputSchema, args: unknown): string[] {
  const value = args === undefined ? {} : args;
  if (typeof value !== "object" || value === null || Array.isArray(value)) return ["The arguments must be an object."];
  const given = value as Record<string, unknown>;
  const problems: string[] = [];
  for (const key of Object.keys(given)) if (!(key in schema.properties)) problems.push(`"${key}" is not an argument of this tool.`);
  for (const key of schema.required) if (!(key in given)) problems.push(`"${key}" is required.`);
  for (const [key, prop] of Object.entries(schema.properties)) {
    if (!(key in given)) continue;
    const found = given[key];
    const problem = checkProp(key, prop, found);
    if (problem) problems.push(problem);
  }
  return problems;
}

function checkProp(key: string, prop: Prop, value: unknown): string | null {
  if (prop.type === "string") {
    if (typeof value !== "string") return `"${key}" must be text.`;
    if (prop.minLength !== undefined && value.length < prop.minLength) return `"${key}" must be at least ${prop.minLength} characters.`;
    if (prop.maxLength !== undefined && value.length > prop.maxLength) return `"${key}" is ${value.length} characters; the limit is ${prop.maxLength}.`;
    if (prop.pattern && !new RegExp(prop.pattern).test(value)) return `"${key}" is not in the expected form.`;
    return null;
  }
  if (prop.type === "integer") {
    if (typeof value !== "number" || !Number.isInteger(value)) return `"${key}" must be a whole number.`;
    if (prop.minimum !== undefined && value < prop.minimum) return `"${key}" must be at least ${prop.minimum}.`;
    return null;
  }
  if (prop.type === "array") {
    if (!Array.isArray(value)) return `"${key}" must be a list.`;
    if (prop.minItems !== undefined && value.length < prop.minItems) return `"${key}" must hold at least ${prop.minItems} item(s).`;
    if (prop.maxItems !== undefined && value.length > prop.maxItems) return `"${key}" holds ${value.length} items; the limit is ${prop.maxItems}.`;
    if (value.some((item) => typeof item !== "object" || item === null || Array.isArray(item))) return `Every item in "${key}" must be an object.`;
  }
  return null;
}
