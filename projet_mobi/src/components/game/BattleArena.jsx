export default function BattleArena({
  me,
  opponent,
  isMyTurn,
  pendingAttack,
  onAttack,
  onDefend,
  onTakeHit,
}) {
  return (
    <div style={{ padding: 16 }}>
      <h2>Combat</h2>
      <p>
        Moi: {me?.name || 'Joueur'} ({me?.hp ?? '-' } PV)
      </p>
      <p>
        Adversaire: {opponent?.name || 'Joueur'} ({opponent?.hp ?? '-'} PV)
      </p>

      <h3>Mes cartes</h3>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {(me?.board || []).map((card) => (
          <button
            key={card.id}
            onClick={() => (pendingAttack ? onDefend(card.id) : onAttack(card.id))}
            disabled={pendingAttack ? false : !isMyTurn}
            type="button"
            style={{ padding: 8 }}
          >
            {card.name || card.id} | ATK {card.atk ?? '-'} / DEF {card.def ?? '-'}
          </button>
        ))}
      </div>

      {pendingAttack && (
        <div style={{ marginTop: 16 }}>
          <p>Attaque en attente: {pendingAttack.attackerCard?.name}</p>
          <button type="button" onClick={onTakeHit}>
            Prendre le coup
          </button>
        </div>
      )}
    </div>
  );
}
