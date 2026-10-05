import { describe, expect, it } from "vitest";
import { getInitials } from "@/lib/get-initials";

describe("getInitials", () => {
  it("uses the first letter of the first and last names", () => {
    expect(getInitials("Ana Souza")).toBe("AS");
    expect(getInitials("Carla Maria Mendes")).toBe("CM");
  });

  it("uses a single letter for a single name", () => {
    expect(getInitials("Bruno")).toBe("B");
  });

  it("ignores extra spaces and uppercases the result", () => {
    expect(getInitials("  ana   souza ")).toBe("AS");
  });
});
