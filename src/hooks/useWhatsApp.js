import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

const API_URL =
  'https://kreandoapp.com/api/index.php'

const STATUS_INTERVAL = 5000

const STATUS = {
  CHECKING: 'checking',
  CONNECTING: 'connecting',
  QR: 'qr',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  ERROR: 'error',
}

export default function useWhatsApp({
  onSessionExpired,
} = {}) {

  // =====================================================
  // ESTADO ÚNICO DE WHATSAPP
  // =====================================================

  const [connected, setConnected] =
    useState(false)

  const [phone, setPhone] =
    useState('')

  const [qr, setQr] =
    useState(null)

  const [status, setStatus] =
    useState(STATUS.CHECKING)

  const [error, setError] =
    useState('')

  const statusInterval =
    useRef(null)

  const mounted =
    useRef(true)


  // =====================================================
  // LIMPIAR ESTADO
  // =====================================================

  const resetWhatsAppState =
    useCallback(() => {

      if (!mounted.current) {
        return
      }

      setConnected(false)
      setPhone('')
      setQr(null)
      setStatus(STATUS.DISCONNECTED)
      setError('')

    }, [])


  // =====================================================
  // COMPROBAR ESTADO
  // =====================================================

  const checkStatus =
    useCallback(async () => {

      const token =
        localStorage.getItem(
          'access_token'
        )

      if (!token) {

        resetWhatsAppState()

        return false
      }

      try {

        const response =
          await fetch(
            `${API_URL}?action=whatsapp-status`,
            {
              method: 'GET',

              headers: {
                Authorization:
                  `Bearer ${token}`,

                Accept:
                  'application/json',
              },

              cache: 'no-store',
            }
          )


        const result =
          await response.json()


        // ===============================================
        // SESIÓN EXPIRADA
        // ===============================================

        if (response.status === 401) {

          onSessionExpired?.()

          return false
        }


        // ===============================================
        // ERROR HTTP
        // ===============================================

        if (!response.ok) {

          console.error(
            '❌ Error estado WhatsApp:',
            response.status
          )

          if (mounted.current) {

            setStatus(
              STATUS.ERROR
            )

            setError(
              result?.message ||
              'No se pudo consultar WhatsApp.'
            )
          }

          return false
        }


        // ===============================================
        // NORMALIZAR RESPUESTA
        // ===============================================

        const data =
          result?.data ||
          result ||
          {}


        const isConnected =
          data.connected === true ||
          data.whatsapp_connected === true ||
          data.whatsappConnected === true


        const whatsappPhone =
          data.phone ||
          data.whatsapp_phone ||
          data.whatsappPhone ||
          ''


        // ===============================================
        // WHATSAPP CONECTADO
        // ===============================================

        if (isConnected) {

          if (mounted.current) {

            setConnected(true)

            setPhone(
              whatsappPhone
            )

            setQr(null)

            setError('')

            setStatus(
              STATUS.CONNECTED
            )
          }

          return true
        }


        // ===============================================
        // QR DISPONIBLE
        // ===============================================

        if (data.qr) {

          if (mounted.current) {

            setConnected(false)

            setPhone('')

            setQr(data.qr)

            setError('')

            setStatus(
              STATUS.QR
            )
          }

          return false
        }


        // ===============================================
        // CONECTANDO
        // ===============================================

        if (
          data.connecting === true
        ) {

          if (mounted.current) {

            setConnected(false)

            setPhone('')

            setError('')

            setStatus(
              STATUS.CONNECTING
            )
          }

          return false
        }


        // ===============================================
        // DESCONECTADO
        // ===============================================

        if (mounted.current) {

          setConnected(false)

          setPhone('')

          setQr(null)

          setError('')

          setStatus(
            STATUS.DISCONNECTED
          )
        }

        return false

      } catch (error) {

        console.error(
          '❌ Error consultando WhatsApp:',
          error
        )

        /*
         * Importante:
         *
         * NO ponemos connected=false ante
         * cualquier error de red.
         *
         * Si WhatsApp estaba conectado y la API
         * tarda un momento, no queremos que toda
         * la aplicación muestre falsamente
         * "desconectado".
         */

        if (mounted.current) {

          setStatus(
            STATUS.ERROR
          )

          setError(
            'No se pudo consultar el estado de WhatsApp.'
          )
        }

        return false
      }

    }, [
      onSessionExpired,
      resetWhatsAppState,
    ])


  // =====================================================
  // CONECTAR WHATSAPP
  // =====================================================

  const connect =
    useCallback(async () => {

      const token =
        localStorage.getItem(
          'access_token'
        )

      if (!token) {

        return null
      }


      try {

        setStatus(
          STATUS.CONNECTING
        )

        setError('')


        const response =
          await fetch(
            `${API_URL}?action=whatsapp-connect`,
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',

                Authorization:
                  `Bearer ${token}`,

                Accept:
                  'application/json',
              },

              body:
                JSON.stringify({}),

              cache: 'no-store',
            }
          )


        const result =
          await response.json()


        // ===============================================
        // SESIÓN EXPIRADA
        // ===============================================

        if (response.status === 401) {

          onSessionExpired?.()

          return null
        }


        // ===============================================
        // ERROR
        // ===============================================

        if (!response.ok) {

          setStatus(
            STATUS.ERROR
          )

          setError(
            result?.message ||
            result?.error ||
            'No se pudo iniciar WhatsApp.'
          )

          return null
        }


        // ===============================================
        // YA CONECTADO
        // ===============================================

        if (
          result?.connected === true
        ) {

          setConnected(true)

          setPhone(
            result?.phone ||
            result?.whatsapp_phone ||
            ''
          )

          setQr(null)

          setError('')

          setStatus(
            STATUS.CONNECTED
          )

          return result
        }


        // ===============================================
        // QR
        // ===============================================

        if (result?.qr) {

          setConnected(false)

          setPhone('')

          setQr(result.qr)

          setError('')

          setStatus(
            STATUS.QR
          )

          return result
        }


        // ===============================================
        // CONECTANDO
        // ===============================================

        setConnected(false)

        setError('')

        setStatus(
          STATUS.CONNECTING
        )

        return result

      } catch (error) {

        console.error(
          '❌ Error conectando WhatsApp:',
          error
        )

        setStatus(
          STATUS.ERROR
        )

        setError(
          'No se pudo conectar con WhatsApp.'
        )

        return null
      }

    }, [
      onSessionExpired,
    ])


  // =====================================================
  // DETECTOR AUTOMÁTICO
  // =====================================================

  const startDetector =
    useCallback(() => {

      if (
        statusInterval.current
      ) {

        clearInterval(
          statusInterval.current
        )
      }


      void checkStatus()


      statusInterval.current =
        setInterval(() => {

          void checkStatus()

        }, STATUS_INTERVAL)

    }, [
      checkStatus,
    ])


  // =====================================================
  // DETENER DETECTOR
  // =====================================================

  const stopDetector =
    useCallback(() => {

      if (
        statusInterval.current
      ) {

        clearInterval(
          statusInterval.current
        )

        statusInterval.current =
          null
      }

    }, [])


  // =====================================================
  // DESCONECTAR WHATSAPP
  // =====================================================

  const disconnect =
    useCallback(async () => {

      const token =
        localStorage.getItem(
          'access_token'
        )

      if (!token) {

        return false
      }


      // =================================================
      // IMPORTANTE:
      //
      // NO usamos window.confirm() aquí.
      //
      // La confirmación se realiza mediante el modal
      // personalizado de WhatsAppStatus.
      // =================================================


      try {

        const response =
          await fetch(
            `${API_URL}?action=whatsapp-disconnect`,
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',

                Authorization:
                  `Bearer ${token}`,

                Accept:
                  'application/json',
              },

              body:
                JSON.stringify({}),

              cache: 'no-store',
            }
          )


        const result =
          await response.json()


        // ===============================================
        // SESIÓN EXPIRADA
        // ===============================================

        if (response.status === 401) {

          onSessionExpired?.()

          return false
        }


        // ===============================================
        // ERROR
        // ===============================================

        if (
          !response.ok ||
          !result.success
        ) {

          console.error(
            '❌ No se pudo desconectar WhatsApp:',
            result?.message ||
            result?.error ||
            response.status
          )

          return false
        }


        // ===============================================
        // ESTADO GLOBAL → DESCONECTADO
        // ===============================================

        resetWhatsAppState()

        return true

      } catch (error) {

        console.error(
          '❌ Error desconectando WhatsApp:',
          error
        )

        return false
      }

    }, [
      onSessionExpired,
      resetWhatsAppState,
    ])


  // =====================================================
  // MONTADO / DESMONTADO
  // =====================================================

  useEffect(() => {

    mounted.current = true

    return () => {

      mounted.current = false

      if (
        statusInterval.current
      ) {

        clearInterval(
          statusInterval.current
        )

        statusInterval.current =
          null
      }

    }

  }, [])


  // =====================================================
  // VALORES PÚBLICOS
  // =====================================================

  return {

    // Estado
    connected,
    phone,
    qr,
    status,
    error,

    // Acciones
    connect,
    disconnect,
    checkStatus,

    // Detector
    startDetector,
    stopDetector,

    // Estados disponibles
    STATUS,
  }
}