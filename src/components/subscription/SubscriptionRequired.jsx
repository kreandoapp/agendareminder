import { useState } from 'react'
import wilbukLogo from '../../assets/logo.png'
import PlanRequiredDialog from './PlanRequiredDialog'
import './SubscriptionRequired.css'

const API_URL = 'https://kreandoapp.com/api/index.php'

function SubscriptionRequired({
  onLogout,
  subscription = null,
  hasSubscription = false,
}) {
  const [showPlans, setShowPlans] = useState(false)
  const [loadingPayment, setLoadingPayment] = useState(false)
  const [error, setError] = useState('')

  const status = String(subscription?.status || '').toLowerCase()

  const isPastDue = ['past_due', 'unpaid'].includes(status)

  const planName =
    subscription?.plan_name ||
    subscription?.plan ||
    'Plan contratado'

  const planPrice = subscription?.price

  const handlePayInvoice = async () => {
    const token = localStorage.getItem('access_token')

    if (!token) {
      setError('Tu sesión ha caducado. Iniciá sesión nuevamente.')
      return
    }

    setLoadingPayment(true)
    setError('')

    try {
      const response = await fetch(
        `${API_URL}?action=stripe-customer-portal`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      )

      const result = await response.json()

      if (!response.ok || !result.success || !result.url) {
        throw new Error(
          result.message || 'No se pudo abrir la página de facturación.'
        )
      }

      window.location.href = result.url
    } catch (err) {
      setError(err.message || 'No se pudo conectar con Stripe.')
      setLoadingPayment(false)
    }
  }

  const handleViewPlans = () => {
    window.location.href = 'https://wilbuk.com/'
  }

  return (
    <main className="subscription-required">
      <section className="subscription-required__card">
        <img
          src={wilbukLogo}
          alt="Wilbuk"
          className="subscription-required__logo"
        />

        <p className="subscription-required__brand">WILBUK</p>

        {isPastDue ? (
          <>
            <h1 className="subscription-required__title">
              Tenés una factura pendiente
            </h1>

            <p className="subscription-required__description">
              No hemos podido completar el cobro de tu suscripción.
              Revisá tu facturación para resolver el pago y recuperar
              el acceso a Wilbuk.
            </p>

            <div className="subscription-required__plan">
              <div className="subscription-required__plan-heading">
                <span className="subscription-required__plan-icon">
                  {planName.toLowerCase().includes('pro')
                    ? 'ϟ'
                    : planName.toLowerCase().includes('business')
                      ? '♟'
                      : '♛'}
                </span>

                <div className="subscription-required__plan-info">
                  <span className="subscription-required__plan-label">
                    Plan actual
                  </span>

                  <strong>{planName}</strong>
                </div>
              </div>

              <p className="subscription-required__plan-description">
                {planName.toLowerCase().includes('business')
                  ? 'Todas las herramientas para equipos en crecimiento.'
                  : planName.toLowerCase().includes('pro')
                    ? 'Más herramientas para hacer crecer tu negocio.'
                    : 'Para empezar a automatizar tu agenda.'}
              </p>

              {planPrice != null && (
                <div className="subscription-required__price">
                  <strong>
                    {Number(planPrice).toLocaleString('es-ES')} €
                  </strong>
                  <span>/mes</span>
                </div>
              )}

              <ul className="subscription-required__features">
                {(planName.toLowerCase().includes('business')
                  ? [
                      'Negocios ilimitados',
                      'Mayor capacidad',
                      'Funciones avanzadas',
                      'Automatizaciones incluidas',
                      'Prioridad en soporte',
                    ]
                  : planName.toLowerCase().includes('pro')
                    ? [
                        'Hasta 5 negocios',
                        'Más capacidad para tu negocio',
                        'Más clientes y servicios',
                        'Automatizaciones incluidas',
                        'Soporte prioritario',
                      ]
                    : [
                        '1 negocio',
                        'Recordatorios automáticos',
                        'Reseñas de Google',
                        'Soporte por email',
                      ]
                ).map((feature) => (
                  <li key={feature}>
                    <span aria-hidden="true">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <span className="subscription-required__status">
                <span className="subscription-required__status-dot" />
                Pago pendiente
              </span>
            </div>

            {error && (
              <p role="alert" className="subscription-required__error">
                {error}
              </p>
            )}

            <div className="subscription-required__actions">
              <button
                type="button"
                className="subscription-required__cancel-button"
                onClick={onLogout}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="subscription-required__plans-button"
                onClick={handlePayInvoice}
                disabled={loadingPayment}
              >
                {loadingPayment
                  ? 'Abriendo facturación...'
                  : 'Pagar factura pendiente'}
              </button>
            </div>
          </>
        ) : (
          <>
            <h1 className="subscription-required__title">
              Elegí tu plan para continuar
            </h1>

            <p className="subscription-required__description">
              Tu cuenta está creada, pero todavía no tiene una suscripción
              activa. Elegí un plan para acceder a la agenda, los clientes
              y las automatizaciones de Wilbuk.
            </p>

            <button
              type="button"
              className="subscription-required__plans-button"
              onClick={() => setShowPlans(true)}
            >
              Ver planes
            </button>

            <button
              type="button"
              className="subscription-required__logout-button"
              onClick={onLogout}
            >
              Cerrar sesión
            </button>
          </>
        )}
      </section>

      {showPlans && (
        <PlanRequiredDialog
          title="Planes de Wilbuk"
          description="Elegí el plan que mejor se adapte a tu negocio."
          onClose={() => setShowPlans(false)}
          onViewPlans={handleViewPlans}
          onLogout={onLogout}
        />
      )}
    </main>
  )
}

export default SubscriptionRequired