import { get, ref, runTransaction } from "firebase/database";
import cards from "../data/disneyCards.json";
import { getCombatStats } from "../game/cardStats";
import { rtdb } from "./firebaseConfig";

const SHARED_COMBAT_CARDS_PATH = "shared/combatCards";

function toCombatCard(card) {
  const cardId = String(card.id);
  const { atk, def } = getCombatStats(cardId);

  return {
    id: cardId,
    name: card.name,
    image: card.image,
    atk,
    def,
  };
}

function buildSharedCombatCardsCatalog() {
  return (cards || []).reduce((catalog, card) => {
    const combatCard = toCombatCard(card);
    catalog[combatCard.id] = combatCard;
    return catalog;
  }, {});
}

export async function getSharedCombatCardsCatalog() {
  const catalogRef = ref(rtdb, SHARED_COMBAT_CARDS_PATH);
  const snapshot = await get(catalogRef);

  if (snapshot.exists()) {
    return snapshot.val();
  }

  const initialCatalog = buildSharedCombatCardsCatalog();
  const result = await runTransaction(catalogRef, (currentCatalog) => {
    return currentCatalog || initialCatalog;
  });

  return result.snapshot?.val() || initialCatalog;
}

export async function getSharedCombatCardsList() {
  const catalog = await getSharedCombatCardsCatalog();
  return Object.values(catalog || {});
}

export async function enrichCardsWithSharedCombatStats(rawCards) {
  const catalog = await getSharedCombatCardsCatalog();

  return (rawCards || []).map((card) => {
    const sharedCard = catalog?.[String(card.id)];
    return sharedCard ? { ...card, atk: sharedCard.atk, def: sharedCard.def } : card;
  });
}
