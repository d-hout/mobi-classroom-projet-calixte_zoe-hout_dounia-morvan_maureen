import { ref, set, get, onValue, runTransaction } from "firebase/database"; // arties en Realtime DB
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

// Crée une partie vide
export async function createGame(hostUser) {
  const gameId = crypto.randomUUID();
  const gameRef = ref(rtdb, `games/${gameId}`);
  console.log("[createGame] creating gameId=", gameId, "user=", hostUser?.uid);
  await set(gameRef, {
    status: "deck_selection", // La partie commence avec la sélection du deck
    createdBy: hostUser.uid,
    playerAUser: {
      uid: hostUser.uid,
      name: hostUser.displayName || "Joueur 1",
      deckReady: false,
    },
    playerBUser: null,
    playerA: null,
    playerB: null,
    currentTurn: null,
    phase: "setup",
    pendingAttack: null,
    winner: null,
    createdAt: Date.now(),
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
    } catch (e) {
      // non une URL, continuer
    }
    // Chercher un pattern UUID simple
    const uuidMatch = cleaned.match(/[0-9a-fA-F\-]{8,36}/);
    if (uuidMatch) return uuidMatch[0];
    // Sinon prendre dernier segment après '/'
    const parts = cleaned.split("/").filter(Boolean);
    return parts.length ? parts[parts.length - 1] : cleaned;
  };

  const normalizedId = extractGameId(raw) || raw;
  console.log(
    `[gameService] joinGame using normalizedId='${normalizedId}' (raw='${raw}')`,
  );
  const gameRef = ref(rtdb, `games/${String(normalizedId).trim()}`);

  // pré‑check
  try {
    const snap = await get(gameRef);
    console.log(
      "[gameService] pre-check snap.exists:",
      snap.exists(),
      "for id:",
      normalizedId,
    );
    if (!snap.exists()) {
      console.error(
        "[gameService] joinGame: partie introuvable (pré-check) id=",
        normalizedId,
        "raw=",
        raw,
      );
      throw new Error("Partie introuvable (vérifie l'ID saisi)");
    }
  } catch (e) {
    console.error("[gameService] joinGame pre-check failed:", e);
    throw e;
  }

  // log avant transaction
  console.log(
    "[gameService] runTransaction starting for",
    gameRef._path?.toString?.() || gameId,
  );

  try {
    const result = await runTransaction(gameRef, (currentGame) => {
      console.log(
        "[gameService] transaction callback currentGame:",
        currentGame ? "OK" : currentGame,
      );
      if (!currentGame) {
        // currentGame null = transaction couldn't read the node (permissions/offline) or race
        // retourne currentGame pour aborter proprement la transaction côté client;
        // on analysera le résultat après runTransaction pour choisir le message d'erreur.
        console.warn(
          "[gameService] transaction read returned null — aborting updateFunction",
        );
        return currentGame;
      }
      if (currentGame.playerBUser?.uid) {
        // déjà complet, on abort
        console.warn("[gameService] transaction: partie déjà pleine");
        return currentGame;
      }

      return {
        ...currentGame,
        playerBUser: {
          uid: guestUser.uid,
          name: guestUser.displayName || guestUser.email || "Joueur 2",
          deckReady: false,
        },
        updatedAt: Date.now(),
      };
    });

    console.log("[gameService] runTransaction result:", {
      committed: result?.committed,
      snapshotExists: !!result?.snapshot?.exists?.(),
      snapshotVal: result?.snapshot?.exists?.() ? result.snapshot.val() : null,
    });

    if (!result.committed) {
      // analyser l'état renvoyé par le serveur
      const snap = result.snapshot;
      const exists = snap?.exists?.() || false;
      if (!exists) {
        throw new Error("Partie introuvable");
      }
      const val = snap.val();
      if (val?.playerBUser?.uid) {
        throw new Error("La partie est déjà pleine");
      }
      throw new Error(
        "Impossible de rejoindre la partie (transaction non commise)",
      );
    }
    return;
  } catch (e) {
    console.error("[gameService] joinGame transaction failed:", e);
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

  const combatDeckCards = await buildDeckCardsFromIds(
    selectedDeckIds.map(String),
  );

  const playerState = createInitialPlayerState(
    uid,
    user.displayName || (isPlayerA ? "Joueur 1" : "Joueur 2"),
    combatDeckCards,
  );

  const result = await runTransaction(gameRef, (currentGame) => {
    if (!currentGame) return currentGame;

    const updatedGame = {
      ...currentGame,
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

export function subscribeToOpenGames(callback) {
  const gamesRef = ref(rtdb, "games");

  return onValue(gamesRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }

    const games = Object.entries(snapshot.val() || {})
      .map(([id, game]) => ({ id, ...game }))
      .filter(
        (game) => game.status === "deck_selection" && !game.playerBUser?.uid,
      )
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    callback(games);
  });
}

export function subscribeToGame(gameId, callback) {
  const gameRef = ref(rtdb, `games/${gameId}`);

  return onValue(gameRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({ id: gameId, ...snapshot.val() });
    } else {
      callback(null);
    }
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
