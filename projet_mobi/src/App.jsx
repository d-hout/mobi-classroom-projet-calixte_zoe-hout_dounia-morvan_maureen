import { useEffect, useState } from "react";
import { observeAuth } from "./services/authService";
import { Routes, Route } from "react-router-dom";
import "./App.css";
import CounterContextProvider from "./assets/counterContext";
import HomePage from "./pages/HomePage";
import DeckPage from "./pages/DeckPage";
import GamePage from "./pages/GamePage";
import LoginPage from "./pages/LoginPage";
import { useAuth } from "./hooks/useAuth";

export default function App() {
  const { user } = useAuth(); // récupère l'utilisateur connecté

  return (
    <CounterContextProvider>
      {/* BrowserRouter doit être dans main.jsx — ne pas le dupliquer ici */}
      {/* ...existing layout... */}
      <Routes>
        <Route path="/" element={user ? <HomePage /> : <LoginPage />} />

        <Route
          path="/deck/:gameId"
          element={user ? <DeckPage /> : <LoginPage />}
        />

        <Route path="/game/:gameId" element={<GamePage />} />

        <Route path="/battle/:gameId" element={<GamePage />} />

        {/* Route /lobby removed - LobbyPage deleted, use HomePage to create/join directly */}
      </Routes>
    </CounterContextProvider>
  );
}
