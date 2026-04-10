import Button from "@mui/material/Button";
import CardGrid from "../cards/CardGrid";
import CardSearchToolbar from "../cards/CardSearchToolbar";
import CardTile from "../cards/CardTile";

export default function DeckCardPicker({
  cards,
  selected,
  loading,
  isSearching,
  emptyText,
  query,
  onQueryChange,
  onSearch,
  onReset,
  onLoadMore,
  onAdd,
  onRemove,
}) {
  return (
    <div className="deck-layout">
      <div className="deck-main-panel">
        <CardSearchToolbar
          query={query}
          onQueryChange={onQueryChange}
          onSearch={onSearch}
          onReset={onReset}
          loading={isSearching || loading}
          placeholder="Rechercher un personnage"
          className="deck-toolbar"
          searchClassName="deck-search"
          countLabel={`Cartes affichées: ${cards.length}`}
          extraAction={
            <Button
              size="small"
              onClick={onLoadMore}
              disabled={loading || !!query}
              className="deck-toolbar-btn"
            >
              Charger plus
            </Button>
          }
        />

        <CardGrid
          cards={cards}
          loading={loading}
          className="cards-wrap"
          loadingClassName="deck-loading"
          emptyText={emptyText}
          renderCard={(card) => (
            <CardTile
              key={card.id}
              card={card}
              selected={selected.includes(String(card.id))}
              onAdd={onAdd}
              onRemove={onRemove}
              disabled={
                selected.length >= 10 && !selected.includes(String(card.id))
              }
            />
          )}
        />
      </div>
    </div>
  );
}
