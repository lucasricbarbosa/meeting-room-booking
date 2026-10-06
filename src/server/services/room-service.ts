import "server-only";
import type { FeatureSummary, RoomFilters, RoomListItem } from "@/domain/room";
import { prisma } from "@/server/db";

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
