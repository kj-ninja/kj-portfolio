import type { Loader } from "astro/loaders";

/** Frontmatter fields both locale files of one Lab entry must agree on. */
type Shared = { status?: string; order?: number };

/**
 * Build-time rule from the spec: English is mandatory for every Lab entry, Polish only for
 * entries with `status: "ready"`, and when both files exist they must agree on `status` and
 * `order` (one entry, one position, one state in both locales). A per-entry zod schema cannot see
 * sibling files, so the check runs after the wrapped loader has filled the store. Throwing here
 * fails `astro build`.
 * The check runs on each content sync; edits made during `astro dev` are
 * not re-validated until restart (glob's watcher updates entries without re-running this check).
 */
export function requirePolishForReady(inner: Loader): Loader {
  return {
    name: `${inner.name}:pl-for-ready`,
    async load(context) {
      await inner.load(context);
      const missingPl: string[] = [];
      const orphanPl: string[] = [];
      const mismatched: string[] = [];
      for (const [id, entry] of context.store.entries()) {
        if (id.startsWith("en/")) {
          const slug = id.slice("en/".length);
          const en = entry.data as Shared;
          const pl = context.store.get(`pl/${slug}`)?.data as Shared | undefined;
          if (pl) {
            if (en.status !== pl.status) mismatched.push(`${slug} (status: en "${en.status}", pl "${pl.status}")`);
            if (en.order !== pl.order) mismatched.push(`${slug} (order: en ${en.order}, pl ${pl.order})`);
          } else if (en.status === "ready") {
            missingPl.push(id);
          }
        } else if (id.startsWith("pl/")) {
          if (!context.store.has(`en/${id.slice("pl/".length)}`)) orphanPl.push(id);
        }
      }
      const problems: string[] = [];
      if (missingPl.length > 0) {
        problems.push(
          `Ready Lab entries need a Polish counterpart: ${missingPl.join(", ")}. ` +
            'Add src/content/lab/pl/<slug>.mdx or set status to "building".',
        );
      }
      if (orphanPl.length > 0) {
        problems.push(
          `Polish Lab entries without an English file: ${orphanPl.join(", ")}. ` +
            "English is mandatory: add src/content/lab/en/<slug>.mdx or remove the Polish file.",
        );
      }
      if (mismatched.length > 0) {
        problems.push(
          `EN and PL files of one Lab entry must have the same status and order: ${mismatched.join(", ")}.`,
        );
      }
      if (problems.length > 0) throw new Error(problems.join("\n"));
    },
  };
}
