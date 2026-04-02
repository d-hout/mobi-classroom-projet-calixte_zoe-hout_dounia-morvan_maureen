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
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundImage: `url(${bg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          zIndex: -1,
        }}
      ></div>

      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Header />
        <div className="center">
          <Button
            className="bouton-blue"
            variant="contained"
            onClick={handleCreateGame}
          >
            Nouvelle partie
          </Button>

          <Button
            className="bouton-blue"
            variant="contained"
            onClick={handleJoinGame}
          >
            Rejoindre partie
          </Button>
        </div>
      </div>
    </>
  );
}
