import { useState, useEffect, useRef } from 'react'
import useAuth from './hooks/useAuth'
import useSubscription from './hooks/useSubscription'
import AuthFlow from './components/auth/AuthFlow'
import SubscriptionRequired from './components/subscription/SubscriptionRequired'
import PaymentSuccess from './pages/payment/PaymentSuccess'

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
    checkSubscription,
  } = useSubscription()

  const [authPage, setAuthPage] = useState('login')
  const [resetEmail, setResetEmail] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [checkingSubscription, setCheckingSubscription] = useState(false)
  const [subscriptionError, setSubscriptionError] = useState('')
  const [sessionChecked, setSessionChecked] = useState(false)

  const sessionRecoveryStarted = useRef(false)

  const isPaymentSuccess =
    window.location.pathname.replace(/\/+$/, '').endsWith('/payment-success')

  // Recuperar la sesión al entrar en la aplicación.
  // No vuelve a ejecutar la recuperación en cada renderizado.
  useEffect(() => {
    if (sessionRecoveryStarted.current) {
      return
    }

    sessionRecoveryStarted.current = true

    const initializeSession = async () => {
      try {
        const result = await restoreSession()

        if (result?.status === 'authenticated' && result.user) {
          const restoredUser = result.user

          setCheckingSubscription(true)
          setSubscriptionError('')

          try {
            const hasAccess = await checkSubscription(restoredUser)

            if (!hasAccess && restoredUser.role !== 'admin') {
              setSubscriptionError('')
            }
          } catch (error) {
            console.error(
              'Error comprobando la suscripción:',
              error
            )

            setSubscriptionError(
              'No se pudo comprobar la suscripción.'
            )
          } finally {
            setCheckingSubscription(false)
          }
        }
      } catch (error) {
        console.error('Error inicializando la sesión:', error)
      } finally {
        setSessionChecked(true)
      }
    }

    initializeSession()
  }, [restoreSession, setUser, checkSubscription])

  const handleLogin = async () => {
    setSubscriptionError('')
    setCheckingSubscription(true)

    try {
      const result = await login()

      if (!result?.user) {
        return
      }

      const loggedInUser = {
        ...result.user,
        business: result.business ?? result.user.business ?? null,
      }

      setUser(loggedInUser)

      const hasAccess = await checkSubscription(loggedInUser)

      if (!hasAccess && loggedInUser.role !== 'admin') {
        return
      }
    } catch (error) {
      console.error('Error comprobando la suscripción:', error)

      setSubscriptionError(
        'No se pudo comprobar la suscripción.'
      )
    } finally {
      setCheckingSubscription(false)
    }
  }

  const handleLogout = () => {
    clearAuthSession()
    setUser(null)
    setEmail('')
    setPassword('')
    setSubscriptionError('')
    setSessionChecked(true)
  }

  if (isPaymentSuccess) {
    return <PaymentSuccess />
  }

  // Esperar a que termine la recuperación inicial de sesión.
  if (!sessionChecked || authInitializing) {
    return (
      <main style={{ padding: 40, fontFamily: 'sans-serif' }}>
        <h2>Comprobando sesión...</h2>
        <p>Estamos verificando tu acceso a Wilbuk.</p>
      </main>
    )
  }

  // Usuario sin sesión: mostrar login.
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
        loading={loading}
        error={error}
        onLogin={handleLogin}
        forgotPassword={forgotPassword}
        verifyResetCode={verifyResetCode}
        resetPassword={resetPassword}
      />
    )
  }

  // Esperar la comprobación de la suscripción.
  if (checkingSubscription || !subscriptionChecked) {
    return (
      <main style={{ padding: 40, fontFamily: 'sans-serif' }}>
        <h2>Comprobando suscripción...</h2>
        <p>Estamos verificando el acceso a tu cuenta.</p>
      </main>
    )
  }

  // Usuario autenticado sin acceso a la suscripción.
  if (!hasSubscriptionAccess && user.role !== 'admin') {
    return (
      <SubscriptionRequired
        onLogout={handleLogout}
      />
    )
  }

  // Dashboard provisional.
  return (
    <main style={{ padding: 40, fontFamily: 'sans-serif' }}>
      <h1>Wilbuk</h1>

      <p>
        Usuario: {user.name || user.email}
      </p>

      <p>
        Rol: {user.role || 'Sin rol'}
      </p>

      <p>
        Acceso: {hasSubscriptionAccess ? 'Autorizado' : 'Sin suscripción'}
      </p>

      {subscriptionError && (
        <p role="alert">{subscriptionError}</p>
      )}

      <button onClick={handleLogout}>
        Cerrar sesión
      </button>
    </main>
  )
}

export default App