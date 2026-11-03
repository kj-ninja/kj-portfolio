import type { Locale } from "../i18n/locales";
import { splitId } from "../lib/ids";
import type { LabStatus } from "./schemas";

/**
 * One entry per slug: the file in `locale` when it exists, otherwise the English one.
 * Sorted by `order`. Pure, so the fallback rule is unit-testable without `astro:content`.
 */
export function selectLocalized<T extends { id: string; data: { order: number } }>(entries: T[], locale: Locale): T[] {
  const bySlug = new Map<string, T>();
  for (const entry of entries) {
    const { locale: entryLocale, slug } = splitId(entry.id);
    if (entryLocale !== locale && entryLocale !== "en") continue;
    const current = bySlug.get(slug);
    if (!current || entryLocale === locale) bySlug.set(slug, entry);
  }
  return [...bySlug.values()].sort((a, b) => a.data.order - b.data.order);
}

/**
 * Lab index layout: ready and building entries first (input order kept), planned entries after
 * them in their own list, because the spec lists planned entries in a shorter form at the bottom.
 * `counts` has one number per status.
 */
export function groupByStatus<T extends { data: { status: LabStatus } }>(
  entries: T[],
): { listed: T[]; planned: T[]; counts: Record<LabStatus, number> } {
  const counts: Record<LabStatus, number> = { ready: 0, building: 0, planned: 0 };
  for (const entry of entries) counts[entry.data.status] += 1;
  return {
    listed: entries.filter((entry) => entry.data.status !== "planned"),
    planned: entries.filter((entry) => entry.data.status === "planned"),
    counts,
  };
}
