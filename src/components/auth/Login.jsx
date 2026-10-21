import React, { useState } from 'react'

import './Login.css'

import { useTheme } from '../../context/ThemeContext'

import { useLanguage } from '../../context/LanguageContext'

import wilbukLogo from '../../assets/logo.png'

export default function Login({
  email,
  setEmail,
  password,
  setPassword,
  loading,
  error,
  onLogin,
  onForgotPassword,
}) {
  const [showPassword, setShowPassword] = useState(false)

  const { theme, setTheme } = useTheme()

  const {
    language,
    supportedLanguages,
    setLanguagePreference,
    t,
  } = useLanguage()

  // --------------------------------------------------
  // VALIDATION
  // --------------------------------------------------

  const isEmailValid =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email.trim()
    )

  const isPasswordValid =
    password.length >= 8

  const canLogin =
    isEmailValid &&
    isPasswordValid &&
    !loading

  // --------------------------------------------------
  // LOGIN
  // --------------------------------------------------

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!canLogin) return

    onLogin()
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && canLogin) {
      onLogin()
    }
  }

  // --------------------------------------------------
  // THEME
  // --------------------------------------------------

  const handleThemeToggle = () => {
    const nextTheme =
      theme === 'dark'
        ? 'light'
        : 'dark'

    setTheme(nextTheme)
  }

  // --------------------------------------------------
  // LANGUAGE
  // --------------------------------------------------

  const handleLanguageChange = (event) => {
    const newLanguage = event.target.value

    setLanguagePreference(newLanguage)
  }

  return (
    <div className="login-page">

      <div className="login-card">

        {/* ==========================================
            TOP CONTROLS
            ========================================== */}

        <div className="login-top-controls">

          {/* LANGUAGE - LEFT */}

          <div className="login-language">

            <select
              value={language}
              onChange={handleLanguageChange}
              aria-label={t(
                'auth.languageSelector',
                'Idioma'
              )}
            >
              {supportedLanguages.map((item) => (
                <option
                  key={item.code}
                  value={item.code}
                >
                  {item.flag} {item.name}
                </option>
              ))}
            </select>

          </div>

          {/* THEME - RIGHT */}

          <button
            type="button"
            className="login-theme-toggle"
            onClick={handleThemeToggle}
            aria-label={
              theme === 'dark'
                ? t(
                    'auth.changeToLightTheme',
                    'Cambiar a tema claro'
                  )
                : t(
                    'auth.changeToDarkTheme',
                    'Cambiar a tema oscuro'
                  )
            }
            title={
              theme === 'dark'
                ? t(
                    'auth.lightTheme',
                    'Tema claro'
                  )
                : t(
                    'auth.darkTheme',
                    'Tema oscuro'
                  )
            }
          >
            {theme === 'dark'
              ? '☀️'
              : '🌙'}
          </button>

        </div>

        {/* ==========================================
            HEADER
            ========================================== */}

        <div className="login-header">

          <div className="wilbuk-brand">

            <img
              src={wilbukLogo}
              alt="Wilbuk"
              className="wilbuk-brand-icon"
            />

            <div className="wilbuk-brand-name">

              <span className="wilbuk-brand-wil">
                Wil
              </span>

              <span className="wilbuk-brand-buk">
                buk
              </span>

            </div>

          </div>

          <p>
            {t(
              'auth.login.subtitle',
              'Gestión inteligente de recordatorios'
            )}
          </p>

        </div>

        {/* ==========================================
            FORM
            ========================================== */}

        <form
          className="login-form"
          onSubmit={handleSubmit}
          noValidate
        >

          {/* ========================================
              EMAIL
              ======================================== */}

          <div className="login-field">

            <label htmlFor="login-email">
              {t(
                'auth.login.email',
                'Email'
              )}
            </label>

            <div className="login-input-wrapper">

              <span
                className="login-input-icon"
                aria-hidden="true"
              >
                👤
              </span>

              <input
                id="login-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder={t(
                  'auth.login.emailPlaceholder',
                  'tu@email.com'
                )}
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                onKeyDown={handleKeyDown}
                disabled={loading}
                autoCapitalize="none"
                spellCheck="false"
              />

            </div>

          </div>

          {/* ========================================
              PASSWORD
              ======================================== */}

          <div className="login-field login-password-field">

            <label htmlFor="login-password">
              {t(
                'auth.login.password',
                'Contraseña'
              )}
            </label>

            <div className="login-input-wrapper">

              <span
                className="login-input-icon"
                aria-hidden="true"
              >
                🔒
              </span>

              <input
                id="login-password"
                type={
                  showPassword
                    ? 'text'
                    : 'password'
                }
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                onKeyDown={handleKeyDown}
                disabled={loading}
              />

              <button
                type="button"
                className="login-password-toggle"
                onClick={() =>
                  setShowPassword(
                    (previous) => !previous
                  )
                }
                aria-label={
                  showPassword
                    ? t(
                        'auth.login.hidePassword',
                        'Ocultar contraseña'
                      )
                    : t(
                        'auth.login.showPassword',
                        'Mostrar contraseña'
                      )
                }
                aria-pressed={showPassword}
                disabled={loading}
              >
                {showPassword
                  ? '🙈'
                  : '👁️'}
              </button>

            </div>

          </div>

          {/* ========================================
              FORGOT PASSWORD
              ======================================== */}

          <div className="login-forgot">

            <button
              type="button"
              onClick={onForgotPassword}
              disabled={loading}
            >
              {t(
                'auth.login.forgotPassword',
                '¿Olvidaste tu contraseña?'
              )}
            </button>

          </div>

          {/* ========================================
              ERROR
              ======================================== */}

          {error && (
            <div
              className="login-error"
              role="alert"
            >

              <span aria-hidden="true">
                ⚠️
              </span>

              <span>
                {error}
              </span>

            </div>
          )}

          {/* ========================================
              LOGIN BUTTON
              ======================================== */}

          <button
            type="submit"
            className={`login-submit ${
              loading ? 'loading' : ''
            }`}
            disabled={!canLogin}
          >
            {loading ? (
              <>
                <span
                  className="login-submit-spinner"
                  aria-hidden="true"
                />

                <span>
                  {t(
                    'auth.login.loading',
                    'Ingresando...'
                  )}
                </span>
              </>
            ) : (
              t(
                'auth.login.submit',
                'Iniciar sesión'
              )
            )}
          </button>

        </form>

      </div>

    </div>
  )
}