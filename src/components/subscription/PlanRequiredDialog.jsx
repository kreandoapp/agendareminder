import { useEffect, useState } from 'react'
import './PlanRequiredDialog.css'

const API_URL = 'https://kreandoapp.com/api/?action=stripe-checkout'

const PLANS = [
  {
    id: 'basic',
    apiPlan: 'basic',
    name: 'Básico',
    price: '15 €',
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
    description: 'Para negocios que quieren crecer.',
    features: [
      'Todo lo del plan Básico',
      'Automatizaciones',
      'Gestión de citas avanzada',
    ],
    featured: true,
  },
  {
    id: 'premium',
    apiPlan: 'business',
    name: 'Premium',
    price: '40 €',
    description: 'Para negocios que necesitan más.',
    features: [
      'Todo lo del plan Profesional',
      'Funciones avanzadas',
      'Mayor capacidad de gestión',
    ],
  },
]

const getToken = () => {
return localStorage.getItem('access_token')
}

export default function PlanRequiredDialog({
  title = 'Elegí tu plan',
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
      const authToken = getToken()

      if (!authToken) {
        throw new Error(
          'No encontramos tu sesión. Iniciá sesión nuevamente.'
        )
      }

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: plan.apiPlan,
        }),
      })

      const responseText = await response.text()

      let data

      try {
        data = JSON.parse(responseText)
      } catch {
        console.error(
          'La API devolvió una respuesta que no es JSON.'
        )

        throw new Error(
          'La API devolvió una respuesta inesperada. Revisá el servidor.'
        )
      }

      if (!response.ok || data.success === false) {
        console.error('Error de stripe-checkout:', {
          status: response.status,
          message: data.message,
        })

        if (response.status === 401) {
          throw new Error(
            'La API rechazó tu sesión. Necesitamos revisar el token de autenticación.'
          )
        }

        if (response.status === 403) {
          throw new Error(
            data.message ||
            'Tu usuario no tiene permiso para contratar este plan.'
          )
        }

        throw new Error(
          data.message ||
          data.error ||
          'No se pudo crear la sesión de pago.'
        )
      }

      const checkoutUrl = data.checkout_url

      if (!checkoutUrl) {
        console.error('Respuesta de stripe-checkout:', data)

        throw new Error(
          'La API no devolvió el enlace de pago de Stripe.'
        )
      }

      const stripeUrl = new URL(checkoutUrl)

      if (
        stripeUrl.protocol !== 'https:' ||
        stripeUrl.hostname !== 'checkout.stripe.com'
      ) {
        throw new Error(
          'La API devolvió una dirección de pago no válida.'
        )
      }

      console.log(
        'Sesión de Stripe creada correctamente para el plan:',
        plan.apiPlan
      )

      // Redirigir directamente al checkout real de Stripe.
      window.location.assign(stripeUrl.href)
    } catch (err) {
      console.error(
        'Error al generar el enlace de Stripe:',
        err
      )

      setError(
        err.message ||
        'Ocurrió un error al generar el pago.'
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
        </header>

        <div className="plan-dialog__grid">
          {PLANS.map((plan) => (
            <article
              key={plan.id}
              className={`plan-card ${
                plan.featured ? 'plan-card--featured' : ''
              }`}
            >
              {plan.featured && (
                <span className="plan-card__badge">
                  MÁS ELEGIDO
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
                <span>/mes</span>
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
                  ? 'Generando enlace...'
                  : loadingPlan
                    ? 'Esperá un momento...'
                    : 'Elegir plan'}
              </button>
            </article>
          ))}
        </div>

        {error && (
          <p
            role="alert"
            style={{
              color: '#dc3545',
              textAlign: 'center',
              marginTop: '16px',
            }}
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