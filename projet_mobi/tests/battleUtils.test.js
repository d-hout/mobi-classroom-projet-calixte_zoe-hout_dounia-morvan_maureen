import { describe, it, expect } from "vitest";
import { getInitial } from "../src/components/game/battleArenaUtils";

describe("getInitial", () => {
  it("retourne la première lettre en majuscule", () => {
    expect(getInitial("mickey")).toBe("M");
  });

  it("retourne ? si nom vide", () => {
    expect(getInitial("")).toBe("?");
  });
});
