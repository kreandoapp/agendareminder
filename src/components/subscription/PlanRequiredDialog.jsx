import { useEffect, useState } from 'react'
import './PlanRequiredDialog.css'

const API_URL = 'https://kreandoapp.com/api/index.php'

const PLANS = [
  {
    id: 'trial',
    apiPlan: 'trial',
    name: 'Prueba gratuita',
    price: '0 €',
    period: '20 días',
    description: 'Probá Wilbuk gratis durante 20 días.',
    features: [
      'Acceso de prueba a Wilbuk',
      'Gestión de citas y clientes',
      'Probá las automatizaciones',
    ],
    featured: true,
    badge: '20 DÍAS GRATIS',
  },
  {
    id: 'basic',
    apiPlan: 'basic',
    name: 'Básico',
    price: '15 €',
    period: '/mes',
    description: 'Para empezar a organizar tu negocio.',
    features: [
      'Agenda de citas',
      'Gestión de clientes',
      'Recordatorios de WhatsApp',
    ],
  },
  {
    id: 'professional',
    apiPlan: 'pro',
    name: 'Profesional',
    price: '25 €',
    period: '/mes',
    description: 'Para negocios que quieren crecer.',
    features: [
      'Todo lo del plan Básico',
      'Automatizaciones',
      'Gestión de citas avanzada',
    ],
  },
  {
    id: 'business',
    apiPlan: 'business',
    name: 'Business',
    price: '40 €',
    period: '/mes',
    description: 'Para negocios que necesitan más.',
    features: [
      'Todo lo del plan Profesional',
      'Funciones avanzadas',
      'Mayor capacidad de gestión',
      'Prioridad en soporte',
    ],
  },
]

const getToken = () => localStorage.getItem('access_token')

export default function PlanRequiredDialog({
  title = 'Planes de Wilbuk',
  description = 'Elegí el plan que mejor se adapte a tu negocio.',
  onClose,
  onViewPlans,
  onLogout,
}) {
  const [loadingPlan, setLoadingPlan] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const previousOverflow = document.body.style.overflow

    document.body.style.overflow = 'hidden'

    const handleEscape = (event) => {
      if (event.key === 'Escape' && !loadingPlan) {
        onClose?.()
      }
    }

    document.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose, loadingPlan])

  const handleChoosePlan = async (plan) => {
    if (loadingPlan) return

    setError('')
    setLoadingPlan(plan.id)

    try {
      const token = getToken()

      if (!token) {
        throw new Error(
          'Tu sesión ha caducado. Iniciá sesión nuevamente.'
        )
      }

      // ==========================================
      // PRUEBA GRATUITA: NO UTILIZA STRIPE
      // ==========================================
      if (plan.id === 'trial') {
        const response = await fetch(
          `${API_URL}?action=activate-trial`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
          }
        )

        const data = await response.json()

        if (!response.ok || data.success !== true) {
          throw new Error(
            data.message ||
              'No se pudo activar la prueba gratuita.'
          )
        }

        // La prueba ya está activada en el servidor.
        // Recargamos para actualizar el estado de Wilbuk.
        window.location.reload()

        return
      }

      // ==========================================
      // PLANES DE PAGO: STRIPE CHECKOUT
      // ==========================================
      const response = await fetch(
        `${API_URL}?action=stripe-checkout`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            plan: plan.apiPlan,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok || data.success === false) {
        throw new Error(
          data.message ||
            data.error ||
            'No se pudo crear la sesión de pago.'
        )
      }

      const checkoutUrl = data.checkout_url || data.url

      if (!checkoutUrl) {
        throw new Error(
          'La API no devolvió el enlace de pago de Stripe.'
        )
      }

      // Validar que la dirección sea de Stripe Checkout.
      const stripeUrl = new URL(checkoutUrl)

      if (
        stripeUrl.protocol !== 'https:' ||
        stripeUrl.hostname !== 'checkout.stripe.com'
      ) {
        throw new Error(
          'La API devolvió una dirección de pago no válida.'
        )
      }

      // Redirigir a Stripe para completar el pago.
      window.location.assign(stripeUrl.href)
    } catch (err) {
      console.error('Error al elegir el plan:', err)

      setError(
        err.message ||
          'Ocurrió un error al procesar la solicitud.'
      )

      setLoadingPlan(null)
    }
  }

  return (
    <div
      className="plan-dialog-overlay"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !loadingPlan
        ) {
          onClose?.()
        }
      }}
    >
      <section
        className="plan-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="plan-dialog-title"
        aria-busy={Boolean(loadingPlan)}
      >
        <button
          type="button"
          className="plan-dialog__close"
          onClick={onClose}
          aria-label="Cerrar diálogo"
          disabled={Boolean(loadingPlan)}
        >
          ×
        </button>

        <header className="plan-dialog__header">
          <span className="plan-dialog__eyebrow">
            WILBUK · PLANES
          </span>

          <h2
            id="plan-dialog-title"
            className="plan-dialog__title"
          >
            {title}
          </h2>

          <p className="plan-dialog__description">
            {description}
          </p>

          <div className="plan-dialog__trial-notice">
            ✨ Empezá gratis: 20 días de prueba
          </div>
        </header>

        <div className="plan-dialog__grid">
          {PLANS.map((plan) => (
            <article
              key={plan.id}
              className={`plan-card ${
                plan.featured ? 'plan-card--featured' : ''
              }`}
            >
              {plan.badge && (
                <span className="plan-card__badge">
                  {plan.badge}
                </span>
              )}

              <h3 className="plan-card__name">
                {plan.name}
              </h3>

              <p className="plan-card__description">
                {plan.description}
              </p>

              <div className="plan-card__price">
                <strong>{plan.price}</strong>
                <span>{plan.period}</span>
              </div>

              <div className="plan-card__divider" />

              <ul className="plan-card__features">
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <span aria-hidden="true">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                className={`plan-card__button ${
                  plan.featured
                    ? 'plan-card__button--featured'
                    : ''
                }`}
                onClick={() => handleChoosePlan(plan)}
                disabled={Boolean(loadingPlan)}
              >
                {loadingPlan === plan.id
                  ? 'Procesando...'
                  : loadingPlan
                    ? 'Esperá un momento...'
                    : plan.id === 'trial'
                      ? 'Empezar prueba gratis'
                      : 'Elegir plan'}
              </button>
            </article>
          ))}
        </div>

        {error && (
          <p
            role="alert"
            className="plan-dialog__error"
          >
            {error}
          </p>
        )}

        <footer className="plan-dialog__footer">
          {onLogout && (
            <button
              type="button"
              className="plan-dialog__logout"
              onClick={onLogout}
              disabled={Boolean(loadingPlan)}
            >
              Cerrar sesión
            </button>
          )}

          <button
            type="button"
            className="plan-dialog__back"
            onClick={onClose}
            disabled={Boolean(loadingPlan)}
          >
            Volver
          </button>
        </footer>
      </section>
    </div>
  )
}