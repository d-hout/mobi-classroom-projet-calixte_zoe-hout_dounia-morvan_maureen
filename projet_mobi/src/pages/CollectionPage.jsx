import { useEffect, useMemo, useState } from "react";
import Header from "../components/Header";
import CollectionHero from "../components/collection/CollectionHero";
import CardGrid from "../components/cards/CardGrid";
import CardSearchToolbar from "../components/cards/CardSearchToolbar";
import CardTile from "../components/cards/CardTile";
import {
  fetchLocalDisneyCharacters,
  searchLocalDisneyCharacters,
} from "../services/localDisneyService";
import { enrichCardsWithSharedCombatStats } from "../services/combatCardService";
import "../App.css";

export default function CollectionPage() {
  const [cards, setCards] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [collectionError, setCollectionError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadCollection() {
      try {
        setLoading(true);
        const list = await fetchLocalDisneyCharacters(1, 240);
        const enrichedCards = await enrichCardsWithSharedCombatStats(list);
        if (mounted) {
          setCollectionError("");
          setCards(enrichedCards);
        }
      } catch (error) {
        console.error("load collection failed:", error);
        if (mounted) {
          setCollectionError(
            "Impossible de charger la collection pour le moment.",
          );
          setCards([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadCollection();

    return () => {
      mounted = false;
    };
  }, []);

  const displayedCards = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return cards;

    return cards.filter((card) => {
      const fields = [
        card.name,
        ...(card.films || []),
        ...(card.shortFilms || []),
        ...(card.tvShows || []),
      ];

      return fields.some((field) =>
        String(field).toLowerCase().includes(normalizedQuery),
      );
    });
  }, [cards, query]);

  const handleSearch = async () => {
    const term = query.trim();

    if (!term) {
      const list = await fetchLocalDisneyCharacters(1, 240);
      setCollectionError("");
      setCards(await enrichCardsWithSharedCombatStats(list));
      return;
    }

    try {
      setLoading(true);
      const results = await searchLocalDisneyCharacters(term);
      setCollectionError("");
      setCards(await enrichCardsWithSharedCombatStats(results));
    } catch (error) {
      console.error("collection search failed:", error);
      setCollectionError("La recherche n'a pas pu aboutir.");
      setCards([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setQuery("");

    try {
      setLoading(true);
      const list = await fetchLocalDisneyCharacters(1, 240);
      setCollectionError("");
      setCards(await enrichCardsWithSharedCombatStats(list));
    } catch (error) {
      console.error("collection reset failed:", error);
      setCollectionError("Impossible de recharger la collection.");
      setCards([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="collection-page">
      <Header />

      <main className="collection-shell">
        <CollectionHero />
        {collectionError && (
          <p className="page-inline-error" role="alert">
            {collectionError}
          </p>
        )}
        <CardSearchToolbar
          query={query}
          onQueryChange={setQuery}
          onSearch={handleSearch}
          onReset={handleReset}
          loading={loading}
          className="collection-toolbar"
          searchClassName="collection-search"
          countLabel={`${displayedCards.length} carte${
            displayedCards.length > 1 ? "s" : ""
          }`}
        />
        <CardGrid
          cards={displayedCards}
          loading={loading}
          className="collection-grid"
          loadingClassName="collection-loading"
          emptyText={
            query.trim()
              ? `Aucun résultat pour "${query.trim()}".`
              : "Aucune carte n'est disponible dans la collection."
          }
          renderCard={(card) => (
            <CardTile key={card.id} card={card} showSource />
          )}
        />
      </main>
    </div>
  );
}
