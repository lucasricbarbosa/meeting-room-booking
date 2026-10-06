import { describe, expect, it } from "vitest";

describe("test environment", () => {
  it("runs with the process time zone set to UTC", () => {
    expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe("UTC");
    expect(new Date("2026-01-01T00:00:00Z").getHours()).toBe(0);
  });
});
