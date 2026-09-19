import { describe, expect, it } from "vitest";
import { createFormatters } from "./index";

describe("createFormatters", () => {
  const en = createFormatters("en");
  const pt = createFormatters("pt");

  it("formats money with each locale's separators", () => {
    expect(en.formatMoney(1234.5, "USD", false)).toBe("$1,234.50");
    expect(pt.formatMoney(1234.5, "USD", false)).toMatch(/^US\$\s?1\.234,50$/);
  });

  it("formats plain numbers and decimals", () => {
    expect(en.formatNumber(1234567, false)).toBe("1,234,567");
    expect(pt.formatNumber(1234567, false)).toBe("1.234.567");
    expect(en.formatDecimal(3.5)).toBe("3.5");
    expect(pt.formatDecimal(3.5)).toBe("3,5");
    expect(pt.formatDecimal(0.256, 2)).toBe("0,26");
  });

  it("keeps fraction digits for small compact numbers and drops them for full ones", () => {
    expect(en.formatNumber(2.5)).toBe("2.5");
    expect(en.formatNumber(2.5, false)).toBe("3");
  });

  it("formats percentages from ratios and from percent points", () => {
    expect(en.formatPercent(0.1234)).toBe("12.3%");
    expect(pt.formatPercent(0.1234)).toBe("12,3%");
    expect(pt.formatPercent(45, false)).toBe("45,0%");
    expect(pt.formatPercent(null)).toBe("—");
  });

  it("formats UTC dates and month names per locale", () => {
    expect(en.formatDate("2026-09-15T17:43:00Z")).toBe("15 Sept 2026, 17:43 UTC");
    expect(pt.formatDate("2026-09-15T17:43:00Z")).toContain("2026");
    expect(pt.formatDate("2026-09-15T17:43:00Z")).toMatch(/set/i);
    expect(en.formatDate(null)).toBe("—");
    expect(en.formatDate("not a date")).toBe("not a date");
    const sept = new Date("2026-09-15T00:00:00Z");
    expect(en.formatMonthShort(sept)).toMatch(/^Sep/);
    expect(pt.formatMonthShort(sept)).toMatch(/^set/i);
  });

  it("formats an inclusive date range per locale", () => {
    expect(en.formatDateRange("2026-09-07", "2026-09-13")).toBe("Sep 07 – Sep 13, 2026");
    expect(pt.formatDateRange("2026-09-07", "2026-09-13")).toMatch(/^07 set.? – 13 set.? 2026$/i);
    expect(en.formatDateRange("bad", "2026-09-13")).toBe("bad – 2026-09-13");
  });

  it("caches one instance per locale", () => {
    expect(createFormatters("pt")).toBe(pt);
  });
});
