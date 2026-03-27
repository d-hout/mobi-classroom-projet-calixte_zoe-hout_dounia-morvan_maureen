// Moteur du jeu: il prend un état e partie en entrée puis retourne un nouvel état mise à jour 

// Mélange les cartes du deck
// Si on a c1,c2,c3,c4 ça ressort c3,c1,c4,c2 par exemple
function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

// Remplir le terrain d'un jour jusqu'à 3 cartes maximum 
// Si après un combat il n’en reste que 1 ou 2, il pioche dans son deck pour remonter à 3
function drawToBoard(player) {
  const board = [...player.board];
  const deck = [...player.deck];

  while (board.length < 3 && deck.length > 0) {
    board.push(deck.shift());// on prend la 1ère carte du deck avec shift() et on l'ajoute au terrain avec push. 
  }

  return { ...player, board, deck };
}
// Comme pour la fonction shuffle on copie via [...] pour ne pas modifier l'objet initial

// Etat initial d'un joueur en début de partie
export function createInitialPlayerState(uid, name, deckCards) {
  const deck = shuffle(deckCards); // on mélange les 10 cartes du joueur
  const board = deck.splice(0, 3); // on prend les 3 premières cartes du deck mélangé pour les afficher sur le terrain, ces cartes=board, les autres=deck 

  return {
    uid,
    name,
    hp: 5, //points de vie
    deck,
    hand: [],
    board,
    discard: [], // cartes défaussées
  };
}

// Remplir le terrain d'un joueur dans l'objet global game
/* playerKey= playerA ou playerB 
si playerKey === 'playerA', on modifie game.playerA
si playerKey === 'playerB', on modifie game.playerB
*/
export function refillBoard(game, playerKey) {
  return {
    ...game,
    [playerKey]: drawToBoard(game[playerKey]),
  };
}

// Déclarer une attaque
export function declareAttack(game, attackerPlayerKey, attackerCardId) {
  const attacker = game[attackerPlayerKey]; //récupération du joueur attaquant
  const attackedPlayerKey = attackerPlayerKey === 'playerA' ? 'playerB' : 'playerA';

  // On détermine automatiquement le défenseur
  const card = attacker.board.find((c) => c.id === attackerCardId);
  // On cherche sur le terrain du joueur la carte choisie pour attaquer 
  if (!card) throw new Error('Carte attaquante introuvable');

  return {
    ...game,
    phase: 'defense',
    pendingAttack: {
      attackerPlayerKey, // ex: 'playerA'
      defenderPlayerKey: attackedPlayerKey, // ex: 'playerB'
      attackerCard: card, // ex: {id:'c7', atk:8, def:3}
    }, // on enregistre ue attaque "en attente"
  };
}

export function resolveDefense(game, defenderCardId = null) {
  // On récupère les infos de l'attaque en attente: qui attaque, qui défend, quelle carte attaque
  const { attackerPlayerKey, defenderPlayerKey, attackerCard } = game.pendingAttack;

  const attacker = { ...game[attackerPlayerKey] }; 
  const defender = { ...game[defenderPlayerKey] }; 

  if (!defenderCardId) { // si defendarCardId vaut null alors le défenseur choisit de prendre le coup directement --> il perd 1PV et l'attaque en attente est supprimée, on repasse à l aphase "attack"
    defender.hp -= 1;
    return endTurn({
      ...game,
      [defenderPlayerKey]: defender,
      phase: 'attack',
      pendingAttack: null,
    });
  }

  // le défenseur joue une carte
  const defenderCard = defender.board.find((c) => c.id === defenderCardId);
  if (!defenderCard) throw new Error('Carte défense introuvable');

  // retirer les cartes du terrain grâce à filter() qui gardent tous sauf celles qu'on veut enlever
  attacker.board = attacker.board.filter((c) => c.id !== attackerCard.id);
  defender.board = defender.board.filter((c) => c.id !== defenderCard.id);

  // On envoie ces cartes dans la défausse
  attacker.discard = [...attacker.discard, attackerCard];
  defender.discard = [...defender.discard, defenderCard];

  // Comparer l'attaque et la défense
  if (attackerCard.atk > defenderCard.def) {
    defender.hp -= 1; // le défenseur perd 1PV si l'attaque est sup à la défense
  }

  // Fin de résolution: on met à jour le state du jeu 
  /* les joueurs ont leur nouveaux board, discard et hp avec leurs PV */
  return endTurn({
    ...game,
    [attackerPlayerKey]: attacker,
    [defenderPlayerKey]: defender,
    phase: 'attack',
    pendingAttack: null,
  });
}

// Terminer le tour actuel et préparer le tour suivant
export function endTurn(game) {
  const nextTurn = game.currentTurn === game.playerA.uid ? game.playerB.uid : game.playerA.uid;
  // si c'était au tour de playerA alors le prochain tour est à playerB et inversement

  const updated = {
    ...game,
    currentTurn: nextTurn,
  }; // met à jour currentTurn

  // Remplir le terrain du prochain joueur 
  const nextKey = updated.playerA.uid === nextTurn ? 'playerA' : 'playerB';
  const refilled = refillBoard(updated, nextKey);
 //on identifie si le prochain joueur est playerA ou playerB puis on remplit son terrain jusqu'à 3 cartes.
  return computeWinner(refilled); // après avoir fini le tour, on vérifie si quelqu'un a gagné
}

// Déterminer si la partie est terminée
export function computeWinner(game) {
  // le playerA n'a plus dePV
  if (game.playerA.hp <= 0) {
    return { ...game, status: 'finished', winner: game.playerB.uid };
  }

  // playerB n'a plus de PV
  if (game.playerB.hp <= 0) {
    return { ...game, status: 'finished', winner: game.playerA.uid };
  }

  // Plus de cartes chez les deux joueurs à la fois dans le deck et sur le terrain
  const aEmpty = game.playerA.deck.length === 0 && game.playerA.board.length === 0;
  const bEmpty = game.playerB.deck.length === 0 && game.playerB.board.length === 0;

  if (aEmpty && bEmpty) {
    return { ...game, status: 'finished', winner: 'draw' };
  }

  return game;
}