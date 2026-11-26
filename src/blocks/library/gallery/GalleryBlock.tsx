import { Container } from "@/components/hl/Container";
import { Photo } from "@/components/hl/Photo";
import { Text } from "@/components/ui/Text";
import type { BlockProps } from "@/blocks/types";
import type { ContentOf } from "@/blocks/schema";
import type { galleryDefinition } from "./definition";

const COLUMNS = {
  "three-column": { grid: "grid-cols-2 lg:grid-cols-3", sizes: "(min-width: 1320px) 400px, (min-width: 1024px) 30vw, 50vw" },
  "two-column": { grid: "grid-cols-1 md:grid-cols-2", sizes: "(min-width: 1320px) 600px, (min-width: 768px) 45vw, 100vw" },
} as const;

/** A grid of photos with optional captions. Nothing opens or moves: a list of figures, named by the heading. */
export function GalleryBlock({ content, variant, anchor, headingId }: BlockProps<ContentOf<typeof galleryDefinition.fields>>) {
  const columns = COLUMNS[variant === "two-column" ? "two-column" : "three-column"];
  return (
    <section id={anchor} aria-labelledby={headingId} className="scroll-mt-24">
      <Container>
        <h2 id={headingId} className="font-ui text-h2 font-bold">
          <Text>{content.heading}</Text>
        </h2>
        {content.intro ? (
          <p className="mt-4 max-w-intro text-blurb">
            <Text>{content.intro}</Text>
          </p>
        ) : null}
        <ul role="list" className={`mt-10 grid items-start gap-x-4 gap-y-8 md:gap-x-6 md:gap-y-10 ${columns.grid}`}>
          {content.photos.map((photo, index) => (
            <li key={index}>
              <figure>
                <Photo image={photo.image} shape="3:2" sizes={columns.sizes} />
                {photo.caption ? (
                  <figcaption className="mt-3 max-w-narrow text-label text-ink-2">
                    <Text>{photo.caption}</Text>
                  </figcaption>
                ) : null}
              </figure>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
