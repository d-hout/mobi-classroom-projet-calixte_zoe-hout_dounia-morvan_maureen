import { useState } from "react";
import { CounterContext } from "./counterContextValue";

export default function CounterContextProvider({ children }) {
  const [counter, setCounter] = useState(0);
  return (
    <CounterContext.Provider
      value={{
        counter,
        increment() {
          setCounter(counter + 1);
        },
      }}
    >
      {children}
    </CounterContext.Provider>
  );
}
