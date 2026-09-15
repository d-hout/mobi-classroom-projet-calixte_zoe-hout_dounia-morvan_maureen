import { Fragment } from "react";
import Header from "../components/Header";
import CardTile from "../components/cards/CardTile";
import disneyCards from "../data/disneyCards.json";
import { getCombatStats } from "../game/cardStats";
import "../App.css";

const rulesSections = [
  {
    title: "Avant le duel",
    items: [
      "Chaque joueur prépare son deck avec ses 10 cartes Disney. Le choix des cartes est stratégique grâce à la lecture des valeurs d'attaque et défense des cartes ",
      "Au début de la partie, chaque joueur commence avec 5 Vies.",
      "Trois cartes parmi les 10 cartes du Deck sont placées aléatoirement sur le terrain. Il vous reste donc 7 cartes dans le deck Le deck sert ensuite a compléter le terrain au fil du jeu.",
    ],
  },
  {
    title: "Pendant ton tour",
    items: [
      "Quand c'est ton tour, choisis une carte de ton terrain pour attaquer.",
      "Ton adversaire peut défendre avec une carte de son terrain ou encaisser directement le coup via le bouton Encaisser le coup.",
      "Encaisser le coup entraine la perte d'une vie.",
    ],
  },
  {
    title: "Resolution du combat",
    items: [
      "A chaque tour, on compare la valeur de l'attaque à celle de la défense",
      "Si l'attaque est supérieure à la défense, le defenseur perd 1 vie.",
      "Les deux cartes utilisées quittent le terrain et vont dans la defausse.",
      " Dès que le terrain a moins de 3 cartes, une carte du deck restant vient le compléter"
    ],
  },
  {
    title: "Fin de partie",
    items: [
      "Le premier joueur qui n'a plus de vie (0 vie) perd la partie.",
      "Si les deux joueurs n'ont plus de cartes sur le terrain, la partie se termine sur un match nul.",
    ],
  },
];

const exampleCards = ["Baloo", "Belle"]
  .map((name) => disneyCards.find((card) => card.name === name))
  .filter(Boolean)
  .map((card) => ({
    ...card,
    ...getCombatStats(card.id),
  }));

export default function GameRules() {
  return (
    <div className="rules-page">
      <Header />

      <main className="rules-shell">
        <section className="rules-hero">
          <p className="page-kicker">Disney Card Battle</p>
          <h1>Rules</h1>
        </section>

        <section className="rules-grid" aria-label="Regles du jeu">
          {rulesSections.map((section, index) => (
            <Fragment key={section.title}>
              <article className="rules-card">
                <h2>{section.title}</h2>
                <ul>
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>

              {index === 0 && (
                <section
                  className="rules-example-cards"
                  aria-label="Exemples de cartes"
                >
                  <div className="rules-example-head">
                    <h2>Exemples de cartes</h2>
                    <p>
                      Chaque carte possède une valeur d'attaque et une valeur
                      de défense.
                    </p>
                  </div>
                  <div className="rules-example-grid">
                    {exampleCards.map((card) => (
                      <CardTile key={card.id} card={card} showSource />
                    ))}
                  </div>
                </section>
              )}
            </Fragment>
          ))}
        </section>
      </main>
    </div>
  );
}
