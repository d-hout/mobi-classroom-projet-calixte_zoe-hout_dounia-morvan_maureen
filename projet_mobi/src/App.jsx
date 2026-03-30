import { useEffect, useState } from "react";
import { observeAuth } from "./services/authService";
import LoginPage from "./pages/LoginPage";
import "./App.css";
import CounterContextProvider from "./assets/counterContext";
import HomePage from "./pages/HomePage";
import DeckPage from "./pages/DeckPage";
import GamePage from "./pages/GamePage"; // ✅ AJOUT
import { Routes, Route } from "react-router-dom";

function App() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const unsubscribe = observeAuth((firebaseUser) => {
      setUser(firebaseUser || null);
    });
    return () => unsubscribe();
  }, []);

  if (user === undefined) {
    return <p>Chargement...</p>;
  }

  return (
    <CounterContextProvider>
      <Routes>
        <Route path="/" element={user ? <HomePage /> : <LoginPage />} />

        <Route
          path="/deck/:gameId" // ✅ AJOUT
          element={user ? <DeckPage /> : <LoginPage />}
        />

        <Route
          path="/game/:gameId" // ✅ AJOUT
          element={user ? <GamePage /> : <LoginPage />}
        />
      </Routes>
    </CounterContextProvider>
  );
}

export default App;