import {
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  createInitialPlayerState,
  declareAttack,
  resolveDefense,
} from '../game/gameEngine';
import { getUserDeck } from './gameService';
import { getAllCards } from './cardService';

export async function createGame(hostUser) {
  const deckIds = await getUserDeck(hostUser.uid);
  const allCards = await getAllCards();

  const hostDeckCards = allCards.filter((c) => deckIds.includes(c.id));

  const gameRef = doc(db, 'games', crypto.randomUUID());

  const playerA = createInitialPlayerState(
    hostUser.uid,
    hostUser.displayName,
    hostDeckCards
  );

  await setDoc(gameRef, {
    status: 'waiting',
    createdBy: hostUser.uid,
    playerA,
    playerB: null,
    currentTurn: hostUser.uid,
    phase: 'attack',
    pendingAttack: null,
    winner: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return gameRef.id;
}

export async function joinGame(gameId, guestUser) {
  const gameRef = doc(db, 'games', gameId);

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(gameRef);
    if (!snap.exists()) throw new Error('Partie introuvable');

    const game = snap.data();
    if (game.playerB) throw new Error('La partie est déjà pleine');

    const deckIds = await getUserDeck(guestUser.uid);
    const allCards = await getAllCards();
    const guestDeckCards = allCards.filter((c) => deckIds.includes(c.id));

    const playerB = createInitialPlayerState(
      guestUser.uid,
      guestUser.displayName,
      guestDeckCards
    );

    transaction.update(gameRef, {
      playerB,
      status: 'playing',
      updatedAt: serverTimestamp(),
    });
  });
}

export function subscribeToGame(gameId, callback) {
  return onSnapshot(doc(db, 'games', gameId), (snap) => {
    if (snap.exists()) {
      callback({ id: snap.id, ...snap.data() });
    }
  });
}

export async function attack(gameId, attackerCardId) {
  const ref = doc(db, 'games', gameId);

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    const game = snap.data();

    const attackerPlayerKey =
      game.playerA.uid === game.currentTurn ? 'playerA' : 'playerB';

    const updated = declareAttack(game, attackerPlayerKey, attackerCardId);

    transaction.update(ref, {
      ...updated,
      updatedAt: serverTimestamp(),
    });
  });
}

export async function defend(gameId, defenderCardId = null) {
  const ref = doc(db, 'games', gameId);

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    const game = snap.data();

    const updated = resolveDefense(game, defenderCardId);

    transaction.update(ref, {
      ...updated,
      updatedAt: serverTimestamp(),
    });
  });
}