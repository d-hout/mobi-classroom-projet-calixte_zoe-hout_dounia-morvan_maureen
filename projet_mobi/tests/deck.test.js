import { describe, it, expect } from "vitest";

// Fonctions utilitaires sur le deck
// On simule ici ce que tu aurais dans ton service ou utilitaire deck
function createDeck(cards) {
  // deck = tableau de cartes uniques (au maximum 10)
  return cards.slice(0, 10);
}

function drawCards(deck, count) {
  // pioche `count` cartes du deck
  return deck.splice(0, count);
}

describe("Deck", () => {
  it("crée un deck de 10 cartes maximum", () => {
    const cards = Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      name: `Carte ${i + 1}`,
    }));
    const deck = createDeck(cards);

    expect(deck.length).toBe(10); // doit limiter à 10 cartes
    expect(new Set(deck.map((c) => c.id)).size).toBe(10); // toutes les cartes uniques
  });

  it("pioche des cartes du deck", () => {
    const cards = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      name: `Carte ${i + 1}`,
    }));
    const deck = createDeck(cards);

    const drawn = drawCards(deck, 3);

    expect(drawn.length).toBe(3);
    expect(deck.length).toBe(7); // 10 - 3
    expect(drawn.map((c) => c.id)).toEqual([1, 2, 3]); // pioche du début
  });

  it("retourne un deck vide si aucune carte", () => {
    const deck = createDeck([]);
    expect(deck.length).toBe(0);

    const drawn = drawCards(deck, 3);
    expect(drawn.length).toBe(0);
  });
});
