import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import BattleArena from "../src/components/game/BattleArena";

describe("BattleArena component", () => {
  it("affiche les PV des joueurs", () => {
    render(
      <BattleArena
        me={{
          name: "Moi",
          hp: 5,
          board: [{ id: "my-card", name: "Ma carte", atk: 6, def: 3 }],
          deck: [{ id: "1" }],
        }}
        opponent={{
          name: "Enemy",
          hp: 4,
          board: [{ id: "enemy-card", name: "Carte adverse", atk: 9, def: 8 }],
          deck: [{ id: "2" }, { id: "3" }],
        }}
        isMyTurn={true}
      />,
    );

    expect(screen.getByText("Moi — 5 PV")).toBeInTheDocument();
    expect(screen.getByText("Enemy — 4 PV")).toBeInTheDocument();
    expect(screen.getByText("Deck restant : 1 carte")).toBeInTheDocument();
    expect(screen.getByText("Deck restant : 2 cartes")).toBeInTheDocument();
    expect(screen.getByText("Ma carte")).toBeInTheDocument();
    expect(screen.getByText("ATK 6")).toBeInTheDocument();
    expect(screen.getByText("DEF 3")).toBeInTheDocument();
    expect(screen.getByText("Carte adverse")).toBeInTheDocument();
    expect(screen.queryByText("ATK 9")).not.toBeInTheDocument();
    expect(screen.queryByText("DEF 8")).not.toBeInTheDocument();
  });
});
