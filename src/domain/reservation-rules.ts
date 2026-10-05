import { DomainError } from "./errors";

export const MIN_DURATION_MINUTES = 15;
export const MAX_DURATION_MINUTES = 240;

export type TimeRange = { startsAt: Date; endsAt: Date };
export type ReservationContext = { now: Date };

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

export function validateDuration(input: TimeRange): void {
  // Exact minutes on purpose: differenceInMinutes truncates, so 240 min 30 s would pass as 240.
  const minutes = (input.endsAt.getTime() - input.startsAt.getTime()) / 60_000;
  if (minutes < MIN_DURATION_MINUTES) {
    throw new DomainError(
      "DURATION_TOO_SHORT",
      `A reserva precisa ter pelo menos ${MIN_DURATION_MINUTES} minutos.`,
    );
  }
  if (minutes > MAX_DURATION_MINUTES) {
    throw new DomainError(
      "DURATION_TOO_LONG",
      `A reserva pode ter no máximo ${MAX_DURATION_MINUTES / 60} horas.`,
    );
  }
}

const RULES: Array<(input: TimeRange, ctx: ReservationContext) => void> = [
  validateRange,
  validateNotInPast,
  validateDuration,
];

export function validateReservation(
  input: TimeRange,
  ctx: ReservationContext,
): void {
  for (const rule of RULES) {
    rule(input, ctx);
  }
}
