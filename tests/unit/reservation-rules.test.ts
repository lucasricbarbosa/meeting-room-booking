import { describe, expect, it } from "vitest";
import { DomainError } from "@/domain/errors";
import {
  overlaps,
  validateReservation,
  type TimeRange,
} from "@/domain/reservation-rules";

const now = new Date("2026-10-07T13:00:00Z");
const MINUTE = 60_000;

function rangeFromNow(startOffsetMin: number, durationMin: number): TimeRange {
  const startsAt = new Date(now.getTime() + startOffsetMin * MINUTE);
  return {
    startsAt,
    endsAt: new Date(startsAt.getTime() + durationMin * MINUTE),
  };
}

function errorCodeOf(fn: () => void): string | undefined {
  try {
    fn();
  } catch (error) {
    if (error instanceof DomainError) return error.code;
    throw error;
  }
  return undefined;
}

function validate(range: TimeRange) {
  return errorCodeOf(() =>
    validateReservation(range, { now, timeZone: "America/Sao_Paulo" }),
  );
}

describe("validateReservation", () => {
  it("rejects an end before the start", () => {
    expect(validate(rangeFromNow(60, -30))).toBe("INVALID_RANGE");
  });

  it("rejects an end equal to the start", () => {
    expect(validate(rangeFromNow(60, 0))).toBe("INVALID_RANGE");
  });

  it("rejects a start 1 minute before now", () => {
    expect(validate(rangeFromNow(-1, 60))).toBe("IN_THE_PAST");
  });

  it("accepts a start exactly at now", () => {
    expect(validate(rangeFromNow(0, 60))).toBeUndefined();
  });

  it("rejects 14 minutes", () => {
    expect(validate(rangeFromNow(60, 14))).toBe("DURATION_TOO_SHORT");
  });

  it.each([15, 240])("accepts %i minutes", (minutes) => {
    expect(validate(rangeFromNow(60, minutes))).toBeUndefined();
  });

  it("rejects 241 minutes", () => {
    expect(validate(rangeFromNow(60, 241))).toBe("DURATION_TOO_LONG");
  });
});

describe("business days and hours", () => {
  // The process runs in UTC; these are São Paulo wall-clock times (UTC-3).
  const local = (date: string, time: string) =>
    new Date(`${date}T${time}:00-03:00`);
  function validateLocal(date: string, start: string, end: string) {
    return validate({ startsAt: local(date, start), endsAt: local(date, end) });
  }

  it.each([
    ["Saturday", "2026-10-10"],
    ["Sunday", "2026-10-11"],
  ])("rejects %s", (_label, date) => {
    expect(validateLocal(date, "09:00", "10:00")).toBe("NOT_A_BUSINESS_DAY");
  });

  it.each([
    ["07:45", "09:00"],
    ["19:30", "20:15"],
  ])("rejects %s–%s", (start, end) => {
    expect(validateLocal("2026-10-08", start, end)).toBe(
      "OUTSIDE_BUSINESS_HOURS",
    );
  });

  it.each([
    ["08:00", "09:00"],
    ["19:00", "20:00"],
  ])("accepts %s–%s", (start, end) => {
    expect(validateLocal("2026-10-08", start, end)).toBeUndefined();
  });

  it("accepts Friday 19:30–20:00 in São Paulo, which is 22:30–23:00 UTC", () => {
    expect(
      validate({
        startsAt: new Date("2026-10-09T22:30:00Z"),
        endsAt: new Date("2026-10-09T23:00:00Z"),
      }),
    ).toBeUndefined();
  });
});

describe("overlaps", () => {
  const at = (time: string) => new Date(`2026-10-07T${time}:00Z`);
  const existing = { startsAt: at("10:00"), endsAt: at("11:00") };

  it.each([
    ["partial at the start", "09:30", "10:30", true],
    ["partial at the end", "10:30", "11:30", true],
    ["contained", "10:15", "10:45", true],
    ["enclosing", "09:00", "12:00", true],
    ["back-to-back before", "09:00", "10:00", false],
    ["back-to-back after", "11:00", "12:00", false],
  ])("%s (%s–%s) → %s", (_label, start, end, expected) => {
    const candidate = { startsAt: at(start), endsAt: at(end) };
    expect(overlaps(candidate, existing)).toBe(expected);
  });
});
