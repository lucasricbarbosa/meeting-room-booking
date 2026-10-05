import { beforeEach, describe, expect, it } from "vitest";
import type { UserSummary } from "@/domain/user";
import { prisma } from "@/server/db";
import { createReservation } from "@/server/services/reservation-service";
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
});
