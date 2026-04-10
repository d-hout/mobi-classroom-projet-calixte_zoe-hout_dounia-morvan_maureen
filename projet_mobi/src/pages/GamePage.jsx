import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import BattleArena from "../components/game/BattleArena";
import EndScreen from "../components/EndScreen";
import { subscribeToGame, attack, defend } from "../services/gameService";
import { useAuth } from "../hooks/useAuth";
import "./GamePage.css";
import Header from "../components/Header";

export default function GamePage() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [gameState, setGameState] = useState({
    game: undefined,
    error: "",
  });

  // Ecouter la partie active
  useEffect(() => {
    if (!gameId || !user) return;

    const unsub = subscribeToGame(
      gameId,
      (nextGame) => {
        setGameState({
          game: nextGame,
          error: "",
        });
      },
      () => {
        setGameState({
          game: null,
          error:
            "La partie n'est pas accessible pour le moment à cause d'une erreur Firebase.",
        });
      },
    );

    return unsub;
  }, [gameId, user]);
  const { game, error: gameError } = gameState;

  const accessError = useMemo(() => {
    if (!user || !game) return "";

    const playerIds = [game.playerAUser?.uid, game.playerBUser?.uid].filter(
      Boolean,
    );

    if (playerIds.length > 0 && !playerIds.includes(user.uid)) {
      return "Tu n'es pas autorisé à accéder à cette partie.";
    }

    return "";
  }, [game, user]);

  if (!user || (game === undefined && !gameError)) {
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

  if (gameError || !game || accessError) {
    return (
      <div className="game-page">
        <Header />
        <section className="game-shell game-shell--waiting">
          <div className="waiting-layout">
            <div className="waiting-hero">
              <p className="game-kicker">Disney Card Battle</p>
              <h1>{!game ? "Partie introuvable" : "Accès impossible"}</h1>
              <Alert
                severity={gameError ? "error" : "warning"}
                className="game-inline-alert"
              >
                {gameError ||
                  accessError ||
                  "La partie demandée n'existe plus ou n'est plus disponible."}
              </Alert>
              <div className="game-error-actions">
                <Button
                  variant="contained"
                  className="bouton-blue"
                  onClick={() => navigate("/")}
                >
                  Retour à l'accueil
                </Button>
              </div>
            </div>
          </div>
        </section>
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
                  Ton deck est {meReady ? "prêt" : "en préparation"}
                </div>
                <div
                  className={`waiting-step ${opponentReady ? "waiting-step--done" : ""}`}
                >
                  <span className="waiting-step-dot" />
                  Le deck adverse est{" "}
                  {opponentReady ? "prêt" : "en préparation"}
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
