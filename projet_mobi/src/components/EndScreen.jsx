import "../App.css";

export default function EndScreen({ game, currentUser }) {
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
      <button
        onClick={async () => {
          const newGameId = await createGame(currentUser);
          navigate(`/game/${newGameId}`);
        }}
      >
        Rejouer
      </button>
    </div>
  );
}
