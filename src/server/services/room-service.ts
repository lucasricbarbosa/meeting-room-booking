import "server-only";
import { DomainError } from "@/domain/errors";
import type {
  AdminRoomListItem,
  FeatureSummary,
  RoomDetails,
  RoomFilters,
  RoomListItem,
} from "@/domain/room";
import { assertAdmin, type UserSummary } from "@/domain/user";
import type { RoomInput } from "@/schemas/room";
import { prisma } from "@/server/db";
import { Prisma } from "../../../generated/prisma/client";

const featureSummarySelect = { slug: true, name: true } as const;

export async function listRooms(filters: RoomFilters): Promise<RoomListItem[]> {
  const rooms = await prisma.room.findMany({
    where: {
      isActive: true,
      capacity: { gte: filters.minCapacity },
      // One "some" per slug: the room must have every selected feature, not just one of them.
      AND: filters.features.map((slug) => ({
        features: { some: { feature: { slug } } },
      })),
    },
    // Features come in the same findMany (batched by Prisma), not one query per room.
    select: {
      id: true,
      name: true,
      capacity: true,
      location: true,
      features: {
        select: { feature: { select: featureSummarySelect } },
        orderBy: { feature: { name: "asc" } },
      },
    },
    orderBy: [{ capacity: "asc" }, { name: "asc" }],
  });

  return rooms.map((room) => ({
    ...room,
    features: room.features.map(({ feature }) => feature),
  }));
}

export function getActiveRoom(id: string) {
  return prisma.room.findFirst({
    where: { id, isActive: true },
    select: { id: true, name: true, capacity: true, location: true },
  });
}

export function listFeatures(): Promise<FeatureSummary[]> {
  return prisma.feature.findMany({
    select: featureSummarySelect,
    orderBy: { name: "asc" },
  });
}

// Admin list: inactive rooms included, so they can be edited and reactivated.
export async function listAllRooms(): Promise<AdminRoomListItem[]> {
  const rooms = await prisma.room.findMany({
    select: {
      id: true,
      name: true,
      capacity: true,
      location: true,
      isActive: true,
      features: {
        select: { feature: { select: featureSummarySelect } },
        orderBy: { feature: { name: "asc" } },
      },
    },
    orderBy: { name: "asc" },
  });

  return rooms.map((room) => ({
    ...room,
    features: room.features.map(({ feature }) => feature),
  }));
}

export async function getRoomDetails(id: string): Promise<RoomDetails | null> {
  const room = await prisma.room.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      capacity: true,
      location: true,
      description: true,
      isActive: true,
      features: {
        select: { feature: { select: { slug: true } } },
        orderBy: { feature: { slug: "asc" } },
      },
    },
  });
  if (!room) return null;

  const { features, ...details } = room;
  return {
    ...details,
    featureSlugs: features.map(({ feature }) => feature.slug),
  };
}

// The action already calls requireAdmin(); the service checks again so no other caller can skip it.
export async function createRoom(
  user: UserSummary,
  input: RoomInput,
): Promise<{ id: string }> {
  assertAdmin(user);
  const { features, ...room } = input;

  try {
    return await prisma.$transaction(async (tx) => {
      const featureIds = await findFeatureIds(tx, features);
      return tx.room.create({
        data: {
          ...room,
          features: { create: featureIds.map((featureId) => ({ featureId })) },
        },
        select: { id: true },
      });
    });
  } catch (error) {
    throw toNameTakenError(error);
  }
}

export async function updateRoom(
  user: UserSummary,
  roomId: string,
  input: RoomInput,
): Promise<void> {
  assertAdmin(user);
  const { features, ...room } = input;

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.room.findUnique({
        where: { id: roomId },
        select: { id: true },
      });
      if (!existing) {
        throw new DomainError("ROOM_NOT_FOUND", "Sala não encontrada.");
      }

      const featureIds = await findFeatureIds(tx, features);
      // Replaces the whole set: the form always sends every checked feature.
      await tx.room.update({
        where: { id: roomId },
        data: {
          ...room,
          features: {
            deleteMany: {},
            create: featureIds.map((featureId) => ({ featureId })),
          },
        },
      });
    });
  } catch (error) {
    throw toNameTakenError(error);
  }
}

// A slug outside the catalog only comes from a tampered form, so it is rejected instead of ignored.
async function findFeatureIds(
  tx: Prisma.TransactionClient,
  slugs: string[],
): Promise<string[]> {
  const unique = [...new Set(slugs)];
  const found = await tx.feature.findMany({
    where: { slug: { in: unique } },
    select: { id: true },
  });
  if (found.length !== unique.length) {
    throw new DomainError(
      "VALIDATION_ERROR",
      "Recurso inválido. Recarregue a página.",
    );
  }
  return found.map(({ id }) => id);
}

// P2002: unique constraint. Room.name is the only unique column an admin can set.
function toNameTakenError(error: unknown): unknown {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return new DomainError("NAME_TAKEN", "Já existe uma sala com esse nome.");
  }
  return error;
}
