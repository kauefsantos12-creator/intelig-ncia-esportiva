import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");
const root = read("src/routes/__root.tsx");
const vite = read("vite.config.ts");
const ci = read(".github/workflows/ci.yml");
const vitals = read("src/components/WebVitalsReporter.tsx");
const vitalsFn = read("src/lib/performance-vitals.functions.ts");

describe("performance and scalability contracts", () => {
  it("collects authenticated real-user Core Web Vitals", () => {
    expect(root).toContain("<WebVitalsReporter />");
    expect(vitals).toContain('observe("largest-contentful-paint"');
    expect(vitals).toContain('observe("layout-shift"');
    expect(vitals).toContain('observe("event"');
    expect(vitalsFn).toContain("requireSupabaseAuth");
  });

  it("keeps Web Vitals payloads bounded and route identities sanitized", () => {
    expect(vitalsFn).toContain("max(1_000_000)");
    expect(vitalsFn).toContain("max(160)");
    expect(vitalsFn).toContain("UUID_IN_PATH");
    expect(vitalsFn).toContain('replace(UUID_IN_PATH, ":id")');
  });

  it("splits major vendor groups", () => {
    expect(vite).toContain('return "vendor-react"');
    expect(vite).toContain('return "vendor-tanstack"');
    expect(vite).toContain('return "vendor-supabase"');
  });

  it("enforces bundle and load budgets in CI", () => {
    expect(ci).toContain("Client bundle performance budget");
    expect(ci).toContain("Concurrent HTTP load smoke");
  });

  it("reduces requested font variants without changing font families", () => {
    expect(root).toContain("IBM+Plex+Mono");
    expect(root).toContain("IBM+Plex+Sans");
    expect(root).not.toContain("Mono:wght@400;500;600");
  });
});
