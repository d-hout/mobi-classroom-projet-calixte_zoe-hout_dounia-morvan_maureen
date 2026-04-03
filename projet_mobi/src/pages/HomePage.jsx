import Header from "../components/Header";
import Button from "@mui/material/Button";
import "../App.css";
import bg from "../assets/disney2.jpg";
import { useNavigate } from "react-router-dom";
import { auth } from "../services/firebaseConfig";
import { createGame, joinGame } from "../services/gameService"; // ✅ AJOUT

export default function HomePage() {
  const navigate = useNavigate();

  const handleCreateGame = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return alert("Utilisateur non connecté");
      const gameId = await createGame(user); // ✅ AJOUT : crée une partie vide
      navigate(`/deck/${gameId}`); // ✅ MODIF : on va ensuite choisir le deck
    } catch (err) {
      console.error("create game error", err);
      alert(err.message || "Erreur lors de la création de la partie");
    }
  };

  const handleJoinGame = async () => {
    const gameId = prompt("Entre l'ID de la partie :"); // ✅ tu pourras remplacer plus tard par une vraie UI
    if (!gameId) return;

    try {
      const user = auth.currentUser;
      if (!user) return alert("Utilisateur non connecté");

      await joinGame(gameId, user); // ✅ AJOUT : rejoint la partie vide
      navigate(`/deck/${gameId}`); // ✅ MODIF : puis choix du deck
    } catch (err) {
      console.error("join game error", err);
      alert(err.message || "Erreur lors de la connexion à la partie");
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
            Cree une nouvelle partie ou rejoins une salle existante pour
            composer ton deck et affronter un autre joueur dans une arene
            enchantee.
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
              onClick={handleJoinGame}
            >
              Rejoindre partie
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}
