# This site's own blocks

The template's blocks live in `src/blocks/library/`. A block that only this site needs lives here, so a template update
never touches it.

To add one:

1. Make a folder for it, for example `src/site-blocks/pricing-table/`.
2. In it, write `definition.ts`: call `defineBlock` with `source: "site"`, a `type` name that no library block uses, a
   title, a plain-words description, its fields with limits, its variants, where it may go on a page, its motion and an
   `example` that passes its own fields. Import only from `../../blocks/schema.ts`.
3. In it, write the component (a PascalCase `.tsx` file). It receives `content`, `variant`, `anchor`, `headingId` and
   `primary`. Use only the site's design tokens, put no padding on its `<section>` (the page adds the spacing) and give
   its heading the `headingId`.
4. Add the definition to the list in `definitions.ts` and the component to the list in `components.tsx`.

It then appears in the block catalog and on the `/blocks` showcase. `npm run check:content` and `npm run check:design`
must pass for it like any library block.
