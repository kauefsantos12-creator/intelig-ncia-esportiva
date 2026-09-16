import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

describe("responsive and browser compatibility contract", () => {
  it("keeps real browser coverage in CI", () => {
    const config = source("../playwright.config.ts");
    const workflow = source("../.github/workflows/ci.yml");
    expect(config).toContain('name: "chromium-desktop"');
    expect(config).toContain('name: "firefox-desktop"');
    expect(config).toContain('name: "webkit-desktop"');
    expect(config).toContain('name: "webkit-phone-small"');
    expect(config).toContain('name: "chromium-android"');
    expect(config).toContain('name: "webkit-tablet-portrait"');
    expect(config).toContain('name: "webkit-tablet-landscape"');
    expect(workflow).toContain("@playwright/test@1.63.0");
    expect(workflow).toContain("playwright install --with-deps chromium firefox webkit");
    expect(workflow).toContain("playwright test");
  });

  it("keeps coarse-pointer controls at least 44px", () => {
    const styles = source("./styles.css");
    const button = source("./components/ui/button.tsx");
    const shell = source("./components/AppShell.tsx");
    expect(styles).toContain("@media (pointer: coarse)");
    expect(styles).toContain(".touch-target");
    expect(styles).toContain("min-height: 44px !important");
    expect(button).toContain("touch-target inline-flex");
    expect(shell).toContain("touch-target flex min-h-11");
  });

  it("keeps metric help touch-safe and inside the viewport", () => {
    const help = source("./components/MetricHelp.tsx");
    const styles = source("./styles.css");
    expect(help).toContain("touch-target");
    expect(help).toContain("metric-help-popover");
    expect(styles).toContain(".metric-help-popover");
    expect(styles).toContain("position: fixed");
    expect(styles).toContain("safe-area-inset-bottom");
  });

  it("allows installed-app rotation", () => {
    const manifest = source("../public/site.webmanifest");
    expect(manifest).toContain('"orientation": "any"');
    expect(manifest).not.toContain('"portrait-primary"');
  });

  it("does not mask layout bugs with global horizontal clipping", () => {
    const styles = source("./styles.css");
    expect(styles).not.toContain("overflow-x: hidden");
    expect(styles).toContain("max-width: 100%");
    expect(styles).toContain("min-width: 0");
  });

  it("optimizes decimal keyboard completion", () => {
    const input = source("./components/ui/input.tsx");
    expect(input).toContain("resolvedEnterKeyHint");
    expect(input).toContain('inputMode === "decimal"');
    expect(input).toContain('inputMode === "numeric"');
    expect(input).toContain('event.key === "Enter"');
  });

  it("defines a browser baseline and CSS color fallbacks", () => {
    const browsers = source("../.browserslistrc");
    const styles = source("./styles.css");
    expect(browsers).toContain("last 2 Chrome versions");
    expect(browsers).toContain("last 2 Firefox versions");
    expect(browsers).toContain("last 2 Safari versions");
    expect(browsers).toContain("iOS >= 17");
    expect(styles).toContain("Browser-safe fallbacks");
    expect(styles).toContain("@supports (color: oklch");
    expect(styles).toMatch(/--background:\s*#[0-9a-fA-F]{6}/);
  });

  it("uses device-neutral notification guidance", () => {
    const push = source("./components/PushNotificationControl.tsx");
    expect(push).toContain("configurações do navegador ou do sistema");
    expect(push).toContain("Use um navegador atualizado");
    expect(push).toContain("Tela de Início");
    expect(push).not.toContain("Ajustes → Notificações no iPhone");
  });

  it("tracks virtual-keyboard viewport changes without legacy bottom navigation", () => {
    const shell = source("./components/AppShell.tsx");
    expect(shell).toContain("window.visualViewport");
    expect(shell).toContain("coveredHeight > 120");
    expect(shell).toContain('data-keyboard-open={keyboardOpen ? "true" : "false"}');
    expect(shell).not.toContain('keyboardOpen ? "hidden" : "fixed"');
  });
});
