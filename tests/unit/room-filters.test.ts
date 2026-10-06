import { describe, expect, it } from "vitest";
import { buildRoomsHref, parseRoomFilters } from "@/schemas/room-filters";

describe("parseRoomFilters", () => {
  it("returns no filters for empty search params", () => {
    expect(parseRoomFilters({})).toEqual({
      minCapacity: undefined,
      features: [],
    });
  });

  it("reads a positive integer minCapacity", () => {
    expect(parseRoomFilters({ minCapacity: "8" }).minCapacity).toBe(8);
  });

  it.each(["abc", "0", "-1", "2.5", ""])(
    "ignores invalid minCapacity %j",
    (value) => {
      expect(parseRoomFilters({ minCapacity: value }).minCapacity).toBe(
        undefined,
      );
    },
  );

  it("ignores minCapacity repeated in the URL", () => {
    expect(
      parseRoomFilters({ minCapacity: ["4", "8"] }).minCapacity,
    ).toBeUndefined();
  });

  it("keeps valid features when minCapacity is invalid", () => {
    expect(parseRoomFilters({ minCapacity: "abc", features: "tv" })).toEqual({
      minCapacity: undefined,
      features: ["tv"],
    });
  });

  it("splits features, dropping blanks and duplicates", () => {
    expect(
      parseRoomFilters({ features: "tv,,projector, tv" }).features,
    ).toEqual(["tv", "projector"]);
  });

  it("drops feature slugs with invalid characters", () => {
    expect(
      parseRoomFilters({ features: "tv,<script>,Projector" }).features,
    ).toEqual(["tv"]);
  });
});

describe("buildRoomsHref", () => {
  it("returns /rooms without filters", () => {
    expect(buildRoomsHref({ features: [] })).toBe("/rooms");
  });

  it("serializes features as comma-separated slugs", () => {
    expect(
      buildRoomsHref({ minCapacity: 8, features: ["projector", "tv"] }),
    ).toBe("/rooms?minCapacity=8&features=projector,tv");
  });

  it("round-trips through parseRoomFilters", () => {
    const filters = { minCapacity: 6, features: ["videoconf", "whiteboard"] };
    const query = new URL(buildRoomsHref(filters), "http://localhost")
      .searchParams;

    expect(parseRoomFilters(Object.fromEntries(query))).toEqual(filters);
  });
});
