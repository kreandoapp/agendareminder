import React, { useState } from 'react'

import './ResetPassword.css'

import { useLanguage } from '../../context/LanguageContext'

export default function ResetPassword({
  onSubmit,
  onBack,
  loading,
  error,
}) {

  const [password, setPassword] = useState('')

  const [confirmPassword, setConfirmPassword] = useState('')

  const [showPassword, setShowPassword] = useState(false)

  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const { t } = useLanguage()

  const passwordsMatch =
    password === confirmPassword

  const passwordValid =
    password.length >= 8

  const canSubmit =
    passwordValid &&
    passwordsMatch &&
    !loading

  const handleSubmit = (e) => {

    e.preventDefault()

    if (!canSubmit) {
      return
    }

    if (onSubmit) {
      onSubmit(password)
    }

  }

  return (

    <div className="reset-password-page">

      <div className="reset-password-card">

        {/* ============================================
            VOLVER
        ============================================ */}

        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="reset-password-back"
        >
          ← {t(
            'auth.resetPassword.back',
            'Volver'
          )}
        </button>


        {/* ============================================
            CABECERA
        ============================================ */}

        <div className="reset-password-header">

          <div className="reset-password-icon">
            🔑
          </div>

          <h1>
            {t(
              'auth.resetPassword.title',
              'Nueva contraseña'
            )}
          </h1>

          <p>
            {t(
              'auth.resetPassword.description',
              'Ingresá una nueva contraseña para tu cuenta.'
            )}
          </p>

        </div>


        {/* ============================================
            FORMULARIO
        ============================================ */}

        <form onSubmit={handleSubmit}>


          {/* ==========================================
              NUEVA CONTRASEÑA
          ========================================== */}

          <div className="reset-password-field">

            <label>
              {t(
                'auth.resetPassword.newPassword',
                'Nueva contraseña'
              )}
            </label>

            <div className="reset-password-input-wrapper">

              <input
                type={
                  showPassword
                    ? 'text'
                    : 'password'
                }
                placeholder={t(
                  'auth.resetPassword.passwordPlaceholder',
                  'Mínimo 8 caracteres'
                )}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                }}
                autoComplete="new-password"
                disabled={loading}
              />

              <button
                type="button"
                onClick={() => {
                  setShowPassword(!showPassword)
                }}
                tabIndex={-1}
                className="reset-password-toggle"
                aria-label={
                  showPassword
                    ? t(
                        'auth.resetPassword.hidePassword',
                        'Ocultar contraseña'
                      )
                    : t(
                        'auth.resetPassword.showPassword',
                        'Mostrar contraseña'
                      )
                }
              >
                {showPassword
                  ? '🙈'
                  : '👁️'}
              </button>

            </div>

            {password.length > 0 &&
              !passwordValid && (

                <div className="reset-password-validation">

                  {t(
                    'auth.resetPassword.passwordValidation',
                    'La contraseña debe tener al menos 8 caracteres.'
                  )}

                </div>

              )}

          </div>


          {/* ==========================================
              CONFIRMAR CONTRASEÑA
          ========================================== */}

          <div className="reset-password-field">

            <label>
              {t(
                'auth.resetPassword.confirmPassword',
                'Confirmar contraseña'
              )}
            </label>

            <div className="reset-password-input-wrapper">

              <input
                type={
                  showConfirmPassword
                    ? 'text'
                    : 'password'
                }
                placeholder={t(
                  'auth.resetPassword.confirmPasswordPlaceholder',
                  'Repetí tu contraseña'
                )}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(
                    e.target.value
                  )
                }}
                autoComplete="new-password"
                disabled={loading}
              />

              <button
                type="button"
                onClick={() => {
                  setShowConfirmPassword(
                    !showConfirmPassword
                  )
                }}
                tabIndex={-1}
                className="reset-password-toggle"
                aria-label={
                  showConfirmPassword
                    ? t(
                        'auth.resetPassword.hidePassword',
                        'Ocultar contraseña'
                      )
                    : t(
                        'auth.resetPassword.showPassword',
                        'Mostrar contraseña'
                      )
                }
              >
                {showConfirmPassword
                  ? '🙈'
                  : '👁️'}
              </button>

            </div>

            {confirmPassword.length > 0 &&
              !passwordsMatch && (

                <div className="reset-password-validation">

                  {t(
                    'auth.resetPassword.passwordsDoNotMatch',
                    'Las contraseñas no coinciden.'
                  )}

                </div>

              )}

          </div>


          {/* ==========================================
              ERROR API
          ========================================== */}

          {error && (

            <div className="reset-password-error">

              ⚠️ {error}

            </div>

          )}


          {/* ==========================================
              BOTÓN
          ========================================== */}

          <button
            type="submit"
            disabled={!canSubmit}
            className={`reset-password-submit ${
              !canSubmit
                ? 'disabled'
                : ''
            }`}
          >

            {loading
              ? t(
                  'auth.resetPassword.loading',
                  'Cambiando...'
                )
              : t(
                  'auth.resetPassword.submit',
                  'Cambiar contraseña'
                )}

          </button>

        </form>

      </div>

    </div>

  )

}