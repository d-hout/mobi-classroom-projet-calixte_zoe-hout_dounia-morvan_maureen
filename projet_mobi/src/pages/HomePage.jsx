import { useEffect, useState } from "react";
import Header from "../components/Header";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import "../App.css";
import bg from "../assets/disney2.jpg";
import { useNavigate } from "react-router-dom";
import { auth } from "../services/firebaseConfig";
import {
  createGame,
  joinGame,
  subscribeToOpenGames,
} from "../services/gameService";
import { useAuth } from "../hooks/useAuth";

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [openGames, setOpenGames] = useState([]);
  const [joiningGameId, setJoiningGameId] = useState(null);
  const [showOpenGames, setShowOpenGames] = useState(false);
  const [openGamesError, setOpenGamesError] = useState("");
  const [feedback, setFeedback] = useState({
    open: false,
    message: "",
    severity: "error",
  });
  const currentUid = user?.uid;
  const otherPlayersGames = openGames.filter(
    (game) => game.playerAUser?.uid !== currentUid,
  );

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
    if (!user) return;
    const unsub = subscribeToOpenGames((games) => {
      setOpenGamesError("");
      setOpenGames(games);
    }, () => {
      setOpenGamesError(
        "La liste des parties n'est pas accessible avec les règles actuelles.",
      );
    });
    return unsub;
  }, [user]);

  const handleCreateGame = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        showFeedback("Utilisateur non connecté.");
        return;
      }
      const gameId = await createGame(user); // Crée une partie vide
      navigate(`/deck/${gameId}`);
    } catch (err) {
      console.error("create game error", err);
      showFeedback(err.message || "Erreur lors de la création de la partie.");
    }
  };

  const handleJoinGame = async (gameId) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        showFeedback("Utilisateur non connecté.");
        return;
      }
      setJoiningGameId(gameId);

      const joinedGameId = await joinGame(gameId, user);
      navigate(`/deck/${joinedGameId}`);
    } catch (err) {
      console.error("join game error", err);
      showFeedback(err.message || "Erreur lors de la connexion à la partie.");
    } finally {
      setJoiningGameId(null);
    }
  };

  return (
    <>
      <div
        className="home-page-background"
        style={{ backgroundImage: `url(${bg})` }}
      />

      <div className="home-page">
        <Header />
        <section className="home-hero">
          <p className="page-kicker">Disney Card Battle</p>
          <h1>Choisis ton aventure et ouvre le portail du duel</h1>
          <p className="page-copy">
            Crée une nouvelle partie ou rejoins une partie existante pour
            affronter un autre joueur dans une arène enchantée.
          </p>

          <div className="home-actions">
            <Button
              className="bouton-blue"
              variant="contained"
              onClick={handleCreateGame}
            >
              Nouvelle partie
            </Button>

            <Button
              className="bouton-blue bouton-blue--ghost"
              variant="contained"
              onClick={() => setShowOpenGames((value) => !value)}
            >
              {showOpenGames ? "Masquer les parties" : "Rejoindre une partie"}
            </Button>
          </div>

          {showOpenGames && (
            <section className="home-open-games">
              <div className="home-open-games-head">
                <h2>Parties disponibles</h2>
                <p>
                  Clique sur une partie pour rejoindre directement le joueur
                  déjà connecté.
                </p>
              </div>

              {otherPlayersGames.length === 0 ? (
                <div className="home-open-games-empty">
                  {openGamesError ||
                    "Aucune partie d'un autre joueur n'est disponible pour le moment."}
                </div>
              ) : (
                <div className="home-open-games-list">
                  {otherPlayersGames.map((game) => {
                    const isJoining = joiningGameId === game.id;

                    return (
                      <button
                        key={game.id}
                        type="button"
                        className="home-game-card"
                        onClick={() => handleJoinGame(game.id)}
                        disabled={isJoining}
                      >
                        <div className="home-game-card-top">
                          <span className="home-game-card-label">Hôte</span>
                          <span className="home-game-card-status">
                            Disponible
                          </span>
                        </div>
                        <div className="home-game-card-name">
                          {game.playerAUser?.name || "Joueur 1"}
                        </div>
                        <div className="home-game-card-meta">
                          Partie : {game.id}
                        </div>
                        <div className="home-game-card-action">
                          {isJoining
                            ? "Connexion..."
                            : "Cliquer pour rejoindre"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          )}
        </section>
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
    </>
  );
}
