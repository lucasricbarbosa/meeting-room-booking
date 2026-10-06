import { describe, expect, it } from "vitest";
import { formatDuration } from "@/lib/format-duration";

describe("formatDuration", () => {
  it.each([
    [15, "15 min"],
    [30, "30 min"],
    [60, "1 h"],
    [90, "1 h 30 min"],
    [480, "8 h"],
    [720, "12 h"],
  ])("%i → %s", (minutes, expected) => {
    expect(formatDuration(minutes)).toBe(expected);
  });
});
