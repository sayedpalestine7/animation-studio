import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
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
