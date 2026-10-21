import React, { useState } from 'react'

import './ForgotPassword.css'

import { useLanguage } from '../../context/LanguageContext'

export default function ForgotPassword({
  onBack,
  onSubmit,
  loading,
  error,
}) {
  

  const [email, setEmail] = useState('')

  const { t } = useLanguage()

  // =====================================================
  // ENVIAR FORMULARIO
  // =====================================================

  const handleSubmit = (e) => {

    e.preventDefault()

    if (!email.trim()) {
      return
    }

    if (onSubmit) {
      onSubmit(email.trim())
    }

  }

  return (

    <div className="forgot-password-page">

      <div className="forgot-password-card">

        {/* ============================================
            VOLVER
        ============================================ */}

        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="forgot-password-back"
        >
          ← {t(
            'auth.forgotPassword.back',
            'Volver'
          )}
        </button>


        {/* ============================================
            CABECERA
        ============================================ */}

        <div className="forgot-password-header">

          <div className="forgot-password-icon">
            ✉️
          </div>

          <h1>
            {t(
              'auth.forgotPassword.title',
              'Recuperar contraseña'
            )}
          </h1>

          <p>
            {t(
              'auth.forgotPassword.description',
              'Ingresá tu email y te enviaremos un código para restablecer tu contraseña.'
            )}
          </p>

        </div>


        {/* ============================================
            FORMULARIO
        ============================================ */}

        <form onSubmit={handleSubmit}>

          <div className="forgot-password-field">

            <label>
              {t(
                'auth.forgotPassword.email',
                'Email'
              )}
            </label>

            <input
              type="email"
              placeholder={t(
                'auth.forgotPassword.emailPlaceholder',
                'tu@email.com'
              )}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
              }}
              autoComplete="email"
              disabled={loading}
            />

          </div>


          {/* =========================================
              ERROR
          ========================================= */}

          {error && (

            <div className="forgot-password-error">
              ⚠️ {error}
            </div>

          )}


          {/* =========================================
              BOTÓN
          ========================================= */}

          <button
            type="submit"
            disabled={
              loading ||
              !email.trim()
            }
            className={`forgot-password-submit ${
              loading || !email.trim()
                ? 'disabled'
                : ''
            }`}
          >

            {loading
              ? t(
                  'auth.forgotPassword.loading',
                  'Enviando...'
                )
              : t(
                  'auth.forgotPassword.submit',
                  'Enviar código'
                )}

          </button>

        </form>

      </div>

    </div>

  )

}