import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <CounterContextProvider>
        <Button></Button>
      </CounterContextProvider>
    </>
  )
}

export default App
