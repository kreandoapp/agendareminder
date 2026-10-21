import React from 'react'
import './NoCustomersDialog.css'

import { useLanguage } from '../../../context/LanguageContext'

export default function NoCustomersDialog({
  open,
  onClose,
  onGoToCustomers,
}) {

  const { t } = useLanguage()

  if (!open) {
    return null
  }

  return (
    <div
      className="no-customers-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="no-customers-title"
      onClick={onClose}
    >

      <div
        className="no-customers-dialog"
        onClick={event =>
          event.stopPropagation()
        }
      >

        <button
          type="button"
          className="no-customers-close"
          onClick={onClose}
          aria-label={t('common.close')}
        >
          ×
        </button>


        <div className="no-customers-content">

          <h2
            id="no-customers-title"
            className="no-customers-title"
          >
            {t('clients.empty.title')}
          </h2>


          <p className="no-customers-description">
            {t('clients.empty.description')}
          </p>


          <div className="no-customers-info">

            <div className="no-customers-info-item">

              <strong>
                {t('clients.empty.addCustomersTitle')}
              </strong>

              <span>
                {t('clients.empty.addCustomersDescription')}
              </span>

            </div>


            <div className="no-customers-divider" />


            <div className="no-customers-info-item">

              <strong>
                {t('clients.empty.createAppointmentsTitle')}
              </strong>

              <span>
                {t('clients.empty.createAppointmentsDescription')}
              </span>

            </div>

          </div>


          <div className="no-customers-actions">

            <button
              type="button"
              className="no-customers-primary"
              onClick={onGoToCustomers}
            >
              {t('sidebar.clients')}
            </button>


            <button
              type="button"
              className="no-customers-secondary"
              onClick={onClose}
            >
              {t('common.cancel')}
            </button>

          </div>

        </div>

      </div>

    </div>
  )
}