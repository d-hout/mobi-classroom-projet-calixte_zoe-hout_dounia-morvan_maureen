import { createContext, useState } from 'react';

export const CounterContext = createContext({ 
    counter: 0, 
    increment(){}
});

export default function CounterContextProvider({ children }) {
  const [counter, setCounter] = useState(0);
  return (<CounterContext.Provider value={{
      counter,
      increment(){
          setCounter(counter + 1);
      }
  }}>
      { children }
  </CounterContext.Provider>);
}
