import { describe, expect, it } from "vitest";
import {
  addMonths,
  firstOf,
  formatMonthHeading,
  isInMonth,
  monthGrid,
  monthOf,
} from "@/lib/editor/calendar";

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
