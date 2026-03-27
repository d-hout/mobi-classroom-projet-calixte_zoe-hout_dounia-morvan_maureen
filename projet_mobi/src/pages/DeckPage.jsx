import React, { useEffect, useState } from "react";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Header from "../components/Header";
import Cartes from "../components/cartes";
import { fetchDisneyCharacters } from "../services/disneyService";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../services/firebaseConfig";

export default function DeckPage() {
  const [cards, setCards] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const pageSize = 48;
  const uid = auth?.currentUser?.uid;

  useEffect(() => {
    if (query && query.trim().length > 0) return; // si une recherche est active, on n'appelle pas la pagination normale
    let mounted = true;
    setLoading(true);
    fetchDisneyCharacters(page, pageSize)
      .then((list) => {
        if (!mounted) return;
        setCards((prev) => {
          const existing = new Set(prev.map((c) => String(c.id)));
          const toAdd = (list || []).filter((c) => !existing.has(String(c.id)));
          return page === 1 ? list || [] : [...prev, ...toAdd];
        });
      })
      .catch((err) => console.error("fetchDisneyCharacters", err))
      .finally(() => mounted && setLoading(false));

    async function loadDeck() {
      if (!uid) return;
      try {
        const ref = doc(db, "users", uid, "deck", "main");
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data.cards)) setSelected(data.cards.map(String));
        }
      } catch (err) {
        console.error("loadDeck", err);
      }
    }
    loadDeck();

    return () => {
      mounted = false;
    };
  }, [uid, page, query]);

  const handleAdd = (cardId) => {
    if (selected.length >= 10) return;
    if (!selected.includes(cardId)) setSelected((s) => [...s, cardId]);
  };

  const handleRemove = (cardId) =>
    setSelected((s) => s.filter((id) => id !== cardId));

  const handleSave = async () => {
    if (!uid) return alert("Connecte-toi d'abord.");
    if (selected.length !== 10)
      return alert("Le deck doit contenir exactement 10 cartes.");
    try {
      const ref = doc(db, "users", uid, "deck", "main");
      await setDoc(
        ref,
        { cards: selected, updatedAt: serverTimestamp() },
        { merge: true },
      );
      alert("Deck sauvegardé.");
    } catch (err) {
      console.error("save deck", err);
      alert("Erreur lors de la sauvegarde.");
    }
  };

  const loadMore = () => setPage((p) => p + 1);

  // Recherche paginée simple : parcourt jusqu'à 10 pages max
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
      const found = await findByName(term, pageSize);
      setCards(
        found.map((c) => ({
          id: c._id ?? c.id,
          name: c.name,
          image: c.imageUrl || c.image,
        })),
      );
    } catch (err) {
      console.error("search error", err);
      setCards([]);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

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
                    disabled={selected.length >= 10}
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
                    src={c.image}
                    alt={c.name}
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
              disabled={selected.length !== 10}
            >
              Sauvegarder le deck
            </Button>
          </div>
        </Paper>
      </div>
    </>
  );
}

async function findByName(term, pageSize = 50) {
  const allFound = [];
  let p = 1;
  while (true) {
    const res = await fetch(
      `https://api.disneyapi.dev/character?page=${p}&pageSize=${pageSize}`,
    );
    if (!res.ok) break;
    const json = await res.json();
    const matches = (json.data || []).filter(
      (c) => c.name && c.name.toLowerCase().includes(term.toLowerCase()),
    );
    if (matches.length) allFound.push(...matches);
    if (!json.info || (json.data || []).length < pageSize) break;
    p++;
    if (p > 10) break; // limite raisonnable
  }
  return allFound;
}
