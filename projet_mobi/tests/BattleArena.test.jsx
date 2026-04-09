import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import BattleArena from "../src/components/game/BattleArena";

describe("BattleArena component", () => {
  it("affiche les PV des joueurs", () => {
    render(
      <BattleArena
        me={{ name: "Moi", hp: 5, board: [] }}
        opponent={{ name: "Enemy", hp: 4, board: [] }}
        isMyTurn={true}
      />,
    );

    expect(screen.getByText("Moi — 5 PV")).toBeInTheDocument();
    expect(screen.getByText("Enemy — 4 PV")).toBeInTheDocument();
  });
});
