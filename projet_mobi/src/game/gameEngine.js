// Moteur du jeu: fonctions pures qui prennent l'état courant et renvoient
// un nouvel état mis à jour. Éviter les mutations latérales pour faciliter
// la compréhension et les tests.

// Fisher-Yates shuffle (plus juste que sort(...random...)).
// rng optionnel facilite les tests (injection d'un RNG déterministe).
function shuffle(array = [], rng = Math.random) {
  const a = (array || []).slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

// Remplit le terrain d'un joueur jusqu'à 3 cartes maximum (sans muter)
function drawToBoard(player) {
  const board = Array.isArray(player.board) ? player.board.slice() : [];
  const deck = Array.isArray(player.deck) ? player.deck.slice() : [];

  const needed = Math.max(0, 3 - board.length);
  const toDraw = deck.slice(0, needed);
  const newBoard = board.concat(toDraw);
  const newDeck = deck.slice(toDraw.length);

  return { ...player, board: newBoard, deck: newDeck };
}

// Etat initial d'un joueur en début de partie (pures fonctions)
export function createInitialPlayerState(uid, name, deckCards) {
  const shuffled = shuffle(deckCards || []);
  const board = shuffled.slice(0, 3);
  const deck = shuffled.slice(3);

  return {
    uid,
    name,
    hp: 5,
    deck,
    hand: [],
    board,
    discard: [],
  };
}

// Remplir le terrain d'un joueur dans l'objet global game
// Inputs: game (objet), playerKey ("playerA" | "playerB")
// Retourne un nouvel objet game avec le board du joueur rempli jusqu'à 3 cartes.
export function refillBoard(game, playerKey) {
  if (!game || !game[playerKey]) return game;
  return { ...game, [playerKey]: drawToBoard(game[playerKey]) };
}

// Déclarer une attaque (avec validations)
// Inputs: game, attackerPlayerKey ('playerA'|'playerB'), attackerCardId
// Retour: nouvel état de la partie avec pendingAttack si valide.
export function declareAttack(game, attackerPlayerKey, attackerCardId) {
  if (!game) throw new Error("Partie invalide");
  if (game.phase !== "attack")
    throw new Error("Impossible d'attaquer hors phase d'attaque");
  if (game.pendingAttack) throw new Error("Une attaque est déjà en attente");

  const attacker = game[attackerPlayerKey];
  if (!attacker) throw new Error("Attaquant introuvable");
  if (game.currentTurn !== attacker.uid)
    throw new Error("Ce n'est pas le tour de l'attaquant");

  const card = (attacker.board || []).find(
    (c) => String(c.id) === String(attackerCardId),
  );
  if (!card) throw new Error("Carte attaquante introuvable");

  return {
    ...game,
    phase: "defense",
    pendingAttack: {
      attackerPlayerKey,
      defenderPlayerKey:
        attackerPlayerKey === "playerA" ? "playerB" : "playerA",
      attackerCard: card,
    },
  };
}

// Résoudre la défense (avec validations)
// defenderCardId = null signifie "prendre le coup" et perdre une vie.
// Retour: nouvel état de la partie après résolution et fin de tour.
export function resolveDefense(game, defenderCardId = null) {
  if (!game || !game.pendingAttack)
    throw new Error("Aucune attaque en attente");

  const { attackerPlayerKey, defenderPlayerKey, attackerCard } =
    game.pendingAttack;
  if (!attackerPlayerKey || !defenderPlayerKey || !attackerCard)
    throw new Error("Attaque en attente invalide");

  const attacker = game[attackerPlayerKey] || null;
  const defender = game[defenderPlayerKey] || null;
  if (!attacker || !defender) throw new Error("Joueurs non initialisés");

  // Défense directe (prendre le coup)
  if (!defenderCardId) {
    const updatedDefender = {
      ...defender,
      hp: Math.max(0, (defender.hp || 0) - 1),
    };
    return endTurn({
      ...game,
      [defenderPlayerKey]: updatedDefender,
      phase: "attack",
      pendingAttack: null,
    });
  }

  const defenderCard = (defender.board || []).find(
    (c) => String(c.id) === String(defenderCardId),
  );
  if (!defenderCard) throw new Error("Carte défense introuvable");

  // Construire nouveaux états sans muter les originaux
  const newAttackerBoard = (attacker.board || []).filter(
    (c) => String(c.id) !== String(attackerCard.id),
  );
  const newDefenderBoard = (defender.board || []).filter(
    (c) => String(c.id) !== String(defenderCard.id),
  );

  const newAttacker = {
    ...attacker,
    board: newAttackerBoard,
    discard: [...(attacker.discard || []), attackerCard],
  };

  const newDefender = {
    ...defender,
    board: newDefenderBoard,
    discard: [...(defender.discard || []), defenderCard],
  };

  // Comparer l'attaque et la défense pour ajuster les vies du défenseur.
  if ((attackerCard.atk || 0) > (defenderCard.def || 0)) {
    newDefender.hp = Math.max(0, (defender.hp || 0) - 1);
  }

  return endTurn({
    ...game,
    [attackerPlayerKey]: newAttacker,
    [defenderPlayerKey]: newDefender,
    phase: "attack",
    pendingAttack: null,
  });
}

// Terminer le tour actuel et préparer le tour suivant
// Met à jour currentTurn et refill le board du joueur suivant.
export function endTurn(game) {
  if (!game || !game.playerA || !game.playerB) return game;

  const aUid = game.playerA.uid;
  const bUid = game.playerB.uid;
  if (!aUid || !bUid) return game;

  const nextTurn = game.currentTurn === aUid ? bUid : aUid;

  const updated = {
    ...game,
    currentTurn: nextTurn,
  };

  const nextKey = updated.playerA.uid === nextTurn ? "playerA" : "playerB";
  const refilled = refillBoard(updated, nextKey);

  return computeWinner(refilled);
}

// Déterminer si la partie est terminée
// Retourne l'état mis à jour (status: 'finished' et winner si terminé)
export function computeWinner(game) {
  if (!game || !game.playerA || !game.playerB) return game;

  if ((game.playerA.hp || 0) <= 0) {
    return { ...game, status: "finished", winner: game.playerB.uid };
  }

  if ((game.playerB.hp || 0) <= 0) {
    return { ...game, status: "finished", winner: game.playerA.uid };
  }

  // Match nul si les deux joueurs n'ont plus de cartes sur le terrain
  const aBoardEmpty = (game.playerA.board || []).length === 0;
  const bBoardEmpty = (game.playerB.board || []).length === 0;

  if (aBoardEmpty && bBoardEmpty) {
    return { ...game, status: "finished", winner: "draw" };
  }

  return game;
}
