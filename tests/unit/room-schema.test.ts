import { describe, expect, it } from "vitest";
import { roomSchema } from "@/schemas/room";

const valid = {
  name: "Sala Nova",
  capacity: "6",
  location: "5º andar",
  description: "",
  features: ["tv"],
  isActive: true,
  maxBookingMinutes: "240",
};

describe("roomSchema", () => {
  it("parses form values, turning blank optional fields into null", () => {
    expect(roomSchema.parse({ ...valid, location: "  " })).toEqual({
      name: "Sala Nova",
      capacity: 6,
      location: null,
      description: null,
      features: ["tv"],
      isActive: true,
      maxBookingMinutes: 240,
    });
  });

  it.each(["0", "-1", "1.5", "abc", ""])("rejects capacity %j", (capacity) => {
    expect(roomSchema.safeParse({ ...valid, capacity }).success).toBe(false);
  });

  it("accepts capacity 1", () => {
    expect(roomSchema.parse({ ...valid, capacity: "1" }).capacity).toBe(1);
  });

  it("rejects a blank name", () => {
    expect(roomSchema.safeParse({ ...valid, name: "   " }).success).toBe(false);
  });

  it("trims the name", () => {
    expect(roomSchema.parse({ ...valid, name: "  Sala Nova  " }).name).toBe(
      "Sala Nova",
    );
  });

  it.each(["14", "721", "60.5", "abc", ""])(
    "rejects maximum booking minutes %j",
    (maxBookingMinutes) => {
      expect(
        roomSchema.safeParse({ ...valid, maxBookingMinutes }).success,
      ).toBe(false);
    },
  );

  it.each([
    ["15", 15],
    ["720", 720],
  ])("accepts maximum booking minutes %j", (maxBookingMinutes, expected) => {
    expect(
      roomSchema.parse({ ...valid, maxBookingMinutes }).maxBookingMinutes,
    ).toBe(expected);
  });
});
