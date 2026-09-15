import Typography from "@mui/material/Typography";

export default function DeckHero() {
  return (
    <div className="deck-page-hero">
      <p className="page-kicker">Préparation du duel</p>
      <Typography variant="h4" component="h1" className="deck-page-title">
        Création du deck
      </Typography>
      <p className="page-copy deck-page-copy">
        Sélectionne 10 cartes pour construire un deck équilibre avant le début
        du combat.
      </p>
    </div>
  );
}
