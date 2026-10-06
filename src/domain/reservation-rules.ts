import { isWeekend, parse } from "date-fns";
import { formatDuration } from "@/lib/format-duration";
import { DomainError } from "./errors";
import type { ReservationStatus } from "./reservation";
import { businessToUtc, utcToBusiness } from "./time";

export const MIN_DURATION_MINUTES = 15;
export const OPENING_TIME = "08:00";
export const CLOSING_TIME = "20:00";
export const NOT_A_BUSINESS_DAY_MESSAGE =
  "Reservas só podem ser feitas de segunda a sexta.";

export type TimeRange = { startsAt: Date; endsAt: Date };
export type ReservationContext = {
  now: Date;
  timeZone: string;
  maxBookingMinutes: number;
};

// Half-open intervals [start, end): back-to-back ranges (09–10 and 10–11) do not overlap.
export function overlaps(a: TimeRange, b: TimeRange): boolean {
  return a.startsAt < b.endsAt && a.endsAt > b.startsAt;
}

export function validateRange(input: TimeRange): void {
  if (input.endsAt <= input.startsAt) {
    throw new DomainError(
      "INVALID_RANGE",
      "O horário de término precisa ser depois do início.",
    );
  }
}

export function validateNotInPast(
  input: TimeRange,
  ctx: ReservationContext,
): void {
  if (input.startsAt < ctx.now) {
    throw new DomainError(
      "IN_THE_PAST",
      "Não é possível reservar um horário que já passou.",
    );
  }
}

export function validateDuration(
  input: TimeRange,
  ctx: ReservationContext,
): void {
  // Exact minutes on purpose: differenceInMinutes truncates, so 240 min 30 s would pass as 240.
  const minutes = (input.endsAt.getTime() - input.startsAt.getTime()) / 60_000;
  if (minutes < MIN_DURATION_MINUTES) {
    throw new DomainError(
      "DURATION_TOO_SHORT",
      `A reserva precisa ter pelo menos ${MIN_DURATION_MINUTES} minutos.`,
    );
  }
  if (minutes > ctx.maxBookingMinutes) {
    throw new DomainError(
      "DURATION_TOO_LONG",
      `Esta sala permite reservas de até ${formatDuration(ctx.maxBookingMinutes)}.`,
    );
  }
}

// A calendar date has no time zone: "2026-10-10" is a Saturday everywhere.
export function isBusinessDay(date: string): boolean {
  return !isWeekend(parse(date, "yyyy-MM-dd", new Date(0)));
}

// Compares instants, not "HH:mm" text: exact to the second, and a booking that
// crosses midnight fails because it ends after closing time on the day it starts.
export function validateBusinessHours(
  input: TimeRange,
  ctx: ReservationContext,
): void {
  const { date } = utcToBusiness(input.startsAt, ctx.timeZone);
  if (!isBusinessDay(date)) {
    throw new DomainError("NOT_A_BUSINESS_DAY", NOT_A_BUSINESS_DAY_MESSAGE);
  }
  const opensAt = businessToUtc(date, OPENING_TIME, ctx.timeZone);
  const closesAt = businessToUtc(date, CLOSING_TIME, ctx.timeZone);
  if (input.startsAt < opensAt || input.endsAt > closesAt) {
    throw new DomainError(
      "OUTSIDE_BUSINESS_HOURS",
      `Reservas devem ficar entre ${OPENING_TIME} e ${CLOSING_TIME}.`,
    );
  }
}

const RULES: Array<(input: TimeRange, ctx: ReservationContext) => void> = [
  validateRange,
  validateNotInPast,
  validateDuration,
  validateBusinessHours,
];

export function validateReservation(
  input: TimeRange,
  ctx: ReservationContext,
): void {
  for (const rule of RULES) {
    rule(input, ctx);
  }
}

export type CancellableReservation = {
  userId: string;
  status: ReservationStatus;
  startsAt: Date;
};

// Ownership first: otherwise someone else's reservation would reveal its status through the error code.
export function validateCancellation(
  reservation: CancellableReservation,
  ctx: { userId: string; now: Date },
): void {
  if (reservation.userId !== ctx.userId) {
    throw new DomainError(
      "FORBIDDEN",
      "Você só pode cancelar as suas próprias reservas.",
    );
  }
  if (reservation.status !== "ACTIVE") {
    throw new DomainError(
      "ALREADY_CANCELLED",
      "Esta reserva já foi cancelada.",
    );
  }
  if (reservation.startsAt <= ctx.now) {
    throw new DomainError(
      "ALREADY_STARTED",
      "Não é possível cancelar uma reserva que já começou.",
    );
  }
}

// Same conditions as validateCancellation for the owner; the UI uses it to decide whether to offer the button.
export function isCancellable(
  reservation: Omit<CancellableReservation, "userId">,
  now: Date,
): boolean {
  return reservation.status === "ACTIVE" && reservation.startsAt > now;
}
