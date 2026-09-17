import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function styles() {
  return readFileSync(new URL("./styles.css", import.meta.url), "utf8");
}

describe("Pastel live visual contract", () => {
  it("keeps the interface light-first with the approved pastel foundations", () => {
    const css = styles();

    expect(css).toContain("--background: #f7f8f5;");
    expect(css).toContain("--surface: #ffffff;");
    expect(css).toContain("--card: #ffffff;");
    expect(css).toContain("--primary: #2f765f;");
    expect(css).toContain("--accent: #dff1e8;");
    expect(css).toContain("--border: #dce4df;");
    expect(css).toContain("--muted-foreground: #63736b;");
    expect(css).toContain("--pastel-blue: #e5eff9;");
    expect(css).toContain("--pastel-lilac: #eee8f8;");
    expect(css).toContain("--pastel-peach: #f9e9df;");
    expect(css).toContain("--pastel-yellow: #fff2d2;");
  });

  it("keeps semantic status colors distinct from section pastel accents", () => {
    const css = styles();

    expect(css).toContain("--destructive: #b64b55;");
    expect(css).toContain("--warning: #a56b13;");
    expect(css).toContain("--success: #2f765f;");
    expect(css).toContain("--pastel-rose: #f8e5e8;");
    expect(css).toContain('.app-shell[data-stage="analytics"]');
    expect(css).toContain('.app-shell[data-stage="today"]');
  });

  it("preserves light color scheme, visible focus and reduced motion", () => {
    const css = styles();

    expect(css).toContain("color-scheme: light;");
    expect(css).toContain(
      "outline: 3px solid color-mix(in oklab, var(--stage-accent) 65%, white);",
    );
    expect(css).toContain("prefers-reduced-motion: reduce");
  });
});
