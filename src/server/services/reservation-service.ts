import "server-only";
import { DomainError } from "@/domain/errors";
import type { OccupiedSlot, UserReservation } from "@/domain/reservation";
import {
  validateCancellation,
  validateReservation,
} from "@/domain/reservation-rules";
import { getBusinessDayRange, utcToBusiness } from "@/domain/time";
import type { UserSummary } from "@/domain/user";
import { prisma } from "@/server/db";
import { BUSINESS_TIMEZONE } from "@/server/env";
import { Prisma } from "../../../generated/prisma/client";

export type CreateReservationInput = {
  roomId: string;
  startsAt: Date;
  endsAt: Date;
  title?: string;
};

export async function createReservation(
  user: UserSummary,
  input: CreateReservationInput,
  now: Date,
): Promise<{ id: string }> {
  try {
    // Check and insert in one transaction: SQLite serializes writes, so no one can book the slot in between.
    return await prisma.$transaction(async (tx) => {
      const room = await tx.room.findUnique({
        where: { id: input.roomId },
        select: { isActive: true, maxBookingMinutes: true },
      });
      if (!room) {
        throw new DomainError("ROOM_NOT_FOUND", "Sala não encontrada.");
      }
      if (!room.isActive) {
        throw new DomainError(
          "ROOM_INACTIVE",
          "Esta sala está desativada e não aceita reservas.",
        );
      }

      validateReservation(input, {
        now,
        maxBookingMinutes: room.maxBookingMinutes,
      });

      // Same condition as overlaps() in domain/, written as a query.
      const conflict = await tx.reservation.findFirst({
        where: {
          roomId: input.roomId,
          status: "ACTIVE",
          startsAt: { lt: input.endsAt },
          endsAt: { gt: input.startsAt },
        },
        select: { startsAt: true, endsAt: true },
        orderBy: { startsAt: "asc" },
      });
      if (conflict) {
        const start = utcToBusiness(conflict.startsAt, BUSINESS_TIMEZONE).time;
        const end = utcToBusiness(conflict.endsAt, BUSINESS_TIMEZONE).time;
        throw new DomainError(
          "ROOM_CONFLICT",
          `A sala já está reservada das ${start} às ${end}.`,
        );
      }

      return tx.reservation.create({
        data: {
          roomId: input.roomId,
          userId: user.id,
          startsAt: input.startsAt,
          endsAt: input.endsAt,
          title: input.title ?? null,
        },
        select: { id: true },
      });
    });
  } catch (error) {
    if (isConcurrencyError(error)) {
      throw new DomainError(
        "TRY_AGAIN",
        "Outra reserva foi feita ao mesmo tempo. Tente novamente.",
      );
    }
    throw error;
  }
}

// Any reservation that touches the business day, including one that starts the day before.
export function listDayReservations(
  roomId: string,
  date: string,
): Promise<OccupiedSlot[]> {
  const day = getBusinessDayRange(date, BUSINESS_TIMEZONE);
  return prisma.reservation.findMany({
    where: {
      roomId,
      status: "ACTIVE",
      startsAt: { lt: day.endsAt },
      endsAt: { gt: day.startsAt },
    },
    // No userId or title: this list is shown to every user.
    select: { id: true, startsAt: true, endsAt: true },
    orderBy: { startsAt: "asc" },
  });
}

export async function cancelReservation(
  user: UserSummary,
  reservationId: string,
  now: Date,
): Promise<void> {
  try {
    // Read and update in one transaction, so two concurrent cancels cannot both pass the ACTIVE check.
    await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({
        where: { id: reservationId },
        select: { userId: true, status: true, startsAt: true },
      });
      if (!reservation) {
        throw new DomainError("NOT_FOUND", "Reserva não encontrada.");
      }

      validateCancellation(reservation, { userId: user.id, now });

      // Soft cancel: the row stays as history and stops blocking the slot.
      await tx.reservation.update({
        where: { id: reservationId },
        data: { status: "CANCELLED", cancelledAt: now },
      });
    });
  } catch (error) {
    if (isConcurrencyError(error)) {
      throw new DomainError(
        "TRY_AGAIN",
        "A reserva foi alterada ao mesmo tempo. Tente novamente.",
      );
    }
    throw error;
  }
}

const userReservationSelect = {
  id: true,
  title: true,
  startsAt: true,
  endsAt: true,
  status: true,
  room: { select: { name: true } },
} as const;

const PAST_RESERVATIONS_LIMIT = 20;

// "Upcoming" means not finished yet, so a meeting in progress is still listed there.
export async function listUserReservations(
  userId: string,
  now: Date,
): Promise<{ upcoming: UserReservation[]; past: UserReservation[] }> {
  const [upcoming, past] = await Promise.all([
    prisma.reservation.findMany({
      where: { userId, endsAt: { gt: now } },
      select: userReservationSelect,
      orderBy: { startsAt: "asc" },
    }),
    prisma.reservation.findMany({
      where: { userId, endsAt: { lte: now } },
      select: userReservationSelect,
      orderBy: { startsAt: "desc" },
      take: PAST_RESERVATIONS_LIMIT,
    }),
  ]);

  return {
    upcoming: upcoming.map(toUserReservation),
    past: past.map(toUserReservation),
  };
}

function toUserReservation({
  room,
  ...reservation
}: Prisma.ReservationGetPayload<{
  select: typeof userReservationSelect;
}>): UserReservation {
  return { ...reservation, roomName: room.name };
}

// P1008: the SQLite adapter maps SQLITE_BUSY to it. P2034: Prisma's write conflict.
function isConcurrencyError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P1008" || error.code === "P2034")
  );
}
