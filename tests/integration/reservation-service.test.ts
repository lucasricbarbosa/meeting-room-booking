import { beforeEach, describe, expect, it } from "vitest";
import type { UserSummary } from "@/domain/user";
import { prisma } from "@/server/db";
import {
  cancelReservation,
  createReservation,
  listDayReservations,
  listUserReservations,
} from "@/server/services/reservation-service";
import { resetDatabase } from "../helpers/db";

// Business time zone is America/Sao_Paulo (UTC-3): 13:00Z is 10:00 local.
const now = new Date("2026-10-07T12:00:00Z");
const at = (time: string) => new Date(`2026-10-08T${time}:00-03:00`);

let owner: UserSummary;
let otherUser: UserSummary;
let roomId: string;

const userSelect = { id: true, name: true, email: true, role: true } as const;

beforeEach(async () => {
  await resetDatabase();
  owner = await prisma.user.create({
    data: { name: "Ana Souza", email: "ana@example.com" },
    select: userSelect,
  });
  otherUser = await prisma.user.create({
    data: { name: "Bruno Lima", email: "bruno@example.com" },
    select: userSelect,
  });
  roomId = (await prisma.room.create({ data: { name: "Sala A", capacity: 4 } }))
    .id;
});

async function bookExisting(status: "ACTIVE" | "CANCELLED" = "ACTIVE") {
  await prisma.reservation.create({
    data: {
      roomId,
      userId: owner.id,
      startsAt: at("10:00"),
      endsAt: at("11:00"),
      status,
      cancelledAt: status === "CANCELLED" ? now : null,
    },
  });
}

function book(start: string, end: string, user: UserSummary = otherUser) {
  return createReservation(
    user,
    { roomId, startsAt: at(start), endsAt: at(end) },
    now,
  );
}

describe("createReservation", () => {
  it.each([
    ["partial at the start", "09:30", "10:30"],
    ["partial at the end", "10:30", "11:30"],
    ["contained", "10:15", "10:45"],
    ["enclosing", "09:00", "12:00"],
  ])("rejects an overlap %s (%s–%s)", async (_label, start, end) => {
    await bookExisting();

    await expect(book(start, end)).rejects.toMatchObject({
      code: "ROOM_CONFLICT",
    });
    expect(await prisma.reservation.count()).toBe(1);
  });

  it("shows the occupied slot in the conflict message, never who booked it", async () => {
    await bookExisting();

    const error = await book("10:30", "11:30").catch((e: unknown) => e);

    expect(error).toMatchObject({ code: "ROOM_CONFLICT" });
    const message = error instanceof Error ? error.message : "";
    expect(message).toContain("10:00");
    expect(message).toContain("11:00");
    expect(message).not.toContain(owner.name);
  });

  it.each([
    ["before", "09:00", "10:00"],
    ["after", "11:00", "12:00"],
  ])(
    "accepts a back-to-back booking %s (%s–%s)",
    async (_label, start, end) => {
      await bookExisting();

      const { id } = await book(start, end);

      const created = await prisma.reservation.findUniqueOrThrow({
        where: { id },
      });
      expect(created).toMatchObject({
        roomId,
        userId: otherUser.id,
        startsAt: at(start),
        endsAt: at(end),
        status: "ACTIVE",
      });
    },
  );

  it("is not blocked by a cancelled reservation in the same slot", async () => {
    await bookExisting("CANCELLED");

    await expect(book("10:00", "11:00")).resolves.toEqual({
      id: expect.any(String),
    });
    expect(
      await prisma.reservation.count({ where: { status: "ACTIVE" } }),
    ).toBe(1);
  });

  it("rejects an inactive room", async () => {
    await prisma.room.update({
      where: { id: roomId },
      data: { isActive: false },
    });

    await expect(book("10:00", "11:00")).rejects.toMatchObject({
      code: "ROOM_INACTIVE",
    });
    expect(await prisma.reservation.count()).toBe(0);
  });

  it("rejects a room that does not exist", async () => {
    await expect(
      createReservation(
        owner,
        { roomId: "missing-room", startsAt: at("10:00"), endsAt: at("11:00") },
        now,
      ),
    ).rejects.toMatchObject({ code: "ROOM_NOT_FOUND" });
  });

  it("applies the domain rules (start in the past)", async () => {
    await expect(
      createReservation(
        owner,
        {
          roomId,
          startsAt: new Date("2026-10-07T11:00:00Z"),
          endsAt: new Date("2026-10-07T12:30:00Z"),
        },
        now,
      ),
    ).rejects.toMatchObject({ code: "IN_THE_PAST" });
  });

  it("rejects 90 minutes in a room limited to 60", async () => {
    await prisma.room.update({
      where: { id: roomId },
      data: { maxBookingMinutes: 60 },
    });

    await expect(book("09:00", "10:30")).rejects.toMatchObject({
      code: "DURATION_TOO_LONG",
      message: "Esta sala permite reservas de até 1 h.",
    });
    expect(await prisma.reservation.count()).toBe(0);
  });

  it("accepts the same 90 minutes in a room limited to 240", async () => {
    await prisma.room.update({
      where: { id: roomId },
      data: { maxBookingMinutes: 240 },
    });

    await book("09:00", "10:30");

    expect(await prisma.reservation.count()).toBe(1);
  });
});

