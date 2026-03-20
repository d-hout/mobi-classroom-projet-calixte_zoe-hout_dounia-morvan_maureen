import { useState } from "react";
import { loginWithGoogle } from "../services/authService";

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
   <div style={{ padding: "2rem" }}>
     <h1>Connexion</h1>
     <button onClick={handleLogin} disabled={loading}>
       {loading ? "Connexion..." : "Se connecter avec Google"}
     </button>

     {error && <p>{error}</p>}
   </div>
 );
}

export default LoginPage;
