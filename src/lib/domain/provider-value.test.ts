import { describe, expect, it } from "vitest";

import { nullableProviderNumber } from "./provider-value";

describe("nullableProviderNumber", () => {
  it("preserves missing provider values as null", () => {
    expect(nullableProviderNumber(null)).toBeNull();
    expect(nullableProviderNumber(undefined)).toBeNull();
    expect(nullableProviderNumber("")).toBeNull();
    expect(nullableProviderNumber("   ")).toBeNull();
    expect(nullableProviderNumber(false)).toBeNull();
  });

  it("accepts finite numeric values including real zero", () => {
    expect(nullableProviderNumber(0)).toBe(0);
    expect(nullableProviderNumber("0")).toBe(0);
    expect(nullableProviderNumber(42)).toBe(42);
    expect(nullableProviderNumber("42.5")).toBe(42.5);
  });

  it("rejects non numeric and non finite values", () => {
    expect(nullableProviderNumber("abc")).toBeNull();
    expect(nullableProviderNumber(Number.NaN)).toBeNull();
    expect(nullableProviderNumber(Number.POSITIVE_INFINITY)).toBeNull();
    expect(nullableProviderNumber({})).toBeNull();
  });
});
