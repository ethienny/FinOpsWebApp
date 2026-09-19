import { describe, expect, it } from "vitest";
import { pickLocale } from "./config";

describe("pickLocale", () => {
  it("defaults to English without a header", () => {
    expect(pickLocale(undefined)).toBe("en");
    expect(pickLocale(null)).toBe("en");
    expect(pickLocale("")).toBe("en");
  });

  it("respects the order of preference instead of matching pt anywhere", () => {
    expect(pickLocale("en-US,en;q=0.9,pt;q=0.8")).toBe("en");
    expect(pickLocale("pt-BR,pt;q=0.9,en;q=0.8")).toBe("pt");
  });

  it("honours q weights over header order", () => {
    expect(pickLocale("en;q=0.5,pt-BR;q=0.9")).toBe("pt");
  });

  it("skips unsupported languages and takes the next supported one", () => {
    expect(pickLocale("fr-FR,pt-PT;q=0.7")).toBe("pt");
    expect(pickLocale("fr-FR,de;q=0.8")).toBe("en");
  });

  it("ignores q=0, wildcards and malformed weights", () => {
    expect(pickLocale("pt;q=0,en;q=0.5")).toBe("en");
    expect(pickLocale("*,pt;q=0.4")).toBe("pt");
    expect(pickLocale("pt;q=abc,en")).toBe("en");
  });

  it("does not match tags that merely contain pt", () => {
    expect(pickLocale("ptx,en;q=0.5")).toBe("en");
  });
});
