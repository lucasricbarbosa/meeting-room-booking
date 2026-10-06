import { describe, expect, it } from "vitest";
import { roomSchema } from "@/schemas/room";

const valid = {
  name: "Sala Nova",
  capacity: "6",
  location: "5º andar",
  description: "",
  features: ["tv"],
  isActive: true,
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
});
