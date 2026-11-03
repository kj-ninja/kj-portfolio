import { z } from "astro/zod";

const labStatus = z.enum(["ready", "building", "planned"]);
export type LabStatus = z.infer<typeof labStatus>;

export const labBase = z.object({
  title: z.string().min(1),
  /** The one-sentence question the entry answers; shown on the index. */
  question: z.string().min(1),
  /** Position in the Lab index (1-based). */
  order: z.number().int().positive(),
  status: labStatus,
  publishedOn: z.coerce.date().optional(),
  updatedOn: z.coerce.date().optional(),
  /** When Krzysztof wrote "My take". Required for ready entries. */
  takeWrittenOn: z.coerce.date().optional(),
  readingMinutes: z.number().int().positive(),
  sandbox: z.enum(["none", "island"]).default("island"),
  sources: z.array(z.object({ title: z.string().min(1), url: z.url() })).default([]),
});

type LabInput = z.output<typeof labBase>;

/** Ready entries must be publishable: a date, Krzysztof's take, and at least one source. */
export function refineLab(value: LabInput, ctx: z.RefinementCtx): void {
  if (value.status !== "ready") return;
  if (!value.publishedOn)
    ctx.addIssue({ code: "custom", path: ["publishedOn"], message: "ready entries need publishedOn" });
  if (!value.takeWrittenOn) {
    ctx.addIssue({ code: "custom", path: ["takeWrittenOn"], message: "ready entries need takeWrittenOn (My take)" });
  }
  if (value.sources.length === 0) {
    ctx.addIssue({ code: "custom", path: ["sources"], message: "ready entries need at least one source" });
  }
}

export const noteBase = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  publishedOn: z.coerce.date(),
  tags: z.array(z.string()).default([]),
});

const workStatus = z.enum(["live", "repo", "in-progress"]);

export const workSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  what: z.object({ en: z.string().min(1), pl: z.string().min(1) }),
  status: workStatus,
  url: z.url().optional(),
  repo: z.url().optional(),
});
