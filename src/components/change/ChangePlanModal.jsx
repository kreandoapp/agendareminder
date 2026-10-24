import './ChangePlanModal.css';

const PLANS = [
    {
        id: 1,
        name: 'Basic',
        price: 15,
        icon: '♛',
        description: 'Para empezar a automatizar tu agenda.',
        features: [
            '1 negocio',
            'Recordatorios automáticos',
            'Reseñas de Google',
            'Soporte por email'
        ]
    },
    {
        id: 2,
        name: 'Pro',
        price: 25,
        icon: 'ϟ',
        description: 'Más herramientas para hacer crecer tu negocio.',
        features: [
            'Hasta 5 negocios',
            'Más capacidad para tu negocio',
            'Más clientes y servicios',
            'Automatizaciones incluidas',
            'Soporte prioritario'
        ],
        popular: true
    },
    {
        id: 3,
        name: 'Business',
        price: 40,
        icon: '♟',
        description: 'Todas las herramientas para equipos en crecimiento.',
        features: [
            'Negocios ilimitados',
            'Mayor capacidad',
            'Funciones avanzadas',
            'Automatizaciones incluidas',
            'Prioridad en soporte',
            'Soporte 24/7'
        ]
    }
];

export default function ChangePlanModal({
    isOpen,
    onClose,
    currentPlan,
    onSelectPlan,
    loading = false,
    error = ''
}) {
    if (!isOpen) {
        return null;
    }

    const normalizedCurrentPlan = String(
        currentPlan?.plan_name ?? currentPlan?.name ?? currentPlan ?? ''
    ).toLowerCase();

    const handleSelectPlan = (plan) => {
        if (loading || isCurrentPlan(plan)) {
            return;
        }

        onSelectPlan?.(plan);
    };

    const isCurrentPlan = (plan) => (
        normalizedCurrentPlan === plan.name.toLowerCase() ||
        String(currentPlan?.plan_id ?? '') === String(plan.id)
    );

    return (
        <div
            className="change-plan-overlay"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !loading) {
                    onClose?.();
                }
            }}
        >
            <section
                className="change-plan-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="change-plan-title"
            >
                <button
                    className="change-plan-close"
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    aria-label="Cerrar ventana"
                >
                    ×
                </button>

                <header className="change-plan-header">
                    <div className="change-plan-header-icon">
                        ↗
                    </div>

                    <div>
                        <h2 id="change-plan-title">
                            Cambiar de plan
                        </h2>

                        <p>
                            Elegí el plan que mejor se adapta a tu negocio.
                        </p>
                    </div>
                </header>

                <div className="change-plan-grid">
                    {PLANS.map((plan) => {
                        const selected = isCurrentPlan(plan);

                        return (
                            <article
                                key={plan.id}
                                className={[
                                    'change-plan-card',
                                    selected ? 'current' : '',
                                    plan.popular ? 'popular' : ''
                                ].filter(Boolean).join(' ')}
                            >
                                {selected && (
                                    <span className="change-plan-badge current-badge">
                                        PLAN ACTUAL
                                    </span>
                                )}

                                {!selected && plan.popular && (
                                    <span className="change-plan-badge popular-badge">
                                        MÁS POPULAR
                                    </span>
                                )}

                                <div className="change-plan-card-title">
                                    <span className="change-plan-icon">
                                        {plan.icon}
                                    </span>

                                    <h3>{plan.name}</h3>
                                </div>

                                <p className="change-plan-description">
                                    {plan.description}
                                </p>

                                <div className="change-plan-price">
                                    {plan.price} €<span>/mes</span>
                                </div>

                                <ul className="change-plan-features">
                                    {plan.features.map((feature) => (
                                        <li key={feature}>
                                            <span aria-hidden="true">✓</span>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    className={[
                                        'change-plan-select',
                                        selected ? 'is-current' : ''
                                    ].filter(Boolean).join(' ')}
                                    type="button"
                                    disabled={selected || loading}
                                    onClick={() => handleSelectPlan(plan)}
                                >
                                    {selected
                                        ? 'Plan actual ✓'
                                        : loading
                                            ? 'Procesando...'
                                            : `Elegir ${plan.name} →`}
                                </button>
                            </article>
                        );
                    })}
                </div>

                {error && (
                    <div className="change-plan-error" role="alert">
                        {error}
                    </div>
                )}

                <footer className="change-plan-footer">
                    <span className="change-plan-info-icon">i</span>

                    <p>
                        El cambio se procesará según las condiciones
                        de tu suscripción actual. Antes de confirmar,
                        revisaremos el importe y las condiciones del cambio.
                    </p>
                </footer>
            </section>
        </div>
    );
}