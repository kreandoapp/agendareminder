import React from 'react'

import './PasswordResetSuccess.css'

import { useLanguage } from '../../context/LanguageContext'

function PasswordResetSuccess({
  onLogin,
}) {

  const { t } = useLanguage()

  return (

    <div className="password-reset-success-page">

      <div className="password-reset-success-card">

        {/* ============================================
            HEADER
        ============================================ */}

        <div className="password-reset-success-header">

          <div className="password-reset-success-brand">

            <div className="password-reset-success-brand-icon">
              📅
            </div>

            <div>

              <div className="password-reset-success-brand-name">

                {t(
                  'auth.passwordResetSuccess.brandName',
                  'Agenda'
                )}

                <span>
                  {t(
                    'auth.passwordResetSuccess.brandNameSuffix',
                    'Reminder'
                  )}
                </span>

              </div>

              <div className="password-reset-success-brand-subtitle">
                {t(
                  'auth.passwordResetSuccess.brandSubtitle',
                  'Tu negocio siempre conectado'
                )}
              </div>

            </div>

          </div>

          <div className="password-reset-success-header-text">
            {t(
              'auth.passwordResetSuccess.headerText',
              'Gestión de citas más simple'
            )}
          </div>

        </div>


        {/* ============================================
            SUCCESS
        ============================================ */}

        <div className="password-reset-success-content">

          {/* CHECK */}

          <div className="password-reset-success-check">

            <span>
              ✓
            </span>

          </div>


          {/* TÍTULO */}

          <h1>

            {t(
              'auth.passwordResetSuccess.titleFirstLine',
              '¡Contraseña'
            )}

            <br />

            <span>
              {t(
                'auth.passwordResetSuccess.titleSecondLine',
                'actualizada!'
              )}
            </span>

          </h1>


          {/* DESCRIPCIÓN */}

          <p className="password-reset-success-description">

            {t(
              'auth.passwordResetSuccess.descriptionFirstLine',
              'Tu contraseña se cambió correctamente.'
            )}

            <br />

            {t(
              'auth.passwordResetSuccess.descriptionSecondLine',
              'Ya puedes iniciar sesión con tu nueva contraseña.'
            )}

          </p>


          {/* ==========================================
              SEGURIDAD
          ========================================== */}

          <div className="password-reset-success-security">

            <div className="password-reset-success-security-icon">
              🛡️
            </div>

            <div>

              <div className="password-reset-success-security-title">

                {t(
                  'auth.passwordResetSuccess.securityTitle',
                  'Tu cuenta está segura'
                )}

              </div>

              <div className="password-reset-success-security-text">

                {t(
                  'auth.passwordResetSuccess.securityText',
                  'Te recomendamos mantener tu contraseña en un lugar seguro.'
                )}

              </div>

            </div>

          </div>


          {/* ==========================================
              BOTÓN
          ========================================== */}

          <button
            type="button"
            onClick={onLogin}
            className="password-reset-success-login"
          >

            {t(
              'auth.passwordResetSuccess.login',
              'Iniciar sesión'
            )}

            <span>
              →
            </span>

          </button>


          {/* ==========================================
              FOOTER
          ========================================== */}

          <div className="password-reset-success-footer">

            {t(
              'auth.passwordResetSuccess.footer',
              'Gracias por confiar en AgendaReminder'
            )}

            <span>
              ♥
            </span>

          </div>

        </div>

      </div>

    </div>

  )
}

export default PasswordResetSuccess