import { describe, it, expect } from "vitest";
import { boardPower, getInitial } from "../src/components/game/BattleArena";

describe("boardPower", () => {
  it("calcule la somme des ATK", () => {
    const board = [{ atk: 3 }, { atk: 5 }, { atk: 2 }];
    expect(boardPower(board)).toBe(10);
  });

  it("retourne 0 si le board est vide", () => {
    expect(boardPower([])).toBe(0);
  });
});

describe("getInitial", () => {
  it("retourne la première lettre en majuscule", () => {
    expect(getInitial("mickey")).toBe("M");
  });

  it("retourne ? si nom vide", () => {
    expect(getInitial("")).toBe("?");
  });
});
