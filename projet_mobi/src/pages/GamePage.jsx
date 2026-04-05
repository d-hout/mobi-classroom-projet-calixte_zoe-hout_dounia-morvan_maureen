import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import BattleArena from "../components/game/BattleArena";
import EndScreen from "../components/EndScreen";
import { subscribeToGame, attack, defend } from "../services/gameService";
import { useAuth } from "../hooks/useAuth";
import "./GamePage.css";
import Header from "../components/Header";

export default function GamePage() {
  const { gameId } = useParams();
  const { user } = useAuth();
  const [game, setGame] = useState(null);

  // Ecouter la partie active
  useEffect(() => {
    if (!gameId) return;
    const unsub = subscribeToGame(gameId, setGame);
    return unsub;
  }, [gameId]);

  if (!game || !user) {
    return (
      <div className="game-page">
        <div className="game-shell game-shell--loading">
          <p className="game-kicker">Disney Card Battle</p>
          <h1>Chargement de la partie...</h1>
          <p>Préparation du château, des cartes et de l'arène enchantée.</p>
        </div>
      </div>
    );
  }

  // Ecran de fin de partie
  if (game.status === "finished") {
    return (
      <div className="game-page">
        <Header />
        <div className="game-shell">
          <EndScreen game={game} currentUser={user} />
        </div>
      </div>
    );
  }

  // Attente (deck pas prêts)
  if (game.status !== "playing" || !game.playerA || !game.playerB) {
    const amPlayerA = game.playerAUser?.uid === user.uid;
    const meReady = amPlayerA
      ? game.playerAUser?.deckReady
      : game.playerBUser?.deckReady;

    const opponentReady = amPlayerA
      ? game.playerBUser?.deckReady
      : game.playerAUser?.deckReady;

    return (
      <div className="game-page">
        <section className="game-shell game-shell--waiting">
          <div className="waiting-layout">
            <div className="waiting-hero">
              <p className="game-kicker">Salle d'attente royale</p>
              <h1>Partie en attente</h1>
              <p className="game-intro">
                Les deux joueurs doivent confirmer leur deck avant d'ouvrir le
                duel.
              </p>

              <div className="waiting-room-badge">
                <span className="waiting-room-label">Salon</span>
                <strong>{gameId}</strong>
              </div>

              <div className="waiting-steps">
                <div
                  className={`waiting-step ${meReady ? "waiting-step--done" : ""}`}
                >
                  <span className="waiting-step-dot" />
                  Ton deck est {meReady ? "pret" : "en preparation"}
                </div>
                <div
                  className={`waiting-step ${opponentReady ? "waiting-step--done" : ""}`}
                >
                  <span className="waiting-step-dot" />
                  Le deck adverse est{" "}
                  {opponentReady ? "pret" : "en preparation"}
                </div>
              </div>

              <p className="game-waiting-note">
                Dès que les deux decks sont valides, le combat commence
                automatiquement.
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Jeu en cours
  const isPlayerA = game.playerA?.uid === user.uid;
  const me = isPlayerA ? game.playerA : game.playerB;
  const opponent = isPlayerA ? game.playerB : game.playerA;
  const isMyTurn = game.currentTurn === user.uid;
  const pendingAttack = game.pendingAttack;
  const amDefender =
    pendingAttack?.defenderPlayerKey === (isPlayerA ? "playerA" : "playerB");

  return (
    <div className="game-page">
      <div className="game-shell">
        <BattleArena
          me={me}
          opponent={opponent}
          isMyTurn={isMyTurn && game.phase === "attack"}
          pendingAttack={amDefender ? pendingAttack : null}
          onAttack={(cardId) => attack(gameId, cardId)}
          onDefend={(cardId) => defend(gameId, cardId)}
          onTakeHit={() => defend(gameId, null)}
        />
      </div>
    </div>
  );
}
