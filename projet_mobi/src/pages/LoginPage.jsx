import { useState } from "react";
import { loginWithGoogle } from "../services/authService";
import googleLogo from "../assets/logo-google.png";
import "./loginPage.css";
import spidermanImg from "../assets/spiderman.png";
import captain_marvelImg from "../assets/captain_marvel.png";

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
          <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap" rel="stylesheet"></link>
          <h2>
            Bienvenue dans Marvel card Arena
            <br />
            <span> Crée ton deck pour remporter la partie</span>
          </h2>

          <p>
            Un jeu de cartes immersif dans l'univers Marvel
            <br />
            
          </p>

          <div className="hero-actions">
            <button
              className="google-btn"
              onClick={handleLogin}
              disabled={loading}
            >
              <img src={googleLogo} alt="Google" />
              {loading
                ? "Connexion..."
                : "Connexion avec Google"}
            </button>
          </div>

          {error && <p className="login-error">{error}</p>}
        </div>
    
       <div className="hero-right">
              <div className="visual-card">
                <div className="bg-circle pink" />
                <div className="bg-circle yellow" />
                <div className="bg-circle green" />

                <div className="mock-card spider">
                  <div className="mock-image ">
                    <img src={spidermanImg} alt="Spider-Man"/>
          
                  </div>
                  <h3>Spider-Man</h3>
                  <p>Marvel hero card</p>
                  <div className="stats-row">
                    <span>ATK 7</span>
                    <span>DEF 5</span>
                  </div>
                </div>

                <div className="mock-card captain">
                  <div className="mock-image">
                    <img src={captain_marvelImg} alt="Captain Marvel" />
                  </div>
                  <h3>Captain Marvel</h3>
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
