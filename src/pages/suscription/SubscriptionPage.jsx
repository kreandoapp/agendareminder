import './SubscriptionPage.css'

export default function SubscriptionPage({
  hasSubscriptionAccess = false,
  onContinue,
  onLogout,
}) {
  return (
    <div className="subscription-page">
      <section className="subscription-card">
        <div className="subscription-logo">
          W
        </div>

        <h1 className="subscription-title">
          Suscripción
        </h1>

        {hasSubscriptionAccess ? (
          <>
            <p className="subscription-description">
              Tu cuenta tiene acceso a Wilbuk.
            </p>

            <button
              type="button"
              className="subscription-primary-button"
              onClick={onContinue}
            >
              Continuar al sistema
            </button>
          </>
        ) : (
          <>
            <p className="subscription-description">
              Tu cuenta todavía no tiene una suscripción activa.
              Elegí un plan para continuar utilizando Wilbuk.
            </p>

            <button
              type="button"
              className="subscription-primary-button"
              onClick={() => {
                window.location.href = 'https://wilbuk.com/'
              }}
            >
              Ver planes
            </button>
          </>
        )}

        {onLogout && (
          <button
            type="button"
            className="subscription-logout-button"
            onClick={onLogout}
          >
            Cerrar sesión
          </button>
        )}
      </section>
    </div>
  )
}