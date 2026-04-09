import { describe, expect, it, vi } from "vitest";
import {
  computeWinner,
  createInitialPlayerState,
  declareAttack,
  refillBoard,
  resolveDefense,
} from "../src/game/gameEngine";

const cards = [
  { id: "1", name: "Mickey", atk: 5, def: 2 },
  { id: "2", name: "Minnie", atk: 3, def: 4 },
  { id: "3", name: "Donald", atk: 2, def: 3 },
  { id: "4", name: "Goofy", atk: 4, def: 1 },
];

function createPlayingGame(overrides = {}) {
  return {
    status: "playing",
    phase: "attack",
    currentTurn: "player-a",
    pendingAttack: null,
    playerA: {
      uid: "player-a",
      name: "Joueur A",
      hp: 5,
      board: [{ id: "a1", name: "Attaque", atk: 5, def: 1 }],
      deck: [{ id: "a2", name: "Reserve A", atk: 1, def: 1 }],
      discard: [],
    },
    playerB: {
      uid: "player-b",
      name: "Joueur B",
      hp: 5,
      board: [{ id: "b1", name: "Defense", atk: 2, def: 3 }],
      deck: [{ id: "b2", name: "Reserve B", atk: 1, def: 1 }],
      discard: [],
    },
    ...overrides,
  };
}

describe("gameEngine", () => {
  it("crée un état joueur avec 5 PV, 3 cartes sur le terrain et le reste dans le deck", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);

    const player = createInitialPlayerState("uid-1", "Zoe", cards);

    expect(player.uid).toBe("uid-1");
    expect(player.name).toBe("Zoe");
    expect(player.hp).toBe(5);
    expect(player.board).toHaveLength(3);
    expect(player.deck).toHaveLength(1);
    expect(player.hand).toEqual([]);
    expect(player.discard).toEqual([]);

    vi.restoreAllMocks();
  });

  it("refillBoard complète le terrain sans dépasser 3 cartes et sans muter le joueur original", () => {
    const game = createPlayingGame({
      playerA: {
        uid: "player-a",
        board: [{ id: "a1" }],
        deck: [{ id: "a2" }, { id: "a3" }, { id: "a4" }],
      },
    });

    const updated = refillBoard(game, "playerA");

    expect(updated.playerA.board.map((card) => card.id)).toEqual([
      "a1",
      "a2",
      "a3",
    ]);
    expect(updated.playerA.deck.map((card) => card.id)).toEqual(["a4"]);
    expect(game.playerA.board.map((card) => card.id)).toEqual(["a1"]);
  });

  it("declareAttack passe en phase défense avec la carte attaquante", () => {
    const game = createPlayingGame();

    const updated = declareAttack(game, "playerA", "a1");

    expect(updated.phase).toBe("defense");
    expect(updated.pendingAttack).toMatchObject({
      attackerPlayerKey: "playerA",
      defenderPlayerKey: "playerB",
      attackerCard: { id: "a1" },
    });
    expect(game.pendingAttack).toBeNull();
  });

  it("declareAttack refuse une attaque hors tour", () => {
    const game = createPlayingGame({ currentTurn: "player-b" });

    expect(() => declareAttack(game, "playerA", "a1")).toThrow(
      "Ce n'est pas le tour de l'attaquant",
    );
  });

  it("resolveDefense retire les cartes jouées, inflige un PV si l'attaque dépasse la défense et change le tour", () => {
    const attackedGame = declareAttack(createPlayingGame(), "playerA", "a1");

    const updated = resolveDefense(attackedGame, "b1");

    expect(updated.phase).toBe("attack");
    expect(updated.pendingAttack).toBeNull();
    expect(updated.currentTurn).toBe("player-b");
    expect(updated.playerA.board.map((card) => card.id)).not.toContain("a1");
    expect(updated.playerB.board.map((card) => card.id)).not.toContain("b1");
    expect(updated.playerA.discard.map((card) => card.id)).toContain("a1");
    expect(updated.playerB.discard.map((card) => card.id)).toContain("b1");
    expect(updated.playerB.hp).toBe(4);
  });

  it("resolveDefense retire un PV quand le défenseur encaisse le coup", () => {
    const attackedGame = declareAttack(createPlayingGame(), "playerA", "a1");

    const updated = resolveDefense(attackedGame, null);

    expect(updated.playerB.hp).toBe(4);
    expect(updated.currentTurn).toBe("player-b");
  });

  it("computeWinner déclare le gagnant quand un joueur n'a plus de PV", () => {
    const updated = computeWinner(
      createPlayingGame({
        playerB: {
          uid: "player-b",
          hp: 0,
          board: [{ id: "b1" }],
          deck: [],
        },
      }),
    );

    expect(updated.status).toBe("finished");
    expect(updated.winner).toBe("player-a");
  });
});
