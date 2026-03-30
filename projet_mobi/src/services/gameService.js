import { doc, getDoc } from "firebase/firestore"; // ✅ GARDE : deck perso en Firestore
import {
  ref,
  set,
  get,
  onValue,
  runTransaction,
} from "firebase/database"; // ✅ MODIF : parties en Realtime DB
import { db, rtdb } from "./firebaseConfig";
import {
  createInitialPlayerState,
  declareAttack,
  resolveDefense,
} from "../game/gameEngine";
import { fetchDisneyCharacters } from "./disneyService";

let allCardsCachePromise = null;

async function getUserDeck(uid) {
  const refDeck = doc(db, "users", uid, "deck", "main");
  const snap = await getDoc(refDeck);
  if (!snap.exists()) return [];
  const data = snap.data();
  return Array.isArray(data.cards) ? data.cards.map(String) : [];
}

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
          fetchDisneyCharacters(index + 1, 50)
        )
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
  const gameId = crypto.randomUUID(); // ✅ AJOUT : id de partie
  const gameRef = ref(rtdb, `games/${gameId}`);

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
    updatedAt: Date.now(),
  });

  return gameId;
}

// ✅ MODIF : rejoint une partie sans encore initialiser le deck combat
export async function joinGame(gameId, guestUser) {
  const gameRef = ref(rtdb, `games/${gameId}`);

  const result = await runTransaction(gameRef, (game) => {
    if (!game) {
      throw new Error("Partie introuvable");
    }

    if (game.playerBUser?.uid) {
      throw new Error("La partie est déjà pleine");
    }

    return {
      ...game,
      playerBUser: {
        uid: guestUser.uid,
        name: guestUser.displayName || "Joueur 2",
        deckReady: false, // ✅ AJOUT
      },
      updatedAt: Date.now(),
    };
  });

  if (!result.committed) {
    throw new Error("Impossible de rejoindre la partie");
  }
}

// ✅ AJOUT : quand un joueur valide son deck sur DeckPage
export async function lockDeckForGame(gameId, user, selectedDeckIds) {
  const gameRef = ref(rtdb, `games/${gameId}`);

  const result = await runTransaction(gameRef, async (game) => {
    if (!game) {
      throw new Error("Partie introuvable");
    }

    const uid = user.uid;
    const isPlayerA = game.playerAUser?.uid === uid;
    const isPlayerB = game.playerBUser?.uid === uid;

    if (!isPlayerA && !isPlayerB) {
      throw new Error("Tu ne fais pas partie de cette partie");
    }

    // ✅ AJOUT : construit les vraies cartes de combat à partir du deck choisi
    const combatDeckCards = await buildDeckCardsFromIds(
      selectedDeckIds.map(String)
    );

    const playerState = createInitialPlayerState(
      uid,
      user.displayName || (isPlayerA ? "Joueur 1" : "Joueur 2"),
      combatDeckCards
    );

    const updatedGame = {
      ...game,
      updatedAt: Date.now(),
    };

    if (isPlayerA) {
      updatedGame.playerA = playerState; // ✅ AJOUT
      updatedGame.playerAUser = {
        ...game.playerAUser,
        deckReady: true, // ✅ AJOUT
      };
    }

    if (isPlayerB) {
      updatedGame.playerB = playerState; // ✅ AJOUT
      updatedGame.playerBUser = {
        ...game.playerBUser,
        deckReady: true, // ✅ AJOUT
      };
    }

    // ✅ AJOUT : si les 2 decks sont prêts, on démarre la partie
    const aReady =
      (isPlayerA ? true : game.playerAUser?.deckReady) && !!updatedGame.playerA;
    const bReady =
      (isPlayerB ? true : game.playerBUser?.deckReady) && !!updatedGame.playerB;

    if (aReady && bReady) {
      updatedGame.status = "playing"; // ✅ AJOUT
      updatedGame.phase = "attack"; // ✅ AJOUT
      updatedGame.currentTurn = updatedGame.playerA.uid; // ✅ AJOUT : playerA commence
    } else {
      updatedGame.status = "deck_selection"; // ✅ AJOUT
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
  const gameRef = ref(rtdb, `games/${gameId}`);
  const snapshot = await get(gameRef);
  return snapshot.exists() ? { id: gameId, ...snapshot.val() } : null;
}