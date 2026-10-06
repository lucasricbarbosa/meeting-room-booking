import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/server/db";
import { getActiveRoom, listRooms } from "@/server/services/room-service";
import { resetDatabase } from "../helpers/db";

async function createRoom(data: {
  name: string;
  capacity: number;
  features?: string[];
  isActive?: boolean;
}) {
  const { features = [], ...room } = data;
  return prisma.room.create({
    data: {
      ...room,
      features: {
        create: features.map((slug) => ({ feature: { connect: { slug } } })),
      },
    },
  });
}

function namesOf(rooms: { name: string }[]): string[] {
  return rooms.map((room) => room.name);
}

beforeEach(async () => {
  await resetDatabase();
  await prisma.feature.createMany({
    data: [
      { slug: "projector", name: "Projetor" },
      { slug: "tv", name: "TV" },
    ],
  });
});

describe("listRooms", () => {
  it("returns active rooms with their features when there are no filters", async () => {
    await createRoom({ name: "Sala A", capacity: 4, features: ["tv"] });
    await createRoom({ name: "Sala B", capacity: 8 });

    const rooms = await listRooms({ features: [] });

    expect(rooms).toEqual([
      expect.objectContaining({
        name: "Sala A",
        capacity: 4,
        features: [{ slug: "tv", name: "TV" }],
      }),
      expect.objectContaining({ name: "Sala B", capacity: 8, features: [] }),
    ]);
  });

  it("requires every selected feature", async () => {
    await createRoom({
      name: "Só projetor",
      capacity: 4,
      features: ["projector"],
    });
    await createRoom({
      name: "Projetor e TV",
      capacity: 6,
      features: ["projector", "tv"],
    });

    const both = await listRooms({ features: ["projector", "tv"] });
    const projectorOnly = await listRooms({ features: ["projector"] });

    expect(namesOf(both)).toEqual(["Projetor e TV"]);
    expect(namesOf(projectorOnly)).toEqual(["Só projetor", "Projetor e TV"]);
  });

  it("includes rooms whose capacity equals the minimum", async () => {
    await createRoom({ name: "Pequena", capacity: 4 });
    await createRoom({ name: "Grande", capacity: 8 });

    expect(namesOf(await listRooms({ minCapacity: 8, features: [] }))).toEqual([
      "Grande",
    ]);
    expect(await listRooms({ minCapacity: 9, features: [] })).toEqual([]);
  });

  it("never returns inactive rooms, even when they match the filters", async () => {
    await createRoom({ name: "Ativa", capacity: 10, features: ["tv"] });
    await createRoom({
      name: "Inativa",
      capacity: 10,
      features: ["tv"],
      isActive: false,
    });

    expect(namesOf(await listRooms({ features: [] }))).toEqual(["Ativa"]);
    expect(
      namesOf(await listRooms({ minCapacity: 10, features: ["tv"] })),
    ).toEqual(["Ativa"]);
  });
});

describe("getActiveRoom", () => {
  it("returns an active room", async () => {
    const room = await createRoom({ name: "Sala A", capacity: 4 });

    expect(await getActiveRoom(room.id)).toEqual({
      id: room.id,
      name: "Sala A",
      capacity: 4,
      location: null,
    });
  });

  it("returns null for an inactive room", async () => {
    const room = await createRoom({
      name: "Sala A",
      capacity: 4,
      isActive: false,
    });

    expect(await getActiveRoom(room.id)).toBeNull();
  });

  it("returns null for a room that does not exist", async () => {
    expect(await getActiveRoom("missing-room")).toBeNull();
  });
});
