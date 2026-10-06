import { tz } from "@date-fns/tz";
import { addDays, format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { TimeRange } from "./reservation-rules";

// The time zone is a parameter (not read from process.env) so domain/ stays pure and testable.
export function businessToUtc(
  date: string,
  time: string,
  timeZone: string,
): Date {
  const zoned = parse(`${date} ${time}`, "yyyy-MM-dd HH:mm", new Date(0), {
    in: tz(timeZone),
  });
  return new Date(zoned.getTime());
}

export function utcToBusiness(
  instant: Date,
  timeZone: string,
): { date: string; time: string } {
  const options = { in: tz(timeZone) };
  return {
    date: format(instant, "yyyy-MM-dd", options),
    time: format(instant, "HH:mm", options),
  };
}

// Adds a calendar day in the business zone, so a DST change would still end at the next midnight.
export function getBusinessDayRange(date: string, timeZone: string): TimeRange {
  const startsAt = businessToUtc(date, "00:00", timeZone);
  const endsAt = addDays(startsAt, 1, { in: tz(timeZone) });
  return { startsAt, endsAt: new Date(endsAt.getTime()) };
}

// A calendar date has no time zone: "2026-10-07" is a Wednesday everywhere.
export function formatBusinessDay(date: string): string {
  const day = parse(date, "yyyy-MM-dd", new Date(0));
  return format(day, "EEEEEE, dd/MM", { locale: ptBR });
}

export function formatTimeRange(range: TimeRange, timeZone: string): string {
  const start = utcToBusiness(range.startsAt, timeZone).time;
  const end = utcToBusiness(range.endsAt, timeZone).time;
  return `${start}–${end}`;
}
