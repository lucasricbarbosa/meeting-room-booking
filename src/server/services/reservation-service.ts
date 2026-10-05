import "server-only";
import { DomainError } from "@/domain/errors";
import { validateReservation } from "@/domain/reservation-rules";
import { utcToBusiness } from "@/domain/time";
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
        select: { isActive: true },
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

      validateReservation(input, { now });

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

// P1008: the SQLite adapter maps SQLITE_BUSY to it. P2034: Prisma's write conflict.
function isConcurrencyError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P1008" || error.code === "P2034")
  );
}
