import { useEffect, useState } from 'react'
import './PaymentSuccess.css'

const API_URL = 'https://kreandoapp.com/api/'

const getIntervalLabel = (interval, count = 1) => {
  const labels = {
    day: count === 1 ? 'día' : 'días',
    week: count === 1 ? 'semana' : 'semanas',
    month: count === 1 ? 'mes' : 'meses',
    year: count === 1 ? 'año' : 'años',
  }

  const label = labels[interval] || 'mes'
  return `/${count > 1 ? `${count} ` : ''}${label}`
}

const formatPrice = (amount, currency = 'eur') => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100)
}

function PaymentSuccess() {
  const sessionId = new URLSearchParams(window.location.search).get('session_id')

  const [purchase, setPurchase] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    let cancelled = false

    const verifyCheckout = async () => {
      setLoading(true)
      setError('')
      setPurchase(null)

      if (!sessionId) {
        setError('No encontramos la sesión de pago.')
        setLoading(false)
        return
      }

      try {
        const response = await fetch(
          `${API_URL}?action=stripe-checkout-session&session_id=${encodeURIComponent(sessionId)}`,
          {
            method: 'GET',
            headers: {
              Accept: 'application/json',
            },
            cache: 'no-store',
          }
        )

        const data = await response.json()

        if (!response.ok || !data.success || !data.session) {
          throw new Error(
            data.message || 'No pudimos verificar tu sesión de pago.'
          )
        }

        const session = data.session

        if (session.status !== 'complete') {
          throw new Error(
            'El proceso de pago todavía no está completado. Volvé a comprobarlo en unos instantes.'
          )
        }

        if (
          session.payment_status !== 'paid' &&
          session.payment_status !== 'no_payment_required'
        ) {
          throw new Error(
            'Stripe todavía no ha confirmado el pago. Podés volver a comprobarlo en unos instantes.'
          )
        }

        if (
          !session.plan_name ||
          !session.plan ||
          !Number.isFinite(Number(session.unit_amount)) ||
          !session.currency
        ) {
          throw new Error(
            'El pago se ha verificado, pero faltan los datos del plan. Contactá con soporte si el problema continúa.'
          )
        }

        const quantity = Math.max(1, Number(session.quantity) || 1)

        if (!cancelled) {
          setPurchase({
            name: session.plan_name,
            plan: session.plan,
            amount: Number(session.unit_amount) * quantity,
            currency: String(session.currency).toLowerCase(),
            interval: session.interval || 'month',
            intervalCount: Math.max(
              1,
              Number(session.interval_count) || 1
            ),
            paymentStatus: session.payment_status,
          })

          localStorage.removeItem('selectedPlan')
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message || 'No pudimos verificar tu suscripción.'
          )
          setLoading(false)
        }
      }
    }

    verifyCheckout()

    return () => {
      cancelled = true
    }
  }, [sessionId, retryCount])

  const handleDashboard = () => {
    window.location.href = '/wilbuk/'
  }

  const handleRetry = () => {
    setRetryCount((count) => count + 1)
  }

  if (loading) {
    return (
      <div className="payment-success-page">
        <div className="payment-success-container">
          <div className="payment-success-logo">
            <div className="payment-success-logo-symbol">W</div>
            <span>Wilbuk</span>
          </div>

          <div className="payment-success-card">
            <div className="payment-success-icon-wrapper">
              <div className="payment-success-icon">↻</div>
            </div>

            <h1>Verificando tu pago...</h1>

            <p className="payment-success-subtitle">
              Estamos consultando Stripe para confirmar tu compra.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !purchase) {
    return (
      <div className="payment-success-page">
        <div className="payment-success-container">
          <div className="payment-success-logo">
            <div className="payment-success-logo-symbol">W</div>
            <span>Wilbuk</span>
          </div>

          <div className="payment-success-card">
            <div className="payment-success-icon-wrapper">
              <div className="payment-success-icon">!</div>
            </div>

            <h1>No pudimos confirmar los datos</h1>

            <p className="payment-success-subtitle">
              {error || 'No encontramos los datos de tu compra.'}
            </p>

            <button
              type="button"
              className="payment-success-button"
              onClick={handleRetry}
            >
              Volver a comprobar →
            </button>

            <button
              type="button"
              className="payment-success-button"
              onClick={handleDashboard}
            >
              Ir al dashboard
            </button>

            <p className="payment-success-footer">
              Si el problema continúa, contactá con soporte antes de
              realizar otro pago.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="payment-success-page">
      <div className="payment-success-container">
        <div className="payment-success-logo">
          <div className="payment-success-logo-symbol">W</div>
          <span>Wilbuk</span>
        </div>

        <div className="payment-success-card">
          <div className="payment-success-icon-wrapper">
            <div className="payment-success-icon">✓</div>
          </div>

          <h1>¡Pago confirmado!</h1>

          <p className="payment-success-subtitle">
            Stripe ha confirmado tu pago. Gracias por confiar en Wilbuk.
          </p>

          <div className="payment-success-plan">
            <div className="payment-success-plan-icon">✦</div>

            <div className="payment-success-plan-info">
              <span>Tu plan contratado</span>
              <strong>{purchase.name}</strong>
            </div>

            <div className="payment-success-plan-price">
              <strong>
                {formatPrice(purchase.amount, purchase.currency)}
              </strong>

              <span>
                {getIntervalLabel(
                  purchase.interval,
                  purchase.intervalCount
                )}
              </span>
            </div>
          </div>

          <div className="payment-success-features">
            <div className="payment-success-feature">
              <span>✓</span>
              Pago verificado por Stripe
            </div>

            <div className="payment-success-feature">
              <span>✓</span>
              Plan contratado: {purchase.name}
            </div>

            <div className="payment-success-feature">
              <span>✓</span>
              Importe obtenido de Stripe
            </div>
          </div>

          <button
            type="button"
            className="payment-success-button"
            onClick={handleDashboard}
          >
            Ir a mi dashboard <span>→</span>
          </button>

          <p className="payment-success-footer">
            Tu suscripción se gestiona desde tu cuenta de Wilbuk.
          </p>
        </div>

        <div className="payment-success-security">
          <span>🔒</span>
          Pago procesado de forma segura por Stripe
        </div>
      </div>
    </div>
  )
}

export default PaymentSuccess