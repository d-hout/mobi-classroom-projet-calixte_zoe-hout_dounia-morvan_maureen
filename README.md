# 🃏 Jeu de Cartes - Projet Web 2026
> **Documentation Projet Développement Mobile **

## 👥 Équipe (Groupe 3)
* [**Calixte Zoé**](lien)
* [**Hout Dounia**](Lien)
* [**Morvan Maureen**](Lien)

---

## 📝 Présentation générale du projet
Ce projet consiste à mettre en place une application web de combat de carte **joueur contre joueur (PvP)** développée avec **React.js**.

Ce jeu permet aux joueurs de s'affronter en temps réel dans des duels stratégiques. Les joueurs construisent leur propre deck de **10 cartes** à partir d’une base de données externe. L’objectif est de réduire les points de vie (PV) de l’adversaire à 0 en gérant intelligemment son terrain, ses attaques et sa défense.

## 🎯 Objectifs du projet
* 🔐 **Authentification** : Connexion via Google avec FirebaseAuth.
* 📚 **Bibliothèque** : Consultation d'une bibliothèque de cartes via l'API [Marvel](https://www.marvel.com/characters/3-d-man-chandler).
* 🎴 **Deck Building** : Construction et sauvegarde d’un deck de 10 cartes.
* ⚔️ **Combat** : Système de tour à tour / logique de combat (attaque, défense, PV).
* 📈 **Statistiques** : Mise à jour des résultats de parties.

## 🛠️ Technologies utilisées
* **Framework** : React.js (Vite)
* **Backend / Auth** : Firebase (Authentication & Firestore)
* **API** : Marvel API
* **Tests** : Vitest / Jest

---

## ⚙️ Procédure d’installation

1. **Cloner le dépôt** sur votre machine :
   ```bash
   git clone [https://github.com/ensc-mobi/mobi-classroom-projet-calixte_zoe-hout_dounia-morvan_maureen.git](https://github.com/ensc-mobi/mobi-classroom-projet-calixte_zoe-hout_dounia-morvan_maureen.git)
2. **Se déplacer dans le répertoire de travail 
cd projet_mobi

3. Configurer Firebase
Créer un projet Firebase et activer :
- Firebase Authentication (Google Auth)
- Realtime Database
Ajouter ensuite la configuration Firebase dans les fichiers prévus du projet.

4. Installer les dépendances et lancer l'application 
npm install 
npm run dev

5. Observer le port du service avec l’adresse localhost : http://localhost:5173/
URL du site : 



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




