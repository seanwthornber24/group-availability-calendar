import { useEffect, useState } from 'react'

export function useDarkMode() {
  function getInitial() {
    const stored = localStorage.getItem('theme')
    if (stored) { return stored === 'dark' }
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  const [isDark, setIsDark] = useState(getInitial)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    function handleChange(e) {
      if (!localStorage.getItem('theme')) { setIsDark(e.matches) }
    }
    mq.addEventListener('change', handleChange)
    return () => mq.removeEventListener('change', handleChange)
  }, [])

  function toggle() {
    setIsDark((prev) => {
      const next = !prev
      localStorage.setItem('theme', next ? 'dark' : 'light')
      return next
    })
  }

  return { isDark, toggle }
}
