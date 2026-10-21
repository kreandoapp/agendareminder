import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

import { QRCodeCanvas } from 'qrcode.react'
import './Step5WhatsApp.css'
import { useLanguage } from '../../../context/LanguageContext'
import wilbukLogo from '../../../assets/logo.png'

const API_URL =
  import.meta.env.VITE_API_URL ||
  'https://kreandoapp.com/api/index.php'

const QR_DURATION = 20
const POLL_INTERVAL = 1500
const SERVER_RETRY_INTERVAL = 10000
const AUTO_CONNECT_COOLDOWN = 10000
const REQUEST_TIMEOUT = 6000

const INITIAL_LOADING_DURATION = 5000
const AUTO_FINALIZE_COUNTDOWN = 5

const STATUS = {
  CHECKING: 'checking',
  SERVER_ERROR: 'server_error',
  PREPARING: 'preparing',
  QR: 'qr',
  CONNECTING: 'connecting',
  EXPIRED: 'expired',
  CONNECTED: 'connected',
  ERROR: 'error',
}

function getBusinessId() {
  const value = localStorage.getItem('business_id')

  if (
    !value ||
    value === 'null' ||
    value === 'undefined'
  ) {
    return null
  }

  const id = Number(value)

  return Number.isInteger(id) && id > 0
    ? id
    : null
}

