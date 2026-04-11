import { useEffect, useState } from "react";
import { loginWithGoogle } from "../services/authService";
import googleLogo from "../assets/logo-google.png";
import "./loginPage.css";
import {
  fetchLocalDisneyCharacters,
  searchLocalDisneyCharacters,
} from "../services/localDisneyService";
import { enrichCardsWithSharedCombatStats } from "../services/combatCardService";
import { getDisplayImageUrl, handleImageError } from "../utils/imageUtils";

function getCardSource(card) {
  const sources = [
    ...(card?.films || []),
    ...(card?.shortFilms || []),
    ...(card?.tvShows || []),
  ];

  return sources[0] || "Univers Disney";
}

function LoginPreviewCard({ card, variant }) {
  if (!card) return null;

  return (
    <div className={`preview-card preview-card--${variant}`}>
      <div className="preview-image">
        <img
          src={getDisplayImageUrl(card.image)}
          alt={card.name}
          onError={handleImageError}
        />
      </div>
      <h3>{card.name}</h3>
      <p>{getCardSource(card)}</p>
      <div className="stats-row">
        <span>Attaque {card.atk ?? "-"}</span>
        <span>Défense {card.def ?? "-"}</span>
      </div>
    </div>
  );
}

function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [featuredCards, setFeaturedCards] = useState([]);

  useEffect(() => {
    let mounted = true;

    async function loadFeaturedCards() {
      try {
        const [balooResults, belleResults] = await Promise.all([
          searchLocalDisneyCharacters("Baloo"),
          searchLocalDisneyCharacters("Belle"),
        ]);
        const preferredCards = [balooResults[0], belleResults[0]].filter(Boolean);
        const fallbackCards =
          preferredCards.length >= 2
            ? preferredCards
            : await fetchLocalDisneyCharacters(1, 2);

        const enrichedCards = await enrichCardsWithSharedCombatStats(
          fallbackCards.slice(0, 2),
        );

        if (mounted) setFeaturedCards(enrichedCards);
      } catch (err) {
        console.error("load login cards failed:", err);
        if (mounted) setFeaturedCards([]);
      }
    }

    loadFeaturedCards();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleLogin() {
    try {
      setLoading(true);
      setError("");
      await loginWithGoogle();
    } catch (err) {
      console.error(err);
      setError("Connexion Google impossible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="hero-grid">
        <div className="hero-left">
          <link
            href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap"
            rel="stylesheet"
          ></link>
          <h2>
            Bienvenue dans le jeu Disney Card Battle
            <br />
            <span> Un jeu de cartes immersif </span>
          </h2>

          <p>
            Plonge dans la magie de l'univers Disney et redécouvre les personnages qui ont façonné des générations.
            <br />
          </p>

          <div className="hero-actions">
            <button
              className="google-btn"
              onClick={handleLogin}
              disabled={loading}
            >
              <img src={googleLogo} alt="Google" />
              {loading ? "Connexion..." : "Connexion avec Google"}
            </button>
          </div>

          {error && <p className="login-error">{error}</p>}
        </div>

        <div className="hero-right">
          <div className="visual-card">
            <div className="bg-circle blue" />
            <div className="bg-circle yellow" />

            <LoginPreviewCard card={featuredCards[0]} variant="primary" />
            <LoginPreviewCard card={featuredCards[1]} variant="secondary" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
