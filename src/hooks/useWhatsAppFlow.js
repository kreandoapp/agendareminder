import { useCallback } from 'react'

export default function useWhatsAppFlow({
  checkStatus,
  startDetector,
  resetOnboarding,
  setCurrentPage,
} = {}) {

  // =====================================================
  // COMPROBAR ESTADO DE WHATSAPP
  // =====================================================

  const checkWhatsAppStatus =
    useCallback(
      async () => {

        if (
          typeof checkStatus !== 'function'
        ) {

          console.error(
            '❌ useWhatsAppFlow: checkStatus de WhatsApp no está disponible'
          )

          return false
        }

        const connected =
          await checkStatus()

        if (!connected) {

          resetOnboarding?.(5)

          setCurrentPage?.(
            'onboarding'
          )
        }

        return connected
      },
      [
        checkStatus,
        resetOnboarding,
        setCurrentPage,
      ]
    )


  // =====================================================
  // INICIAR DETECTOR DE WHATSAPP
  // =====================================================

  const startWhatsAppDetector =
    useCallback(
      () => {

        if (
          typeof startDetector !== 'function'
        ) {

          console.error(
            '❌ useWhatsAppFlow: startDetector de WhatsApp no está disponible'
          )

          return
        }

        startDetector()

      },
      [
        startDetector,
      ]
    )


  return {
    checkWhatsAppStatus,
    startWhatsAppDetector,
  }
}