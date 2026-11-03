import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

// global.css repeats the dark tokens in two blocks (CSS cannot share one block between a media
// query and an attribute selector). This keeps them from drifting apart.
const css = readFileSync(new URL("./global.css", import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

function declarations(pattern: RegExp): Record<string, string> {
  const body = css.match(pattern)?.[1];
  if (body === undefined) throw new Error(`block not found: ${pattern}`);
  const entries = body
    .split(";")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const colon = line.indexOf(":");
      return [line.slice(0, colon).trim(), line.slice(colon + 1).trim()] as const;
    });
  return Object.fromEntries(entries);
}

it("OS dark and explicit dark define the same tokens with the same values", () => {
  const osDark = declarations(
    /@media \(prefers-color-scheme: dark\)\s*\{\s*:root:not\(\[data-theme="light"\]\)\s*\{([^}]*)\}/,
  );
  const explicitDark = declarations(/:root\[data-theme="dark"\]\s*\{([^}]*)\}/);
  expect(Object.keys(osDark)).toContain("--surface");
  expect(Object.keys(osDark)).toContain("color-scheme");
  expect(osDark).toEqual(explicitDark);
});
