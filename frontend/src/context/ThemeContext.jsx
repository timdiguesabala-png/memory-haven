import { createContext, useState, useContext, useEffect } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    if (saved === null) return false
    return saved === 'true'
  })

  const [comfortMode, setComfortMode] = useState(() => {
    const saved = localStorage.getItem('mhComfortMode')
    return saved === 'true'
  })

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode)
    const root = document.documentElement
    if (darkMode) {
      document.body.classList.add('dark')
      root.style.colorScheme = 'dark'
    } else {
      document.body.classList.remove('dark')
      root.style.colorScheme = 'light'
    }
  }, [darkMode])

  useEffect(() => {
    localStorage.setItem('mhComfortMode', comfortMode)
    document.body.classList.toggle('mh-comfort-mode', comfortMode)
  }, [comfortMode])

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode, comfortMode, setComfortMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
