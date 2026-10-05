import { describe, expect, it } from "vitest";
import { businessToUtc, utcToBusiness } from "@/domain/time";

// Tests run with TZ=UTC, so these only pass if the business time zone is applied explicitly.
const timeZone = "America/Sao_Paulo";

describe("businessToUtc", () => {
  it("converts a business date and time to UTC", () => {
    expect(businessToUtc("2026-10-07", "10:00", timeZone).toISOString()).toBe(
      "2026-10-07T13:00:00.000Z",
    );
  });

  it("rolls over to the next UTC day late in the evening", () => {
    expect(businessToUtc("2026-10-07", "22:30", timeZone).toISOString()).toBe(
      "2026-10-08T01:30:00.000Z",
    );
  });
});

describe("utcToBusiness", () => {
  it("converts a UTC instant back to the business date and time", () => {
    expect(utcToBusiness(new Date("2026-10-08T01:30:00Z"), timeZone)).toEqual({
      date: "2026-10-07",
      time: "22:30",
    });
  });
});
