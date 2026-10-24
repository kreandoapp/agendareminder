import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'

import useAuth from './hooks/useAuth'
import useSubscription from './hooks/useSubscription'
import useWhatsApp from './hooks/useWhatsApp'
import useOnboarding from './hooks/useOnboarding'
import useNavigation from './hooks/useNavigation'
import useSession from './hooks/useSession'

import { useLanguage } from './context/LanguageContext'

import AuthFlow from './components/auth/AuthFlow'
import SubscriptionRequired from './components/subscription/SubscriptionRequired'
import PaymentSuccess from './pages/payment/PaymentSuccess'
import Sidebar from './components/layout/Sidebar'
import AppPages from './components/layout/AppPages'

import Step1Location from './pages/onboarding/steps/Step1Location'
import Step2Hours from './pages/onboarding/steps/Step2Hours'
import Step3Service from './pages/onboarding/steps/Step3Service'
import Step4Employee from './pages/onboarding/steps/Step4Employee'
import Step5WhatsApp from './pages/onboarding/steps/Step5WhatsApp'

function App() {
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
    authInitializing,
    restoreSession,
  } = useAuth()

  const {
    subscriptionChecked,
    hasSubscriptionAccess,
    hasSubscription,
    subscription,
    checkSubscription,
  } = useSubscription()

  const [currentPage, setCurrentPage] = useState('home')
  const [authPage, setAuthPage] = useState('login')
  const [resetEmail, setResetEmail] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [checkingSubscription, setCheckingSubscription] = useState(false)
  const [subscriptionError, setSubscriptionError] = useState('')
  const [sessionChecked, setSessionChecked] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [onboardingCompleted, setOnboardingCompleted] = useState(false)
  const [onboardingStep, setOnboardingStep] = useState(1)
  const [onboardingChecked, setOnboardingChecked] = useState(false)

  const sessionRecoveryStarted = useRef(false)
  const stopDetectorRef = useRef(null)

  const isPaymentSuccess = window.location.pathname
    .replace(/\/+$/, '')
    .endsWith('/payment-success')

  const { setLanguageFromBusiness, syncLanguage } = useLanguage()

  const { clearSession, logout } = useSession({
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

  // The hook only reads onboarding status. App controls navigation after
  // subscription access has been confirmed.
  const onboarding = useOnboarding({
    onSessionExpired: () => clearSession(),
  })

  const {
    checkStatus: checkOnboardingStatus,
    refreshStatus: refreshOnboardingStatus,
  } = onboarding

  const whatsapp = useWhatsApp({
    onSessionExpired: clearSession,
  })

  const {
    connected: whatsappConnected,
    phone: whatsappPhone,
  } = whatsapp

  const navigate = useNavigation({
    whatsappConnected,
    onboardingCompleted,
    resetOnboarding: onboarding.reset,
    setCurrentPage,
    setError,
  })

  useEffect(() => {
    stopDetectorRef.current = whatsapp.stopDetector
    return () => {
      stopDetectorRef.current = null
    }
  }, [whatsapp.stopDetector])

  useEffect(() => {
    if (user?.business?.language) {
      setLanguageFromBusiness(user.business.language)
    } else {
      syncLanguage()
    }
  }, [user, setLanguageFromBusiness, syncLanguage])

  // Called only after subscription access is confirmed.
  const applyOnboardingStatus = useCallback(async (status) => {
    if (!status || typeof status !== 'object') {
      throw new Error('La API no devolvió un estado válido del onboarding.')
    }

    const completed =
      status.completed === true ||
      status.onboarding_completed === true

    const step = Math.min(5, Math.max(1, Number(status.current_step) || 1))

    setOnboardingCompleted(completed)

    if (completed) {
      setOnboardingStep(5)
      setCurrentPage('home')

      try {
        await whatsapp.checkStatus()
        whatsapp.startDetector()
      } catch (whatsappError) {
        console.error('Error comprobando el estado de WhatsApp:', whatsappError)
      }
    } else {
      setOnboardingStep(step)
      setCurrentPage('onboarding')
    }

    setOnboardingChecked(true)
  }, [
    setCurrentPage,
    whatsapp.checkStatus,
    whatsapp.startDetector,
  ])

  // Session restore -> subscription check -> onboarding status check.
  useEffect(() => {
    if (sessionRecoveryStarted.current) return
    sessionRecoveryStarted.current = true

    const initializeSession = async () => {
      try {
        const result = await restoreSession()

        if (result?.status !== 'authenticated' || !result.user) {
          return
        }

        const restoredUser = result.user
        setCheckingSubscription(true)
        setSubscriptionError('')
        setOnboardingChecked(false)

        const hasAccess = await checkSubscription(restoredUser)
        const isAdmin = restoredUser.role === 'admin'

        // No subscription access means no onboarding request.
        if (!hasAccess && !isAdmin) return

        const onboardingStatus = await checkOnboardingStatus()

        if (!onboardingStatus) {
          setSubscriptionError(
            'No se pudo consultar la configuración inicial. Volvé a intentarlo.'
          )
          return
        }

        await applyOnboardingStatus(onboardingStatus)
      } catch (initializationError) {
        console.error('Error inicializando el acceso:', initializationError)
        setSubscriptionError(
          'No se pudo comprobar el acceso a tu cuenta. Volvé a intentarlo.'
        )
      } finally {
        setCheckingSubscription(false)
        setSessionChecked(true)
      }
    }

    initializeSession()
  }, [
    restoreSession,
    checkSubscription,
    checkOnboardingStatus,
    applyOnboardingStatus,
  ])

  // Login -> subscription check -> onboarding status check.
  const handleLogin = async () => {
    setSubscriptionError('')
    setCheckingSubscription(true)
    setOnboardingChecked(false)

    try {
      const result = await login()
      if (!result?.user) return

      const loggedInUser = {
        ...result.user,
        business: result.business ?? result.user.business ?? null,
      }

      setUser(loggedInUser)

      const hasAccess = await checkSubscription(loggedInUser)
      const isAdmin = loggedInUser.role === 'admin'

      // Do not query onboarding if subscription access is denied.
      if (!hasAccess && !isAdmin) return

      const onboardingStatus = await checkOnboardingStatus()

      if (!onboardingStatus) {
        setSubscriptionError(
          'No se pudo consultar la configuración inicial. Volvé a intentarlo.'
        )
        return
      }

      await applyOnboardingStatus(onboardingStatus)
    } catch (loginError) {
      console.error('Error durante el inicio de sesión:', loginError)
      setSubscriptionError(
        'No se pudo comprobar el acceso a tu cuenta. Intentá nuevamente.'
      )
    } finally {
      setCheckingSubscription(false)
    }
  }

  const handleLogout = () => {
    logout()
    setSubscriptionError('')
    setOnboardingChecked(false)
    setSessionChecked(true)
  }

  const handleDisconnectWhatsApp = async () => {
    try {
      if (typeof whatsapp.disconnect === 'function') {
        await whatsapp.disconnect()
      }
    } catch (disconnectError) {
      console.error('Error desconectando WhatsApp:', disconnectError)
    }
  }

  const handleRetryOnboarding = async () => {
    setCheckingSubscription(true)
    setSubscriptionError('')

    try {
      const hasAccess = await checkSubscription(user)
      if (!hasAccess && user?.role !== 'admin') return

      const status = await checkOnboardingStatus()
      if (!status) {
        setSubscriptionError(
          'No se pudo consultar la configuración inicial. Volvé a intentarlo.'
        )
        return
      }

      await applyOnboardingStatus(status)
    } catch (retryError) {
      console.error('Error reintentando la comprobación:', retryError)
      setSubscriptionError('No se pudo comprobar el acceso. Volvé a intentarlo.')
    } finally {
      setCheckingSubscription(false)
    }
  }

  if (isPaymentSuccess) {
    return <PaymentSuccess />
  }

  if (!sessionChecked || authInitializing) {
    return (
      <main className="app-loading">
        <h2>Comprobando sesión...</h2>
        <p>Estamos verificando tu acceso a Wilbuk.</p>
      </main>
    )
  }

  if (!user) {
    return (
      <AuthFlow
        authPage={authPage}
        setAuthPage={setAuthPage}
        resetEmail={resetEmail}
        setResetEmail={setResetEmail}
        resetToken={resetToken}
        setResetToken={setResetToken}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        loading={loading || checkingSubscription}
        error={error || subscriptionError}
        onLogin={handleLogin}
        forgotPassword={forgotPassword}
        verifyResetCode={verifyResetCode}
        resetPassword={resetPassword}
      />
    )
  }

  if (checkingSubscription || !subscriptionChecked) {
    return (
      <main className="app-loading">
        <h2>Comprobando suscripción...</h2>
        <p>Estamos verificando el acceso a tu cuenta.</p>
      </main>
    )
  }

if (!hasSubscriptionAccess && user.role !== 'admin') {
  return (
    <SubscriptionRequired
      onLogout={handleLogout}
      subscription={subscription}
      hasSubscription={hasSubscription}
    />
  )
}

  // Don't render the app pages until the database onboarding status is known.
  if (!onboardingChecked) {
    return (
      <main className="app-loading">
        <h2>Comprobando configuración...</h2>
        <p>Estamos consultando el estado de configuración de tu negocio.</p>
        {subscriptionError && (
          <div className="app-error" role="alert">
            <p>{subscriptionError}</p>
            <button type="button" onClick={handleRetryOnboarding}>
              Volver a intentar
            </button>
            <button type="button" onClick={handleLogout}>
              Cerrar sesión
            </button>
          </div>
        )}
      </main>
    )
  }

  if (currentPage === 'onboarding') {
    const onboardingProps = {
      user,
      onboardingStep,
      setOnboardingStep,
      setCurrentPage,
      setOnboardingCompleted,
      refreshOnboardingStatus,
    }

    switch (onboardingStep) {
      case 1:
        return <Step1Location {...onboardingProps} />
      case 2:
        return <Step2Hours {...onboardingProps} />
      case 3:
        return <Step3Service {...onboardingProps} />
      case 4:
        return <Step4Employee {...onboardingProps} />
      case 5:
        return <Step5WhatsApp {...onboardingProps} />
      default:
        return <Step1Location {...onboardingProps} />
    }
  }

  return (
    <div className="app-container">
          <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        navigate={navigate}
        user={user}
        whatsappConnected={whatsappConnected}
        whatsappPhone={whatsappPhone}
        hasSubscriptionAccess={hasSubscriptionAccess}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onLogout={handleLogout}
      />

      <main className="app-main">
        {subscriptionError && (
          <div className="app-error" role="alert">
            {subscriptionError}
            <button type="button" onClick={() => setSubscriptionError('')}>
              Cerrar
            </button>
          </div>
        )}

        <AppPages
          currentPage={currentPage}
          user={user}
          whatsappConnected={whatsappConnected}
          whatsappPhone={whatsappPhone}
          navigate={navigate}
          onDisconnectWhatsApp={handleDisconnectWhatsApp}
        />
      </main>
    </div>
  )
}

export default App
