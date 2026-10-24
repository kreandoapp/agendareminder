import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

const ThemeContext = createContext(null)

const PRE_LOGIN_THEME_KEY = 'theme_preference'

function getCurrentUser() {
  try {
    const storedUser = localStorage.getItem('user')

    if (!storedUser) {
      return null
    }

    return JSON.parse(storedUser)
  } catch (error) {
    console.error(
      '❌ Error leyendo usuario para el tema:',
      error
    )

    return null
  }
}

function getThemeStorageKey(user) {
  if (!user?.id) {
    return null
  }

  return `theme_${user.id}`
}

function isValidTheme(value) {
  return value === 'light' || value === 'dark'
}

/**
 * Obtiene el tema actual.
 *
 * Prioridad:
 *
 * 1. Tema del usuario autenticado
 * 2. Tema temporal/pre-login
 * 3. Claro por defecto
 */
function getUserTheme() {
    const user = getCurrentUser()

    if (user?.id) {
        const userStorageKey = getThemeStorageKey(user)
        const savedUserTheme = localStorage.getItem(userStorageKey)

        if (isValidTheme(savedUserTheme)) {
            return savedUserTheme
        }
    }

    const preLoginTheme = localStorage.getItem(PRE_LOGIN_THEME_KEY)

    if (isValidTheme(preLoginTheme)) {
        return preLoginTheme
    }

    return 'dark'
}

export function ThemeProvider({ children }) {

  const [theme, setThemeState] =
    useState(getUserTheme)

  /**
   * Aplica el tema al documento.
   */
  const applyTheme = useCallback(
    (newTheme) => {

      document.documentElement.setAttribute(
        'data-theme',
        newTheme
      )

    },
    []
  )

  /**
   * Aplica el tema cada vez que cambia.
   */
  useEffect(() => {

    applyTheme(theme)

  }, [
    theme,
    applyTheme,
  ])

  /**
   * Cambia y guarda el tema.
   *
   * Si hay usuario:
   *    theme_${user.id}
   *
   * Si no hay usuario:
   *    theme_preference
   */
  const setTheme = useCallback(
    (newTheme) => {

      if (!isValidTheme(newTheme)) {
        return
      }

      const user = getCurrentUser()

      if (user?.id) {

        const storageKey =
          getThemeStorageKey(user)

        localStorage.setItem(
          storageKey,
          newTheme
        )

      } else {

        localStorage.setItem(
          PRE_LOGIN_THEME_KEY,
          newTheme
        )

      }

      setThemeState(newTheme)

    },
    []
  )

  /**
   * Sincroniza el tema cuando cambia
   * el usuario autenticado.
   *
   * Esto es importante porque el evento
   * "storage" NO se dispara en la misma
   * pestaña que modificó localStorage.
   */
  const syncTheme = useCallback(() => {

    const newTheme =
      getUserTheme()

    setThemeState(newTheme)

  }, [])

  /**
   * Cambio de sesión en la misma pestaña.
   */
  useEffect(() => {

    const handleAuthSessionChanged = () => {
      syncTheme()
    }

    window.addEventListener(
      'auth-session-changed',
      handleAuthSessionChanged
    )

    return () => {

      window.removeEventListener(
        'auth-session-changed',
        handleAuthSessionChanged
      )

    }

  }, [syncTheme])

  /**
   * Cambio desde otra pestaña.
   */
  useEffect(() => {

    const handleStorageChange = () => {
      syncTheme()
    }

    window.addEventListener(
      'storage',
      handleStorageChange
    )

    return () => {

      window.removeEventListener(
        'storage',
        handleStorageChange
      )

    }

  }, [syncTheme])

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        syncTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {

  const context =
    useContext(ThemeContext)

  if (!context) {

    throw new Error(
      'useTheme debe utilizarse dentro de ThemeProvider'
    )

  }

  return context
}