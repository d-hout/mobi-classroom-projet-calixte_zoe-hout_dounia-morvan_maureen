import { useContext } from "react";
import { CounterContext } from "./contexte/counterContext";

export default function Child() {
  const { counter, increment } = useContext(CounterContext);
  return (<div>
      <span>{ counter }</span>
      <button onClick={increment}>Increment !</button>
  </div>)
}