export default function Step5WhatsApp({
  onConnected,
  onSessionExpired,
}) {
  const handleLogout = () => {
    try {
      const rawUser = localStorage.getItem('user')

      if (rawUser) {
        try {
          const user = JSON.parse(rawUser)

          if (user?.id) {
            localStorage.removeItem(`language_${user.id}`)
          }
        } catch {
          // Si el usuario no puede parsearse, continuamos limpiando la sesión.
        }
      }

      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      localStorage.removeItem('language_active')
    } catch (error) {
      console.warn('No se pudo limpiar la sesión local:', error)
    }

    window.location.href = 'https://kreandoapp.com/wilbuk/'
  }

  /*
   * =========================================================
   * IDIOMA
   * =========================================================
   *
   * El usuario puede haber comenzado el onboarding en otro
   * dispositivo.
   *
   * Por eso Step 5 no depende únicamente de localStorage.
   *
   * Al entrar:
   *
   * DB → LanguageContext → localStorage del dispositivo actual
   *
   * De esta forma, si el usuario comenzó en PC y continúa
   * en móvil, el móvil recupera el idioma correcto.
   */
  const {
    t,
    setLanguageFromBusiness,
    supportedLanguages,
    catalogsLoaded,
  } = useLanguage()

  useEffect(() => {
    if (
      !catalogsLoaded ||
      !Array.isArray(
        supportedLanguages
      ) ||
      supportedLanguages.length === 0
    ) {
      return
    }

    let cancelled = false

    async function syncLanguageFromServer() {
      const token =
        localStorage.getItem('access_token')

      if (!token) {
        onSessionExpired?.()
        return
      }

      try {
        const response = await fetch(
          `${API_URL}?action=business-settings`,
          {
            method: 'GET',
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        )

        if (response.status === 401) {
          onSessionExpired?.()
          return
        }

        const result = await response.json()

        if (
          !response.ok ||
          !result?.success
        ) {
          throw new Error(
            result?.message ||
              'Error obteniendo el idioma del negocio.'
          )
        }

        if (cancelled) {
          return
        }

        const business =
          result?.data || {}

        const serverLanguage =
          String(
            business?.language || ''
          )
            .trim()
            .toLowerCase()

        const languageIsSupported =
          Array.isArray(
            supportedLanguages
          ) &&
          supportedLanguages.some(
            language =>
              language.code ===
              serverLanguage
          )

        if (languageIsSupported) {
          /*
           * Actualizamos el idioma efectivo
           * usando el catálogo dinámico de la API.
           */
          setLanguageFromBusiness(
            serverLanguage
          )
        }
      } catch (err) {
        if (cancelled) {
          return
        }

        console.error(
          '❌ Error sincronizando idioma:',
          err
        )

        /*
         * No bloqueamos el Step 5 si falla solamente
         * la sincronización del idioma.
         *
         * El LanguageContext conserva el idioma actual.
         */
      }
    }

    syncLanguageFromServer()

    return () => {
      cancelled = true
    }
  }, [
    onSessionExpired,
    setLanguageFromBusiness,
    supportedLanguages,
    catalogsLoaded,
  ])

  const [businessId, setBusinessId] = useState(null)
  const [status, setStatus] = useState(STATUS.CHECKING)
  const [qr, setQr] = useState(null)
  const [seconds, setSeconds] = useState(QR_DURATION)
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [retrying, setRetrying] = useState(false)
  const [finalizing, setFinalizing] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [finalizeCountdown, setFinalizeCountdown] =
    useState(AUTO_FINALIZE_COUNTDOWN)

  const qrStartedAt = useRef(null)
  const currentQr = useRef(null)

  const timerRef = useRef(null)
  const pollTimerRef = useRef(null)

  const connectRunning = useRef(false)
  const mounted = useRef(true)

  const connectedNotified = useRef(false)

  const lastAutoConnectAt = useRef(0)

  const serverAvailableRef = useRef(null)

  const initialLoadingTimerRef = useRef(null)
  const finalizeCountdownTimerRef = useRef(null)

  /* =========================================================
     CLEANUP
  ========================================================= */

  useEffect(() => {
    mounted.current = true

    return () => {
      mounted.current = false

      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }

      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current)
        pollTimerRef.current = null
      }

      if (initialLoadingTimerRef.current) {
        clearTimeout(
          initialLoadingTimerRef.current
        )

        initialLoadingTimerRef.current = null
      }

      if (finalizeCountdownTimerRef.current) {
        clearInterval(
          finalizeCountdownTimerRef.current
        )

        finalizeCountdownTimerRef.current = null
      }
    }
  }, [])

  /* =========================================================
     BUSINESS ID
  ========================================================= */

  useEffect(() => {
    setBusinessId(getBusinessId())
  }, [])

  /* =========================================================
     INITIAL LOADING
  ========================================================= */

  useEffect(() => {
    if (!businessId) {
      return
    }

    setInitialLoading(true)

    if (initialLoadingTimerRef.current) {
      clearTimeout(
        initialLoadingTimerRef.current
      )
    }

    initialLoadingTimerRef.current =
      setTimeout(() => {
        initialLoadingTimerRef.current = null

        if (mounted.current) {
          setInitialLoading(false)
        }
      }, INITIAL_LOADING_DURATION)

    return () => {
      if (initialLoadingTimerRef.current) {
        clearTimeout(
          initialLoadingTimerRef.current
        )

        initialLoadingTimerRef.current = null
      }
    }
  }, [businessId])

  /* =========================================================
     REQUEST
  ========================================================= */

  const request = useCallback(
    async (url, options = {}) => {
      const controller = new AbortController()

      const timeout = setTimeout(() => {
        controller.abort()
      }, REQUEST_TIMEOUT)

      try {
        const token =
          localStorage.getItem('access_token')

        return await fetch(url, {
          ...options,

          headers: {
            Accept: 'application/json',
            ...(options.headers || {}),

            ...(token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {}),
          },

          signal: controller.signal,
          cache: 'no-store',
        })
      } finally {
        clearTimeout(timeout)
      }
    },
    []
  )

  /* =========================================================
     CLEAR QR
  ========================================================= */

  const clearQr = useCallback(() => {
    currentQr.current = null
    qrStartedAt.current = null

    setQr(null)
    setSeconds(QR_DURATION)
  }, [])

  /* =========================================================
     SERVER AVAILABLE
  ========================================================= */

  const markServerAvailable = useCallback(() => {
    serverAvailableRef.current = true
  }, [])

  /* =========================================================
     SERVER UNAVAILABLE
  ========================================================= */

  const markServerUnavailable = useCallback(
    (message) => {
      const alreadyUnavailable =
        serverAvailableRef.current === false

      serverAvailableRef.current = false

      if (!alreadyUnavailable) {
        console.warn(
          '🔴 Node no disponible:',
          message
        )
      }

      clearQr()

      setPhone('')

      setError(
        message ||
          t(
            'onboarding.step5.errors.serverConnection'
          )
      )

      setStatus(STATUS.SERVER_ERROR)
    },
    [clearQr, t]
  )

  /* =========================================================
     NOTIFY CONNECTED
  ========================================================= */

  const notifyConnected = useCallback(
    (result) => {
      if (connectedNotified.current) {
        return
      }

      connectedNotified.current = true

      if (onConnected) {
        onConnected(result)
      }
    },
    [onConnected]
  )

  /* =========================================================
     PROCESS QR
  ========================================================= */

  const processQr = useCallback((value) => {
    if (!value) {
      return
    }

    if (currentQr.current === value) {
      return
    }

    currentQr.current = value

    qrStartedAt.current = Date.now()

    setQr(value)
    setSeconds(QR_DURATION)

    setError('')
    setStatus(STATUS.QR)
  }, [])

  /* =========================================================
     CHECK STATUS
  ========================================================= */

  const checkStatus = useCallback(
    async ({ allowAutoConnect = false } = {}) => {
      const id = getBusinessId()

      if (!id) {
        setStatus(STATUS.ERROR)

        setError(
          t(
            'onboarding.step5.errors.invalidBusinessId'
          )
        )

        return {
          data: null,
          serverAvailable: false,
        }
      }

      try {
        const response = await request(
          `${API_URL}?action=whatsapp-status&business_id=${encodeURIComponent(
            id
          )}`,
          {
            method: 'GET',
            headers: {
              Accept: 'application/json',
            },
          }
        )

        const text = await response.text()

        let result = {}

        try {
          result = JSON.parse(text)
        } catch {
          result = {}
        }

        if (response.status === 401) {
          onSessionExpired?.()

          return {
            data: null,
            serverAvailable: false,
          }
        }

        if (!response.ok) {
          markServerUnavailable(
            result?.error ||
              result?.message ||
              t(
                'onboarding.step5.errors.serverResponse',
                {
                  status: response.status,
                }
              )
          )

          return {
            data: null,
            serverAvailable: false,
          }
        }

        markServerAvailable()

        /* CONNECTED */

        if (result?.connected === true) {
          clearQr()

          setPhone(
            result?.phone ||
              result?.whatsapp_phone ||
              ''
          )

          setError('')
          setStatus(STATUS.CONNECTED)

          return {
            data: result,
            serverAvailable: true,
          }
        }

        /* QR */

        if (result?.qr) {
          processQr(result.qr)

          return {
            data: result,
            serverAvailable: true,
          }
        }

        /* CONNECTING */

        if (result?.connecting === true) {
          setStatus(STATUS.CONNECTING)

          return {
            data: result,
            serverAvailable: true,
          }
        }

        /*
         * Si ya tenemos un QR válido,
         * no lo borramos.
         */

        if (currentQr.current) {
          return {
            data: result,
            serverAvailable: true,
          }
        }

        /* PREPARING */

        setError('')
        setStatus(STATUS.PREPARING)

        if (
          allowAutoConnect &&
          !connectRunning.current &&
          Date.now() -
            lastAutoConnectAt.current >=
            AUTO_CONNECT_COOLDOWN
        ) {
          lastAutoConnectAt.current =
            Date.now()

          void connectWhatsApp({
            automatic: true,
          })
        }

        return {
          data: result,
          serverAvailable: true,
        }
      } catch (err) {
        if (err?.name === 'AbortError') {
          markServerUnavailable(
            t(
              'onboarding.step5.errors.serverTimeout'
            )
          )
        } else {
          markServerUnavailable(
            t(
              'onboarding.step5.errors.serverConnection'
            )
          )
        }

        return {
          data: null,
          serverAvailable: false,
        }
      }
    },
    [
      clearQr,
      markServerAvailable,
      markServerUnavailable,
      onSessionExpired,
      processQr,
      request,
      t,
    ]
  )

  /* =========================================================
     CONNECT WHATSAPP
  ========================================================= */

  const connectWhatsApp = useCallback(
    async ({ automatic = false } = {}) => {
      const id = getBusinessId()

      if (!id) {
        setStatus(STATUS.ERROR)

        setError(
          t(
            'onboarding.step5.errors.invalidBusinessId'
          )
        )

        return null
      }

      if (connectRunning.current) {
        return null
      }

      connectRunning.current = true

      try {
        setStatus(STATUS.PREPARING)
        setError('')

        const response = await request(
          `${API_URL}?action=whatsapp-connect`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
              Accept:
                'application/json',
            },

            body: JSON.stringify({
              business_id: id,
            }),
          }
        )

        const text = await response.text()

        let result = {}

        try {
          result = JSON.parse(text)
        } catch {
          result = {}
        }

        if (response.status === 401) {
          onSessionExpired?.()

          return null
        }

        if (!response.ok) {
          markServerUnavailable(
            result?.error ||
              result?.message ||
              t(
                'onboarding.step5.errors.connectFailed',
                {
                  status: response.status,
                }
              )
          )

          return null
        }

        markServerAvailable()

        if (result?.connected === true) {
          clearQr()

          setPhone(
            result?.phone ||
              result?.whatsapp_phone ||
              ''
          )

          setError('')
          setStatus(STATUS.CONNECTED)

          return result
        }

        if (result?.qr) {
          processQr(result.qr)
        } else {
          setStatus(STATUS.CONNECTING)
        }

        return result
      } catch (err) {
        if (err?.name === 'AbortError') {
          markServerUnavailable(
            t(
              'onboarding.step5.errors.serverTimeout'
            )
          )
        } else {
          markServerUnavailable(
            t(
              'onboarding.step5.errors.serverConnection'
            )
          )
        }

        return null
      } finally {
        connectRunning.current = false
      }
    },
    [
      clearQr,
      markServerAvailable,
      markServerUnavailable,
      onSessionExpired,
      processQr,
      request,
      t,
    ]
  )

  /* =========================================================
     POLLING
  ========================================================= */

  const scheduleNextPoll = useCallback(
    (delay) => {
      if (pollTimerRef.current) {
        clearTimeout(
          pollTimerRef.current
        )
      }

      pollTimerRef.current =
        setTimeout(() => {
          pollTimerRef.current = null

          if (!mounted.current) {
            return
          }

          void runPoll()
        }, delay)
    },
    []
  )

  const runPoll = useCallback(
    async () => {
      if (!mounted.current) {
        return
      }

      const result = await checkStatus({
        allowAutoConnect: true,
      })

      if (!mounted.current) {
        return
      }

      scheduleNextPoll(
        result?.serverAvailable
          ? POLL_INTERVAL
          : SERVER_RETRY_INTERVAL
      )
    },
    [checkStatus, scheduleNextPoll]
  )

  useEffect(() => {
    if (!businessId) {
      return
    }

    connectedNotified.current = false
    lastAutoConnectAt.current = 0
    serverAvailableRef.current = null

    if (pollTimerRef.current) {
      clearTimeout(
        pollTimerRef.current
      )

      pollTimerRef.current = null
    }

    void runPoll()

    return () => {
      if (pollTimerRef.current) {
        clearTimeout(
          pollTimerRef.current
        )

        pollTimerRef.current = null
      }
    }
  }, [businessId, runPoll])

  /* =========================================================
     RETRY
  ========================================================= */

  const retry = async () => {
    if (retrying) {
      return
    }

    setRetrying(true)

    setStatus(STATUS.CHECKING)
    setError('')

    lastAutoConnectAt.current = 0

    const result = await checkStatus({
      allowAutoConnect: true,
    })

    if (!mounted.current) {
      return
    }

    setRetrying(false)

    scheduleNextPoll(
      result?.serverAvailable
        ? POLL_INTERVAL
        : SERVER_RETRY_INTERVAL
    )
  }

  /* =========================================================
     FINALIZE ONBOARDING
  ========================================================= */

  const handleFinalize = async () => {
    if (finalizing) {
      return
    }

    const id = getBusinessId()

    if (!id) {
      setError(
        t(
          'onboarding.step5.errors.invalidBusinessId'
        )
      )

      return
    }

    setFinalizing(true)
    setError('')

    try {
      const response = await request(
        `${API_URL}?action=onboarding-step`,
        {
          method: 'PUT',

          headers: {
            'Content-Type':
              'application/json',
            Accept:
              'application/json',
          },

          body: JSON.stringify({
            current_step: 5,
          }),
        }
      )

      const text = await response.text()

      let result = {}

      try {
        result = JSON.parse(text)
      } catch {
        result = {}
      }

      if (response.status === 401) {
        onSessionExpired?.()

        return
      }

      if (!response.ok) {
        setError(
          result?.error ||
            result?.message ||
            t(
              'onboarding.step5.errors.finalize'
            )
        )

        return
      }

      if (
        result?.success === true &&
        result?.data?.completed === true
      ) {
        connectedNotified.current = true

        if (onConnected) {
          onConnected({
            ...result,
            completed: true,
            onboarding_completed: true,
          })
        }

        return
      }

      setError(
        t(
          'onboarding.step5.errors.notCompleted'
        )
      )
    } catch (err) {
      if (err?.name === 'AbortError') {
        setError(
          t(
            'onboarding.step5.errors.finalizeTimeout'
          )
        )
      } else {
        setError(
          t(
            'onboarding.step5.errors.finalize'
          )
        )
      }
    } finally {
      if (mounted.current) {
        setFinalizing(false)
      }
    }
  }

  /* =========================================================
     AUTO FINALIZE COUNTDOWN
  ========================================================= */

  useEffect(() => {
    if (status !== STATUS.CONNECTED) {
      if (
        finalizeCountdownTimerRef.current
      ) {
        clearInterval(
          finalizeCountdownTimerRef.current
        )

        finalizeCountdownTimerRef.current =
          null
      }

      setFinalizeCountdown(
        AUTO_FINALIZE_COUNTDOWN
      )

      return
    }

    setFinalizeCountdown(
      AUTO_FINALIZE_COUNTDOWN
    )

    if (
      finalizeCountdownTimerRef.current
    ) {
      clearInterval(
        finalizeCountdownTimerRef.current
      )
    }

    finalizeCountdownTimerRef.current =
      setInterval(() => {
        if (!mounted.current) {
          return
        }

        setFinalizeCountdown(
          current => {
            if (current <= 1) {
              clearInterval(
                finalizeCountdownTimerRef.current
              )

              finalizeCountdownTimerRef.current =
                null

              void handleFinalize()

              return 0
            }

            return current - 1
          }
        )
      }, 1000)

    return () => {
      if (
        finalizeCountdownTimerRef.current
      ) {
        clearInterval(
          finalizeCountdownTimerRef.current
        )

        finalizeCountdownTimerRef.current =
          null
      }
    }
  }, [status])

  /* =========================================================
     QR TIMER
  ========================================================= */

  useEffect(() => {
    if (status !== STATUS.QR || !qr) {
      return
    }

    if (timerRef.current) {
      clearInterval(
        timerRef.current
      )
    }

    timerRef.current = setInterval(() => {
      if (!qrStartedAt.current) {
        return
      }

      const elapsed = Math.floor(
        (Date.now() -
          qrStartedAt.current) /
          1000
      )

      const remaining = Math.max(
        0,
        QR_DURATION - elapsed
      )

      setSeconds(remaining)

      if (remaining <= 0) {
        clearInterval(
          timerRef.current
        )

        timerRef.current = null

        currentQr.current = null
        qrStartedAt.current = null

        setQr(null)
        setStatus(STATUS.EXPIRED)
      }
    }, 250)

    return () => {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [qr, status])

  /* =========================================================
     QR PROGRESS
  ========================================================= */

  const progress = Math.max(
    0,
    Math.min(
      100,
      (seconds / QR_DURATION) * 100
    )
  )

  /* =========================================================
     START
  ========================================================= */

  const handleStart = () => {
    if (
      retrying ||
      connectRunning.current
    ) {
      return
    }

    lastAutoConnectAt.current = 0
    connectedNotified.current = false

    void connectWhatsApp({
      automatic: false,
    })
  }

  /* =========================================================
     LOADING COMPONENT
  ========================================================= */

  const Loading = ({
    icon,
    title,
    text,
  }) => (
    <div className="step5-state">

      <div className="step5-state-icon">
        {icon}
      </div>

      <h2>{title}</h2>

      <p>{text}</p>

      <div className="step5-spinner" />

    </div>
  )

  /* =========================================================
     INITIAL LOADING
  ========================================================= */

  if (initialLoading) {
    return (
      <div className="step5-whatsapp">

        <div className="step5-container">

          <div
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              marginBottom: '18px',
            }}
          >
            <div className="step5-brand">
  <div
    className="step5-brand-icon"
    style={{
      background: 'transparent',
      boxShadow: 'none',
    }}
  >
    <img
      src={wilbukLogo}
      alt="Wilbuk"
      style={{
        width: '34px',
        height: '34px',
        objectFit: 'contain',
        display: 'block',
      }}
    />
  </div>

  <div className="step5-brand-name">
    <span
      style={{
        color: 'var(--color-text)',
        fontWeight: 800,
      }}
    >
      Wil
    </span>
    <span
      style={{
        background:
          'linear-gradient(135deg, #08bdf5 0%, #168cff 42%, #6638ff 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        fontWeight: 800,
      }}
    >
      buk
    </span>
  </div>
</div>
          
            <button
              type="button"
              onClick={handleLogout}
              style={{
                flexShrink: 0,
                border: 'none',
                background: 'transparent',
                color: 'var(--color-text-secondary, #7a8490)',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                padding: '7px 9px',
                borderRadius: '8px',
                transition: 'color 0.2s ease, background 0.2s ease',
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.color =
                  'var(--color-danger, #d94b4b)'
                event.currentTarget.style.background =
                  'rgba(217, 75, 75, 0.06)'
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.color =
                  'var(--color-text-secondary, #7a8490)'
                event.currentTarget.style.background =
                  'transparent'
              }}
            >
              {t('sidebar.logout')}
            </button>
          </div>

          <div className="step5-progress">

            <div className="step5-progress-info">

              <span>
                {t(
                  'onboarding.initialSetup'
                )}
              </span>

              <strong>
                {t(
                  'onboarding.step5.progress'
                )}
              </strong>

            </div>

            <div className="step5-progress-track">

              <div className="step5-progress-bar" />

            </div>

          </div>

          <div className="step5-card">

            <Loading
              icon="📱"
              title={t(
                'onboarding.step5.initialLoading.title'
              )}
              text={t(
                'onboarding.step5.initialLoading.text'
              )}
            />

          </div>

        </div>

      </div>
    )
  }

  /* =========================================================
     MAIN
  ========================================================= */

  return (
    <div className="step5-whatsapp">

      <div className="step5-container">

        {/* BRAND */}

        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            marginBottom: '18px',
          }}
        >
          <div className="step5-brand">
  <div
    className="step5-brand-icon"
    style={{
      background: 'transparent',
      boxShadow: 'none',
    }}
  >
    <img
      src={wilbukLogo}
      alt="Wilbuk"
      style={{
        width: '34px',
        height: '34px',
        objectFit: 'contain',
        display: 'block',
      }}
    />
  </div>

  <div className="step5-brand-name">
    <span
      style={{
        color: 'var(--color-text)',
        fontWeight: 800,
      }}
    >
      Wil
    </span>
    <span
      style={{
        background:
          'linear-gradient(135deg, #08bdf5 0%, #168cff 42%, #6638ff 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        fontWeight: 800,
      }}
    >
      buk
    </span>
  </div>
