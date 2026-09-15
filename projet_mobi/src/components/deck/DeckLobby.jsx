function DeckLobbyPlayer({ player, fallbackName, currentUid }) {
  return (
    <div className="deck-lobby-player">
      <div className="deck-lobby-name">
        {player?.name || fallbackName}{" "}
        {player?.uid === currentUid ? "(Moi)" : ""}
      </div>
      <div className="deck-lobby-ready">
        Pret : {player?.deckReady ? "Oui" : "Non"}
      </div>
    </div>
  );
}

export default function DeckLobby({ game, gameId, currentUid }) {
  if (!gameId) return null;

  return (
    <section className="deck-lobby-card">
      <div className="deck-lobby-head">
        <p>
          ID de la partie : <strong>{gameId}</strong>
        </p>
      </div>

      <div className="deck-lobby-grid">
        <DeckLobbyPlayer
          player={game?.playerAUser}
          fallbackName="Joueur A"
          currentUid={currentUid}
        />
        <DeckLobbyPlayer
          player={game?.playerBUser}
          fallbackName="Joueur B"
          currentUid={currentUid}
        />
      </div>
    </section>
  );
}
