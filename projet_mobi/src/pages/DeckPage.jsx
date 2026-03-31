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
import {
  getDisplayImageUrl,
  handleImageError,
} from "../utils/imageUtils";
import { useNavigate, useParams } from "react-router-dom"; 
import {
  lockDeckForGame,
  subscribeToGame,
} from "../services/gameService"; 

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

  const navigate = useNavigate(); // ✅ AJOUT
  const { gameId } = useParams(); // ✅ AJOUT

  useEffect(() => {
    if (query && query.trim().length > 0) return;

    let mounted = true;
    setLoading(true);

    fetchLocalDisneyCharacters(page, pageSize)
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
      setCards(found);
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
    <>
      <Header />
      <Typography
        variant="h4"
        component="h1"
        marginLeft="10px"
        marginBottom="20px"
      >
        Création du deck
      </Typography>

      {/* ✅ AJOUT : petit état du lobby */}
      {gameId && (
        <div style={{ marginLeft: "10px", marginBottom: "16px" }}>
          <p>ID de la partie : {gameId}</p>
          <p>Mon deck prêt : {myReady ? "Oui" : "Non"}</p>
          <p>Deck adverse prêt : {opponentReady ? "Oui" : "Non"}</p>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <TextField
                size="small"
                placeholder="Rechercher un personnage"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSearch();
                }}
                sx={{ width: 320 }}
              />
              <Button
                size="small"
                variant="outlined"
                onClick={onSearch}
                disabled={isSearching || loading}
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
              >
                Réinitialiser
              </Button>
            </div>

            <div>
              <Typography
                variant="subtitle2"
                component="div"
                sx={{
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  display: "inline-block",
                  mr: 2,
                }}
              >
                Cartes affichées: {cards.length}
              </Typography>
              <Button
                size="small"
                onClick={loadMore}
                disabled={loading || !!query}
              >
                Charger plus
              </Button>
            </div>
          </div>

          {loading ? (
            <p>Chargement...</p>
          ) : (
            <Grid container>
              <div style={{ display: "flex", flexWrap: "wrap" }}>
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

        <Paper elevation={2} sx={{ p: 2 }}>
          <Typography
            variant="subtitle2"
            component="div"
            sx={{ fontSize: "0.95rem", mb: 1 }}
          >
            Résumé
          </Typography>

          <p>Cartes sélectionnées: {selected.length} / 10</p>

          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {selected.map((id) => {
              const c = cards.find((x) => String(x.id) === String(id));
              return c ? (
                <div key={id} style={{ width: 80, margin: 4 }}>
                  <img
                    src={getDisplayImageUrl(c.image)}
                    alt={c.name}
                    onError={handleImageError}
                    style={{ width: "100%", height: 60, objectFit: "cover" }}
                  />
                </div>
              ) : (
                <div
                  key={id}
                  style={{
                    width: 80,
                    height: 60,
                    margin: 4,
                    background: "#f3f3f3",
                  }}
                />
              );
            })}
          </div>

          <div style={{ marginTop: 12 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              disabled={selected.length !== 10 || saving} // ✅ MODIF
            >
              {saving ? "Sauvegarde..." : "Sauvegarder le deck"}
            </Button>
          </div>
        </Paper>
      </div>
    </>
  );
}
