import { useState } from 'react'
import AnimationStudio from './pages/AnimationStudio.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

function App() {
  return (
    <ErrorBoundary>
      <AnimationStudio />
    </ErrorBoundary>
  )
}
export default App
