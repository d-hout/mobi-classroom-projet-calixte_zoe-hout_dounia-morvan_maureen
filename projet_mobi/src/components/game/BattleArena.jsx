import React from "react";

//  somme des ATK sur le board
function boardPower(board = []) {
  return (board || []).reduce((s, c) => s + (c.atk || 0), 0);
}

function getInitial(name) {
  if (!name) return "?";
  return name.trim().charAt(0).toUpperCase();
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

  const opponentPower = boardPower(opponent?.board);
  const myPower = boardPower(me?.board);

  let terrainLabel = "Terrain";
  if (opponentPower > myPower) terrainLabel = "Terrain défavorable";
  else if (opponentPower < myPower) terrainLabel = "Terrain favorable";
  else terrainLabel = "Terrain équilibré";

  return (
    <div className="ba-container">
      <header className="ba-header">
        <div>
          <h2 className="ba-title">Combat</h2>
          <p className="ba-terrain">{terrainLabel}</p>
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
          <span>
            {opponent?.name || "Joueur"} — {opponent?.hp ?? "-"} PV
          </span>
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
          <span>
            {me?.name || "Joueur"} — {me?.hp ?? "-"} PV
          </span>
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
                <div className="ba-card-stats">
                  ATK {card.atk ?? "-"} / DEF {card.def ?? "-"}
                </div>
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
          <p>ATK : {pendingAttack.attackerCard?.atk}</p>
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
                <div className="ba-card-stats">
                  ATK {card.atk ?? "-"} / DEF {card.def ?? "-"}
                </div>
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
            💥 Encaisser le coup (-1 PV)
          </button>
        </div>
      )}
    </div>
  );
}
