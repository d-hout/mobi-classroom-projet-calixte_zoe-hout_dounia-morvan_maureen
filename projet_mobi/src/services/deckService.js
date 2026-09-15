import { ref, get, set } from "firebase/database";
import { rtdb } from "./firebaseConfig";

export async function getUserDeck(uid) {
  const deckRef = ref(rtdb, `userDecks/${uid}`);
  const snapshot = await get(deckRef);

  if (!snapshot.exists()) return [];

  const data = snapshot.val();
  return Array.isArray(data.cards) ? data.cards.map(String) : [];
}

export async function saveUserDeck(uid, cards) {
  const deckRef = ref(rtdb, `userDecks/${uid}`);

  await set(deckRef, {
    cards: cards.map(String),
    updatedAt: Date.now(),
  });
}