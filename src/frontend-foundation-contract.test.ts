import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

const PRODUCT_ROUTES = [
  "./routes/index.tsx",
  "./routes/hoje.tsx",
  "./routes/elo.tsx",
  "./routes/analytics.tsx",
  "./routes/anotacoes.tsx",
];

describe("frontend product foundation", () => {
  it("keeps the canonical five-surface navigation", () => {
    const shell = source("./components/AppShell.tsx");
    for (const label of ["Noticiário", "Hoje", "Elo", "Analytics", "Anotações"]) {
      expect(shell).toContain(`label: "${label}"`);
    }
    expect(shell).toContain('aria-label="Navegação principal"');
    expect(shell).toContain("safe-area-inset-bottom");
    expect(shell).toContain("window.visualViewport");
  });

  it("provides accessible loading, empty and error states", () => {
    const states = source("./components/SurfaceState.tsx");
    expect(states).toContain("export function EmptyState");
    expect(states).toContain("export function ErrorState");
    expect(states).toContain("export function LoadingState");
    expect(states).toContain('role="alert"');
    expect(states).toContain('role="status"');
    expect(states).toContain('aria-busy="true"');
    expect(states).toContain("touch-target");
  });

  it("provides touch-safe filtering and search primitives", () => {
    const controls = source("./components/ProductControls.tsx");
    expect(controls).toContain("export function FilterBar");
    expect(controls).toContain("export function FilterChip");
    expect(controls).toContain("export function SegmentedControl");
    expect(controls).toContain("export function SearchField");
    expect(controls).toContain("export function StatusBadge");
    expect(controls).toContain("aria-pressed={active}");
    expect(controls).toContain('role="group"');
    expect(controls).toContain("touch-target");
  });

  it("keeps cards labelled and supports consistent density", () => {
    const surfaces = source("./components/ProductSurface.tsx");
    expect(surfaces).toContain("useId");
    expect(surfaces).toContain("aria-labelledby={titleId}");
    expect(surfaces).toContain('density?: "compact" | "default"');
    expect(surfaces).toContain('tone?: "default" | "subtle"');
    expect(surfaces).toContain("export function SectionHeader");
  });

  it("does not expose implementation placeholders or fake fixtures in product routes", () => {
    for (const path of PRODUCT_ROUTES) {
      const route = source(path);
      expect(route).not.toContain("FoundationNotice");
      expect(route).not.toContain("será alimentada");
      expect(route).not.toContain("vai consumir");
      expect(route).not.toContain("próxima conexão");
    }

    const today = source("./routes/hoje.tsx");
    expect(today).not.toContain("Mandante × Visitante");
    expect(today).not.toContain("20:30");
  });
});
