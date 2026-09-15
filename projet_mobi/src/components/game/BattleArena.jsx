import React from "react";
import { deckCountLabel, getInitial } from "./battleArenaUtils";

function HeartMeter({ hp }) {
  const hearts = Math.max(0, Number(hp) || 0);

  if (!Number.isFinite(Number(hp))) {
    return <span className="ba-hearts">-</span>;
  }

  return (
    <span
      className="ba-hearts"
      aria-label={`${hearts} coeur${hearts > 1 ? "s" : ""}`}
      title={`${hearts} coeur${hearts > 1 ? "s" : ""}`}
    >
      {Array.from({ length: hearts }, (_, index) => (
        <span className="ba-heart" aria-hidden="true" key={index}>
          ❤️
        </span>
      ))}
    </span>
  );
}

export default function BattleArena({
  me,
  opponent,
  isMyTurn,
  pendingAttack,
  onAttack,
  onDefend,
  onTakeHit,
}) {
  const mustDefend = !!pendingAttack;

  return (
    <div className="ba-container">
      <header className="ba-header">
        <div>
          <h2 className="ba-title">Combat</h2>
        </div>

        <p
          className={`ba-turn ${isMyTurn ? "ba-turn--mine" : "ba-turn--other"}`}
        >
          {mustDefend
            ? "⚔️ Tu dois défendre !"
            : isMyTurn
              ? "✅ C'est ton tour d'attaquer"
              : "⏳ Tour de l'adversaire..."}
        </p>
      </header>

      <section className="ba-pv-row">
        <div className="ba-pv">
          <div className="ba-avatar" aria-hidden="true">
            <div className="ba-avatar-head" />
            <div className="ba-avatar-body" />
            <span className="ba-avatar-initial">
              {getInitial(opponent?.name || "Joueur")}
            </span>
          </div>
          <strong>Adversaire</strong>
          <span>{opponent?.name || "Joueur"}</span>
          <div className="ba-hp-row">
            <span className="ba-hp-label">PV :</span>
            <HeartMeter hp={opponent?.hp} />
          </div>
          <span className="ba-deck-count">{deckCountLabel(opponent)}</span>
        </div>
        <div className="ba-pv">
          <div className="ba-avatar" aria-hidden="true">
            <div className="ba-avatar-head" />
            <div className="ba-avatar-body" />
            <span className="ba-avatar-initial">
              {getInitial(me?.name || "Joueur")}
            </span>
          </div>
          <strong>Moi</strong>
          <span>{me?.name || "Joueur"}</span>
          <div className="ba-hp-row">
            <span className="ba-hp-label">PV :</span>
            <HeartMeter hp={me?.hp} />
          </div>
          <span className="ba-deck-count">{deckCountLabel(me)}</span>
        </div>
      </section>

      <section>
        <h3 className="ba-subtitle">Terrain adverse</h3>
        <div className="ba-board">
          {(opponent?.board || []).length === 0 ? (
            <div className="ba-empty-slot">
              Aucune carte adverse en jeu pour l'instant.
            </div>
          ) : (
            (opponent?.board || []).map((card) => (
              <div key={card.id} className="ba-card ba-card--opponent">
                <img
                  src={card.image || "/card-back.png"}
                  alt={card.name || "Carte inconnue"}
                  className="ba-card-image"
                />
                <div className="ba-card-title">{card.name || card.id}</div>
              </div>
            ))
          )}
        </div>
      </section>

      {mustDefend && (
        <div className="ba-attack-box" role="status">
          <p>
            ⚔️ Attaque de : <strong>{pendingAttack.attackerCard?.name}</strong>
          </p>
          <p>Attaque : {pendingAttack.attackerCard?.atk}</p>
        </div>
      )}

      <section>
        <h3 className="ba-subtitle">Mon terrain</h3>
        <div className="ba-board">
          {(me?.board || []).length === 0 ? (
            <div className="ba-empty-slot">
              Ton terrain est vide. Ajoute des cartes pour lancer l'offensive.
            </div>
          ) : (
            (me?.board || []).map((card) => (
              <button
                key={card.id}
                type="button"
                className="ba-card ba-card--button"
                onClick={() =>
                  mustDefend ? onDefend(card.id) : onAttack(card.id)
                }
                disabled={!isMyTurn && !mustDefend}
              >
                <img
                  src={card.image || "/card-back.png"}
                  alt={card.name || "Carte inconnue"}
                  className="ba-card-image"
                />
                <div className="ba-card-title">{card.name || card.id}</div>
                <div className="ba-card-stats">Attaque {card.atk ?? "-"}</div>
                <div className="ba-card-stats">Défense {card.def ?? "-"}</div>
              </button>
            ))
          )}
        </div>
      </section>

      {mustDefend && (
        <div className="ba-actions">
          <button
            type="button"
            className="ba-btn ba-btn--danger"
            onClick={onTakeHit}
          >
            💥 Encaisser le coup (-1 cœur)
          </button>
        </div>
      )}
    </div>
  );
}
