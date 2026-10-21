import {
  useEffect,
  useRef,
  useState,
} from 'react'

import './App.css'
import wilbukLogo from './assets/logo.png'
import './styles/themes.css'

import {
  ThemeProvider,
} from './context/ThemeContext'

import {
  useLanguage,
} from './context/LanguageContext'

import Step1Location from './pages/onboarding/steps/Step1Location'
import Step2Hours from './pages/onboarding/steps/Step2Hours'
import Step3Service from './pages/onboarding/steps/Step3Service'
import Step4Employee from './pages/onboarding/steps/Step4Employee'
import Step5WhatsApp from './pages/onboarding/steps/Step5WhatsApp'

import Login from './components/auth/Login'
import ForgotPassword from './components/auth/ForgotPassword'
import VerifyResetCode from './components/auth/VerifyResetCode'
import ResetPassword from './components/auth/ResetPassword'
import PasswordResetSuccess from './components/auth/PasswordResetSuccess'

import useWhatsApp from './hooks/useWhatsApp'
import useAuth from './hooks/useAuth'
import useOnboarding from './hooks/useOnboarding'
import useNavigation from './hooks/useNavigation'
import useSession from './hooks/useSession'
import useWhatsAppFlow from './hooks/useWhatsAppFlow'
import useWhatsAppDisconnect from './hooks/useWhatsAppDisconnect'

import Sidebar from './components/layout/Sidebar'
import AppPages from './components/layout/AppPages'


