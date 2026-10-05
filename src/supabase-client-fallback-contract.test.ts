import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("post-remix public Supabase client contract", () => {
  const source = readFileSync(
    resolve(process.cwd(), "src/integrations/supabase/client.ts"),
    "utf8",
  );

  it("keeps public fallbacks for the current Cloud when build env is absent", () => {
    expect(source).toContain("const PUBLIC_SUPABASE_URL = 'https://hefuvmocohhpmnhwpkac.supabase.co'");
    expect(source).toMatch(/const PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_[^']+'/);
    expect(source).toContain("serverEnv('SUPABASE_URL') || PUBLIC_SUPABASE_URL");
    expect(source).toContain("serverEnv('SUPABASE_PUBLISHABLE_KEY') ||");
    expect(source).toContain("if (typeof process === 'undefined') return undefined");
    expect(source).toContain("import type { Database } from './database.types'");
    expect(source).not.toContain("vsygkpwptoppbrlnrpcp");
  });
});
