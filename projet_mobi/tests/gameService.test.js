import { beforeEach, describe, expect, it, vi } from "vitest";

const firebaseMock = vi.hoisted(() => ({
  get: vi.fn(),
  onValue: vi.fn(),
  ref: vi.fn((db, path = "") => ({ db, path })),
  runTransaction: vi.fn(),
  update: vi.fn(),
}));

vi.mock("firebase/database", () => firebaseMock);
vi.mock("../src/services/firebaseConfig", () => ({
  rtdb: { name: "mock-rtdb" },
}));

describe("gameService", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(Date, "now").mockReturnValue(1775661239718);
    vi.stubGlobal("crypto", {
      randomUUID: () => "game-1",
    });
  });

  it("createGame écrit la partie privée et son entrée openGames", async () => {
    const { createGame } = await import("../src/services/gameService");

    const gameId = await createGame({
      uid: "host-uid",
      displayName: "Zoe",
    });

    expect(gameId).toBe("game-1");
    expect(firebaseMock.update).toHaveBeenCalledWith(
      expect.objectContaining({ path: "" }),
      {
        "games/game-1": expect.objectContaining({
          createdAt: 1775661239718,
          createdBy: "host-uid",
          currentTurn: "host-uid",
          players: { "host-uid": true },
          playerAUser: {
            uid: "host-uid",
            name: "Zoe",
            deckReady: false,
          },
          status: "deck_selection",
        }),
        "openGames/game-1": {
          createdAt: 1775661239718,
          createdBy: "host-uid",
          hostName: "Zoe",
        },
      },
    );
  });

  it("joinGame lit openGames, ajoute le joueur B puis retire l'entrée publique", async () => {
    firebaseMock.get.mockResolvedValue({
      exists: () => true,
      val: () => ({ createdBy: "host-uid", hostName: "Zoe" }),
    });

    const { joinGame } = await import("../src/services/gameService");

    const gameId = await joinGame("game-1", {
      uid: "guest-uid",
      displayName: "Maureen",
    });

    expect(gameId).toBe("game-1");
    expect(firebaseMock.ref).toHaveBeenCalledWith(
      { name: "mock-rtdb" },
      "openGames/game-1",
    );
    expect(firebaseMock.update).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ path: "" }),
      {
        "games/game-1/players/guest-uid": true,
        "games/game-1/playerBUser": {
          uid: "guest-uid",
          name: "Maureen",
          deckReady: false,
        },
        "games/game-1/updatedAt": 1775661239718,
      },
    );
    expect(firebaseMock.update).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ path: "" }),
      {
        "openGames/game-1": null,
      },
    );
  });

  it("joinGame refuse de rejoindre sa propre partie", async () => {
    firebaseMock.get.mockResolvedValue({
      exists: () => true,
      val: () => ({ createdBy: "host-uid", hostName: "Zoe" }),
    });

    const { joinGame } = await import("../src/services/gameService");

    await expect(
      joinGame("game-1", { uid: "host-uid", displayName: "Zoe" }),
    ).rejects.toThrow("Tu ne peux pas rejoindre ta propre partie");
    expect(firebaseMock.update).not.toHaveBeenCalled();
  });

  it("subscribeToOpenGames lit openGames et trie les parties récentes d'abord", async () => {
    firebaseMock.onValue.mockImplementation((refValue, onData) => {
      onData({
        exists: () => true,
        val: () => ({
          old: { createdBy: "u1", hostName: "Ancienne", createdAt: 1 },
          recent: { createdBy: "u2", hostName: "Récente", createdAt: 2 },
        }),
      });
      return "unsubscribe";
    });

    const { subscribeToOpenGames } = await import("../src/services/gameService");
    const callback = vi.fn();

    const unsubscribe = subscribeToOpenGames(callback);

    expect(unsubscribe).toBe("unsubscribe");
    expect(callback).toHaveBeenCalledWith([
      expect.objectContaining({
        id: "recent",
        playerAUser: { uid: "u2", name: "Récente" },
      }),
      expect.objectContaining({
        id: "old",
        playerAUser: { uid: "u1", name: "Ancienne" },
      }),
    ]);
  });
});