function App() {

  // =====================================================
  // PÁGINA ACTUAL
  // =====================================================

  const [
    currentPage,
    setCurrentPage,
  ] = useState('home')


  // =====================================================
  // MENÚ MOBILE
  // =====================================================

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] = useState(false)


  // =====================================================
  // PANTALLA DE AUTENTICACIÓN
  // =====================================================

  const [
    authPage,
    setAuthPage,
  ] = useState('login')


  // =====================================================
  // EMAIL DE RECUPERACIÓN
  // =====================================================

  const [
    resetEmail,
    setResetEmail,
  ] = useState('')


  // =====================================================
  // TOKEN DE RECUPERACIÓN
  // =====================================================

  const [
    resetToken,
    setResetToken,
  ] = useState('')


  // =====================================================
  // REFERENCIA PARA DETENER WHATSAPP
  // =====================================================

  const stopDetectorRef =
    useRef(null)


  // =====================================================
  // AUTH
  // =====================================================

  const {
    user,
    setUser,
    email,
    setEmail,
    password,
    setPassword,
    loading,
    error,
    setError,
    login,
    forgotPassword,
    verifyResetCode,
    resetPassword,
    clearAuthSession,
  } = useAuth()


  // =====================================================
  // IDIOMA
  // =====================================================

  const {
    setLanguageFromBusiness,
    syncLanguage,
  } = useLanguage()


  // =====================================================
  // SINCRONIZAR IDIOMA
  // =====================================================
  //
  // SIN LOGIN:
  //     language_preference
  //
  // CON LOGIN:
  //     user.business.language
  //
  // LOGOUT:
  //     vuelve a language_preference
  //
  // =====================================================

  useEffect(() => {

    if (
      user?.business?.language
    ) {

      setLanguageFromBusiness(
        user.business.language
      )

      return
    }

    syncLanguage()

  }, [
    user,
    setLanguageFromBusiness,
    syncLanguage,
  ])


  // =====================================================
  // ONBOARDING
  // =====================================================

  const onboarding =
    useOnboarding({

      onSessionExpired: () => {
        clearSession()
      },

      onIncomplete: () => {
        setCurrentPage(
          'onboarding'
        )
      },

    })


  const {
    onboardingCompleted,
    onboardingStep,
    setOnboardingCompleted,
    setOnboardingStep,
    checkStatus:
      checkOnboardingStatus,
    refreshStatus:
      refreshOnboardingStatus,
  } = onboarding


  // =====================================================
  // SESIÓN
  // =====================================================

  const session =
    useSession({

      setUser,

      clearAuthSession,

      setEmail,
      setPassword,
      setError,
      setCurrentPage,
      setOnboardingCompleted,
      setOnboardingStep,
      stopDetectorRef,

    })


  const {
    clearSession,
    restoreSession,
    logout,
  } = session


  // =====================================================
  // WHATSAPP
  // =====================================================

  const whatsapp =
    useWhatsApp({

      onSessionExpired:
        clearSession,

    })


  const whatsappConnected =
    whatsapp.connected


  const whatsappPhone =
    whatsapp.phone


  // =====================================================
  // FLUJO WHATSAPP
  // =====================================================

  const {
    checkWhatsAppStatus,
    startWhatsAppDetector,
  } =
    useWhatsAppFlow({

      checkStatus:
        whatsapp.checkStatus,

      startDetector:
        whatsapp.startDetector,

      resetOnboarding:
        onboarding.reset,

      setCurrentPage,

    })


  // =====================================================
  // DESCONEXIÓN WHATSAPP
  // =====================================================

  const {
    disconnectWhatsApp,
  } =
    useWhatsAppDisconnect({

      whatsappConnected,

      disconnect:
        whatsapp.disconnect,

      setError,

      resetOnboarding:
        onboarding.reset,

      setCurrentPage,

    })


  // =====================================================
  // CONECTAR REFERENCIA DEL DETECTOR
  // =====================================================

  useEffect(() => {

    stopDetectorRef.current =
      whatsapp.stopDetector

    return () => {

      stopDetectorRef.current =
        null

    }

  }, [
    whatsapp.stopDetector,
  ])


  // =====================================================
  // LOGIN
  // =====================================================

  const handleLogin =
    async () => {

      const result =
        await login()

      if (!result) {
        return
      }


      const onboardingStatus =
        await checkOnboardingStatus()


      if (!onboardingStatus) {
        return
      }


      // =================================================
      // ONBOARDING COMPLETADO
      // =================================================

      if (
        onboardingStatus.completed ===
        true
      ) {

        setOnboardingCompleted(
          true
        )

        setOnboardingStep(
          Number(
            onboardingStatus.current_step
          ) || 5
        )

        setCurrentPage(
          'home'
        )

        await checkWhatsAppStatus()

        startWhatsAppDetector()

        return
      }


      // =================================================
      // ONBOARDING INCOMPLETO
      // =================================================

      setOnboardingCompleted(
        false
      )

      setOnboardingStep(
        Number(
          onboardingStatus.current_step
        ) || 1
      )

      setCurrentPage(
        'onboarding'
      )

    }


  // =====================================================
  // RESTAURAR SESIÓN
  // =====================================================

  useEffect(() => {

    let cancelled = false


    const restore =
      async () => {

        await restoreSession(

          async () => {

            const onboardingStatus =
              await checkOnboardingStatus()


            if (cancelled) {
              return false
            }


            if (!onboardingStatus) {
              return false
            }


            // ===========================================
            // ONBOARDING COMPLETADO
            // ===========================================

            if (
              onboardingStatus.completed ===
              true
            ) {

              setOnboardingCompleted(
                true
              )

              setOnboardingStep(
                Number(
                  onboardingStatus.current_step
                ) || 5
              )

              setCurrentPage(
                'home'
              )

              await checkWhatsAppStatus()

              startWhatsAppDetector()

              return true
            }


            // ===========================================
            // ONBOARDING INCOMPLETO
            // ===========================================

            setOnboardingCompleted(
              false
            )

            setOnboardingStep(
              Number(
                onboardingStatus.current_step
              ) || 1
            )

            setCurrentPage(
              'onboarding'
            )

            return false

          }

        )

      }


    restore()


    return () => {

      cancelled = true

      whatsapp.stopDetector()

    }

  }, [])


  // =====================================================
  // NAVEGACIÓN
  // =====================================================

  const navigate =
    useNavigation({

      whatsappConnected,

      onboardingCompleted,

      resetOnboarding:
        onboarding.reset,

      setCurrentPage,

      setError,

    })


  // =====================================================
  // LOGIN / RECUPERACIÓN
  // =====================================================

  if (!user) {

    if (
      authPage ===
      'forgot-password'
    ) {

      return (

        <ForgotPassword

          onSubmit={
            async email => {

              const result =
                await forgotPassword(
                  email
                )

              if (result) {

                setResetEmail(
                  email
                )

                setAuthPage(
                  'verify-reset-code'
                )

              }

              return result

            }
          }

          onBack={() =>
            setAuthPage(
              'login'
            )
          }

        />

      )

    }


    if (
      authPage ===
      'verify-reset-code'
    ) {

      return (

        <VerifyResetCode

          email={
            resetEmail
          }

          onSubmit={
            async code => {

              const result =
                await verifyResetCode(
                  resetEmail,
                  code
                )

              if (
                result?.reset_token
              ) {

                setResetToken(
                  result.reset_token
                )

                setAuthPage(
                  'reset-password'
                )

              }

              return result

            }
          }

          onBack={() =>
            setAuthPage(
              'forgot-password'
            )
          }

        />

      )

    }


    if (
      authPage ===
      'reset-password'
    ) {

      return (

        <ResetPassword

          onSubmit={
            async password => {

              const result =
                await resetPassword(
                  resetToken,
                  password
                )

              if (result) {

                setAuthPage(
                  'password-reset-success'
                )

              }

              return result

            }
          }

        />

      )

    }


    if (
      authPage ===
      'password-reset-success'
    ) {

      return (

        <PasswordResetSuccess

          onContinue={() =>
            setAuthPage(
              'login'
            )
          }

        />

      )

    }


    return (

      <Login

        email={
          email
        }

        setEmail={
          setEmail
        }

        password={
          password
        }

        setPassword={
          setPassword
        }

        loading={
          loading
        }

        error={
          error
        }

        onLogin={
          handleLogin
        }

        onForgotPassword={() =>
          setAuthPage(
            'forgot-password'
          )
        }

      />

    )

  }


  // =====================================================
  // ONBOARDING
  // =====================================================

  if (
    currentPage ===
    'onboarding'
  ) {

    switch (
      Number(
        onboardingStep
      )
    ) {


      // ===============================================
      // PASO 1
      // ===============================================

      case 1:

        return (

          <Step1Location

            onSaved={async () => {

              await refreshOnboardingStatus()

            }}

            onNext={async () => {

              await refreshOnboardingStatus()

            }}

            onSessionExpired={
              clearSession
            }

          />

        )


      // ===============================================
      // PASO 2
      // ===============================================

      case 2:

        return (

          <Step2Hours

            onSaved={async () => {

              await refreshOnboardingStatus()

            }}

            onNext={async () => {

              await refreshOnboardingStatus()

            }}

            onSessionExpired={
              clearSession
            }

          />

        )


      // ===============================================
      // PASO 3
      // ===============================================

      case 3:

        return (

          <Step3Service

            onSaved={async () => {

              await refreshOnboardingStatus()

            }}

            onNext={async () => {

              await refreshOnboardingStatus()

            }}

            onSessionExpired={
              clearSession
            }

          />

        )


      // ===============================================
      // PASO 4
      // ===============================================

      case 4:

        return (

          <Step4Employee

            onSaved={async () => {

              await refreshOnboardingStatus()

            }}

            onNext={async () => {

              await refreshOnboardingStatus()

            }}

            onSessionExpired={
              clearSession
            }

          />

        )


      // ===============================================
      // PASO 5
      // ===============================================

      case 5:

        return (

          <Step5WhatsApp

            onConnected={
              async result => {

                console.log(
                  '🟢 WhatsApp conectado durante onboarding:',
                  result
                )


                if (
                  result?.completed ===
                  true
                ) {

                  setOnboardingCompleted(
                    true
                  )

                  setOnboardingStep(
                    5
                  )

                  // HOME ES LA PANTALLA PRINCIPAL
                  setCurrentPage(
                    'home'
                  )

                  await checkWhatsAppStatus()

                  return

                }


                await checkWhatsAppStatus()

                await refreshOnboardingStatus()

              }
            }

            onSessionExpired={
              clearSession
            }

          />

        )


      // ===============================================
      // PASO INVÁLIDO
      // ===============================================

      default:

        console.warn(
          '⚠️ Paso de onboarding inválido:',
          onboardingStep
        )

        setOnboardingStep(
          1
        )

        return null

    }

  }


  // =====================================================
  // APP PRINCIPAL
  // =====================================================

  return (

    <div
      className="app-shell"
    >

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <Sidebar

        user={
          user
        }

        currentPage={
          currentPage
        }

        navigate={
          navigate
        }

        whatsappConnected={
          whatsappConnected
        }

        whatsappPhone={
          whatsappPhone
        }

        onLogout={
          logout
        }

        mobileOpen={
          mobileMenuOpen
        }

        onCloseMobile={() =>
          setMobileMenuOpen(
            false
          )
        }

      />


      {/* =================================================
          CONTENIDO
      ================================================= */}

      <div
        className="app-content-wrapper"
      >

        {/* ===============================================
            HEADER MOBILE
        =============================================== */}

        <header
          className="mobile-app-header"
        >

          {/* =============================================
              LOGO / HOME
          ============================================= */}

          <button
            type="button"
            className="mobile-app-brand"
            onClick={() => {

              navigate(
                'home'
              )

              setMobileMenuOpen(
                false
              )

            }}

            aria-label="Ir al inicio"
          >

            <div
              className="mobile-app-logo"
            >
              <img
                src={wilbukLogo}
                alt="Wilbuk"
                className="mobile-app-logo-image"
              />
            </div>

            <div
              className="mobile-app-brand-text"
            >

              <div
                className="mobile-app-brand-name"
              >
                <span className="mobile-app-brand-wil">
                  Wil
                </span>
                <span className="mobile-app-brand-buk">
                  buk
                </span>
              </div>

              <div
                className="mobile-app-brand-subtitle"
              >
                Gestión y automatización
              </div>

            </div>

          </button>


          {/* =============================================
              MENÚ MOBILE
          ============================================= */}

          <button
            type="button"
            className="mobile-menu-button"
            onClick={() =>
              setMobileMenuOpen(
                true
              )
            }

            aria-label="Abrir menú"
          >
            ☰
          </button>

        </header>


        {/* ===============================================
            MAIN
        =============================================== */}

        <main
          className="app-main"
        >

          <AppPages

            currentPage={
              currentPage
            }

            user={
              user
            }

            whatsappConnected={
              whatsappConnected
            }

            whatsappPhone={
              whatsappPhone
            }

            navigate={
              navigate
            }

            onDisconnectWhatsApp={
              disconnectWhatsApp
            }

          />

        </main>

      </div>

    </div>

  )

}


export default App