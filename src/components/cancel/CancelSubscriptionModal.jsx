import './CancelSubscriptionModal.css';

export default function CancelSubscriptionModal({
    isOpen,
    onClose,
    onConfirm,
    periodEnd,
    loading = false,
    error = '',
}) {
    if (!isOpen) {
        return null;
    }

    const parsedDate = periodEnd ? new Date(periodEnd) : null;

    const formattedDate =
        parsedDate && !Number.isNaN(parsedDate.getTime())
            ? parsedDate.toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
              })
            : 'el final de tu período actual';

    const handleClose = () => {
        if (!loading) {
            onClose();
        }
    };

    const handleConfirm = async () => {
        if (loading || typeof onConfirm !== 'function') {
            return;
        }

        try {
            await onConfirm();
        } catch (err) {
            // Home.jsx gestiona y muestra los errores de la API.
            console.error(
                'Error al confirmar la cancelación:',
                err
            );
        }
    };

    return (
        <div
            className="cancel-modal-overlay"
            onClick={handleClose}
        >
            <div
                className="cancel-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="cancel-modal-title"
                aria-describedby="cancel-modal-description"
                onClick={(event) => event.stopPropagation()}
            >
                <button
                    className="cancel-modal-close"
                    type="button"
                    onClick={handleClose}
                    aria-label="Cerrar diálogo"
                    disabled={loading}
                >
                    ×
                </button>

                <div
                    className="cancel-modal-icon"
                    aria-hidden="true"
                >
                    !
                </div>

                <h2 id="cancel-modal-title">
                    ¿Cancelar tu suscripción?
                </h2>

                <p
                    id="cancel-modal-description"
                    className="cancel-modal-description"
                >
                    Tu suscripción se cancelará al finalizar el
                    período actual. Podrás seguir utilizando Wilbuk
                    hasta esa fecha.
                </p>

                <div className="cancel-modal-access">
                    <span>
                        Tu acceso continuará hasta
                    </span>

                    <strong>
                        {formattedDate}
                    </strong>
                </div>

                <p className="cancel-modal-note">
                    La cancelación se programará para el final
                    del período contratado.
                </p>

                {error && (
                    <p
                        className="cancel-modal-error"
                        role="alert"
                        aria-live="polite"
                    >
                        {error}
                    </p>
                )}

                <div className="cancel-modal-actions">
                    <button
                        className="cancel-modal-keep"
                        type="button"
                        onClick={handleClose}
                        disabled={loading}
                    >
                        Mantener suscripción
                    </button>

                    <button
                        className="cancel-modal-confirm"
                        type="button"
                        onClick={handleConfirm}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span
                                    className="cancel-modal-spinner"
                                    aria-hidden="true"
                                />
                                Cancelando...
                            </>
                        ) : (
                            'Sí, cancelar suscripción'
                        )}
                    </button>
                </div>

                <span className="cancel-modal-footer">
                    Podrás utilizar Wilbuk hasta que finalice
                    tu período contratado.
                </span>
            </div>
        </div>
    );
}