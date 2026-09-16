import { readdirSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sourceRoot = resolve(import.meta.dirname);
const repositoryRoot = resolve(sourceRoot, "..");

function collectFiles(path: string): string[] {
  if (statSync(path).isFile()) return [path];
  return readdirSync(path).flatMap((entry) => collectFiles(resolve(path, entry)));
}

const protectedPaths = [
  resolve(sourceRoot, "components"),
  resolve(sourceRoot, "routes"),
  resolve(sourceRoot, "styles.css"),
  resolve(sourceRoot, "frontend-accessibility-typography-contract.test.ts"),
  resolve(sourceRoot, "frontend-responsive-compatibility-contract.test.ts"),
  resolve(repositoryRoot, "tests/browser"),
  resolve(repositoryRoot, "public/site.webmanifest"),
  resolve(repositoryRoot, "docs/MOBILE_BRANDING.md"),
  resolve(repositoryRoot, "docs/PRIVACY.md"),
  resolve(repositoryRoot, "docs/governance/ACCESSIBILITY_WCAG22.md"),
  resolve(repositoryRoot, "docs/governance/RESPONSIVE_COMPATIBILITY.md"),
  resolve(repositoryRoot, "docs/governance/SPORTS_INTELLIGENCE_FRONTEND_SHELL_2026-09-16.md"),
  resolve(repositoryRoot, "docs/governance/SPORTS_INTELLIGENCE_UI_2026-09-16.md"),
];

const forbiddenTerms = [
  ["a", "posta"].join(""),
  ["a", "postas"].join(""),
  ["b", "et"].join(""),
  ["b", "etting"].join(""),
  ["b", "ookmaker"].join(""),
  ["o", "dds"].join(""),
  ["s", "take"].join(""),
  ["b", "ankroll"].join(""),
  ["b", "anca"].join(""),
  ["p", "ick"].join(""),
  ["p", "icks"].join(""),
  ["c", "lv"].join(""),
];

function containsForbiddenTerm(content: string, term: string) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9áàâãéèêíïóôõöúç])${escaped}([^a-z0-9áàâãéèêíïóôõöúç]|$)`, "iu").test(content);
}

describe("sports intelligence frontend domain contract", () => {
  it("keeps active frontend and UX surfaces restricted to the current sports domain", () => {
    const violations: string[] = [];

    for (const path of protectedPaths.flatMap(collectFiles)) {
      if (!/\.(tsx?|css|md|json|webmanifest)$/i.test(path)) continue;
      const content = readFileSync(path, "utf8");
      for (const term of forbiddenTerms) {
        if (containsForbiddenTerm(content, term)) {
          violations.push(`${path.replace(`${repositoryRoot}/`, "")}: ${term}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
