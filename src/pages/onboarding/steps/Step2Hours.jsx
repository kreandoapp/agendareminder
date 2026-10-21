import { useEffect, useState } from 'react'
import './Step2Hours.css'
import { useLanguage } from '../../../context/LanguageContext'
import wilbukLogo from '../../../assets/logo.png'

const API_URL =
    import.meta.env.VITE_API_URL ||
    'https://kreandoapp.com/api/index.php'

function ClockIcon() {
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
            <circle cx="12" cy="12" r="9" />
            <polyline points="12 7 12 12 15 14" />
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

export default function Step2BusinessHours({
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

    const [languageSyncing, setLanguageSyncing] = useState(true)

    const [openTime, setOpenTime] = useState('')
    const [closeTime, setCloseTime] = useState('')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    /*
     * ============================================================
     * SINCRONIZAR IDIOMA DESDE EL SERVIDOR
     * ============================================================
     *
     * Step 1 ya guardó el idioma seleccionado en la base de datos.
     *
     * Acá no confiamos únicamente en localStorage porque este
     * dispositivo puede ser nuevo.
     *
     * DB → LanguageContext → localStorage
     *
     * De esta forma PC, móvil y tablet utilizan la misma preferencia.
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
            const token = localStorage.getItem('access_token')

            if (!token) {
                if (!cancelled) {
                    setLanguageSyncing(false)

                    if (
                        typeof onSessionExpired ===
                        'function'
                    ) {
                        onSessionExpired()
                    }
                }

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
                    if (!cancelled) {
                        if (
                            typeof onSessionExpired ===
                            'function'
                        ) {
                            onSessionExpired()
                        }
                    }

                    return
                }

                const result =
                    await response.json()

                if (!response.ok) {
                    throw new Error(
                        result?.message ||
                            'Error obteniendo la configuración del negocio.'
                    )
                }

                /*
                 * El endpoint puede devolver los datos
                 * directamente o dentro de data.
                 */
                const settings =
                    result?.data ||
                    result?.business ||
                    result

                const serverLanguage =
                    settings?.language

                /*
                 * Solamente aceptamos idiomas soportados.
                 */
                const languageIsSupported =
                    Array.isArray(
                        supportedLanguages
                    ) &&
                    supportedLanguages.some(
                        language =>
                            language.code ===
                            serverLanguage
                    )

                if (
                    languageIsSupported
                ) {
                    /*
                     * Actualizamos el idioma efectivo
                     * usando el catálogo dinámico de la API.
                     */
                    setLanguageFromBusiness(
                        serverLanguage
                    )
                }
            } catch (err) {
                console.error(
                    'Error sincronizando idioma:',
                    err
                )

                /*
                 * No bloqueamos el onboarding si falla
                 * únicamente la sincronización del idioma.
                 *
                 * El idioma actual del LanguageContext
                 * seguirá funcionando como fallback.
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

    function handleTimeChange(setter) {
        return event => {
            setter(event.target.value)
            setError('')
            setSuccess('')
        }
    }

    async function handleContinue() {
        if (saving) {
            return
        }

        const token =
            localStorage.getItem('access_token')

        if (!token) {
            if (
                typeof onSessionExpired ===
                'function'
            ) {
                onSessionExpired()
            }

            return
        }

        if (!openTime || !closeTime) {
            setError(
                t(
                    'onboarding.step2.errors.selectTimes'
                )
            )

            return
        }

        if (openTime >= closeTime) {
            setError(
                t(
                    'onboarding.step2.errors.closeAfterOpen'
                )
            )

            return
        }

        try {
            setSaving(true)
            setError('')
            setSuccess('')

            const days = Array.from(
                { length: 7 },
                (_, index) => ({
                    day_of_week: index + 1,
                    is_open: true,
                    open_time: openTime,
                    close_time: closeTime,
                })
            )

            /*
             * Guardar horarios
             */
            const response = await fetch(
                `${API_URL}?action=business-hours`,
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
                    body: JSON.stringify({
                        days,
                    }),
                }
            )

            if (response.status === 401) {
                if (
                    typeof onSessionExpired ===
                    'function'
                ) {
                    onSessionExpired()
                }

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
                            'onboarding.step2.errors.saveHours'
                        )
                )
            }

            /*
             * Actualizar paso del onboarding
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
                        body: JSON.stringify({
                            current_step: 3,
                        }),
                    }
                )

            if (
                onboardingResponse.status ===
                401
            ) {
                if (
                    typeof onSessionExpired ===
                    'function'
                ) {
                    onSessionExpired()
                }

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
                            'onboarding.step2.errors.advance'
                        )
                )
            }

            /*
             * Datos guardados
             */
            const savedData = {
                open_time: openTime,
                close_time: closeTime,
                days,
            }

            setSuccess(
                t(
                    'onboarding.step2.success'
                )
            )

            if (
                typeof onSaved ===
                'function'
            ) {
                onSaved(savedData)
            }

            if (
                typeof onNext ===
                'function'
            ) {
                onNext(savedData)
            }
        } catch (err) {
            console.error(
                'Error guardando horarios:',
                err
            )

            setError(
                err?.message ||
                    t(
                        'onboarding.step2.errors.saveHours'
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
     * ESPERAR A QUE EL IDIOMA SE SINCRONICE
     * ============================================================
     *
     * Evitamos mostrar momentáneamente el Step 2 en español
     * mientras estamos obteniendo el idioma real del negocio.
     */
    if (languageSyncing) {
        return (
            <div className="step2-business-hours">
                <div className="step2-container">
                    <div className="step2-card step2-language-loading">
                        <div className="step2-spinner" />

                        <span>
                            Cargando...
                        </span>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="step2-business-hours">
            <div className="step2-container">

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
                    <div className="step2-brand">
                        <div className="step2-brand-icon">
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

                        <div className="step2-brand-name">
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
                <div className="step2-progress">
                    <div className="step2-progress-info">
                        <span>
                            {t(
                                'onboarding.initialSetup'
                            )}
                        </span>

                        <strong>
                            {t(
                                'onboarding.stepProgress'
                            )}
                        </strong>
                    </div>

                    <div className="step2-progress-track">
                        <div className="step2-progress-bar" />
                    </div>
                </div>

                {/* CARD */}
                <div className="step2-card">

                    <div className="step2-icon-box">
                        <ClockIcon />
                    </div>

                    <h1>
                        {t(
                            'onboarding.step2.title'
                        )}
                    </h1>

                    <p className="step2-description">
                        {t(
                            'onboarding.step2.description'
                        )}
                    </p>

                    {/* INFO */}
                    <div className="step2-info">

                        <div className="step2-info-icon">
                            ✦
                        </div>

                        <div>
                            <strong>
                                {t(
                                    'onboarding.step2.quickSetup.title'
                                )}
                            </strong>

                            <span>
                                {t(
                                    'onboarding.step2.quickSetup.description'
                                )}
                            </span>
                        </div>

                    </div>

                    {/* HORARIOS */}
                    <div className="step2-time-grid">

                        {/* APERTURA */}
                        <div className="step2-time-field">

                            <label htmlFor="step2-open">
                                {t(
                                    'onboarding.step2.openingTime'
                                )}
                            </label>

                            <div className="step2-time-input">

                                <ClockIcon />

                                <input
                                    id="step2-open"
                                    type="time"
                                    value={
                                        openTime
                                    }
                                    onChange={
                                        handleTimeChange(
                                            setOpenTime
                                        )
                                    }
                                    disabled={
                                        saving
                                    }
                                />

                            </div>

                        </div>

                        {/* SEPARADOR */}
                        <div className="step2-time-divider">
                            <span>
                                {t(
                                    'onboarding.step2.until'
                                )}
                            </span>
                        </div>

                        {/* CIERRE */}
                        <div className="step2-time-field">

                            <label htmlFor="step2-close">
                                {t(
                                    'onboarding.step2.closingTime'
                                )}
                            </label>

                            <div className="step2-time-input">

                                <ClockIcon />

                                <input
                                    id="step2-close"
                                    type="time"
                                    value={
                                        closeTime
                                    }
                                    onChange={
                                        handleTimeChange(
                                            setCloseTime
                                        )
                                    }
                                    disabled={
                                        saving
                                    }
                                />

                            </div>

                        </div>

                    </div>

                    {/* PREVIEW */}
                    {openTime &&
                        closeTime &&
                        openTime < closeTime && (
                            <div className="step2-preview">

                                <div className="step2-preview-check">
                                    <CheckIcon />
                                </div>

                                <div>

                                    <strong>
                                        {t(
                                            'onboarding.step2.preview.title'
                                        )}
                                    </strong>

                                    <span>
                                        {openTime}
                                        {' — '}
                                        {closeTime}
                                        {' · '}
                                        {t(
                                            'onboarding.step2.preview.appliesToSevenDays'
                                        )}
                                    </span>

                                </div>

                            </div>
                        )}

                    {/* ERROR */}
                    {error && (
                        <div className="step2-error">
                            {error}
                        </div>
                    )}

                    {/* SUCCESS */}
                    {success && (
                        <div className="step2-success">

                            <CheckIcon />

                            <span>
                                {success}
                            </span>

                        </div>
                    )}

                    {/* BUTTON */}
                    <div className="step2-actions">

                        <button
                            type="button"
                            className="step2-continue"
                            disabled={
                                saving ||
                                !openTime ||
                                !closeTime
                            }
                            onClick={
                                handleContinue
                            }
                        >

                            {saving ? (
                                <>
                                    <span className="step2-spinner" />

                                    {t(
                                        'onboarding.step2.saving'
                                    )}
                                </>
                            ) : (
                                <>
                                    {t(
                                        'onboarding.continue'
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