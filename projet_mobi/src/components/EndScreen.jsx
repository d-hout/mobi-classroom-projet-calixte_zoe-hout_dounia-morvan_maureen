import "../App.css";
import { useNavigate } from "react-router-dom";

export default function EndScreen({ game, currentUser }) {
  const navigate = useNavigate();
  if (!game) return <div>Chargement...</div>;

  let message = "";

  if (game.winner === "draw") {
    message = "Match nul 🤝";
  } else if (game.winner === currentUser.uid) {
    message = "Victoire 🎉";
  } else {
    message = "Défaite 💀";
  }

  return (
    <div className="end-screen">
      <h1>Fin de partie</h1>
      <h2>{message}</h2>
      <div className="end-screen-actions">
        <button onClick={() => navigate("/")}>Rejouer</button>
        <button onClick={() => navigate("/")}>Retourner à l'accueil</button>
      </div>
    </div>
  );
}
