import { ref, set, get, onValue, runTransaction } from "firebase/database"; // arties en Realtime DB
import { rtdb } from "./firebaseConfig";
import {
  createInitialPlayerState,
  declareAttack,
  resolveDefense,
} from "../game/gameEngine";
import { fetchDisneyCharacters } from "./disneyService";

let allCardsCachePromise = null;

function toCombatCard(card) {
  const cardId = String(card.id);
  const score = cardId
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);

  return {
    id: cardId,
    name: card.name,
    image: card.image,
    atk: (score % 7) + 3,
    def: (score % 6) + 2,
  };
}

async function getAllCards() {
  if (!allCardsCachePromise) {
    allCardsCachePromise = (async () => {
      const pages = await Promise.all(
        Array.from({ length: 6 }, (_, index) =>
          fetchDisneyCharacters(index + 1, 50),
        ),
      );
      return pages.flat().map(toCombatCard);
    })();
  }
  return allCardsCachePromise;
}

// ✅ AJOUT : transforme une liste d'ids en vraies cartes de combat
async function buildDeckCardsFromIds(deckIds) {
  const allCards = await getAllCards();
  return allCards.filter((c) => deckIds.includes(String(c.id)));
}

// ✅ MODIF : crée une partie vide
export async function createGame(hostUser) {
  const gameId = crypto.randomUUID();
  const gameRef = ref(rtdb, `games/${gameId}`);
  console.log("[createGame] creating gameId=", gameId, "user=", hostUser?.uid);
  await set(gameRef, {
    status: "deck_selection", // ✅ MODIF : la partie commence en sélection de deck
    createdBy: hostUser.uid,
    playerAUser: {
      uid: hostUser.uid,
      name: hostUser.displayName || "Joueur 1",
      deckReady: false, // ✅ AJOUT
    },
    playerBUser: null, // ✅ AJOUT : le joueur 2 n'est pas encore là
    playerA: null, // ✅ AJOUT : état de combat non initialisé
    playerB: null, // ✅ AJOUT
    currentTurn: null, // ✅ AJOUT
    phase: "setup", // ✅ MODIF
    pendingAttack: null,
    winner: null,
    createdAt: Date.now(),
  });
  console.log("[createGame] created OK:", gameId);
  return gameId;
}

// ✅ MODIF : rejoint une partie sans encore initialiser le deck combat
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

// ✅ AJOUT : quand un joueur valide son deck sur DeckPage
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
    if (game.status !== "playing") return game; // ✅ AJOUT : on bloque si la partie n'a pas démarré

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
    if (game.status !== "playing") return game; // ✅ AJOUT

    const updated = resolveDefense(game, defenderCardId);

    return {
      ...updated,
      updatedAt: Date.now(),
    };
  });
}

// ✅ AJOUT : utile pour lire l'état brut d'une partie si besoin
export async function getGame(gameId) {
  console.log("[getGame] fetching:", gameId);
  const gameRef = ref(rtdb, `games/${gameId}`);
  const snapshot = await get(gameRef);
  console.log("[getGame] snapshot.exists:", snapshot.exists());
  return snapshot.exists() ? { id: gameId, ...snapshot.val() } : null;
}
