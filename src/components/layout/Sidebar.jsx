import React, { useState } from 'react'

import './Sidebar.css'

import { useLanguage } from '../../context/LanguageContext'

import wilbukLogo from '../../assets/logo.png'

export default function Sidebar({
  user,
  currentPage,
  navigate,
  whatsappConnected,
  whatsappPhone,
  onLogout,
  mobileOpen = false,
  onCloseMobile,
}) {
  const { t } = useLanguage()

  const isAdmin = user?.role === 'admin'

  const [adminMode, setAdminMode] = useState(
    isAdmin
  )

  const handleNavigate = (page) => {
    navigate(page)
    onCloseMobile?.()
  }

  const navButtonClass = (page) =>
    `sidebar-nav-button ${
      currentPage === page ? 'active' : ''
    }`

  return (
    <>
      {/* =====================================================
          OVERLAY MOBILE
          ===================================================== */}

      <div
        className={`sidebar-overlay ${
          mobileOpen ? 'visible' : ''
        }`}
        onClick={onCloseMobile}
      />

      {/* =====================================================
          SIDEBAR
          ===================================================== */}

      <aside
        className={`sidebar ${
          mobileOpen ? 'mobile-open' : ''
        }`}
      >

        {/* =====================================================
            LOGO DESKTOP
            ===================================================== */}

        <div className="sidebar-logo">

          <img
            src={wilbukLogo}
            alt="Wilbuk"
            className="sidebar-wilbuk-logo"
          />

          <div className="sidebar-logo-text">

            <div className="sidebar-logo-title">

              <span className="sidebar-logo-wil">
                Wil
              </span>

              <span className="sidebar-logo-buk">
                buk
              </span>

            </div>

            <div className="sidebar-logo-subtitle">
              {t('sidebar.brandSubtitle')}
            </div>

          </div>

        </div>

        {/* =====================================================
            USUARIO
            ===================================================== */}

        <div className="sidebar-user">

          <div className="sidebar-user-avatar">
            {(user?.name || t('sidebar.user'))
              .charAt(0)
              .toUpperCase()}
          </div>

          <div className="sidebar-user-info">

            <div className="sidebar-user-name">
              {user?.name || t('sidebar.user')}
            </div>

            <div className="sidebar-user-email">
              {user?.email}
            </div>

          </div>

          {/* CERRAR MOBILE */}

          <button
            type="button"
            className="sidebar-mobile-close"
            onClick={onCloseMobile}
            aria-label={t('sidebar.closeMenu')}
          >
            ✕
          </button>

        </div>

        {/* =====================================================
            MODO ADMIN / USUARIO
            ===================================================== */}

        {isAdmin && (
          <div className="sidebar-mode-switch">

            <div className="sidebar-mode-info">

              <span className="sidebar-mode-icon">
                {adminMode ? '👑' : '👤'}
              </span>

              <span className="sidebar-mode-label">
                {adminMode
                  ? 'Administrador'
                  : 'Usuario'}
              </span>

            </div>

            <button
              type="button"
              className={`ios-switch ${
                adminMode ? 'active' : ''
              }`}
              onClick={() =>
                setAdminMode(
                  (value) => !value
                )
              }
              aria-label={
                adminMode
                  ? 'Cambiar a Usuario'
                  : 'Cambiar a Administrador'
              }
              aria-pressed={adminMode}
            >
              <span className="ios-switch-knob" />
            </button>

          </div>
        )}

        {/* =====================================================
            MENÚ PRINCIPAL
            ===================================================== */}

        <div className="sidebar-section-title">

          {isAdmin && adminMode
            ? 'ADMINISTRADOR'
            : t('sidebar.mainMenu')}

        </div>

        {/* =====================================================
            MENÚ ADMINISTRADOR
            ===================================================== */}

        {isAdmin && adminMode ? (

          <>
            {/* DASHBOARD */}

            <button
              type="button"
              onClick={() =>
                handleNavigate('admin-dashboard')
              }
              className={navButtonClass(
                'admin-dashboard'
              )}
            >

              <span className="sidebar-nav-icon">
                📊
              </span>

              <span>
                Dashboard
              </span>

            </button>

            {/* PAÍSES */}

            <button
              type="button"
              onClick={() =>
                handleNavigate('countries')
              }
              className={navButtonClass(
                'countries'
              )}
            >

              <span className="sidebar-nav-icon">
                🌎
              </span>

              <span>
                Países
              </span>

            </button>

            {/* IDIOMAS */}

            <button
              type="button"
              onClick={() =>
                handleNavigate('languages')
              }
              className={navButtonClass(
                'languages'
              )}
            >

              <span className="sidebar-nav-icon">
                🌐
              </span>

              <span>
                Idiomas
              </span>

            </button>

            {/* PLANTILLAS ADMIN */}

            <button
              type="button"
              onClick={() =>
                handleNavigate(
                  'admin-templates'
                )
              }
              className={navButtonClass(
                'admin-templates'
              )}
            >

              <span className="sidebar-nav-icon">
                💬
              </span>

              <span>
                Plantillas Admin
              </span>

            </button>

            {/* MONEDAS */}

            <button
              type="button"
              onClick={() =>
                handleNavigate('currencies')
              }
              className={navButtonClass(
                'currencies'
              )}
            >

              <span className="sidebar-nav-icon">
                💰
              </span>

              <span>
                Monedas
              </span>

            </button>

            {/* CONFIGURACIÓN */}

            <button
              type="button"
              onClick={() =>
                handleNavigate('settings')
              }
              className={navButtonClass(
                'settings'
              )}
            >

              <span className="sidebar-nav-icon">
                ⚙️
              </span>

              <span>
                Configuración
              </span>

            </button>

          </>

        ) : (

          /* ===================================================
             MENÚ USUARIO
             =================================================== */

          <>

            {/* INICIO */}

            <button
              type="button"
              onClick={() =>
                handleNavigate('home')
              }
              className={navButtonClass('home')}
            >

              <span className="sidebar-nav-icon">
                🏠
              </span>

              <span>
                {t('sidebar.home')}
              </span>

            </button>

            {/* AGENDA */}

            <button
              type="button"
              onClick={() =>
                handleNavigate('agenda')
              }
              className={navButtonClass(
                'agenda'
              )}
            >

              <span className="sidebar-nav-icon">
                📅
              </span>

              <span>
                {t('sidebar.agenda')}
              </span>

            </button>

            {/* CLIENTES */}

            <button
              type="button"
              onClick={() =>
                handleNavigate('clients')
              }
              className={navButtonClass(
                'clients'
              )}
            >

              <span className="sidebar-nav-icon">
                👥
              </span>

              <span>
                {t('sidebar.clients')}
              </span>

            </button>

            {/* EMPLEADOS */}

            <button
              type="button"
              onClick={() =>
                handleNavigate('employees')
              }
              className={navButtonClass(
                'employees'
              )}
            >

              <span className="sidebar-nav-icon">
                👨‍💼
              </span>

              <span>
                {t('sidebar.employees')}
              </span>

            </button>

            {/* SERVICIOS */}

            <button
              type="button"
              onClick={() =>
                handleNavigate('services')
              }
              className={navButtonClass(
                'services'
              )}
            >

              <span className="sidebar-nav-icon">
                ✂️
              </span>

              <span>
                {t('sidebar.services')}
              </span>

            </button>

            {/* PLANTILLAS */}

            <button
              type="button"
              onClick={() =>
                handleNavigate('layout')
              }
              className={navButtonClass(
                'layout'
              )}
            >

              <span className="sidebar-nav-icon">
                🎨
              </span>

              <span>
                {t('sidebar.templates')}
              </span>

            </button>

            {/* WHATSAPP */}

            <button
              type="button"
              onClick={() =>
                handleNavigate('whatsapp')
              }
              className={navButtonClass(
                'whatsapp'
              )}
            >

              <span className="sidebar-nav-icon">
                📱
              </span>

              <span className="sidebar-nav-label">
                {t('sidebar.whatsapp')}
              </span>

              <span
                className={`sidebar-whatsapp-dot ${
                  whatsappConnected
                    ? 'connected'
                    : 'disconnected'
                }`}
              />

            </button>

            {/* HORARIOS */}

            <button
              type="button"
              onClick={() =>
                handleNavigate('hours')
              }
              className={navButtonClass(
                'hours'
              )}
            >

              <span className="sidebar-nav-icon">
                🕐
              </span>

              <span>
                {t('sidebar.hours')}
              </span>

            </button>

            {/* CONFIGURACIÓN */}

            <button
              type="button"
              onClick={() =>
                handleNavigate('settings')
              }
              className={navButtonClass(
                'settings'
              )}
            >

              <span className="sidebar-nav-icon">
                ⚙️
              </span>

              <span>
                {t('sidebar.settings')}
              </span>

            </button>

          </>

        )}

        {/* =====================================================
            SEPARACIÓN
            ===================================================== */}

        <div className="sidebar-spacer-small" />

        {/* =====================================================
            ESTADO WHATSAPP
            ===================================================== */}

        <div
          className={`sidebar-whatsapp-status ${
            whatsappConnected
              ? 'connected'
              : 'disconnected'
          }`}
        >

          <div className="sidebar-whatsapp-header">

            <span>
              {t('sidebar.whatsapp')}
            </span>

            <span className="sidebar-whatsapp-status-dot" />

          </div>

          <div className="sidebar-whatsapp-state">

            {whatsappConnected
              ? t('sidebar.connected')
              : t('sidebar.notConnected')}

          </div>

          {whatsappConnected &&
            whatsappPhone && (

              <div className="sidebar-whatsapp-phone">
                +{whatsappPhone}
              </div>

            )}

        </div>

        {/* =====================================================
            CERRAR SESIÓN
            ===================================================== */}

        <button
          type="button"
          onClick={() => {
            onCloseMobile?.()
            onLogout?.()
          }}
          className="sidebar-logout"
        >

          <span className="sidebar-nav-icon">
            🚪
          </span>

          <span>
            {t('sidebar.logout')}
          </span>

        </button>

      </aside>
    </>
  )
}