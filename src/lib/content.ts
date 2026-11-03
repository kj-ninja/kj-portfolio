import { type CollectionEntry, getCollection } from "astro:content";
import { findBrokenReferences } from "../content/references";
import { selectLocalized } from "../content/select";
import type { Locale } from "../i18n/locales";
import { splitId } from "./ids";

export type LabEntry = CollectionEntry<"lab">;
export type NoteEntry = CollectionEntry<"notes">;
export type WorkItem = CollectionEntry<"work">;

let referencesChecked: Promise<void> | undefined;

async function checkReferences(): Promise<void> {
  const [lab, notes] = await Promise.all([getCollection("lab"), getCollection("notes")]);
  const broken = findBrokenReferences({ lab, notes });
  if (broken.length > 0) throw new Error(`Broken content references:\n${broken.join("\n")}`);
}

/**
 * Fatal cross-reference check (Astro 7.4.4 only logs wrong `reference()` slugs and exits 0).
 * In a production build (`import.meta.env.PROD`) the check runs once: one shared promise per
 * process, and a failure stays rejected so every page that calls it fails. In `astro dev` it runs
 * again on every call, so a fixed or newly broken reference shows up without a restart.
 */
export function assertReferences(): Promise<void> {
  if (!import.meta.env.PROD) return checkReferences();
  referencesChecked ??= checkReferences();
  return referencesChecked;
}

/**
 * Every Lab slug once: the file in `locale` when it exists, otherwise the English one
 * (allowed only for non-ready entries, enforced by `requirePolishForReady`). Sorted by `order`.
 */
export async function labEntries(locale: Locale): Promise<LabEntry[]> {
  await assertReferences();
  return selectLocalized(await getCollection("lab"), locale);
}

export function labSlug(entry: LabEntry): string {
  return splitId(entry.id).slug;
}

/** Notes of one locale only, newest first. */
export async function noteEntries(locale: Locale): Promise<NoteEntry[]> {
  await assertReferences();
  const all = await getCollection("notes", (entry) => splitId(entry.id).locale === locale);
  return all.sort((a, b) => b.data.publishedOn.getTime() - a.data.publishedOn.getTime());
}

export function noteSlug(entry: NoteEntry): string {
  return splitId(entry.id).slug;
}

export async function workItems(): Promise<WorkItem[]> {
  return getCollection("work");
}
