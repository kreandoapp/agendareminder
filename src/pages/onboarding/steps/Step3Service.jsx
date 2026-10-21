import { useEffect, useState } from 'react'
import './Step3Service.css'
import { useLanguage } from '../../../context/LanguageContext'
import wilbukLogo from '../../../assets/logo.png'

const API_URL =
  import.meta.env.VITE_API_URL ||
  'https://kreandoapp.com/api/index.php'

function ServiceIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 3v18" />
      <path d="M18 3v18" />
      <path d="M6 3c0 4 3 6 6 6s6-2 6-6" />
      <path d="M6 21c0-4 3-6 6-6s6 2 6 6" />
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export default function Step3Service({
  onNext,
  onSaved,
  onSessionExpired,
}) {
  const {
    t,
    setLanguageFromBusiness,
    supportedLanguages,
    catalogsLoaded,
  } = useLanguage()

  const [serviceName, setServiceName] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState('')
  const [price, setPrice] = useState('')
  const [color, setColor] = useState('#25D366')

  const [currencySymbol, setCurrencySymbol] =
    useState('')

  const [loadingBusiness, setLoadingBusiness] =
    useState(true)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const canContinue =
    serviceName.trim() !== '' &&
    Number(duration) > 0 &&
    Number(duration) % 5 === 0 &&
    (price === '' || Number(price) >= 0)

  /*
   * ============================================================
   * CARGAR CONFIGURACIÓN DEL NEGOCIO
   * ============================================================
   *
   * Esta petición obtiene:
   *
   * - currency_symbol
   * - language
   *
   * El idioma viene de la DB porque este dispositivo podría
   * no tener todavía localStorage.
   *
   * DB → LanguageContext → localStorage
   */

  useEffect(() => {
    if (
      !catalogsLoaded ||
      !Array.isArray(
        supportedLanguages
      ) ||
      supportedLanguages.length === 0
    ) {
      setLoadingBusiness(false)
      return
    }

    let cancelled = false

    async function loadBusinessSettings() {
      const token =
        localStorage.getItem('access_token')

      if (!token) {
        if (!cancelled) {
          setLoadingBusiness(false)
        }

        onSessionExpired?.()
        return
      }

      try {
        setLoadingBusiness(true)
        setError('')

        const response = await fetch(
          `${API_URL}?action=business-settings`,
          {
            method: 'GET',
            headers: {
              Accept: 'application/json',
              Authorization:
                `Bearer ${token}`,
            },
          }
        )

        if (response.status === 401) {
          onSessionExpired?.()
          return
        }

        const result =
          await response.json()

        if (
          !response.ok ||
          !result?.success
        ) {
          throw new Error(
            result?.message ||
              t(
                'onboarding.step3.errors.loadBusiness'
              )
          )
        }

        if (cancelled) {
          return
        }

        const business =
          result?.data || {}

        /*
         * ========================================================
         * IDIOMA
         * ========================================================
         */

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

        /*
         * ========================================================
         * MONEDA
         * ========================================================
         */

        const symbol =
          business?.currency_symbol || ''

        setCurrencySymbol(
          String(symbol).trim()
        )
      } catch (err) {
        if (cancelled) {
          return
        }

        console.error(
          '❌ Error cargando configuración del negocio:',
          err
        )

        setError(
          err?.message ||
            t(
              'onboarding.step3.errors.loadBusiness'
            )
        )
      } finally {
        if (!cancelled) {
          setLoadingBusiness(false)
        }
      }
    }

    loadBusinessSettings()

    return () => {
      cancelled = true
    }
  }, [
    onSessionExpired,
    setLanguageFromBusiness,
    supportedLanguages,
    catalogsLoaded,
    t,
  ])

  /*
   * ============================================================
   * CONTINUAR
   * ============================================================
   */

  const handleContinue = async () => {
    if (saving) {
      return
    }

    const token =
      localStorage.getItem('access_token')

    if (!token) {
      onSessionExpired?.()
      return
    }

    if (!canContinue) {
      setError(
        t(
          'onboarding.step3.errors.invalidForm'
        )
      )

      return
    }

    if (!currencySymbol) {
      setError(
        t(
          'onboarding.step3.errors.missingCurrency'
        )
      )

      return
    }

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const payload = {
        service_name:
          serviceName.trim(),

        service_description:
          description.trim() || null,

        service_duration:
          Number(duration),

        service_price:
          price === ''
            ? null
            : Number(price),

        service_color:
          color,

        is_active: true,
      }

      const response =
        await fetch(
          `${API_URL}?action=service`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',

              Accept:
                'application/json',

              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify(payload),
          }
        )

      if (response.status === 401) {
        onSessionExpired?.()
        return
      }

      const result =
        await response.json()

      if (
        !response.ok ||
        !result?.success
      ) {
        throw new Error(
          result?.message ||
            t(
              'onboarding.step3.errors.createService'
            )
        )
      }

      /*
       * Actualizar onboarding → Step 4
       */

      const onboardingResponse =
        await fetch(
          `${API_URL}?action=onboarding-step`,
          {
            method: 'PUT',

            headers: {
              'Content-Type':
                'application/json',

              Accept:
                'application/json',

              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify({
                current_step: 4,
              }),
          }
        )

      if (
        onboardingResponse.status === 401
      ) {
        onSessionExpired?.()
        return
      }

      const onboardingResult =
        await onboardingResponse.json()

      if (
        !onboardingResponse.ok ||
        !onboardingResult?.success
      ) {
        throw new Error(
          onboardingResult?.message ||
            t(
              'onboarding.step3.errors.advance'
            )
        )
      }

      /*
       * Datos guardados
       */

      const savedData = {
        ...payload,

        id:
          result?.data?.id ||
          result?.data?.service_id ||
          null,

        currency_symbol:
          currencySymbol,
      }

      setSuccess(
        t(
          'onboarding.step3.success'
        )
      )

      onSaved?.(savedData)
      onNext?.(savedData)
    } catch (err) {
      console.error(
        '❌ Error creando servicio:',
        err
      )

      setError(
        err?.message ||
          t(
            'onboarding.step3.errors.createService'
          )
      )
    } finally {
      setSaving(false)
    }
  }

  /*
   * ============================================================
   * CERRAR SESIÓN
   * ============================================================
   */

  function handleLogout() {
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
      console.warn(
        'No se pudo limpiar la sesión local:',
        error
      )
    }

    window.location.href = `${import.meta.env.BASE_URL}login`
  }

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <div className="step3-service">
      <div className="step3-container">

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
          <div className="step3-brand">

            <div className="step3-brand-icon">
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

            <div className="step3-brand-name">
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

        {/* PROGRESO */}

        <div className="step3-progress">

          <div className="step3-progress-info">

            <span>
              {t(
                'onboarding.initialSetup'
              )}
            </span>

            <strong>
              {t(
                'onboarding.step3.progress'
              )}
            </strong>

          </div>

          <div className="step3-progress-track">
            <div className="step3-progress-bar" />
          </div>

        </div>

        {/* CARD */}

        <div className="step3-card">

          <div className="step3-icon-box">
            <ServiceIcon />
          </div>

          <h1>
            {t(
              'onboarding.step3.title'
            )}
          </h1>

          <p className="step3-description">
            {t(
              'onboarding.step3.description'
            )}
          </p>

          <div className="step3-form">

            {/* NOMBRE */}

            <div className="step3-field step3-field-full">

              <label htmlFor="step3-name">
                {t(
                  'onboarding.step3.serviceName'
                )}
              </label>

              <input
                id="step3-name"
                type="text"
                value={serviceName}
                onChange={e => {
                  setServiceName(
                    e.target.value
                  )

                  setError('')
                  setSuccess('')
                }}
                placeholder={t(
                  'onboarding.step3.serviceNamePlaceholder'
                )}
                maxLength={255}
                disabled={saving}
                autoFocus
              />

            </div>

            {/* DESCRIPCIÓN */}

            <div className="step3-field step3-field-full">

              <label htmlFor="step3-description">

                {t(
                  'onboarding.step3.descriptionLabel'
                )}

                <span className="step3-optional">
                  {t(
                    'onboarding.optional'
                  )}
                </span>

              </label>

              <textarea
                id="step3-description"
                value={description}
                onChange={e => {
                  setDescription(
                    e.target.value
                  )

                  setError('')
                  setSuccess('')
                }}
                placeholder={t(
                  'onboarding.step3.descriptionPlaceholder'
                )}
                rows={3}
                disabled={saving}
              />

            </div>

            {/* DURACIÓN + PRECIO */}

            <div className="step3-two-columns">

              <div className="step3-field">

                <label htmlFor="step3-duration">
                  {t(
                    'onboarding.step3.duration'
                  )}
                </label>

                <div className="step3-input-with-suffix">

                  <input
                    id="step3-duration"
                    type="number"
                    min="5"
                    step="5"
                    value={duration}
                    onChange={e => {
                      setDuration(
                        e.target.value
                      )

                      setError('')
                      setSuccess('')
                    }}
                    placeholder="30"
                    disabled={saving}
                  />

                  <span>
                    {t(
                      'onboarding.step3.minutes'
                    )}
                  </span>

                </div>

              </div>

              <div className="step3-field">

                <label htmlFor="step3-price">

                  {t(
                    'onboarding.step3.price'
                  )}

                  <span className="step3-optional">
                    {t(
                      'onboarding.optional'
                    )}
                  </span>

                </label>

                <div className="step3-input-with-suffix">

                  <input
                    id="step3-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={e => {
                      setPrice(
                        e.target.value
                      )

                      setError('')
                      setSuccess('')
                    }}
                    placeholder="0,00"
                    disabled={
                      saving ||
                      loadingBusiness
                    }
                  />

                  <span>
                    {loadingBusiness
                      ? '...'
                      : currencySymbol}
                  </span>

                </div>

              </div>

            </div>

            {/* COLOR */}

            <div className="step3-field step3-field-full">

              <label htmlFor="step3-color">
                {t(
                  'onboarding.step3.color'
                )}
              </label>

              <div className="step3-color-row">

                <div
                  className="step3-color-preview"
                  style={{
                    backgroundColor:
                      color,
                  }}
                />

                <input
                  id="step3-color"
                  type="color"
                  value={color}
                  onChange={e => {
                    setColor(
                      e.target.value
                    )

                    setError('')
                    setSuccess('')
                  }}
                  disabled={saving}
                />

                <span>
                  {t(
                    'onboarding.step3.colorDescription'
                  )}
                </span>

              </div>

            </div>

          </div>

          {/* ERROR */}

          {error && (
            <div className="step3-error">
              {error}
            </div>
          )}

          {/* SUCCESS */}

          {success && (
            <div className="step3-success">

              <CheckIcon />

              <span>
                {success}
              </span>

            </div>
          )}

          {/* BUTTON */}

          <div className="step3-actions">

            <button
              type="button"
              className="step3-continue"
              disabled={
                saving ||
                !canContinue ||
                loadingBusiness ||
                !currencySymbol
              }
              onClick={
                handleContinue
              }
            >

              {saving ? (
                <>
                  <span className="step3-spinner" />

                  {t(
                    'onboarding.step3.creating'
                  )}
                </>
              ) : (
                <>
                  {t(
                    'onboarding.step3.createButton'
                  )}

                  <ArrowRightIcon />
                </>
              )}

            </button>

          </div>

        </div>
      </div>
    </div>
  )
}