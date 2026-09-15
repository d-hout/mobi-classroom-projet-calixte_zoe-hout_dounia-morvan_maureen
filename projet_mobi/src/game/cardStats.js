export function getCombatStats(cardId) {
  const normalizedId = String(cardId);
  const score = normalizedId
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);

  return {
    atk: (score % 7) + 3,
    def: (score % 6) + 2,
  };
}
