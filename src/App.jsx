import { useState } from 'react'
import AnimationStudio from './pages/AnimationStudio.jsx';

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <AnimationStudio />
    </>
  )
}

export default App
