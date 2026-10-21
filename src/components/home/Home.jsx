import './Home.css'

import { useLanguage } from '../../context/LanguageContext'

export default function Home({
  user,
  whatsappConnected,
  whatsappPhone,
  navigate,
}) {
  const { t } = useLanguage()

  return (
    <div className="home-page">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="home-header">

        <div className="home-eyebrow">
          {t('home.eyebrow')}
        </div>

        <h1>
          {t('home.welcome')}{' '}
          {user.name || t('home.welcomeFallback')} 👋
        </h1>

        <p>
          {t('home.description')}
        </p>

      </div>

      {/* =====================================================
          SUMMARY CARDS
          ===================================================== */}

      <div className="home-summary-grid">

        {/* ===================================================
            WHATSAPP
            =================================================== */}

        <div className="home-summary-card">

          <div className="home-summary-label">
            {t('home.whatsapp')}
          </div>

          <div
            className={
              whatsappConnected
                ? 'home-summary-value success'
                : 'home-summary-value danger'
            }
          >
            {whatsappConnected
              ? t('home.connected')
              : t('home.notConnected')}
          </div>

          {whatsappConnected && whatsappPhone && (
            <div className="home-summary-detail">
              +{whatsappPhone}
            </div>
          )}

        </div>

        {/* ===================================================
            CUENTA
            =================================================== */}

        <div className="home-summary-card">

          <div className="home-summary-label">
            {t('home.account')}
          </div>

          <div className="home-summary-value">
            {t('home.active')}
          </div>

          <div className="home-summary-detail">
            {user.email}
          </div>

        </div>

        {/* ===================================================
            AUTOMATIZACIÓN
            =================================================== */}

        <div className="home-summary-card">

          <div className="home-summary-label">
            {t('home.automation')}
          </div>

          <div className="home-summary-value">
            {t('home.ready')}
          </div>

          <div className="home-summary-detail">
            {t('home.remindersAndMessages')}
          </div>

        </div>

      </div>

      {/* =====================================================
          WHATSAPP STATUS
          ===================================================== */}

      <div
        className={
          whatsappConnected
            ? 'home-whatsapp-banner connected'
            : 'home-whatsapp-banner disconnected'
        }
      >

        <div className="home-whatsapp-content">

          <div className="home-whatsapp-info">

            <div className="home-whatsapp-title">

              {whatsappConnected
                ? `🟢 ${t('home.whatsappConnectedTitle')}`
                : `🔴 ${t('home.whatsappDisconnectedTitle')}`}

            </div>

            <p>
              {whatsappConnected
                ? t('home.whatsappConnectedDescription')
                : t('home.whatsappDisconnectedDescription')}
            </p>

          </div>

          {/* =================================================
              ACTION
              ================================================= */}

          <div className="home-whatsapp-actions">

            <button
              type="button"
              className="home-whatsapp-button"
              onClick={() => navigate('whatsapp')}
            >
              <span>📱</span>

              <span>
                {t('home.manageWhatsapp')}
              </span>
            </button>

          </div>

        </div>

      </div>

    </div>
  )
}