import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import BattleArena from '../components/game/BattleArena';
import { subscribeToGame, attack, defend } from '../services/gameService';
import { useAuth } from '../hooks/useAuth';

export default function GamePage() {
  const { gameId } = useParams(); // récupération de l'id de la partie depuis l'URL
  const { user } = useAuth(); // récupération de l'utilisateur actuellement connecté
  const [game, setGame] = useState(null); // création d'une variable d'état React game qui contient les données actuelles de la partie

  //Ecouter la partie active
  useEffect(() => {
    if (!gameId) return;
    const unsub = subscribeToGame(gameId, setGame);
    return unsub;
  }, [gameId]);

  if (!game || !user) return <div>Chargement...</div>;

  // Plus propre: on attend vraiment que la partie soit prête
  if (game.status !== "playing" || !game.playerA || !game.playerB) {
    const amPlayerA = game.playerAUser?.uid === user.uid;
    const meReady = amPlayerA
      ? game.playerAUser?.deckReady
      : game.playerBUser?.deckReady;

    const opponentReady = amPlayerA
      ? game.playerBUser?.deckReady
      : game.playerAUser?.deckReady;

    
    return (
      <div style={{ padding: 24 }}>
        <h2>Partie en attente</h2>
        <p>ID de la partie : {gameId}</p>
        <p>Mon deck prêt : {meReady ? "Oui" : "Non"}</p>
        <p>Deck adverse prêt : {opponentReady ? "Oui" : "Non"}</p>
        <p>En attente que les deux joueurs valident leur deck...</p>
      </div>
    );
  }

  const isPlayerA = game.playerA?.uid === user.uid;
  const me = isPlayerA ? game.playerA : game.playerB;
  const opponent = isPlayerA ? game.playerB : game.playerA;
  const isMyTurn = game.currentTurn === user.uid;
  const pendingAttack = game.pendingAttack;
  const amDefender =
    pendingAttack?.defenderPlayerKey === (isPlayerA ? "playerA" : "playerB");

  return (
    <BattleArena //composant d'affichage du plateau de jeu
      me={me}
      opponent={opponent}
      isMyTurn={isMyTurn && game.phase === 'attack'}
      pendingAttack={amDefender ? pendingAttack : null}
      onAttack={(cardId) => attack(gameId, cardId)}
      onDefend={(cardId) => defend(gameId, cardId)}
      onTakeHit={() => defend(gameId, null)}
    />
  );
}