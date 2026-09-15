import { Routes, Route } from "react-router-dom";
import "./App.css";
import CounterContextProvider from "./assets/counterContext";
import HomePage from "./pages/HomePage";
import DeckPage from "./pages/DeckPage";
import GamePage from "./pages/GamePage";
import LoginPage from "./pages/LoginPage";
import CollectionPage from "./pages/CollectionPage";
import GameRules from "./pages/GameRules";
import ProfilePage from "./pages/ProfilePage";
import NotFoundPage from "./pages/NotFoundPage";
import { useAuth } from "./hooks/useAuth";

export default function App() {
  const { user, loading } = useAuth(); // récupère l'utilisateur connecté

  if (loading) {
    return null;
  }

  return (
    <CounterContextProvider>
      <Routes>
        <Route path="/" element={user ? <HomePage /> : <LoginPage />} />

        <Route
          path="/deck/:gameId"
          element={user ? <DeckPage /> : <LoginPage />}
        />

        <Route
          path="/collection"
          element={user ? <CollectionPage /> : <LoginPage />}
        />

        <Route
          path="/rules"
          element={user ? <GameRules /> : <LoginPage />}
        />

        <Route
          path="/profile"
          element={user ? <ProfilePage /> : <LoginPage />}
        />

        <Route
          path="/game/:gameId"
          element={user ? <GamePage /> : <LoginPage />}
        />

        <Route
          path="/battle/:gameId"
          element={user ? <GamePage /> : <LoginPage />}
        />

        <Route
          path="*"
          element={user ? <NotFoundPage /> : <LoginPage />}
        />
      </Routes>
    </CounterContextProvider>
  );
}
