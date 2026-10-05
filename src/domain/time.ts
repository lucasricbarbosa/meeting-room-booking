import { tz } from "@date-fns/tz";
import { format, parse } from "date-fns";

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
