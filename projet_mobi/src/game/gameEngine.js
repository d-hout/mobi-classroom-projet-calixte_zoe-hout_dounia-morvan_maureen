// Moteur du jeu: il prend un état e partie en entrée puis retourne un nouvel état mise à jour

// Mélange les cartes du deck
function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

// Remplir le terrain d'un joueur jusqu'à 3 cartes maximum
function drawToBoard(player) {
  const board = [...(player.board || [])];
  const deck = [...(player.deck || [])];

  while (board.length < 3 && deck.length > 0) {
    board.push(deck.shift());
  }

  return { ...player, board, deck };
}

// Etat initial d'un joueur en début de partie
export function createInitialPlayerState(uid, name, deckCards) {
  const deck = shuffle(deckCards || []);
  const board = deck.splice(0, 3);

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
export function refillBoard(game, playerKey) {
  if (!game || !game[playerKey]) return game;
  return {
    ...game,
    [playerKey]: drawToBoard(game[playerKey]),
  };
}

// Déclarer une attaque (avec validations)
export function declareAttack(game, attackerPlayerKey, attackerCardId) {
  if (!game) throw new Error("Partie invalide");
  if (game.phase !== "attack")
    throw new Error("Impossible d'attaquer hors phase d'attaque");
  if (!game.pendingAttack) {
    // ok
  } else {
    // s'il existe déjà une attaque en attente, bloquer
    throw new Error("Une attaque est déjà en attente");
  }

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
export function resolveDefense(game, defenderCardId = null) {
  if (!game || !game.pendingAttack)
    throw new Error("Aucune attaque en attente");

  const { attackerPlayerKey, defenderPlayerKey, attackerCard } =
    game.pendingAttack;
  if (!attackerPlayerKey || !defenderPlayerKey || !attackerCard)
    throw new Error("Attaque en attente invalide");

  const attacker = { ...(game[attackerPlayerKey] || {}) };
  const defender = { ...(game[defenderPlayerKey] || {}) };

  if (!attacker || !defender) throw new Error("Joueurs non initialisés");

  // Défense directe (prendre le coup)
  if (!defenderCardId) {
    defender.hp = Math.max(0, (defender.hp || 0) - 1);
    return endTurn({
      ...game,
      [defenderPlayerKey]: defender,
      phase: "attack",
      pendingAttack: null,
    });
  }

  const defenderCard = (defender.board || []).find(
    (c) => String(c.id) === String(defenderCardId),
  );
  if (!defenderCard) throw new Error("Carte défense introuvable");

  // Retirer les cartes du terrain
  attacker.board = (attacker.board || []).filter(
    (c) => String(c.id) !== String(attackerCard.id),
  );
  defender.board = (defender.board || []).filter(
    (c) => String(c.id) !== String(defenderCard.id),
  );

  // Envoyer en défausse
  attacker.discard = [...(attacker.discard || []), attackerCard];
  defender.discard = [...(defender.discard || []), defenderCard];

  // Comparer ATK / DEF
  if ((attackerCard.atk || 0) > (defenderCard.def || 0)) {
    defender.hp = Math.max(0, (defender.hp || 0) - 1);
  }

  return endTurn({
    ...game,
    [attackerPlayerKey]: attacker,
    [defenderPlayerKey]: defender,
    phase: "attack",
    pendingAttack: null,
  });
}

// Terminer le tour actuel et préparer le tour suivant
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
export function computeWinner(game) {
  if (!game || !game.playerA || !game.playerB) return game;

  if ((game.playerA.hp || 0) <= 0) {
    return { ...game, status: "finished", winner: game.playerB.uid };
  }

  if ((game.playerB.hp || 0) <= 0) {
    return { ...game, status: "finished", winner: game.playerA.uid };
  }

  // Conformément au PDF : match nul si les deux joueurs n'ont plus de cartes sur le terrain
  const aBoardEmpty = (game.playerA.board || []).length === 0;
  const bBoardEmpty = (game.playerB.board || []).length === 0;

  if (aBoardEmpty && bBoardEmpty) {
    return { ...game, status: "finished", winner: "draw" };
  }

  return game;
}
