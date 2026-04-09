export function getInitial(name) {
  if (!name) return "?";
  return name.trim().charAt(0).toUpperCase();
}

export function deckCountLabel(player) {
  const count = Array.isArray(player?.deck) ? player.deck.length : 0;
  return `Deck restant : ${count} carte${count > 1 ? "s" : ""}`;
}