</div>
        
          <button
            type="button"
            onClick={handleLogout}
            style={{
              flexShrink: 0,
              border: 'none',
              background: 'transparent',
              color: 'var(--color-text-secondary, #7a8490)',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              padding: '7px 9px',
              borderRadius: '8px',
              transition: 'color 0.2s ease, background 0.2s ease',
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.color =
                'var(--color-danger, #d94b4b)'
              event.currentTarget.style.background =
                'rgba(217, 75, 75, 0.06)'
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.color =
                'var(--color-text-secondary, #7a8490)'
              event.currentTarget.style.background =
                'transparent'
            }}
          >
            {t('sidebar.logout')}
          </button>
        </div>

        {/* PROGRESS */}

        <div className="step5-progress">

          <div className="step5-progress-info">

            <span>
              {t(
                'onboarding.initialSetup'
              )}
            </span>

            <strong>
              {t(
                'onboarding.step5.progress'
              )}
            </strong>

          </div>

          <div className="step5-progress-track">

            <div className="step5-progress-bar" />

          </div>

        </div>

        {/* CONNECTED */}

        {status === STATUS.CONNECTED ? (

          <div className="step5-card">

            <div className="step5-connected-minimal">

              <div className="step5-connected-icon">
                ✓
              </div>

              <div className="step5-connected-badge">
                {t(
                  'onboarding.step5.connected.title'
                )}
              </div>

              {phone && (
                <div className="step5-phone">
                  +{phone}
                </div>
              )}

              <button
                type="button"
                className="step5-primary-button step5-finalize-button"
                onClick={handleFinalize}
                disabled={finalizing}
              >
                {finalizing
                  ? t(
                      'onboarding.step5.finalizing'
                    )
                  : `${t(
                      'onboarding.step5.finalizeIn'
                    )} ${finalizeCountdown}`}
              </button>

              <button
                type="button"
                className="step5-finalize-now"
                onClick={handleFinalize}
                disabled={finalizing}
              >
                {t(
                  'onboarding.step5.finalizeNow'
                )}
              </button>

              <div className="step5-connected-note">
                {t(
                  'onboarding.step5.connected.note'
                )}
              </div>

            </div>

          </div>

        ) : (

          <div className="step5-card">

            {/* HEADER */}

            {status !== STATUS.QR && (
              <>
                <div className="step5-icon-box">
                  📱
                </div>

                <h1>
                  {t(
                    'onboarding.step5.title'
                  )}
                </h1>

                <p className="step5-description">
                  {t(
                    'onboarding.step5.description'
                  )}
                </p>
              </>
            )}

            {/* CHECKING */}

            {status === STATUS.CHECKING && (
              <Loading
                icon="📡"
                title={t(
                  'onboarding.step5.checking.title'
                )}
                text={t(
                  'onboarding.step5.checking.text'
                )}
              />
            )}

            {/* PREPARING */}

            {status === STATUS.PREPARING && (
              <Loading
                icon="📱"
                title={t(
                  'onboarding.step5.preparing.title'
                )}
                text={t(
                  'onboarding.step5.preparing.text'
                )}
              />
            )}

            {/* CONNECTING */}

            {status === STATUS.CONNECTING && (
              <Loading
                icon="🔄"
                title={t(
                  'onboarding.step5.connecting.title'
                )}
                text={t(
                  'onboarding.step5.connecting.text'
                )}
              />
            )}

            {/* SERVER ERROR */}

            {status === STATUS.SERVER_ERROR && (
              <div className="step5-message-state">

                <div className="step5-message-icon">
                  ⚠️
                </div>

                <h2>
                  {t(
                    'onboarding.step5.serverError.title'
                  )}
                </h2>

                <p>
                  {t(
                    'onboarding.step5.serverError.text'
                  )}
                </p>

                <button
                  type="button"
                  className="step5-primary-button"
                  onClick={retry}
                  disabled={retrying}
                >
                  {retrying
                    ? t(
                        'onboarding.step5.retry.checking'
                      )
                    : t(
                        'onboarding.step5.retry.connection'
                      )}
                </button>

              </div>
            )}

            {/* GENERAL ERROR */}

            {status === STATUS.ERROR && (
              <div className="step5-message-state">

                <div className="step5-message-icon">
                  ❌
                </div>

                <h2>
                  {t(
                    'onboarding.step5.generalError.title'
                  )}
                </h2>

                <p>
                  {error}
                </p>

                <button
                  type="button"
                  className="step5-primary-button"
                  onClick={retry}
                  disabled={retrying}
                >
                  {t(
                    'onboarding.step5.retry.connection'
                  )}
                </button>

              </div>
            )}

            {/* EXPIRED */}

            {status === STATUS.EXPIRED && (
              <div className="step5-message-state">

                <div className="step5-message-icon">
                  ⏱️
                </div>

                <h2>
                  {t(
                    'onboarding.step5.expired.title'
                  )}
                </h2>

                <p>
                  {t(
                    'onboarding.step5.expired.text'
                  )}
                </p>

                <button
                  type="button"
                  className="step5-primary-button"
                  onClick={handleStart}
                  disabled={retrying}
                >
                  {t(
                    'onboarding.step5.expired.button'
                  )}
                </button>

              </div>
            )}

            {/* QR */}

            {status === STATUS.QR && qr && (
              <div className="step5-qr-layout">

                <div className="step5-qr-column">

                  <div className="step5-qr-frame">

                    <QRCodeCanvas
                      value={qr}
                      size={220}
                      level="M"
                      includeMargin
                      className="step5-qr"
                    />

                  </div>

                </div>

                <div className="step5-qr-content">

                  <div className="step5-qr-badge">

                    <span className="step5-live-dot" />

                    {t(
                      'onboarding.step5.qr.active'
                    )}

                  </div>

                  <h2>
                    {t(
                      'onboarding.step5.title'
                    )}
                  </h2>

                  <p className="step5-qr-help">
                    {t(
                      'onboarding.step5.qr.help'
                    )}
                  </p>

                  <div className="step5-steps">

                    <div className="step5-step">

                      <span className="step5-step-number">
                        1
                      </span>

                      <span>
                        {t(
                          'onboarding.step5.qr.step1'
                        )}
                      </span>

                    </div>

                    <div className="step5-step">

                      <span className="step5-step-number">
                        2
                      </span>

                      <span>
                        {t(
                          'onboarding.step5.qr.step2'
                        )}
                      </span>

                    </div>

                    <div className="step5-step">

                      <span className="step5-step-number">
                        3
                      </span>

                      <span>
                        {t(
                          'onboarding.step5.qr.step3'
                        )}
                      </span>

                    </div>

                  </div>

                  <div className="step5-help">

                    <span>?</span>

                    <span>
                      {t(
                        'onboarding.step5.qr.helpLink'
                      )}
                    </span>

                  </div>

                  <div className="step5-qr-expiration">

                    {t(
                      'onboarding.step5.qr.validFor'
                    )}{' '}
                    {seconds}{' '}
                    {t(
                      'onboarding.step5.qr.seconds'
                    )}

                  </div>

                  <div className="step5-progress-qr">

                    <div
                      style={{
                        width: `${progress}%`,
                      }}
                    />

                  </div>

                </div>

              </div>
            )}

            {/* CONNECT BUTTON */}

            {![
              STATUS.QR,
              STATUS.CONNECTED,
              STATUS.CHECKING,
              STATUS.CONNECTING,
              STATUS.SERVER_ERROR,
              STATUS.ERROR,
              STATUS.EXPIRED,
            ].includes(status) && (
              <button
                type="button"
                className="step5-primary-button"
                onClick={handleStart}
              >
                {t(
                  'onboarding.step5.connectButton'
                )}
              </button>
            )}

            {/* ERROR */}

            {error &&
              status !== STATUS.SERVER_ERROR &&
              status !== STATUS.ERROR && (
                <div className="step5-error">
                  {error}
                </div>
              )}

          </div>
        )}

      </div>

    </div>
  )
}
