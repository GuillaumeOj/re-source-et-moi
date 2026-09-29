import { describe, expect, it } from "vitest";
import { formatPhone } from "@/lib/format";

describe("formatPhone", () => {
  it("writes an international French number the French way", () => {
    expect(formatPhone("+33627470144")).toBe("06 27 47 01 44");
    expect(formatPhone("+33123456789")).toBe("01 23 45 67 89");
  });
});
