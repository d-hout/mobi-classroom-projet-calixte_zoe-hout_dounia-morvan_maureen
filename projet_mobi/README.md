## Documentation Projet développement mobile 2026

Réalisé par : 
[**Calixte Zoé**] (lien Github)
[**Hout Dounia**] (lien Github)
[**Morvan Maureen**] (lien Github)
Groupe 3

## Présentation générale du projet Disney Card Battle : 
Disney Card Battle est une application web de jeu de cartes en joueur contre joueur (PvP) développée avec React.js.
Le jeu permet à deux joueurs de s’affronter en temps réel dans des duels stratégiques.
Chaque joueur compose un deck de 10 cartes à partir d’une base de données externe, puis engage un combat où l’objectif est de réduire les points de vie (PV) de l’adversaire à 0.
Le gameplay repose sur :
la gestion du terrain,
des choix stratégiques d’attaque et de défense,
un système de tour par tour.


## Objectifs du projet : 

Authentification utilisateur via Google (Firebase Auth)
Consultation d’une bibliothèque de cartes via API
(ex : https://www.marvel.com/characters/3-d-man-chandler)
Création et sauvegarde d’un deck de 10 cartes
Implémentation d’un système de combat :
tour par tour
attaques / défenses
gestion des PV
Mise à jour des résultats de parties en temps réel



## Procédure d’installation 

1. Cloner le dépôt sur la machine 

git clone <https://github.com/ensc-mobi/mobi-classroom-projet-calixte_zoe-hout_dounia-morvan_maureen.git>
cd projet_mobi

2. Installer les dépendances

npm install

3. Configurer Firebase

Créer un projet Firebase et activer :
Firebase Authentication (Google Auth)
Firestore
Realtime Database
Ajouter ensuite la configuration Firebase dans les fichiers prévus du projet.

4. Lancer l’appli web : npm run dev et accéder à l’application via http://localhost:5173/ 

## Déploiement
URL du site déployée : 

## Tests unitaires

Les tests couvrant la logique de jeu (combat, calculs) et la constitution du deck sont disponibles dans le dossier `src/tests`.
Vous pouvez les lancer avec : npm test -- --run
ajouter lien du site dépolyé 
mettre lien github de tout le monde

## Fonctionnalités utilisateur 
Un utilisateur peut :
- se connecter avec Google ;
- créer une partie ;
- rejoindre une partie existante ;
- constituer un deck de 10 cartes ;
- lancer un combat contre un autre joueur ;
- consulter une collection de cartes Disney.

## Fonctionnalités principales

- Authentification avec Google via Firebase Auth
- Création de partie multijoueur
- Liste des parties ouvertes
- Rejoindre une partie existante
- Construction d’un deck de 10 cartes
- Sauvegarde du deck utilisateur
- Lancement automatique du combat quand les deux decks sont prêts
- Système de combat tour par tour
- Écran de fin de partie
- Collection de cartes avec recherche
- Tests unitaires et tests de composants

## Stack technique

- React
- Vite
- React Router
- Firebase Auth
- Firebase Realtime Database
- Firebase Firestore
- Material UI
- Vitest
- Testing Library
- ESLint

## Structure du projet

src/
  components/     composants réutilisables
  pages/          pages principales
  services/       accès Firebase et logique de données
  game/           logique métier du combat
  hooks/          hooks personnalisés
  data/           données locales des cartes

tests/            tests unitaires et composants
scripts/          scripts utilitaires


## Qualité technique
- séparation entre pages, composants, services et logique métier ;
- hook dédié à l’authentification ;
- tests automatisés ;
- vérification de qualité avec ESLint ;
- utilisation d’un moteur de jeu séparé de l’interface.

## Parcours utilisateur
1. L’utilisateur se connecte avec Google.
2. Il crée une partie ou rejoint une partie existante.
3. Il compose un deck de 10 cartes.
4. Lorsque les deux joueurs ont validé leur deck, la partie démarre.
5. Les joueurs s’affrontent tour par tour.
6. Un écran final affiche le résultat du match.

## Améliorations envisagées
- historique des parties ;
- statistiques par joueur ;
- filtres avancés sur la collection ;
- meilleure gestion des erreurs et notifications ;
- écran profil plus complet.

