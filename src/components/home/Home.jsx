import { useCallback, useEffect, useRef, useState } from 'react';

import './Home.css';

import CancelSubscriptionModal from '../cancel/CancelSubscriptionModal';
import ChangePlanModal from '../change/ChangePlanModal';

const API_URL = 'https://kreandoapp.com/api/index.php';

const PLAN_PRICES = {
    1: 15,
    2: 25,
    3: 40,
};

export default function Home({ user }) {
    const [subscription, setSubscription] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Cancelación
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelLoading, setCancelLoading] = useState(false);
    const [cancelError, setCancelError] = useState('');

    // Cambio de plan
    const [showChangePlanModal, setShowChangePlanModal] = useState(false);
    const [changePlanLoading, setChangePlanLoading] = useState(false);
    const [changePlanError, setChangePlanError] = useState('');

    // Notificación del dashboard
    const [notification, setNotification] = useState(null);

    const notificationTimeoutRef = useRef(null);

    const token = () => localStorage.getItem('access_token');

    // =====================================================
    // NOTIFICACIONES
    // =====================================================

    const showNotification = useCallback((type, title, message) => {
        if (notificationTimeoutRef.current) {
            clearTimeout(notificationTimeoutRef.current);
        }

        setNotification({
            type,
            title,
            message,
        });

        if (type !== 'loading') {
            notificationTimeoutRef.current = setTimeout(() => {
                setNotification(null);
            }, 5000);
        }
    }, []);

    const dismissNotification = () => {
        if (notificationTimeoutRef.current) {
            clearTimeout(notificationTimeoutRef.current);
        }

        setNotification(null);
    };

    useEffect(() => {
        return () => {
            if (notificationTimeoutRef.current) {
                clearTimeout(notificationTimeoutRef.current);
            }
        };
    }, []);

    // =====================================================
    // CARGAR SUSCRIPCIÓN
    // =====================================================

    const loadSubscription = useCallback(async () => {
        const accessToken = token();

        if (!accessToken) {
            throw new Error(
                'Tu sesión ha expirado. Inicia sesión nuevamente.'
            );
        }

        const response = await fetch(
            `${API_URL}?action=subscription`,
            {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Accept: 'application/json',
                },
                cache: 'no-store',
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message ||
                'No se pudo consultar la suscripción.'
            );
        }

        const updatedSubscription = data.subscription ?? null;

        setSubscription(updatedSubscription);

        return updatedSubscription;
    }, []);

    useEffect(() => {
        let mounted = true;

        const initialLoad = async () => {
            try {
                const accessToken = token();

                if (!accessToken) {
                    throw new Error(
                        'Tu sesión ha expirado. Inicia sesión nuevamente.'
                    );
                }

                const response = await fetch(
                    `${API_URL}?action=subscription`,
                    {
                        method: 'GET',
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            Accept: 'application/json',
                        },
                        cache: 'no-store',
                    }
                );

                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(
                        data.message ||
                        'No se pudo cargar la suscripción.'
                    );
                }

                if (mounted) {
                    setSubscription(data.subscription ?? null);
                    setError('');
                }
            } catch (err) {
                console.error(
                    'Error al cargar la suscripción:',
                    err
                );

                if (mounted) {
                    setError(
                        err.message ||
                        'Error al conectar con Wilbuk.'
                    );
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        initialLoad();

        return () => {
            mounted = false;
        };
    }, []);

    // =====================================================
    // FORMATO DE FECHAS
    // =====================================================

    const formatDate = (date) => {
        if (!date) {
            return 'No disponible';
        }

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return 'No disponible';
        }

        return new Intl.DateTimeFormat('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        }).format(parsedDate);
    };

    // =====================================================
    // DATOS DE LA SUSCRIPCIÓN
    // =====================================================

    const planName =
        subscription?.plan_name ||
        subscription?.name ||
        subscription?.plan ||
        'Plan contratado';

    const planId = Number(subscription?.plan_id);

    const price =
        subscription?.price ??
        subscription?.amount ??
        subscription?.price_monthly ??
        PLAN_PRICES[planId];

    const status = subscription?.status || 'unknown';

    const statusLabels = {
        active: 'Activa',
        trialing: 'En período de prueba',
        past_due: 'Pago pendiente',
        unpaid: 'Pago pendiente',
        canceled: 'Cancelada',
        incomplete: 'Pendiente de activación',
        incomplete_expired: 'Expirada',
        paused: 'Pausada',
    };

    const periodEnd =
        subscription?.current_period_end ||
        subscription?.period_end ||
        subscription?.current_period_end_date;

    const displayName =
        user?.name ||
        user?.full_name ||
        user?.first_name ||
        'bienvenido';

    const canManageSubscription = [
        'active',
        'trialing',
    ].includes(status);

    const cancellationScheduled =
        subscription?.cancel_at_period_end === true ||
        subscription?.cancel_at_period_end === 1 ||
        subscription?.cancel_at_period_end === '1';

    // =====================================================
    // ABRIR DIÁLOGOS
    // =====================================================

    const handleChangePlan = () => {
        setChangePlanError('');
        setShowChangePlanModal(true);
    };

    const handleCloseChangePlanModal = () => {
        if (changePlanLoading) {
            return;
        }

        setShowChangePlanModal(false);
        setChangePlanError('');
    };

    const handleCancelSubscription = () => {
        setCancelError('');
        setShowCancelModal(true);
    };

    const handleCloseCancelModal = () => {
        if (cancelLoading) {
            return;
        }

        setShowCancelModal(false);
        setCancelError('');
    };

    // =====================================================
    // CAMBIAR PLAN
    // =====================================================

    const handleSelectPlan = async (selectedPlan) => {
        if (!selectedPlan || changePlanLoading) {
            return;
        }

        const accessToken = token();

        if (!accessToken) {
            setChangePlanError(
                'Tu sesión ha expirado. Inicia sesión nuevamente.'
            );
            return;
        }

        const currentPlanId = String(
            subscription?.plan_id ?? ''
        );

        const selectedPlanId = String(
            selectedPlan.id ?? ''
        );

        const currentPlanName = String(
            subscription?.plan_name ||
            subscription?.name ||
            subscription?.plan ||
            ''
        ).toLowerCase();

        if (
            currentPlanId === selectedPlanId ||
            currentPlanName === String(selectedPlan.name).toLowerCase()
        ) {
            setChangePlanError(
                'Ya tienes contratado este plan. Selecciona otro para continuar.'
            );
            return;
        }

        setChangePlanLoading(true);
        setChangePlanError('');

        showNotification(
            'loading',
            'Actualizando tu suscripción',
            'Estamos procesando el cambio y actualizando tu plan.'
        );

        try {
           const planSlug = String(
    selectedPlan.slug || selectedPlan.name || ''
).trim().toLowerCase();

const response = await fetch(
    `${API_URL}?action=stripe-change-plan`,
    {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: JSON.stringify({
            plan: planSlug,
        }),
    }
);

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message ||
                    data.detail ||
                    'No se pudo cambiar el plan.'
                );
            }

            /*
             * La petición de cambio ha sido aceptada.
             * Consultamos la API para comprobar el plan que
             * realmente tiene guardado la suscripción.
             *
             * No cambiamos el estado visual a ciegas.
             */

            let updatedSubscription = null;

            const expectedPlanId = String(selectedPlan.id);
            const expectedPlanName = String(
                selectedPlan.name
            ).toLowerCase();

            for (let attempt = 0; attempt < 10; attempt++) {
                try {
                    const refreshResponse = await fetch(
                        `${API_URL}?action=subscription`,
                        {
                            method: 'GET',
                            headers: {
                                Authorization: `Bearer ${accessToken}`,
                                Accept: 'application/json',
                            },
                            cache: 'no-store',
                        }
                    );

                    const refreshData =
                        await refreshResponse.json();

                    if (
                        refreshResponse.ok &&
                        refreshData.success &&
                        refreshData.subscription
                    ) {
                        const candidate =
                            refreshData.subscription;

                        const actualPlanId = String(
                            candidate.plan_id ?? ''
                        );

                        const actualPlanName = String(
                            candidate.plan_name ||
                            candidate.name ||
                            candidate.plan ||
                            ''
                        ).toLowerCase();

                        if (
                            actualPlanId === expectedPlanId ||
                            actualPlanName === expectedPlanName
                        ) {
                            updatedSubscription = candidate;
                            break;
                        }
                    }
                } catch (refreshError) {
                    console.warn(
                        'Todavía no se pudo actualizar la suscripción:',
                        refreshError
                    );
                }

                if (attempt < 9) {
                    await new Promise((resolve) => {
                        setTimeout(resolve, 1000);
                    });
                }
            }

            if (!updatedSubscription) {
                /*
                 * Stripe puede haber aceptado el cambio aunque
                 * la API todavía no refleje el nuevo plan.
                 * No afirmamos que el dashboard esté actualizado.
                 */
                throw new Error(
                    'El cambio fue aceptado, pero todavía no podemos confirmar el nuevo plan. Espera unos segundos y vuelve a intentarlo.'
                );
            }

            // Actualizar el dashboard con los datos reales de la API.
            setSubscription(updatedSubscription);
            setError('');

            setShowChangePlanModal(false);
            setChangePlanError('');

            dismissNotification();

            showNotification(
                'success',
                '¡Plan actualizado!',
                `Tu suscripción ahora es ${updatedSubscription.plan_name || selectedPlan.name}.`
            );
        } catch (err) {
            console.error(
                'Error al cambiar el plan:',
                err
            );

            setChangePlanError(
                err.message ||
                'Ha ocurrido un error al cambiar el plan.'
            );

            dismissNotification();

            showNotification(
                'error',
                'No se pudo completar el cambio',
                err.message ||
                'Comprueba tu suscripción e inténtalo nuevamente.'
            );
        } finally {
            setChangePlanLoading(false);
        }
    };

    // =====================================================
    // CANCELAR SUSCRIPCIÓN
    // =====================================================

    const handleConfirmCancelSubscription = async () => {
        const accessToken = token();

        if (!accessToken) {
            setCancelError(
                'Tu sesión ha expirado. Vuelve a iniciar sesión.'
            );
            return;
        }

        try {
            setCancelLoading(true);
            setCancelError('');

            const response = await fetch(
                `${API_URL}?action=stripe-cancel`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                    },
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message ||
                    'No se pudo cancelar la suscripción.'
                );
            }

            /*
             * Después de programar la cancelación, volvemos
             * a consultar la suscripción desde el backend.
             */

            const updatedSubscription = await loadSubscription();

            if (!updatedSubscription) {
                throw new Error(
                    'La cancelación se solicitó, pero no pudimos actualizar la información de la suscripción.'
                );
            }

            setShowCancelModal(false);
            setCancelError('');
            setError('');

            showNotification(
                'success',
                'Cancelación programada',
                'Tu suscripción seguirá activa hasta que finalice el período contratado.'
            );
        } catch (err) {
            console.error(
                'Error al cancelar la suscripción:',
                err
            );

            setCancelError(
                err.message ||
                'Ha ocurrido un error al cancelar la suscripción.'
            );
        } finally {
            setCancelLoading(false);
        }
    };

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <div className="home-page">

            <header className="home-header">
                <span className="home-eyebrow">
                    INICIO
                </span>

                <h1>
                    Hola, {displayName} 👋
                </h1>

                <p>
                    Aquí tienes un resumen de tu negocio.
                </p>
            </header>

            <section className="subscription-card">

                {loading ? (
                    <div className="subscription-message">
                        <div className="home-loader" />

                        <p>
                            Cargando información de tu suscripción...
                        </p>
                    </div>
                ) : error ? (
                    <div className="subscription-message subscription-error">
                        <strong>
                            No se pudo cargar la suscripción
                        </strong>

                        <p>{error}</p>

                        <button
                            type="button"
                            className="subscription-retry-button"
                            onClick={async () => {
                                try {
                                    setLoading(true);
                                    setError('');
                                    await loadSubscription();
                                } catch (err) {
                                    setError(
                                        err.message ||
                                        'No se pudo cargar la suscripción.'
                                    );
                                } finally {
                                    setLoading(false);
                                }
                            }}
                        >
                            Reintentar
                        </button>
                    </div>
                ) : !subscription ? (
                    <div className="subscription-message">
                        <strong>
                            No encontramos una suscripción
                        </strong>

                        <p>
                            Consulta tu cuenta para conocer el estado de tu plan.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="subscription-top">

                            <div className="subscription-main">
                                <div className="subscription-icon">
                                    <span>♛</span>
                                </div>

                                <div className="subscription-information">
                                    <span className="subscription-eyebrow">
                                        TU SUSCRIPCIÓN
                                    </span>

                                    <h2>
                                        {planName}
                                    </h2>

                                    <p>
                                        Información actual de la suscripción de tu negocio.
                                    </p>
                                </div>
                            </div>

                            <div className="subscription-details">

                                <span
                                    className={`subscription-status status-${cancellationScheduled ? 'scheduled' : status}`}
                                >
                                    <span className="status-dot" />

                                    {cancellationScheduled
                                        ? 'Cancelación programada'
                                        : statusLabels[status] || status}
                                </span>

                                <strong className="subscription-price">
                                    {price != null
                                        ? `${Number(price).toLocaleString('es-ES')} €/mes`
                                        : 'Precio no disponible'}
                                </strong>

                                <div className="renewal-information">
                                    <span className="renewal-label">
                                        <span className="renewal-icon">
                                            ▦
                                        </span>

                                        {cancellationScheduled
                                            ? 'Fin de tu suscripción'
                                            : 'Próxima renovación'}
                                    </span>

                                    <span className="renewal-date">
                                        {formatDate(periodEnd)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="subscription-features">
                            <div className="subscription-feature">
                                <span className="feature-icon">▦</span>
                                <span>Gestión de tu negocio</span>
                            </div>

                            <div className="subscription-feature">
                                <span className="feature-icon">◉</span>
                                <span>Recordatorios automáticos</span>
                            </div>

                            <div className="subscription-feature">
                                <span className="feature-icon">☆</span>
                                <span>Reseñas de Google</span>
                            </div>

                            <div className="subscription-feature">
                                <span className="feature-icon">✉</span>
                                <span>Soporte por email</span>
                            </div>
                        </div>

                        {cancellationScheduled && (
                            <div className="subscription-cancellation-notice">
                                <span className="cancellation-notice-icon">
                                    ✓
                                </span>

                                <div>
                                    <strong>
                                        Cancelación programada
                                    </strong>

                                    <p>
                                        Tu suscripción seguirá activa hasta el{' '}
                                        <strong>{formatDate(periodEnd)}</strong>.
                                        Hasta entonces, podrás seguir utilizando Wilbuk.
                                    </p>
                                </div>
                            </div>
                        )}

                        {canManageSubscription && !cancellationScheduled && (
                            <div className="subscription-actions">

                                <button
                                    type="button"
                                    className="subscription-action change-plan-button"
                                    onClick={handleChangePlan}
                                    disabled={changePlanLoading}
                                >
                                    <span className="action-icon">
                                        <span>↗</span>
                                    </span>

                                    <span className="action-content">
                                        <strong>
                                            Cambiar de plan
                                        </strong>

                                        <span>
                                            Mejora o cambia tu suscripción
                                        </span>
                                    </span>

                                    <span className="action-arrow">
                                        ›
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    className="subscription-action cancel-plan-button"
                                    onClick={handleCancelSubscription}
                                    disabled={cancelLoading}
                                >
                                    <span className="action-icon">
                                        <span>×</span>
                                    </span>

                                    <span className="action-content">
                                        <strong>
                                            Cancelar suscripción
                                        </strong>

                                        <span>
                                            Mantén el acceso hasta el final del período
                                        </span>
                                    </span>

                                    <span className="action-arrow">
                                        ›
                                    </span>
                                </button>

                            </div>
                        )}
                    </>
                )}
            </section>

            {/* Diálogo para cambiar de plan */}

            <ChangePlanModal
                isOpen={showChangePlanModal}
                onClose={handleCloseChangePlanModal}
                currentPlan={subscription}
                onSelectPlan={handleSelectPlan}
                loading={changePlanLoading}
                error={changePlanError}
            />

            {/* Diálogo de confirmación de cancelación */}

            <CancelSubscriptionModal
                isOpen={showCancelModal}
                onClose={handleCloseCancelModal}
                onConfirm={handleConfirmCancelSubscription}
                periodEnd={periodEnd}
                loading={cancelLoading}
                error={cancelError}
            />

            {/* Notificación de Wilbuk, sin alert() */}

            {notification && (
                <div
                    className={`home-toast home-toast-${notification.type}`}
                    role={notification.type === 'error' ? 'alert' : 'status'}
                    aria-live="polite"
                >
                    {notification.type === 'loading' ? (
                        <span className="home-toast-spinner" />
                    ) : (
                        <span className="home-toast-icon">
                            {notification.type === 'success'
                                ? '✓'
                                : '!'}
                        </span>
                    )}

                    <div className="home-toast-content">
                        <strong>
                            {notification.title}
                        </strong>

                        <p>
                            {notification.message}
                        </p>
                    </div>

                    {notification.type !== 'loading' && (
                        <button
                            type="button"
                            className="home-toast-close"
                            onClick={dismissNotification}
                            aria-label="Cerrar notificación"
                        >
                            ×
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}