describe("listDayReservations", () => {
  async function insert(
    startsAt: Date,
    endsAt: Date,
    data: { roomId?: string; status?: "ACTIVE" | "CANCELLED" } = {},
  ) {
    return prisma.reservation.create({
      data: {
        roomId: data.roomId ?? roomId,
        userId: owner.id,
        title: "Planejamento",
        startsAt,
        endsAt,
        status: data.status ?? "ACTIVE",
      },
    });
  }

  it("returns only the times of the room's active reservations on that business day", async () => {
    const late = await insert(at("22:30"), at("23:30"));
    const morning = await insert(at("09:00"), at("10:00"));
    await insert(at("11:00"), at("12:00"), { status: "CANCELLED" });
    const otherRoom = await prisma.room.create({
      data: { name: "Sala B", capacity: 4 },
    });
    await insert(at("09:00"), at("10:00"), { roomId: otherRoom.id });
    await insert(
      new Date("2026-10-07T09:00:00-03:00"),
      new Date("2026-10-07T10:00:00-03:00"),
    );
    await insert(
      new Date("2026-10-09T00:00:00-03:00"),
      new Date("2026-10-09T01:00:00-03:00"),
    );

    const slots = await listDayReservations(roomId, "2026-10-08");

    // Exact shape on purpose: owner or title in this result would leak to other users.
    expect(slots).toEqual([
      { id: morning.id, startsAt: at("09:00"), endsAt: at("10:00") },
      { id: late.id, startsAt: at("22:30"), endsAt: at("23:30") },
    ]);
  });
});

