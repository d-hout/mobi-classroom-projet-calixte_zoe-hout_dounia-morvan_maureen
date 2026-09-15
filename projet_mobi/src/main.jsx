import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";

const root = createRoot(document.getElementById("root"));
// Affiche l'origine (utile pour récupérer le domaine exact à ajouter dans Firebase)
if (typeof window !== "undefined") {
  // eslint-disable-next-line no-console
  console.log("APP_ORIGIN:", window.location.origin);
}
root.render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
