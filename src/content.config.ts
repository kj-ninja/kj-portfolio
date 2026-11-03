import { defineCollection, reference } from "astro:content";
import { file, glob } from "astro/loaders";
import { z } from "astro/zod";
import { requirePolishForReady } from "./content/loaders";
import { labBase, noteBase, refineLab, workSchema } from "./content/schemas";

// Ids are `<locale>/<slug>` (see src/lib/ids.ts). In Astro 7.4.4 `reference()` only makes Astro log
// an "Invalid content reference" error for a wrong slug; the build still exits 0. References are
// enforced by `assertReferences` in src/lib/content.ts (pure check: src/content/references.ts).
const lab = defineCollection({
  loader: requirePolishForReady(glob({ pattern: "**/*.mdx", base: "./src/content/lab" })),
  schema: labBase
    .extend({
      related: z.array(reference("lab")).default([]),
      notes: z.array(reference("notes")).default([]),
    })
    .superRefine(refineLab),
});

const notes = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/notes" }),
  schema: noteBase.extend({ lab: z.array(reference("lab")).default([]) }),
});

const work = defineCollection({
  loader: file("./src/content/work.yaml"),
  schema: workSchema,
});

export const collections = { lab, notes, work };
