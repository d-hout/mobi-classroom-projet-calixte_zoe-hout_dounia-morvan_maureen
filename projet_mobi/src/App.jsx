import { useEffect, useState } from "react";
import { observeAuth } from "./services/authService";
import LoginPage from "./pages/LoginPage";
import "./App.css";
import CounterContextProvider from "./assets/counterContext";
// import Child from "./Child";
import Header from "./components/Header";
import DisneyTest from "./components/DisneyTest"; // ajouté
import HomePage from "./pages/HomePage";
import DeckPage from "./pages/DeckPage";
import { Routes, Route } from "react-router-dom";

function App() {
  const [user, setUser] = useState(undefined);
  const [count, setCount] = useState(0);

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
        <Route path="/DeckPage" element={user ? <DeckPage /> : <LoginPage />} />
      </Routes>
    </CounterContextProvider>
  );
}

export default App;
