import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import BattleArena, {
  boardPower,
  getInitial,
} from "../src/components/game/BattleArena";

describe("BattleArena utils", () => {
  it("boardPower calcule la somme des ATK", () => {
    const board = [{ atk: 3 }, { atk: 5 }];
    expect(boardPower(board)).toBe(8);
  });

  it("getInitial retourne la première lettre en majuscule", () => {
    expect(getInitial("mickey")).toBe("M");
    expect(getInitial("")).toBe("?");
  });
});

describe("BattleArena component", () => {
  it("affiche les PV des joueurs", () => {
    render(
      <BattleArena
        me={{ name: "Moi", hp: 5, board: [] }}
        opponent={{ name: "Enemy", hp: 4, board: [] }}
        isMyTurn={true}
      />,
    );

    expect(screen.getByText(/Moi/)).toBeInTheDocument();
    expect(screen.getByText(/Enemy/)).toBeInTheDocument();
  });
});
