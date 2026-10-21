import { useEffect, useState } from 'react'
import './Step4Employee.css'
import { useLanguage } from '../../../context/LanguageContext'
import wilbukLogo from '../../../assets/logo.png'

const API_URL =
  import.meta.env.VITE_API_URL ||
  'https://kreandoapp.com/api/index.php'

function EmployeeIcon() {
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
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c.8-4 3.5-6 8-6s7.2 2 8 6" />
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

export default function Step4Employee({
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

  const [languageSyncing, setLanguageSyncing] =
    useState(true)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [color, setColor] = useState('#22C55E')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const colorPresets = [
    '#22C55E',
    '#3B82F6',
    '#8B5CF6',
    '#EC4899',
    '#F97316',
    '#EAB308',
    '#14B8A6',
    '#06B6D4',
    '#EF4444',
    '#64748B',
  ]

  // El onboarding usa un único horario general.
  // El backend lo aplica automáticamente a los días abiertos del negocio
  // y genera employee_working_hours. La personalización día por día
  // se realiza posteriormente desde la edición del empleado.

  const canContinue =
    firstName.trim() !== '' &&
    lastName.trim() !== '' &&
    startTime !== '' &&
    endTime !== '' &&
    startTime < endTime

  /*
   * ============================================================
   * SINCRONIZAR IDIOMA DESDE EL SERVIDOR
   * ============================================================
   *
   * El usuario puede haber comenzado el onboarding en otro
   * dispositivo.
   *
   * Por eso no confiamos únicamente en localStorage.
   *
   * DB → LanguageContext → localStorage del dispositivo actual
   */

  useEffect(() => {
    if (
      !catalogsLoaded ||
      !Array.isArray(
        supportedLanguages
      ) ||
      supportedLanguages.length === 0
    ) {
      setLanguageSyncing(false)
      return
    }

    let cancelled = false

    async function syncLanguageFromServer() {
      const token =
        localStorage.getItem('access_token')

      if (!token) {
        if (!cancelled) {
          setLanguageSyncing(false)
        }

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

        /*
         * El onboarding usa el horario del negocio como referencia.
         *
         * Tomamos primero el lunes (day_of_week = 1), igual que la
         * referencia visual del módulo Empleados. Como en onboarding
         * el horario del empleado es uniforme, este único rango se
         * muestra bloqueado y se envía al backend.
         *
         * El backend sigue siendo la autoridad y ajustará el rango
         * para cada día según business_hours.
         */
        const businessHoursResponse =
          await fetch(
            `${API_URL}?action=business-hours`,
            {
              method: 'GET',
              headers: {
                Accept: 'application/json',
                Authorization:
                  `Bearer ${token}`,
              },
            }
          )

        if (
          businessHoursResponse.status === 401
        ) {
          onSessionExpired?.()
          return
        }

        const businessHoursResult =
          await businessHoursResponse.json()

        if (
          !businessHoursResponse.ok ||
          !businessHoursResult?.success
        ) {
          throw new Error(
            businessHoursResult?.message ||
              'Error obteniendo los horarios del negocio.'
          )
        }

        const businessHours =
          Array.isArray(
            businessHoursResult?.data
          )
            ? businessHoursResult.data
            : []

        const monday =
          businessHours.find(
            day =>
              Number(day?.day_of_week) === 1 &&
              (
                Number(day?.is_open) === 1 ||
                day?.is_open === true
              ) &&
              day?.open_time &&
              day?.close_time
          )

        const referenceDay =
          monday ||
          businessHours.find(
            day =>
              (
                Number(day?.is_open) === 1 ||
                day?.is_open === true
              ) &&
              day?.open_time &&
              day?.close_time
          )

        if (referenceDay) {
          setStartTime(
            String(
              referenceDay.open_time
            ).substring(0, 5)
          )

          setEndTime(
            String(
              referenceDay.close_time
            ).substring(0, 5)
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
         * No bloqueamos el onboarding por un problema
         * de sincronización del idioma.
         *
         * El LanguageContext conserva el idioma actual.
         */
      } finally {
        if (!cancelled) {
          setLanguageSyncing(false)
        }
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

  const clearMessages = () => {
    setError('')
    setSuccess('')
  }

  const handleContinue = async () => {
    if (saving) return

    const token =
      localStorage.getItem('access_token')

    if (!token) {
      onSessionExpired?.()
      return
    }

    if (!canContinue) {
      setError(
        t(
          'onboarding.step4.errors.invalidForm'
        )
      )
      return
    }

    try {
      setSaving(true)
      clearMessages()

      const payload = {
        first_name:
          firstName.trim(),

        last_name:
          lastName.trim(),

        color,

        start_time:
          startTime,

        end_time:
          endTime,

        is_active: true,
      }

      /*
       * En el onboarding NO enviamos employee_phone.
       */
      const response = await fetch(
        `${API_URL}?action=employee`,
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
              'onboarding.step4.errors.createEmployee'
            )
        )
      }

      /*
       * Avanzar al Paso 5
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
                current_step: 5,
              }),
          }
        )

      if (
        onboardingResponse.status ===
        401
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
              'onboarding.step4.errors.advance'
            )
        )
      }

      const savedData = {
        ...payload,

        id:
          result?.data?.id ||
          result?.data?.employee_id ||
          null,
      }

      setSuccess(
        t(
          'onboarding.step4.success'
        )
      )

      onSaved?.(savedData)
      onNext?.(savedData)

    } catch (err) {
      console.error(
        '❌ Error creando empleado:',
        err
      )

      setError(
        err?.message ||
          t(
            'onboarding.step4.errors.createEmployee'
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
   * CARGANDO IDIOMA
   * ============================================================
   */

  if (languageSyncing) {
    return (
      <div className="step4-employee">
        <div className="step4-container">
          <div className="step4-card step4-language-loading">

            <span className="step4-spinner" />

            <span>
              Cargando...
            </span>

          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="step4-employee">
      <div className="step4-container">

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
          <div className="step4-brand">

            <div
              className="step4-brand-icon"
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

            <div className="step4-brand-name">
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
        <div className="step4-progress">

          <div className="step4-progress-info">

            <span>
              {t(
                'onboarding.initialSetup'
              )}
            </span>

            <strong>
              {t(
                'onboarding.step4.progress'
              )}
            </strong>

          </div>

          <div className="step4-progress-track">
            <div className="step4-progress-bar" />
          </div>

        </div>

        {/* CARD */}
        <div className="step4-card">

          <div className="step4-icon-box">
            <EmployeeIcon />
          </div>

          <h1>
            {t(
              'onboarding.step4.title'
            )}
          </h1>

          <p className="step4-description">
            {t(
              'onboarding.step4.description'
            )}
          </p>

          <div className="step4-form">

            {/* NOMBRE */}
            <div className="step4-two-columns">

              <div className="step4-field">

                <label htmlFor="step4-first-name">
                  {t(
                    'onboarding.step4.firstName'
                  )}
                </label>

                <input
                  id="step4-first-name"
                  type="text"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(
                      e.target.value
                    )
                    clearMessages()
                  }}
                  placeholder={t(
                    'onboarding.step4.firstNamePlaceholder'
                  )}
                  maxLength={100}
                  disabled={saving}
                  autoFocus
                />

              </div>

              <div className="step4-field">

                <label htmlFor="step4-last-name">
                  {t(
                    'onboarding.step4.lastName'
                  )}
                </label>

                <input
                  id="step4-last-name"
                  type="text"
                  value={lastName}
                  onChange={(e) => {
                    setLastName(
                      e.target.value
                    )
                    clearMessages()
                  }}
                  placeholder={t(
                    'onboarding.step4.lastNamePlaceholder'
                  )}
                  maxLength={100}
                  disabled={saving}
                />

              </div>

            </div>

            {/* COLOR */}
            <div className="step4-field step4-field-full">

              <label>
                {t(
                  'onboarding.step4.employeeColor'
                )}
              </label>

              <div className="step4-color-section">

                <div className="step4-color-options">

                  {colorPresets.map(
                    (preset) => (
                      <button
                        key={preset}
                        type="button"
                        className={
                          color === preset
                            ? 'step4-color-option selected'
                            : 'step4-color-option'
                        }
                        style={{
                          backgroundColor:
                            preset,
                        }}
                        onClick={() => {
                          setColor(
                            preset
                          )
                          clearMessages()
                        }}
                        disabled={saving}
                        aria-label={t(
                          'onboarding.step4.selectColor'
                        )}
                        title={preset}
                      />
                    )
                  )}

                </div>

                <div className="step4-custom-color">

                  <span>
                    {t(
                      'onboarding.step4.custom'
                    )}
                  </span>

                  <input
                    type="color"
                    value={color}
                    onChange={(e) => {
                      setColor(
                        e.target.value
                      )
                      clearMessages()
                    }}
                    disabled={saving}
                    aria-label={t(
                      'onboarding.step4.customColor'
                    )}
                  />

                  <strong>
                    {color}
                  </strong>

                </div>

              </div>

              <span className="step4-help">
                {t(
                  'onboarding.step4.colorHelp'
                )}
              </span>

            </div>

            {/* HORARIOS */}
            <div className="step4-two-columns">

              <div className="step4-field">

                <label htmlFor="step4-start-time">
                  {t(
                    'onboarding.step4.startTime'
                  )}
                </label>

                <input
                  id="step4-start-time"
                  type="time"
                  value={startTime}
                  disabled={true}
                />

              </div>

              <div className="step4-field">

                <label htmlFor="step4-end-time">
                  {t(
                    'onboarding.step4.endTime'
                  )}
                </label>

                <input
                  id="step4-end-time"
                  type="time"
                  value={endTime}
                  disabled={true}
                />

              </div>

            </div>

            {/* NOTA */}
            <div className="step4-schedule-note">

              <span className="step4-note-icon">
                🕐
              </span>

              <span>
                {t(
                  'onboarding.step4.scheduleNote'
                )}
              </span>

            </div>

          </div>

          {/* ERROR */}
          {error && (
            <div className="step4-error">
              {error}
            </div>
          )}

          {/* SUCCESS */}
          {success && (
            <div className="step4-success">

              <CheckIcon />

              <span>
                {success}
              </span>

            </div>
          )}

          {/* BUTTON */}
          <div className="step4-actions">

            <button
              type="button"
              className="step4-continue"
              disabled={
                saving ||
                !canContinue
              }
              onClick={
                handleContinue
              }
            >

              {saving ? (
                <>
                  <span className="step4-spinner" />

                  {t(
                    'onboarding.step4.creating'
                  )}
                </>
              ) : (
                <>
                  {t(
                    'onboarding.step4.createButton'
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