describe("cancelReservation", () => {
  let reservationId: string;

  beforeEach(async () => {
    reservationId = (await insertOwn(at("10:00"), at("11:00"))).id;
  });

  async function insertOwn(startsAt: Date, endsAt: Date) {
    return prisma.reservation.create({
      data: { roomId, userId: owner.id, startsAt, endsAt },
    });
  }

  function getState(id = reservationId) {
    return prisma.reservation.findUniqueOrThrow({
      where: { id },
      select: { status: true, cancelledAt: true },
    });
  }

  it("lets the owner cancel, keeping the record (soft cancel)", async () => {
    await cancelReservation(owner, reservationId, now);

    expect(await getState()).toEqual({ status: "CANCELLED", cancelledAt: now });
  });

  it("forbids another user and keeps the reservation active", async () => {
    await expect(
      cancelReservation(otherUser, reservationId, now),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    expect(await getState()).toEqual({ status: "ACTIVE", cancelledAt: null });
  });

  it("forbids an admin who is not the owner", async () => {
    const admin = await prisma.user.create({
      data: { name: "Carla Mendes", email: "carla@example.com", role: "ADMIN" },
      select: userSelect,
    });

    await expect(
      cancelReservation(admin, reservationId, now),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    expect(await getState()).toEqual({ status: "ACTIVE", cancelledAt: null });
  });

  it.each([
    ["exactly at its start", "2026-10-07T12:00:00Z"],
    ["in progress", "2026-10-07T11:30:00Z"],
  ])(
    "rejects a reservation that already started (%s)",
    async (_label, start) => {
      const startsAt = new Date(start);
      const started = await insertOwn(
        startsAt,
        new Date(startsAt.getTime() + 60 * 60_000),
      );

      await expect(
        cancelReservation(owner, started.id, now),
      ).rejects.toMatchObject({ code: "ALREADY_STARTED" });

      expect(await getState(started.id)).toEqual({
        status: "ACTIVE",
        cancelledAt: null,
      });
    },
  );

  it("rejects a reservation that is already cancelled", async () => {
    await cancelReservation(owner, reservationId, now);
    const later = new Date(now.getTime() + 60_000);

    await expect(
      cancelReservation(owner, reservationId, later),
    ).rejects.toMatchObject({ code: "ALREADY_CANCELLED" });

    expect(await getState()).toEqual({ status: "CANCELLED", cancelledAt: now });
  });

  it("checks ownership first, so another user cannot learn the status", async () => {
    await cancelReservation(owner, reservationId, now);

    await expect(
      cancelReservation(otherUser, reservationId, now),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects a reservation that does not exist", async () => {
    await expect(
      cancelReservation(owner, "missing-reservation", now),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("listUserReservations", () => {
  const local = (dateTime: string) => new Date(`${dateTime}:00-03:00`);

  function insert(
    startsAt: Date,
    endsAt: Date,
    data: { userId?: string; status?: "ACTIVE" | "CANCELLED" } = {},
  ) {
    return prisma.reservation.create({
      data: {
        roomId,
        userId: data.userId ?? owner.id,
        title: "Planejamento",
        startsAt,
        endsAt,
        status: data.status ?? "ACTIVE",
      },
    });
  }

  it("splits the user's reservations around now, including cancelled ones", async () => {
    // now is 2026-10-07 09:00 in São Paulo.
    const yesterday = await insert(
      local("2026-10-06T14:00"),
      local("2026-10-06T15:00"),
    );
    const endedNow = await insert(
      local("2026-10-07T08:00"),
      local("2026-10-07T09:00"),
    );
    const inProgress = await insert(
      local("2026-10-07T08:30"),
      local("2026-10-07T09:30"),
    );
    const cancelled = await insert(at("14:00"), at("15:00"), {
      status: "CANCELLED",
    });
    const tomorrow = await insert(at("10:00"), at("11:00"));
    await insert(at("12:00"), at("13:00"), { userId: otherUser.id });

    const { upcoming, past } = await listUserReservations(owner.id, now);

    const item = (reservation: typeof tomorrow) => ({
      id: reservation.id,
      title: "Planejamento",
      startsAt: reservation.startsAt,
      endsAt: reservation.endsAt,
      status: reservation.status,
      roomName: "Sala A",
    });
    expect(upcoming).toEqual([
      item(inProgress),
      item(tomorrow),
      item(cancelled),
    ]);
    expect(past).toEqual([item(endedNow), item(yesterday)]);
  });

  it("keeps only the 20 most recent past reservations", async () => {
    const hour = 60 * 60_000;
    for (let index = 1; index <= 21; index++) {
      const startsAt = new Date(now.getTime() - index * hour);
      await insert(startsAt, new Date(startsAt.getTime() + hour / 2));
    }

    const { past } = await listUserReservations(owner.id, now);

    expect(past).toHaveLength(20);
    expect(past[0]?.startsAt).toEqual(new Date(now.getTime() - hour));
    expect(past[19]?.startsAt).toEqual(new Date(now.getTime() - 20 * hour));
  });
});
