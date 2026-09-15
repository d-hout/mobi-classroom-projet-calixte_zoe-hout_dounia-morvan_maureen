import cards from "../data/disneyCards.json";

export async function fetchLocalDisneyCharacters(page = 1, pageSize = 48) {
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return cards.slice(start, end);
}

export async function searchLocalDisneyCharacters(term) {
  const q = term.trim().toLowerCase();

  if (!q) return cards;

  return cards.filter((card) => card.name.toLowerCase().includes(q));
}