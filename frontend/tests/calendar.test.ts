import { describe, expect, it } from "vitest";
import {
  addMonths,
  firstOf,
  formatMonthHeading,
  formatMonthParam,
  isInMonth,
  monthGrid,
  monthOf,
  parseFrenchDate,
  parseMonth,
  toFrenchDate,
} from "@/lib/calendar";

describe("monthGrid", () => {
  it("starts on the Monday on or before the 1st", () => {
    // 1 October 2026 is a Thursday.
    const days = monthGrid({ year: 2026, month: 10 });

    expect(days[0]).toBe("2026-09-28");
    expect(days[3]).toBe("2026-10-01");
  });

  it("starts on the 1st itself when the month begins on a Monday", () => {
    // 1 March 2027 is a Monday.
    expect(monthGrid({ year: 2027, month: 3 })[0]).toBe("2027-03-01");
  });

  it("is always six full weeks, so the grid keeps its height", () => {
    const days = monthGrid({ year: 2026, month: 2 });

    expect(days).toHaveLength(42);
    expect(days[41]).toBe("2026-03-08");
  });

  it("crosses the daylight-saving change without skipping or repeating a day", () => {
    // Paris moves its clocks on 29 March 2026. UTC arithmetic doesn't notice.
    const days = monthGrid({ year: 2026, month: 3 });

    expect(new Set(days).size).toBe(42);
    expect(days).toContain("2026-03-29");
    expect(days).toContain("2026-03-30");
  });
});

describe("month helpers", () => {
  it("steps across a year boundary", () => {
    expect(addMonths({ year: 2026, month: 12 }, 1)).toEqual({ year: 2027, month: 1 });
    expect(addMonths({ year: 2027, month: 1 }, -1)).toEqual({ year: 2026, month: 12 });
  });

  it("names the month in French with a capital", () => {
    expect(formatMonthHeading({ year: 2026, month: 10 })).toBe("Octobre 2026");
  });

  it("tells a day of the month from a day of the neighbouring weeks", () => {
    expect(isInMonth("2026-10-31", { year: 2026, month: 10 })).toBe(true);
    expect(isInMonth("2026-11-01", { year: 2026, month: 10 })).toBe(false);
    expect(monthOf("2026-10-31")).toEqual({ year: 2026, month: 10 });
    expect(firstOf({ year: 2026, month: 3 })).toBe("2026-03-01");
  });
});

describe("the ?mois= parameter", () => {
  it("round-trips a month", () => {
    expect(formatMonthParam({ year: 2026, month: 3 })).toBe("2026-03");
    expect(parseMonth("2026-03")).toEqual({ year: 2026, month: 3 });
  });

  it("rejects anything that is not a real month", () => {
    for (const value of [undefined, "", "2026-13", "2026-00", "2026-3", "mars", "2026-03-01"]) {
      expect(parseMonth(value), String(value)).toBeNull();
    }
  });
});

describe("French dates", () => {
  it("writes an ISO date the way it is written here", () => {
    expect(toFrenchDate("2026-06-14")).toBe("14/06/2026");
    expect(toFrenchDate("")).toBe("");
  });

  it("reads one back", () => {
    expect(parseFrenchDate("14/06/2026")).toBe("2026-06-14");
    // The leading zero is dropped while typing, and often for good.
    expect(parseFrenchDate("14/6/2026")).toBe("2026-06-14");
    expect(parseFrenchDate(" 14/06/2026 ")).toBe("2026-06-14");
  });

  it("refuses a date that is still being typed", () => {
    expect(parseFrenchDate("")).toBeNull();
    expect(parseFrenchDate("14")).toBeNull();
    expect(parseFrenchDate("14/06")).toBeNull();
    expect(parseFrenchDate("14/06/26")).toBeNull();
  });

  it("refuses a day that does not exist, and keeps the one that does", () => {
    expect(parseFrenchDate("31/02/2026")).toBeNull();
    expect(parseFrenchDate("31/04/2026")).toBeNull();
    expect(parseFrenchDate("29/02/2026")).toBeNull();
    expect(parseFrenchDate("00/06/2026")).toBeNull();
    expect(parseFrenchDate("2026-06-14")).toBeNull();
    // 2028 is a leap year.
    expect(parseFrenchDate("29/02/2028")).toBe("2028-02-29");
  });
});
