import { useEffect, useState } from 'react'
import { observeAuth } from "./services/authService";
import LoginPage from "./pages/LoginPage";
import './App.css'
import CounterContextProvider from './assets/counterContext'
import Child from './Child'
import Header from './components/Header';

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
 
  if (!user) {
    return <LoginPage />;
  }

  return (
    <>    
      <CounterContextProvider>
          <div>
            <Header/>
            <h1>Bienvenue {user.displayName}</h1>
            <p>{user.email}</p>
            <Child/>
          </div>
      </CounterContextProvider>
    </>
  )
}

export default App
