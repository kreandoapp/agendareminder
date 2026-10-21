import { useState } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import whatsappLogo from '../../assets/whatsapp-logo.png'

import './WhatsAppStatus.css'

export default function WhatsAppStatus({
  whatsappConnected,
  whatsappPhone,
  onDisconnect,
}) {
  const { t } = useLanguage()

  const [showDisconnectAlert, setShowDisconnectAlert] =
    useState(false)

  const handleOpenDisconnectAlert = () => {
    setShowDisconnectAlert(true)
  }

  const handleCloseDisconnectAlert = () => {
    setShowDisconnectAlert(false)
  }

  const handleConfirmDisconnect = async () => {
    setShowDisconnectAlert(false)

    if (typeof onDisconnect === 'function') {
      await onDisconnect()
    }
  }

  return (
    <div className="whatsapp-status-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="whatsapp-status-header">

        <div className="whatsapp-status-heading">

          <div className="whatsapp-status-eyebrow">
            {t('whatsappStatus.eyebrow')}
          </div>

          <h1 className="whatsapp-status-title">

            <span
              className="whatsapp-status-title-icon"
              aria-hidden="true"
            >
              📱
            </span>

            <span>
              WhatsApp
            </span>

          </h1>

          <p className="whatsapp-status-description">
            {t('whatsappStatus.description')}
          </p>

        </div>

      </header>


      {/* =================================================
          MAIN PANEL
      ================================================= */}

      <section
        className={`whatsapp-main-panel ${
          whatsappConnected
            ? 'is-connected'
            : 'is-disconnected'
        }`}
      >

        <div className="whatsapp-main-glow" />

        <div className="whatsapp-main-glow-secondary" />


        {/* =================================================
            LEFT CONTENT
        ================================================= */}

        <div className="whatsapp-main-content">

          <div className="whatsapp-status-pill">

            <span className="whatsapp-status-dot" />

            <span>
              {whatsappConnected
                ? t('whatsappStatus.status.connected')
                : t('whatsappStatus.status.notConnected')}
            </span>

          </div>


          <h2 className="whatsapp-main-title">

            {whatsappConnected ? (
              <>
                WhatsApp{' '}

                <span>
                  {t('whatsappStatus.main.connectedHighlight')}
                </span>
              </>
            ) : (
              t('whatsappStatus.main.notConnectedTitle')
            )}

          </h2>


          <p className="whatsapp-main-description">

            {whatsappConnected
              ? t('whatsappStatus.main.connectedDescription')
              : t('whatsappStatus.main.notConnectedDescription')}

          </p>


          {whatsappConnected ? (

            <>
              {/* =================================================
                  PHONE
              ================================================= */}

              <div className="whatsapp-phone-card">

                <div className="whatsapp-phone-icon">
                  ☎
                </div>

                <div className="whatsapp-phone-content">

                  <span>
                    {t('whatsappStatus.phone.connectedNumber')}
                  </span>

                  <strong>
                    +{whatsappPhone}
                  </strong>

                </div>

                <div className="whatsapp-phone-check">
                  ✓
                </div>

              </div>


              {/* =================================================
                  DISCONNECT
              ================================================= */}

              <button
                type="button"
                onClick={handleOpenDisconnectAlert}
                className="whatsapp-disconnect-button"
              >

                <span className="whatsapp-disconnect-icon">
                  ⛓
                </span>

                <span className="whatsapp-disconnect-content">

                  <strong>
                    {t('whatsappStatus.disconnect.button')}
                  </strong>

                  <small>
                    {t('whatsappStatus.disconnect.description')}
                  </small>

                </span>

              </button>

            </>

          ) : (

            <div className="whatsapp-pending-card">

              <div className="whatsapp-pending-icon">
                📱
              </div>

              <div>

                <strong>
                  {t('whatsappStatus.pending.title')}
                </strong>

                <span>
                  {t('whatsappStatus.pending.description')}
                </span>

              </div>

            </div>

          )}

        </div>


        {/* =================================================
            CENTER LOGO
        ================================================= */}

        <div className="whatsapp-main-visual">

          <div className="whatsapp-visual-ring whatsapp-ring-one" />

          <div className="whatsapp-visual-ring whatsapp-ring-two" />

          <div className="whatsapp-visual-ring whatsapp-ring-three" />

          <div className="whatsapp-logo-container">

            <div className="whatsapp-logo-background" />

            <img
              src={whatsappLogo}
              alt={t('whatsappStatus.logoAlt')}
              className="whatsapp-main-logo"
            />

            {whatsappConnected && (
              <div className="whatsapp-logo-check">
                ✓
              </div>
            )}

          </div>

        </div>


        {/* =================================================
            SYSTEM STATUS
        ================================================= */}

        {whatsappConnected && (

          <div className="whatsapp-system-status">

            <div className="whatsapp-system-item">

              <div className="whatsapp-system-icon">
                ⚡
              </div>

              <div className="whatsapp-system-content">

                <strong>
                  {t('whatsappStatus.system.automaticMessages')}
                </strong>

                <span>
                  {t('whatsappStatus.system.active')}
                </span>

              </div>

            </div>


            <div className="whatsapp-system-item">

              <div className="whatsapp-system-icon">
                👥
              </div>

              <div className="whatsapp-system-content">

                <strong>
                  {t('whatsappStatus.system.customerCommunication')}
                </strong>

                <span>
                  {t('whatsappStatus.system.enabled')}
                </span>

              </div>

            </div>


            <div className="whatsapp-system-item">

              <div className="whatsapp-system-icon">
                📊
              </div>

              <div className="whatsapp-system-content">

                <strong>
                  {t('whatsappStatus.system.systemWorking')}
                </strong>

                <span>
                  {t('whatsappStatus.system.noErrors')}
                </span>

              </div>

            </div>

          </div>

        )}

      </section>


      {/* =================================================
          INFORMATION
      ================================================= */}

      <div className="whatsapp-information-card">

        <div className="whatsapp-information-icon">
          💡
        </div>

        <div className="whatsapp-information-content">

          <strong>
            {t('whatsappStatus.information.title')}
          </strong>

          <p>
            {t('whatsappStatus.information.description')}
          </p>

        </div>

      </div>


      {/* =================================================
          DISCONNECT DIALOG
      ================================================= */}

      {showDisconnectAlert && (

        <div
          className="whatsapp-alert-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              handleCloseDisconnectAlert()
            }
          }}
        >

          <div
            className="whatsapp-alert"
            role="dialog"
            aria-modal="true"
            aria-labelledby="whatsapp-alert-title"
          >

            <button
              type="button"
              className="whatsapp-alert-close"
              onClick={handleCloseDisconnectAlert}
              aria-label={t('common.close')}
            >
              ×
            </button>


            <div className="whatsapp-alert-icon">

              <img
                src={whatsappLogo}
                alt={t('whatsappStatus.logoAlt')}
              />

            </div>


            <h2 id="whatsapp-alert-title">
              {t('whatsappStatus.disconnectDialog.title')}
            </h2>


            <p>
              {t('whatsappStatus.disconnectDialog.description')}
            </p>


            {whatsappPhone && (

              <div className="whatsapp-alert-phone">

                <span>
                  📱
                </span>

                <strong>
                  +{whatsappPhone}
                </strong>

              </div>

            )}


            <div className="whatsapp-alert-actions">

              <button
                type="button"
                className="whatsapp-alert-cancel"
                onClick={handleCloseDisconnectAlert}
              >
                {t('common.cancel')}
              </button>

              <button
                type="button"
                className="whatsapp-alert-confirm"
                onClick={handleConfirmDisconnect}
              >
                {t('whatsappStatus.disconnectDialog.confirm')}
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  )
}