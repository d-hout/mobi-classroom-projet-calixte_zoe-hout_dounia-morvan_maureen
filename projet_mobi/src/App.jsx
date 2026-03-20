import { useState } from 'react'
import './App.css'
import CounterContextProvider from './contexte/counterContext'
import Child from './Child'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <CounterContextProvider>
        <Child/>
      </CounterContextProvider>
    </>
  )
}

export default App
