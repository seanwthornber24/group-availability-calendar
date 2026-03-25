import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Session from './pages/Session'
import { useDarkMode } from './hooks/useDarkMode'

export default function App() {
  const { isDark, toggle } = useDarkMode()
  return (
    <BrowserRouter>
      <button
        onClick={toggle}
        aria-label="Toggle dark mode"
        className="fixed top-3 right-3 z-50 w-9 h-9 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm"
      >
        {isDark ? '☀️' : '🌙'}
      </button>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/session/:id" element={<Session />} />
      </Routes>
    </BrowserRouter>
  )
}
