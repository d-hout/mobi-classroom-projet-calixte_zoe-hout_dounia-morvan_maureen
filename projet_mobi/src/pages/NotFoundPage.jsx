import Button from "@mui/material/Button";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import "../App.css";

export default function NotFoundPage() {
  return (
    <div className="home-page">
      <Header />

      <section className="home-hero not-found-shell">
        <p className="page-kicker">Disney Card Battle</p>
        <h1>Route inconnue</h1>
        <p className="page-copy">
          La page demandée n'existe pas ou le lien utilisé n'est plus valide.
          Retourne à l'accueil pour créer une partie, rejoindre un duel ou
          consulter la collection.
        </p>

        <div className="home-actions">
          <Button
            component={Link}
            to="/"
            className="bouton-blue"
            variant="contained"
          >
            Retour à l'accueil
          </Button>
        </div>
      </section>
    </div>
  );
}
