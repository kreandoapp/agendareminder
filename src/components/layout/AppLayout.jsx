import wilbukLogo from '../../assets/logo.png'
import Sidebar from './Sidebar'
import AppPages from './AppPages'

function AppLayout({
  hasSubscriptionAccess,
  user,
  currentPage,
  navigate,
  whatsappConnected,
  whatsappPhone,
  onLogout,
  mobileMenuOpen,
  setMobileMenuOpen,
  onDisconnectWhatsApp,
}) {
  return (
    <div className="app-shell">
      <Sidebar
        hasSubscriptionAccess={hasSubscriptionAccess}
        user={user}
        currentPage={currentPage}
        navigate={navigate}
        whatsappConnected={whatsappConnected}
        whatsappPhone={whatsappPhone}
        onLogout={onLogout}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="app-content-wrapper">
        <header className="mobile-app-header">
          <button
            type="button"
            className="mobile-app-brand"
            onClick={() => {
              navigate('home')
              setMobileMenuOpen(false)
            }}
            aria-label="Ir al inicio"
          >
            <div className="mobile-app-logo">
              <img
                src={wilbukLogo}
                alt="Wilbuk"
                className="mobile-app-logo-image"
              />
            </div>

            <div className="mobile-app-brand-text">
              <div className="mobile-app-brand-name">
                <span className="mobile-app-brand-wil">Wil</span>
                <span className="mobile-app-brand-buk">buk</span>
              </div>
              <div className="mobile-app-brand-subtitle">
                Gestión y automatización
              </div>
            </div>
          </button>

          <button
            type="button"
            className="mobile-menu-button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Abrir menú"
          >
            ☰
          </button>
        </header>

        <main className="app-main">
          <AppPages
            currentPage={currentPage}
            user={user}
            whatsappConnected={whatsappConnected}
            whatsappPhone={whatsappPhone}
            navigate={navigate}
            onDisconnectWhatsApp={onDisconnectWhatsApp}
          />
        </main>
      </div>
    </div>
  )
}

export default AppLayout
