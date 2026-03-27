import { useEffect, useState } from "react";
import { observeAuth } from "./services/authService";
import LoginPage from "./pages/LoginPage";
import "./App.css";
import CounterContextProvider from "./assets/counterContext";
import DeckPage from "./pages/DeckPage";

function App() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const unsubscribe = observeAuth((firebaseUser) => {
      setUser(firebaseUser || null);
    });
    return () => unsubscribe();
  }, []);

  if (user === undefined) return <p>Chargement...</p>;
  if (!user) return <LoginPage />;

  return (
    <CounterContextProvider>
      <DeckPage />
    </CounterContextProvider>
  );
}

export default App;
