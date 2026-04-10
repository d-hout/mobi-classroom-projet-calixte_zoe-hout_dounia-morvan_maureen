import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Header from "../components/Header";
import Snackbar from "@mui/material/Snackbar";
import DeckCardPicker from "../components/deck/DeckCardPicker";
import DeckHero from "../components/deck/DeckHero";
import DeckLobby from "../components/deck/DeckLobby";
import DeckSummary from "../components/deck/DeckSummary";
import {
  fetchLocalDisneyCharacters,
  searchLocalDisneyCharacters,
} from "../services/localDisneyService";
import { auth } from "../services/firebaseConfig";
import { getUserDeck, saveUserDeck } from "../services/deckService";
import { useNavigate, useParams } from "react-router-dom";
import { lockDeckForGame, subscribeToGame } from "../services/gameService";
import { enrichCardsWithSharedCombatStats } from "../services/combatCardService";

export default function DeckPage() {
  const [cards, setCards] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [game, setGame] = useState(null); // Permet de suivre l'état de la partie
  const [saving, setSaving] = useState(false); // Eviter les doubles clics
  const [collectionError, setCollectionError] = useState("");
  const [feedback, setFeedback] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const pageSize = 48;
  const uid = auth?.currentUser?.uid;

  const navigate = useNavigate();
  const { gameId } = useParams();

  const showFeedback = (message, severity = "error") => {
    setFeedback({
      open: true,
      message,
      severity,
    });
  };

  const handleCloseFeedback = () => {
    setFeedback((current) => ({
      ...current,
      open: false,
    }));
  };

  useEffect(() => {
    if (query && query.trim().length > 0) return;

    let mounted = true;
    setLoading(true);

    fetchLocalDisneyCharacters(page, pageSize)
      .then((list) => enrichCardsWithSharedCombatStats(list))
      .then((list) => {
        if (!mounted) return;
        setCollectionError("");
        setCards((prev) => {
          const existing = new Set(prev.map((c) => String(c.id)));
          const toAdd = (list || []).filter((c) => !existing.has(String(c.id)));
          return page === 1 ? list || [] : [...prev, ...toAdd];
        });
      })
      .catch((err) => {
        console.error("fetchLocalDisneyCharacters", err);
        if (!mounted) return;
        setCollectionError(
          "Impossible de charger les cartes pour le moment. Vérifie la source locale ou réessaie plus tard.",
        );
        setCards([]);
      })
      .finally(() => mounted && setLoading(false));

    // Charger le deck sauvegardé uniquement si on n'est PAS en contexte de partie
    // (gameId présent signifie qu'on veut repartir d'un deck vide pour cette partie).
    async function loadDeck() {
      if (!uid) return;
      if (gameId) return; // <-- empêcher le chargement du deck global quand on est dans une partie
      try {
        const cards = await getUserDeck(uid);
        setSelected(cards);
      } catch (err) {
        console.warn("loadDeck ignoré :", err.message);
      }
    }

    loadDeck();

    return () => {
      mounted = false;
    };
  }, [uid, page, query, gameId]);

  // Réinitialiser le deck à chaque connexion à une partie (gameId présent)
  // sinon charger le deck sauvegardé localement
  useEffect(() => {
    if (!uid) return;

    if (gameId) {
      // À chaque fois qu'on accède à une partie, on part d'un deck vide
      setSelected([]);
      return;
    }

    let mounted = true;
    (async function loadSavedDeck() {
      try {
        const cards = await getUserDeck(uid);
        if (!mounted) return;
        setSelected(cards || []);
      } catch (err) {
        console.warn("loadDeck ignoré :", err.message);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [uid, gameId]);
  // Verifie si les 2 decks sont prêts
  useEffect(() => {
    if (!gameId) return;
    const unsub = subscribeToGame(gameId, setGame);
    return unsub;
  }, [gameId]);

  const handleAdd = (cardId) => {
    const normalizedId = String(cardId);
    if (selected.length >= 10) return;
    if (!selected.includes(normalizedId)) {
      setSelected((s) => [...s, normalizedId]);
    }
  };

  const handleRemove = (cardId) =>
    setSelected((s) => s.filter((id) => id !== String(cardId)));

  const handleSave = async () => {
    if (!uid) {
      showFeedback("Connecte-toi d'abord.");
      return;
    }
    if (!gameId) {
      showFeedback("Aucune partie sélectionnée.");
      return;
    }
    if (selected.length !== 10) {
      showFeedback("Le deck doit contenir exactement 10 cartes.");
      return;
    }

    try {
      setSaving(true);

      await saveUserDeck(uid, selected);
      await lockDeckForGame(gameId, auth.currentUser, selected);

      showFeedback("Deck sauvegardé pour la partie.", "success");
      window.setTimeout(() => {
        navigate(`/game/${gameId}`);
      }, 700);
    } catch (err) {
      console.error("save deck", err);
      showFeedback(err.message || "Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  const loadMore = () => setPage((p) => p + 1);

  const onSearch = async () => {
    const term = query.trim();

    if (!term) {
      setPage(1);
      setCards([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setLoading(true);

    try {
      const found = await searchLocalDisneyCharacters(term);
      setCollectionError("");
      setCards(await enrichCardsWithSharedCombatStats(found));
    } catch (err) {
      console.error("search error", err);
      setCollectionError("La recherche a échoué. Merci de réessayer.");
      setCards([]);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  return (
    <div className="deck-page">
      <Header />
      <div className="deck-page-shell">
        <DeckHero />
        <DeckLobby game={game} gameId={gameId} currentUid={uid} />
        <DeckSummary
          cards={cards}
          selected={selected}
          saving={saving}
          validationMessage={
            selected.length === 10
              ? "Ton deck est complet et prêt à être verrouillé."
              : `Ton deck est incomplet. Ajoute encore ${10 - selected.length} carte${
                  10 - selected.length > 1 ? "s" : ""
                }.`
          }
          onSave={handleSave}
        />
        {collectionError && (
          <p className="page-inline-error" role="alert">
            {collectionError}
          </p>
        )}
        <DeckCardPicker
          cards={cards}
          selected={selected}
          loading={loading}
          isSearching={isSearching}
          emptyText={
            query.trim()
              ? `Aucune carte ne correspond à "${query.trim()}".`
              : "Aucune carte n'est disponible pour le moment."
          }
          query={query}
          onQueryChange={setQuery}
          onSearch={onSearch}
          onReset={() => {
            setQuery("");
            setPage(1);
            setCards([]);
          }}
          onLoadMore={loadMore}
          onAdd={handleAdd}
          onRemove={handleRemove}
        />
      </div>

      <Snackbar
        open={feedback.open}
        autoHideDuration={4000}
        onClose={handleCloseFeedback}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseFeedback}
          severity={feedback.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {feedback.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
