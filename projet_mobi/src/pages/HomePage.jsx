import { useEffect, useState } from "react";
import Header from "../components/Header";
import Button from "@mui/material/Button";
import "../App.css";
import bg from "../assets/disney2.jpg";
import { useNavigate } from "react-router-dom";
import { auth } from "../services/firebaseConfig";
import {
  createGame,
  joinGame,
  subscribeToOpenGames,
} from "../services/gameService";

export default function HomePage() {
  const navigate = useNavigate();
  const [openGames, setOpenGames] = useState([]);
  const [joiningGameId, setJoiningGameId] = useState(null);
  const [showOpenGames, setShowOpenGames] = useState(false);
  const currentUid = auth.currentUser?.uid;
  const otherPlayersGames = openGames.filter(
    (game) => game.playerAUser?.uid !== currentUid,
  );

  useEffect(() => {
    const unsub = subscribeToOpenGames(setOpenGames);
    return unsub;
  }, []);

  const handleCreateGame = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return alert("Utilisateur non connecté");
      const gameId = await createGame(user); // Crée une partie vide
      navigate(`/deck/${gameId}`);
    } catch (err) {
      console.error("create game error", err);
      alert(err.message || "Erreur lors de la création de la partie");
    }
  };

  const handleJoinGame = async (gameId) => {
    try {
      const user = auth.currentUser;
      if (!user) return alert("Utilisateur non connecté");
      setJoiningGameId(gameId);

      await joinGame(gameId, user);
      navigate(`/deck/${gameId}`);
    } catch (err) {
      console.error("join game error", err);
      alert(err.message || "Erreur lors de la connexion à la partie");
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
                  Aucune partie d'un autre joueur n'est disponible pour le
                  moment.
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
                          <span className="home-game-card-label">Hote</span>
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
    </>
  );
}
