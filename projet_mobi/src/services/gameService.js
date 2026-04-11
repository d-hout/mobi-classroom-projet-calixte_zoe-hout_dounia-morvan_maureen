import { ref, get, onValue, runTransaction, update } from "firebase/database"; // arties en Realtime DB
import { rtdb } from "./firebaseConfig";
import {
  createInitialPlayerState,
  declareAttack,
  resolveDefense,
} from "../game/gameEngine";
import { getSharedCombatCardsList } from "./combatCardService";

let allCardsCachePromise = null;

async function getAllCards() {
  if (!allCardsCachePromise) {
    allCardsCachePromise = getSharedCombatCardsList();
  }
  return allCardsCachePromise;
}

// Transforme une liste d'ids en vraies cartes de combat
async function buildDeckCardsFromIds(deckIds) {
  const allCards = await getAllCards();
  return allCards.filter((c) => deckIds.includes(String(c.id)));
}

function withPlayerUid(players, uid) {
  if (!uid) return players || {};
  return {
    ...(players || {}),
    [uid]: true,
  };
}

// Crée une partie vide
export async function createGame(hostUser) {
  const gameId = crypto.randomUUID();
  const createdAt = Date.now();
  const gameData = {
    status: "deck_selection", // La partie commence avec la sélection du deck
    createdBy: hostUser.uid,
    players: {
      [hostUser.uid]: true,
    },
    playerAUser: {
      uid: hostUser.uid,
      name: hostUser.displayName || "Joueur 1",
      deckReady: false,
    },
    playerBUser: null,
    playerA: null,
    playerB: null,
    currentTurn: hostUser.uid,
    phase: "setup",
    pendingAttack: null,
    winner: null,
    createdAt,
  };

  console.log("[createGame] creating gameId=", gameId, "user=", hostUser?.uid);
  await update(ref(rtdb), {
    [`games/${gameId}`]: gameData,
    [`openGames/${gameId}`]: {
      createdBy: hostUser.uid,
      hostName: hostUser.displayName || "Joueur 1",
      createdAt,
    },
  });
  console.log("[createGame] created OK:", gameId);
  return gameId;
}

// Rejoint une partie sans encore initialiser le deck combat
export async function joinGame(gameId, guestUser) {
  console.log(
    "[gameService] joinGame called with id:",
    JSON.stringify(gameId),
    "guest:",
    guestUser?.uid,
  );

  // Tolérance sur l'ID fourni : on accepte l'UUID pur, une URL complète ou un chemin
  const raw = String(gameId || "").trim();
  const extractGameId = (input) => {
    if (!input) return null;
    // Retirer les paramètres d'URL éventuels
    const cleaned = input.split(/[?#]/)[0];
    // Si l'utilisateur a collé une URL complète, récupérer le dernier segment
    try {
      // si c'est une URL, new URL(cleaned) fonctionne; sinon on continue
      const maybeUrl = new URL(cleaned);
      const p = maybeUrl.pathname.split("/").filter(Boolean);
      if (p.length) return p[p.length - 1];
    } catch {
      // non une URL, continuer
    }
    // Chercher un pattern UUID simple
    const uuidMatch = cleaned.match(/[0-9a-fA-F-]{8,36}/);
    if (uuidMatch) return uuidMatch[0];
    // Sinon prendre dernier segment après '/'
    const parts = cleaned.split("/").filter(Boolean);
    return parts.length ? parts[parts.length - 1] : cleaned;
  };

  const normalizedId = extractGameId(raw) || raw;
  console.log(
    `[gameService] joinGame using normalizedId='${normalizedId}' (raw='${raw}')`,
  );
  const normalizedGameId = String(normalizedId).trim();
  const openGameRef = ref(rtdb, `openGames/${normalizedGameId}`);

  try {
    const snap = await get(openGameRef);
    console.log(
      "[gameService] open game pre-check snap.exists:",
      snap.exists(),
      "for id:",
      normalizedGameId,
    );

    if (!snap.exists()) {
      throw new Error("Partie introuvable ou déjà complète");
    }

    const openGame = snap.val();
    if (openGame.createdBy === guestUser.uid) {
      throw new Error("Tu ne peux pas rejoindre ta propre partie");
    }

    await update(ref(rtdb), {
      [`games/${normalizedGameId}/players/${guestUser.uid}`]: true,
      [`games/${normalizedGameId}/playerBUser`]: {
        uid: guestUser.uid,
        name: guestUser.displayName || guestUser.email || "Joueur 2",
        deckReady: false,
      },
      [`games/${normalizedGameId}/updatedAt`]: Date.now(),
    });

    try {
      await update(ref(rtdb), {
        [`openGames/${normalizedGameId}`]: null,
      });
    } catch (removeError) {
      console.warn("[gameService] open game cleanup failed:", removeError);
    }

    return normalizedGameId;
  } catch (e) {
    console.error("[gameService] joinGame failed:", e);
    throw e;
  }
}

// Quand un joueur valide son deck
export async function lockDeckForGame(gameId, user, selectedDeckIds) {
  const gameRef = ref(rtdb, `games/${gameId}`);
  const uid = user.uid;

  const gameSnapshot = await get(gameRef);
  if (!gameSnapshot.exists()) {
    throw new Error("Partie introuvable");
  }

  const game = gameSnapshot.val();
  const isPlayerA = game.playerAUser?.uid === uid;
  const isPlayerB = game.playerBUser?.uid === uid;

  if (!isPlayerA && !isPlayerB) {
    throw new Error("Tu ne fais pas partie de cette partie");
  }

  // s'assurer que le deck contient exactement cartes
  if (!Array.isArray(selectedDeckIds) || selectedDeckIds.length !== 10) {
    throw new Error("Le deck doit contenir exactement 10 cartes (serveur)");
  }

  const combatDeckCards = await buildDeckCardsFromIds(
    selectedDeckIds.map(String),
  );

  if (!Array.isArray(combatDeckCards) || combatDeckCards.length !== 10) {
    throw new Error("Cartes du deck invalides ou manquantes (serveur)");
  }

  const playerState = createInitialPlayerState(
    uid,
    user.displayName || (isPlayerA ? "Joueur 1" : "Joueur 2"),
    combatDeckCards,
  );

  const result = await runTransaction(gameRef, (currentGame) => {
    if (!currentGame) return currentGame;

    const updatedGame = {
      ...currentGame,
      players: withPlayerUid(
        withPlayerUid(currentGame.players, currentGame.playerAUser?.uid),
        currentGame.playerBUser?.uid,
      ),
      updatedAt: Date.now(),
    };

    if (isPlayerA) {
      updatedGame.playerA = playerState;
      updatedGame.playerAUser = {
        ...currentGame.playerAUser,
        deckReady: true,
      };
    }

    if (isPlayerB) {
      updatedGame.playerB = playerState;
      updatedGame.playerBUser = {
        ...currentGame.playerBUser,
        deckReady: true,
      };
    }

    const aReady =
      !!updatedGame.playerA && !!updatedGame.playerAUser?.deckReady;
    const bReady =
      !!updatedGame.playerB && !!updatedGame.playerBUser?.deckReady;

    if (aReady && bReady) {
      updatedGame.status = "playing";
      updatedGame.phase = "attack";
      updatedGame.currentTurn =
        Math.random() < 0.5 ? updatedGame.playerA.uid : updatedGame.playerB.uid;
    } else {
      updatedGame.status = "deck_selection";
      updatedGame.phase = "setup";
    }

    return updatedGame;
  });

  if (!result.committed) {
    throw new Error("Impossible de verrouiller le deck");
  }
}

export function subscribeToOpenGames(callback, onError) {
  const gamesRef = ref(rtdb, "openGames");

  return onValue(gamesRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }

    const games = Object.entries(snapshot.val() || {})
      .map(([id, game]) => ({
        id,
        ...game,
        playerAUser: {
          uid: game.createdBy,
          name: game.hostName || "Joueur 1",
        },
      }))
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    callback(games);
  }, (error) => {
    console.error("[subscribeToOpenGames] read failed:", error);
    callback([]);
    if (onError) onError(error);
  });
}

