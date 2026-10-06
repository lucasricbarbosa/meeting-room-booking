import { describe, expect, it } from "vitest";
import {
  businessToUtc,
  formatBusinessDay,
  formatReservationRange,
  formatTimeRange,
  getBusinessDayRange,
  utcToBusiness,
} from "@/domain/time";

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

describe("getBusinessDayRange", () => {
  it("covers the whole business day, from midnight to the next midnight", () => {
    const range = getBusinessDayRange("2026-10-07", timeZone);

    expect(range.startsAt.toISOString()).toBe("2026-10-07T03:00:00.000Z");
    expect(range.endsAt.toISOString()).toBe("2026-10-08T03:00:00.000Z");
  });
});

describe("formatBusinessDay", () => {
  it("formats as short weekday and day/month in Portuguese", () => {
    expect(formatBusinessDay("2026-10-07")).toBe("qua, 07/10");
  });
});

describe("formatTimeRange", () => {
  it("shows start and end in the business time zone", () => {
    const range = {
      startsAt: new Date("2026-10-07T13:00:00Z"),
      endsAt: new Date("2026-10-07T14:30:00Z"),
    };

    expect(formatTimeRange(range, timeZone)).toBe("10:00–11:30");
  });
});

describe("formatReservationRange", () => {
  it("shows the business day and the time range", () => {
    const range = {
      startsAt: new Date("2026-10-07T13:00:00Z"),
      endsAt: new Date("2026-10-07T14:00:00Z"),
    };

    expect(formatReservationRange(range, timeZone)).toBe(
      "qua, 07/10 · 10:00–11:00",
    );
  });

  it("uses the business date, not the UTC date, late in the evening", () => {
    const range = {
      startsAt: new Date("2026-10-08T01:00:00Z"),
      endsAt: new Date("2026-10-08T02:00:00Z"),
    };

    expect(formatReservationRange(range, timeZone)).toBe(
      "qua, 07/10 · 22:00–23:00",
    );
  });
});
