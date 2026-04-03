import React, { useEffect, useState } from "react";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Header from "../components/Header";
import Cartes from "../components/cartes";
import {
  fetchLocalDisneyCharacters,
  searchLocalDisneyCharacters,
} from "../services/localDisneyService";
import { auth } from "../services/firebaseConfig";
import { getUserDeck, saveUserDeck } from "../services/deckService";
import { getDisplayImageUrl, handleImageError } from "../utils/imageUtils";
import { useNavigate, useParams } from "react-router-dom";
import { lockDeckForGame, subscribeToGame } from "../services/gameService";
import { enrichCardsWithSharedCombatStats } from "../services/combatCardService";

const USERS_COLLECTION = "utilisateurs";

export default function DeckPage() {
  const [cards, setCards] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [game, setGame] = useState(null); // ✅ AJOUT : pour suivre l'état de la partie
  const [saving, setSaving] = useState(false); // ✅ AJOUT : éviter les doubles clics
  const pageSize = 48;
  const uid = auth?.currentUser?.uid;

  const navigate = useNavigate(); // ✅ correct : navigate est défini ici
  const { gameId } = useParams(); // ✅ AJOUT

  useEffect(() => {
    if (query && query.trim().length > 0) return;

    let mounted = true;
    setLoading(true);

    fetchLocalDisneyCharacters(page, pageSize)
      .then((list) => enrichCardsWithSharedCombatStats(list))
      .then((list) => {
        if (!mounted) return;
        setCards((prev) => {
          const existing = new Set(prev.map((c) => String(c.id)));
          const toAdd = (list || []).filter((c) => !existing.has(String(c.id)));
          return page === 1 ? list || [] : [...prev, ...toAdd];
        });
      })
      .catch((err) => console.error("fetchLocalDisneyCharacters", err))
      .finally(() => mounted && setLoading(false));

    async function loadDeck() {
      if (!uid) return;
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
  }, [uid, page, query]);

  // ✅ AJOUT : écoute la partie pour savoir si les 2 decks sont prêts
  useEffect(() => {
    if (!gameId) return;
    const unsub = subscribeToGame(gameId, setGame);
    return unsub;
  }, [gameId]);

  const handleAdd = (cardId) => {
    const normalizedId = String(cardId); // ✅ MODIF
    if (selected.length >= 10) return;
    if (!selected.includes(normalizedId)) {
      setSelected((s) => [...s, normalizedId]);
    }
  };

  const handleRemove = (cardId) =>
    setSelected((s) => s.filter((id) => id !== String(cardId))); // ✅ MODIF

  const handleSave = async () => {
    if (!uid) return alert("Connecte-toi d'abord.");
    if (!gameId) return alert("Aucune partie sélectionnée.");
    if (selected.length !== 10) {
      return alert("Le deck doit contenir exactement 10 cartes.");
    }

    try {
      setSaving(true);

      await saveUserDeck(uid, selected);
      await lockDeckForGame(gameId, auth.currentUser, selected);

      alert("Deck sauvegardé pour la partie.");
      navigate(`/game/${gameId}`);
    } catch (err) {
      console.error("save deck", err);
      alert(err.message || "Erreur lors de la sauvegarde.");
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
      setCards(await enrichCardsWithSharedCombatStats(found));
    } catch (err) {
      console.error("search error", err);
      setCards([]);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  // ✅ AJOUT : infos lobby simples
  const myReady =
    game?.playerAUser?.uid === uid
      ? game?.playerAUser?.deckReady
      : game?.playerBUser?.uid === uid
        ? game?.playerBUser?.deckReady
        : false;

  const opponentReady =
    game?.playerAUser?.uid === uid
      ? game?.playerBUser?.deckReady
      : game?.playerBUser?.uid === uid
        ? game?.playerAUser?.deckReady
        : false;

  return (
    <div className="deck-page">
      <Header />
      <div className="deck-page-shell">
        <div className="deck-page-hero">
          <p className="page-kicker">Preparation du duel</p>
          <Typography variant="h4" component="h1" className="deck-page-title">
            Creation du deck
          </Typography>
          <p className="page-copy deck-page-copy">
            Selectionne 10 cartes pour construire un deck equilibre avant le
            debut du combat.
          </p>
        </div>

        {gameId && (
          <section className="deck-lobby-card">
            <div className="deck-lobby-head">
              <p>
                ID de la partie : <strong>{gameId}</strong>
              </p>
            </div>

            <div className="deck-lobby-grid">
              <div className="deck-lobby-player">
                <div className="deck-lobby-name">
                  {game?.playerAUser?.name || "Joueur A"}{" "}
                  {game?.playerAUser?.uid === uid ? "(Moi)" : ""}
                </div>
                <div className="deck-lobby-ready">
                  Pret : {game?.playerAUser?.deckReady ? "Oui" : "Non"}
                </div>
              </div>

              <div className="deck-lobby-player">
                <div className="deck-lobby-name">
                  {game?.playerBUser?.name || "Joueur B"}{" "}
                  {game?.playerBUser?.uid === uid ? "(Moi)" : ""}
                </div>
                <div className="deck-lobby-ready">
                  Pret : {game?.playerBUser?.deckReady ? "Oui" : "Non"}
                </div>
              </div>
            </div>
          </section>
        )}

        <Paper
          elevation={2}
          className="deck-summary-panel deck-summary-panel--top"
          sx={{ p: 2 }}
        >
          <Typography
            variant="subtitle2"
            component="div"
            className="deck-summary-title"
          >
            Résumé
          </Typography>

          <p className="deck-summary-count">
            Cartes selectionnees: {selected.length} / 10
          </p>

          <div className="summary-thumbs">
            {selected.map((id) => {
              const c = cards.find((x) => String(x.id) === String(id));
              return c ? (
                <div key={id} className="summary-thumb">
                  <img
                    src={getDisplayImageUrl(c.image)}
                    alt={c.name}
                    onError={handleImageError}
                    className="summary-thumb-image"
                  />
                </div>
              ) : (
                <div key={id} className="summary-thumb summary-thumb--empty" />
              );
            })}
          </div>

          <div className="deck-summary-actions">
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              disabled={selected.length !== 10 || saving}
              className="bouton-blue"
            >
              {saving ? "Sauvegarde..." : "Sauvegarder le deck"}
            </Button>
          </div>
        </Paper>

        <div className="deck-layout">
          <div className="deck-main-panel">
            <div className="deck-toolbar">
            <div className="deck-toolbar-left">
              <TextField
                size="small"
                placeholder="Rechercher un personnage"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSearch();
                }}
                sx={{ width: 320 }}
                className="deck-search"
              />
              <Button
                size="small"
                variant="outlined"
                onClick={onSearch}
                disabled={isSearching || loading}
                className="deck-toolbar-btn"
              >
                Rechercher
              </Button>
              <Button
                size="small"
                onClick={() => {
                  setQuery("");
                  setPage(1);
                  setCards([]);
                }}
                disabled={loading}
                sx={{ ml: 1 }}
                className="deck-toolbar-btn deck-toolbar-btn--plain"
              >
                Réinitialiser
              </Button>
            </div>

            <div className="deck-toolbar-right">
              <Typography
                variant="subtitle2"
                component="div"
                className="deck-counter"
              >
                Cartes affichées: {cards.length}
              </Typography>
              <Button
                size="small"
                onClick={loadMore}
                disabled={loading || !!query}
                className="deck-toolbar-btn"
              >
                Charger plus
              </Button>
            </div>
          </div>

          {loading ? (
            <p className="deck-loading">Chargement...</p>
          ) : (
            <Grid container>
              <div className="cards-wrap">
                {cards.map((c) => (
                  <Cartes
                    key={c.id}
                    card={c}
                    onAdd={handleAdd}
                    onRemove={handleRemove}
                    inDeck={selected.includes(String(c.id))}
                    disabled={
                      selected.length >= 10 && !selected.includes(String(c.id))
                    } // ✅ MODIF
                  />
                ))}
              </div>
            </Grid>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