export function subscribeToGame(gameId, callback, onError) {
  const gameRef = ref(rtdb, `games/${gameId}`);

  return onValue(gameRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({ id: gameId, ...snapshot.val() });
    } else {
      callback(null);
    }
  }, (error) => {
    console.error("[subscribeToGame] read failed:", error);
    callback(null);
    if (onError) onError(error);
  });
}

export function subscribeToUserGames(uid, callback, onError) {
  const gamesRef = ref(rtdb, "games");

  return onValue(gamesRef, (snapshot) => {
    if (!snapshot.exists() || !uid) {
      callback([]);
      return;
    }

    const games = Object.entries(snapshot.val() || {})
      .map(([id, game]) => ({ id, ...game }))
      .filter((game) => {
        const isListedPlayer = !!game.players?.[uid];
        const isPlayerA = game.playerAUser?.uid === uid;
        const isPlayerB = game.playerBUser?.uid === uid;

        return game.status === "finished" && (isListedPlayer || isPlayerA || isPlayerB);
      })
      .sort(
        (a, b) =>
          (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0),
      );

    callback(games);
  }, (error) => {
    console.error("[subscribeToUserGames] read failed:", error);
    callback([]);
    if (onError) onError(error);
  });
}

export async function attack(gameId, attackerCardId) {
  const gameRef = ref(rtdb, `games/${gameId}`);

  await runTransaction(gameRef, (game) => {
    if (!game) return game;
    if (game.status !== "playing") return game; // On bloque si la partie n'a pas démarré

    const attackerPlayerKey =
      game.playerA.uid === game.currentTurn ? "playerA" : "playerB";

    const updated = declareAttack(game, attackerPlayerKey, attackerCardId);

    return {
      ...updated,
      updatedAt: Date.now(),
    };
  });
}

export async function defend(gameId, defenderCardId = null) {
  const gameRef = ref(rtdb, `games/${gameId}`);

  await runTransaction(gameRef, (game) => {
    if (!game) return game;
    if (game.status !== "playing") return game;

    const updated = resolveDefense(game, defenderCardId);

    if (updated.status === "finished") {
      return {
        ...updated,
        phase: "end",
        pendingAttack: null,
        updatedAt: Date.now(),
      };
    }

    return {
      ...updated,
      updatedAt: Date.now(),
    };
  });
}

// Utile pour lire l'état brut d'une partie si besoin
export async function getGame(gameId) {
  console.log("[getGame] fetching:", gameId);
  const gameRef = ref(rtdb, `games/${gameId}`);
  const snapshot = await get(gameRef);
  console.log("[getGame] snapshot.exists:", snapshot.exists());
  return snapshot.exists() ? { id: gameId, ...snapshot.val() } : null;
}
