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

function validate(range: TimeRange, maxBookingMinutes = 240) {
  return errorCodeOf(() =>
    validateReservation(range, { now, maxBookingMinutes }),
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

// now is Wednesday 10:00 in São Paulo, so every range below falls on a weekday between 09:00 and 18:00.
describe("validateReservation with the room's maximum duration", () => {
  it("rejects 61 minutes in a room limited to 60", () => {
    expect(validate(rangeFromNow(60, 61), 60)).toBe("DURATION_TOO_LONG");
  });

  it("accepts 60 minutes in a room limited to 60", () => {
    expect(validate(rangeFromNow(60, 60), 60)).toBeUndefined();
  });

  it("accepts 120 minutes in a room limited to 240", () => {
    expect(validate(rangeFromNow(60, 120), 240)).toBeUndefined();
  });

  it("still rejects 14 minutes in a room limited to 60", () => {
    expect(validate(rangeFromNow(60, 14), 60)).toBe("DURATION_TOO_SHORT");
  });

  it("cites the room's limit in the message", () => {
    expect(() =>
      validateReservation(rangeFromNow(60, 90), {
        now,
        maxBookingMinutes: 60,
      }),
    ).toThrow("Esta sala permite reservas de até 1 h.");
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
