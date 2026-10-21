import { useCallback } from 'react'

export default function useWhatsAppDisconnect({
  whatsappConnected,
  disconnect,
  setError,
  resetOnboarding,
  setCurrentPage,
} = {}) {

  const disconnectWhatsApp =
    useCallback(
      async () => {

        if (!whatsappConnected) {
          return
        }

        setError('')

        const disconnected =
          await disconnect()

        if (!disconnected) {
          return
        }

        resetOnboarding(5)

        setCurrentPage(
          'onboarding'
        )

        console.log(
          '🔴 WhatsApp desconectado correctamente'
        )

        console.log(
          '🚀 Enviando automáticamente al Paso 5 del onboarding'
        )
      },
      [
        whatsappConnected,
        disconnect,
        setError,
        resetOnboarding,
        setCurrentPage,
      ]
    )

  return {
    disconnectWhatsApp,
  }
}