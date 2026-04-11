import { useEffect, useMemo, useState } from "react";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import { useAuth } from "../hooks/useAuth";
import { subscribeToUserGames } from "../services/gameService";
import "../App.css";

function formatDate(timestamp) {
  if (!timestamp) return "Date inconnue";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function getOpponentName(game, uid) {
  if (game.playerAUser?.uid === uid) {
    return game.playerBUser?.name || "En attente d'un adversaire";
  }

  if (game.playerBUser?.uid === uid) {
    return game.playerAUser?.name || "Joueur 1";
  }

  return "Adversaire inconnu";
}

function getResultLabel(game, uid) {
  if (game.winner === "draw") return "Match nul";
  if (game.winner === uid) return "Victoire";
  return "Défaite";
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToUserGames(
      user.uid,
      (nextGames) => {
        setGames(nextGames);
        setHistoryError("");
        setLoading(false);
      },
      () => {
        setGames([]);
        setHistoryError(
          "Impossible de charger l'historique des parties pour le moment.",
        );
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [user]);

  const stats = useMemo(() => {
    return {
      total: games.length,
      victories: games.filter((game) => game.winner === user?.uid).length,
      defeats: games.filter(
        (game) => game.winner && game.winner !== "draw" && game.winner !== user?.uid,
      ).length,
      draws: games.filter((game) => game.winner === "draw").length,
    };
  }, [games, user]);

  return (
    <div className="profile-page">
      <Header />

      <main className="profile-shell">
        <section className="profile-hero">
          <p className="page-kicker">Profil joueur</p>
          <h1>{user?.displayName || "Mon profil"}</h1>
          <p className="page-copy">
            Retrouve tes duels Disney Card Battle, les parties en cours et tes
            résultats.
          </p>
        </section>

        <section className="profile-stats" aria-label="Statistiques du joueur">
          <div className="profile-stat">
            <span>Parties</span>
            <strong>{stats.total}</strong>
          </div>
          <div className="profile-stat">
            <span>Victoires</span>
            <strong>{stats.victories}</strong>
          </div>
          <div className="profile-stat">
            <span>Défaites</span>
            <strong>{stats.defeats}</strong>
          </div>
          <div className="profile-stat">
            <span>Nuls</span>
            <strong>{stats.draws}</strong>
          </div>
        </section>

        <section className="profile-history">
          <div className="profile-history-head">
            <h2>Historique des parties</h2>
            <Button
              component={Link}
              to="/"
              className="bouton-blue bouton-blue--ghost"
              variant="contained"
            >
              Nouvelle partie
            </Button>
          </div>

          {historyError && (
            <Alert severity="error" className="profile-alert">
              {historyError}
            </Alert>
          )}

          {loading ? (
            <p className="profile-empty">Chargement de l'historique...</p>
          ) : games.length === 0 ? (
            <p className="profile-empty">
              Aucune partie terminée pour le moment. Termine un duel pour
              remplir ton historique.
            </p>
          ) : (
            <div className="profile-game-list">
              {games.map((game) => {
                const result = getResultLabel(game, user?.uid);

                return (
                  <article className="profile-game-card" key={game.id}>
                    <div>
                      <p className="profile-game-label">{result}</p>
                      <h3>Contre {getOpponentName(game, user?.uid)}</h3>
                      <p>
                        Dernière activité :{" "}
                        {formatDate(game.updatedAt || game.createdAt)}
                      </p>
                      <p className="profile-game-id">Partie : {game.id}</p>
                    </div>

                    <Button
                      component={Link}
                      to={`/game/${game.id}`}
                      className="profile-game-link"
                      variant="outlined"
                    >
                      Voir la partie
                    </Button>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
