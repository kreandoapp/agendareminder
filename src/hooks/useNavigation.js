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
      // =====================================================
      // 🔒 BLOQUEO GLOBAL SI WHATSAPP ESTÁ DESCONECTADO
      // =====================================================

      if (!whatsappConnected) {
        resetOnboarding(5)
        setCurrentPage('onboarding')
        setError('')
        return
      }

      // =====================================================
      // ONBOARDING NORMAL
      // =====================================================

      if (
        !onboardingCompleted &&
        page !== 'onboarding'
      ) {
        setCurrentPage('onboarding')
        setError('')
        return
      }

      setCurrentPage(page)
      setError('')
    },
    [
      whatsappConnected,
      onboardingCompleted,
      resetOnboarding,
      setCurrentPage,
      setError,
    ]
  )

  return navigate
}