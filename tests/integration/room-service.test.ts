import { beforeEach, describe, expect, it } from "vitest";
import type { UserSummary } from "@/domain/user";
import type { RoomInput } from "@/schemas/room";
import { prisma } from "@/server/db";
import {
  // The local createRoom helper inserts directly; this is the admin service under test.
  createRoom as createRoomService,
  getActiveRoom,
  getRoomDetails,
  listAllRooms,
  listRooms,
  updateRoom,
} from "@/server/services/room-service";
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
        maxBookingMinutes: 240,
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
      maxBookingMinutes: 240,
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

describe("room administration", () => {
  const userSelect = { id: true, name: true, email: true, role: true } as const;
  let admin: UserSummary;
  let regularUser: UserSummary;

  const input = (overrides: Partial<RoomInput> = {}): RoomInput => ({
    name: "Sala Nova",
    capacity: 6,
    location: "5º andar",
    description: null,
    features: ["tv"],
    isActive: true,
    maxBookingMinutes: 120,
    ...overrides,
  });

  beforeEach(async () => {
    admin = await prisma.user.create({
      data: { name: "Carla Mendes", email: "carla@example.com", role: "ADMIN" },
      select: userSelect,
    });
    regularUser = await prisma.user.create({
      data: { name: "Ana Souza", email: "ana@example.com" },
      select: userSelect,
    });
  });

  describe("createRoom", () => {
    it("rejects a regular user with FORBIDDEN and creates nothing", async () => {
      await expect(
        createRoomService(regularUser, input()),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      expect(await prisma.room.count()).toBe(0);
    });

    it("lets an admin create a room with its features", async () => {
      const { id } = await createRoomService(
        admin,
        input({ features: ["projector", "tv"] }),
      );

      expect(await getRoomDetails(id)).toEqual({
        id,
        name: "Sala Nova",
        capacity: 6,
        location: "5º andar",
        description: null,
        isActive: true,
        maxBookingMinutes: 120,
        featureSlugs: ["projector", "tv"],
      });
    });

    it("rejects a duplicate name with NAME_TAKEN", async () => {
      await createRoom({ name: "Sala Nova", capacity: 4 });

      await expect(createRoomService(admin, input())).rejects.toMatchObject({
        code: "NAME_TAKEN",
      });
      expect(await prisma.room.count()).toBe(1);
    });

    it("rejects a feature outside the catalog", async () => {
      await expect(
        createRoomService(admin, input({ features: ["tv", "jacuzzi"] })),
      ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
      expect(await prisma.room.count()).toBe(0);
    });
  });

  describe("updateRoom", () => {
    it("rejects a regular user with FORBIDDEN and leaves the room intact", async () => {
      const room = await createRoom({ name: "Sala A", capacity: 4 });

      await expect(
        updateRoom(regularUser, room.id, input({ isActive: false })),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      expect(await prisma.room.findUnique({ where: { id: room.id } })).toEqual(
        room,
      );
    });

    it("lets an admin edit the fields and replace the features", async () => {
      const room = await createRoom({
        name: "Sala A",
        capacity: 4,
        features: ["tv"],
      });

      await updateRoom(
        admin,
        room.id,
        input({
          name: "Sala A2",
          capacity: 10,
          description: "Renovada",
          features: ["projector"],
          maxBookingMinutes: 90,
        }),
      );

      expect(await getRoomDetails(room.id)).toEqual({
        id: room.id,
        name: "Sala A2",
        capacity: 10,
        location: "5º andar",
        description: "Renovada",
        isActive: true,
        maxBookingMinutes: 90,
        featureSlugs: ["projector"],
      });
    });

    it("accepts saving a room with its own name", async () => {
      const room = await createRoom({ name: "Sala Nova", capacity: 4 });

      await expect(
        updateRoom(admin, room.id, input()),
      ).resolves.toBeUndefined();
    });

    it("rejects renaming to another room's name with NAME_TAKEN", async () => {
      await createRoom({ name: "Sala Nova", capacity: 4 });
      const room = await createRoom({ name: "Sala B", capacity: 4 });

      await expect(updateRoom(admin, room.id, input())).rejects.toMatchObject({
        code: "NAME_TAKEN",
      });
      expect(
        (await prisma.room.findUniqueOrThrow({ where: { id: room.id } })).name,
      ).toBe("Sala B");
    });

    it("rejects a room that does not exist", async () => {
      await expect(
        updateRoom(admin, "missing-room", input()),
      ).rejects.toMatchObject({ code: "ROOM_NOT_FOUND" });
    });

    it("hides a deactivated room from the room list but keeps it in the admin list", async () => {
      const room = await createRoom({ name: "Sala Nova", capacity: 4 });

      await updateRoom(admin, room.id, input({ isActive: false }));

      expect(await listRooms({ features: [] })).toEqual([]);
      expect(await listAllRooms()).toEqual([
        expect.objectContaining({ name: "Sala Nova", isActive: false }),
      ]);
    });
  });
});
