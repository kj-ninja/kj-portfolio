type Ref = { id: string };

/**
 * Cross-reference check for Lab and Notes. Astro 7.4.4 only logs an "Invalid content reference"
 * for a wrong `reference()` slug and still exits 0, so this is the fatal check.
 * After parsing, a `reference()` field is `{ id, collection }`; only `id` is used here.
 * Returns one line per broken reference (empty array when all resolve).
 */
export function findBrokenReferences(input: {
  lab: { id: string; data: { related: Ref[]; notes: Ref[] } }[];
  notes: { id: string; data: { lab: Ref[] } }[];
}): string[] {
  const labIds = new Set(input.lab.map((e) => e.id));
  const noteIds = new Set(input.notes.map((e) => e.id));
  const lines: string[] = [];
  for (const entry of input.lab) {
    for (const ref of entry.data.related) {
      if (!labIds.has(ref.id)) lines.push(`lab/${entry.id} related -> lab/${ref.id}`);
    }
    for (const ref of entry.data.notes) {
      if (!noteIds.has(ref.id)) lines.push(`lab/${entry.id} notes -> notes/${ref.id}`);
    }
  }
  for (const entry of input.notes) {
    for (const ref of entry.data.lab) {
      if (!labIds.has(ref.id)) lines.push(`notes/${entry.id} lab -> lab/${ref.id}`);
    }
  }
  return lines;
}
