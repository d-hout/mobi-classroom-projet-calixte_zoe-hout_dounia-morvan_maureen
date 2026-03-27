import { useState } from "react";
import { loginWithGoogle } from "../services/authService";
import googleLogo from "../assets/logo-google.png";
import "./loginPage.css";
import minnieImg from "../assets/minie.jpg";
import simbaImg from "../assets/simba.jpg";

function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
            Bienvenue dans l'univers Disney
            <br />
            <span> Crée ton deck pour remporter la partie </span>
          </h2>

          <p>
            Un jeu de cartes immersif
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

            <div className="mock-card minnie">
              <div className="mock-image ">
                <img src={minnieImg} alt="Minnie" />
              </div>
              <h3>Minnie</h3>
              <p>Disney card</p>
              <div className="stats-row">
                <span>ATK 7</span>
                <span>DEF 5</span>
              </div>
            </div>

            <div className="mock-card simba">
              <div className="mock-image">
                <img src={simbaImg} alt="Simba" />
              </div>
              <h3>Simba</h3>
              <p>Marvel hero card</p>
              <div className="stats-row">
                <span>ATK 9</span>
                <span>DEF 6</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
