import { useState } from 'react'
import wilbukLogo from '../../assets/logo.png'
import PlanRequiredDialog from './PlanRequiredDialog'
import './SubscriptionRequired.css'

function SubscriptionRequired({ onLogout }) {
  const [showPlans, setShowPlans] = useState(false)

  const handleClosePlans = () => {
    setShowPlans(false)
  }

  const handleViewPlans = (plan) => {
    // Por ahora, dirigimos a la web de Wilbuk.
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

        <h1 className="subscription-required__title">
          Elegí tu plan para continuar
        </h1>

        <p className="subscription-required__description">
          Tu cuenta está creada, pero todavía no tiene una suscripción activa.
          Elegí un plan para acceder a la agenda, los clientes y las
          automatizaciones de Wilbuk.
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
      </section>

      {showPlans && (
        <PlanRequiredDialog
          title="Planes de Wilbuk"
          description="Elegí el plan que mejor se adapte a tu negocio."
          onClose={handleClosePlans}
          onViewPlans={handleViewPlans}
          onLogout={onLogout}
        />
      )}
    </main>
  )
}

export default SubscriptionRequired