import { useCallback } from 'react'

export default function useNavigation({
  whatsappConnected,
  onboardingCompleted,
  resetOnboarding,
  setCurrentPage,
  setError,
}) {
  const navigate = useCallback(
    (page) => {
      // Solo mostramos el onboarding cuando el usuario lo solicita
      // explícitamente. La navegación normal no debe bloquearse
      // porque WhatsApp esté desconectado.

      if (page === 'onboarding') {
        resetOnboarding(5)
        setCurrentPage('onboarding')
        setError('')
        return
      }

      // Si el onboarding no está completo, no permitimos acceder
      // a las páginas normales.
      if (!onboardingCompleted) {
        setCurrentPage('onboarding')
        setError('')
        return
      }

      setCurrentPage(page)
      setError('')
    },
    [
      onboardingCompleted,
      resetOnboarding,
      setCurrentPage,
      setError,
    ]
  )

  return navigate
}