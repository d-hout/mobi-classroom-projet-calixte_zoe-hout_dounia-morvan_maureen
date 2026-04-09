import CardTile from "./CardTile";

export default function CardGrid({
  cards,
  loading,
  className = "cards-grid",
  loadingClassName = "cards-loading",
  emptyText = "Aucune carte trouvée.",
  renderCard,
}) {
  if (loading) {
    return <p className={loadingClassName}>Chargement...</p>;
  }

  if (!cards.length) {
    return <p className={loadingClassName}>{emptyText}</p>;
  }

  return (
    <section className={className}>
      {cards.map((card) =>
        renderCard ? renderCard(card) : <CardTile key={card.id} card={card} />,
      )}
    </section>
  );
}
