import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import { useLanguage } from '../../../context/LanguageContext'

import './AppointmentDialog.css'

const API_URL =
  'https://kreandoapp.com/api/index.php'


// =========================================================
// UTILIDADES
// =========================================================

function formatDateForApi(date) {
  if (!date) return ''

  const year = date.getFullYear()

  const month = String(
    date.getMonth() + 1
  ).padStart(2, '0')

  const day = String(
    date.getDate()
  ).padStart(2, '0')

  return `${year}-${month}-${day}`
}


function formatApiDateForDisplay(date) {
  if (!date) return '—'

  const parts = String(date)
    .slice(0, 10)
    .split('-')

  if (parts.length !== 3) {
    return date
  }

  return `${parts[2]}/${parts[1]}/${parts[0]}`
}


function formatLongDate(date) {
  if (!date) return '—'

  const value = new Date(
    `${date}T12:00:00`
  )

  if (Number.isNaN(value.getTime())) {
    return formatApiDateForDisplay(date)
  }

  return value.toLocaleDateString(
    'es-ES',
    {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }
  )
}


function normalizeTime(time) {
  if (
    time === null ||
    time === undefined ||
    time === ''
  ) {
    return ''
  }

  return String(time).slice(0, 5)
}


function getCustomerId(customer) {
  return (
    customer?.id ??
    customer?.customer_id ??
    customer?.ID ??
    ''
  )
}


function getCustomerName(customer) {
  return (
    customer?.name ||
    customer?.full_name ||
    customer?.customer_name ||
    [
      customer?.first_name,
      customer?.last_name,
    ]
      .filter(Boolean)
      .join(' ') ||
    'Cliente'
  )
}


function getCustomerPhone(customer) {
  const dialCode =
    customer?.dial_code || ''

  const phone =
    customer?.phone_number ||
    customer?.phone ||
    customer?.telephone ||
    customer?.mobile ||
    ''

  if (!phone) return ''

  if (!dialCode) {
    return phone
  }

  return `${dialCode} ${phone}`
}


function getInitials(customer) {
  const name =
    getCustomerName(customer)

  const parts =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)

  if (!parts.length) {
    return 'CL'
  }

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase()
  }

  return (
    parts[0][0] +
    parts[1][0]
  ).toUpperCase()
}


function getEmployeeName(employee) {
  return [
    employee?.first_name,
    employee?.last_name,
  ]
    .filter(Boolean)
    .join(' ') ||
    'Empleado'
}


function getServiceName(service) {
  return (
    service?.service_name ||
    service?.name ||
    'Servicio'
  )
}


function getServiceDuration(service) {
  return Number(
    service?.service_duration ||
    service?.duration ||
    0
  )
}


function formatDuration(minutes) {
  const value =
    Number(minutes) || 0

  if (value <= 0) return '—'

  if (value < 60) {
    return `${value} min`
  }

  const hours =
    Math.floor(value / 60)

  const remaining =
    value % 60

  if (!remaining) {
    return hours === 1
      ? '1 h'
      : `${hours} h`
  }

  return `${hours} h ${remaining} min`
}


function calculateEndTime(
  time,
  duration
) {
  if (
    !time ||
    !duration
  ) {
    return ''
  }

  const parts =
    time.split(':')

  if (parts.length !== 2) {
    return ''
  }

  const hours =
    Number(parts[0])

  const minutes =
    Number(parts[1])

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    return ''
  }

  const total =
    hours * 60 +
    minutes +
    Number(duration)

  const endHours =
    Math.floor(total / 60) % 24

  const endMinutes =
    total % 60

  return (
    String(endHours).padStart(2, '0') +
    ':' +
    String(endMinutes).padStart(2, '0')
  )
}


// =========================================================
// COMPONENTE
// =========================================================


// =========================================================
// DIÁLOGO — CONFIGURAR ENLACE DE RESEÑAS
// =========================================================

function ReviewLinkDialog({ open, onClose, onSaved }) {
  const { t } = useLanguage()

  const [link, setLink] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [loadingBusiness, setLoadingBusiness] = useState(false)
  const [savingLink, setSavingLink] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    if (!open) return

    let cancelled = false

    const loadBusiness = async () => {
      const token = localStorage.getItem('access_token')

      if (!token) return

      setLoadingBusiness(true)
      setSaveMessage('')

      try {
        const response = await fetch(
          `${API_URL}?action=business-settings`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
            cache: 'no-store',
          }
        )

        const result = await response.json()

        if (!response.ok || !result?.success) {
          throw new Error(
            result?.message ||
            t('appointmentDialog.reviewConfig.errors.loadBusiness')
          )
        }

        if (cancelled) return

        const business = result?.data || {}

        setBusinessName(
          String(business.name || '').trim()
        )

        setLink(
          String(business.review_url || '').trim()
        )
      } catch (error) {
        if (cancelled) return

        console.error(
          '❌ Error cargando negocio para reseñas:',
          error
        )

        setBusinessName('')
        setLink('')
      } finally {
        if (!cancelled) {
          setLoadingBusiness(false)
        }
      }
    }

    loadBusiness()

    return () => {
      cancelled = true
    }
  }, [open])

  const openGoogleBusiness = () => {
    const query = businessName || 'mi negocio'

    const url =
      `https://www.google.com/search?q=${encodeURIComponent(query)}`

    window.open(
      url,
      '_blank',
      'noopener,noreferrer'
    )
  }

  const handleSave = async () => {
    const value = link.trim()

    if (!value) {
      setSaveMessage(t('appointmentDialog.reviewConfig.errors.missingLink'))
      return
    }

    const token = localStorage.getItem('access_token')

    if (!token) {
      setSaveMessage(t('appointmentDialog.errors.sessionExpired'))
      return
    }

    setSavingLink(true)
    setSaveMessage('')

    try {
      const response = await fetch(
        `${API_URL}?action=business-settings`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            review_url: value,
          }),
        }
      )

      const result = await response.json()

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.message ||
          t('appointmentDialog.reviewConfig.errors.saveLink')
        )
      }

      onSaved?.(value)
      onClose?.()
    } catch (error) {
      console.error(
        '❌ Error guardando enlace de reseñas:',
        error
      )

      setSaveMessage(
        error?.message ||
        t('appointmentDialog.reviewConfig.errors.saveLink')
      )
    } finally {
      setSavingLink(false)
    }
  }

  if (!open) {
    return null
  }

  return (
    <div
      className="review-link-dialog-overlay"
      onMouseDown={event => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        className="review-link-dialog review-link-dialog-guide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-link-dialog-title"
      >
        <div className="review-link-dialog-header">
          <div className="review-link-dialog-icon">
            ⭐
          </div>

          <div className="review-link-dialog-heading">
            <h2 id="review-link-dialog-title">
              {t('appointmentDialog.reviewConfig.title')}
            </h2>

            <p>
              {t('appointmentDialog.reviewConfig.description')}
            </p>
          </div>

          <button
            type="button"
            className="review-link-dialog-close"
            onClick={onClose}
            disabled={savingLink}
            aria-label={t('common.close')}
          >
            ×
          </button>
        </div>

        <div className="review-link-dialog-body">
          <div className="review-guide-grid">
            <div className="review-guide-step">
              <div className="review-guide-number">
                1
              </div>

              <h3>
                {t('appointmentDialog.reviewConfig.step1.title')}
              </h3>

              <p>
                {t('appointmentDialog.reviewConfig.step1.description')}
              </p>

              <div className="review-guide-example">
                <div className="review-guide-google">
                  <span className="google-g">G</span>
                  <span className="google-o1">o</span>
                  <span className="google-o2">o</span>
                  <span className="google-g2">g</span>
                  <span className="google-l">l</span>
                  <span className="google-e">e</span>
                </div>

                <div className="review-guide-account">
                  <span>👤</span>

                  <div>
                    <strong>
                      {t('appointmentDialog.reviewConfig.ownerAccount')}
                    </strong>

                    <small>
                      {t('appointmentDialog.reviewConfig.ownerAccountDescription')}
                    </small>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="review-guide-action"
                onClick={openGoogleBusiness}
                disabled={loadingBusiness || savingLink}
              >
                🔎 {t('appointmentDialog.reviewConfig.openGoogle')}
              </button>
            </div>

            <div className="review-guide-step">
              <div className="review-guide-number">
                2
              </div>

              <h3>
                {t('appointmentDialog.reviewConfig.step2.title')}
              </h3>

              <p>
                {t('appointmentDialog.reviewConfig.step2.description')}
              </p>

              <div className="review-guide-business-card">
                <strong>
                  {loadingBusiness
                    ? t('appointmentDialog.reviewConfig.loadingBusiness')
                    : businessName || t('appointmentDialog.reviewConfig.yourBusiness')}
                </strong>

                <small>
                  ✓ {t('appointmentDialog.reviewConfig.googleBusinessProfile')}
                </small>

                <div className="review-guide-business-actions">
                  <span>{t('appointmentDialog.reviewConfig.editProfile')}</span>
                  <span>{t('appointmentDialog.reviewConfig.readReviews')}</span>
                  <b>
                    ⭐ {t('appointmentDialog.reviewConfig.requestReviews')}
                  </b>
                </div>
              </div>
            </div>

            <div className="review-guide-step">
              <div className="review-guide-number">
                3
              </div>

              <h3>
                {t('appointmentDialog.reviewConfig.step3.title')}
              </h3>

              <p>
                {t('appointmentDialog.reviewConfig.step3.description')}
              </p>

              <div className="review-guide-copy-card">
                <strong>
                  {t('appointmentDialog.reviewConfig.requestReviews')}
                </strong>

                <small>
                  {t('appointmentDialog.reviewConfig.shareLinkDescription')}
                </small>

                <div className="review-guide-url-preview">
                  <span>
                    https://g.page/r/...
                  </span>

                  <b>
                    📋 {t('appointmentDialog.reviewConfig.copyLink')}
                  </b>
                </div>
              </div>
            </div>
          </div>

          <div className="review-guide-tip">
            <div className="review-guide-tip-icon">
              ℹ
            </div>

            <div>
              <strong>
                {t('appointmentDialog.reviewConfig.notFoundTitle')}
              </strong>

              <span>
                {t('appointmentDialog.reviewConfig.notFoundDescription')}
              </span>
            </div>
          </div>

          <div className="review-guide-divider" />

          <div className="review-link-dialog-field">
            <label
              htmlFor="review-link-dialog-input"
              className="review-link-dialog-label"
            >
              🔗 {t('appointmentDialog.reviewConfig.linkLabel')}
            </label>

            <div className="review-link-input-wrapper">
              <input
                id="review-link-dialog-input"
                type="url"
                value={link}
                onChange={event =>
                  setLink(event.target.value)
                }
                className="review-link-dialog-input"
                placeholder="https://g.page/r/..."
                disabled={savingLink}
              />

              <span className="review-link-input-icon">
                🔗
              </span>
            </div>

            <small className="review-link-dialog-hint">
              {t('appointmentDialog.reviewConfig.linkHint')}
            </small>

            {saveMessage && (
              <div className="review-link-dialog-error">
                ⚠️ {saveMessage}
              </div>
            )}
          </div>
        </div>

        <div className="review-link-dialog-footer">
          <button
            type="button"
            className="review-link-dialog-cancel"
            onClick={onClose}
            disabled={savingLink}
          >
            {t('common.cancel')}
          </button>

          <button
            type="button"
            className="review-link-dialog-save"
            onClick={handleSave}
            disabled={
              savingLink ||
              !link.trim()
            }
          >
            {savingLink
              ? t('common.saving')
              : `✓ ${t('appointmentDialog.reviewConfig.saveLink')}`}
          </button>
        </div>
      </div>
    </div>
  )
}


function AppointmentDialog({
  open,
  mode = 'create',
  appointment = null,
  date,
  time,
  onClose,
  onCreated,
  onUpdated,
  onConfigureReviews,
}) {

  const isEdit =
    mode === 'edit'

  const { t } = useLanguage()


  // =======================================================
  // CLIENTE
  // =======================================================

  const [
    customers,
    setCustomers,
  ] = useState([])

  const [
    loadingCustomers,
    setLoadingCustomers,
  ] = useState(false)

  const [
    customerSearch,
    setCustomerSearch,
  ] = useState('')

  const [
    selectedCustomer,
    setSelectedCustomer,
  ] = useState(null)


  // =======================================================
  // SERVICIOS
  // =======================================================

  const [
    services,
    setServices,
  ] = useState([])

  const [
    loadingServices,
    setLoadingServices,
  ] = useState(false)

  const [
    selectedServiceId,
    setSelectedServiceId,
  ] = useState('')


  // =======================================================
  // CITA
  // =======================================================

  const [
    appointmentDate,
    setAppointmentDate,
  ] = useState('')

  const [
    appointmentTime,
    setAppointmentTime,
  ] = useState('')

  const [
    status,
    setStatus,
  ] = useState('scheduled')

  const [
    notes,
    setNotes,
  ] = useState('')


  // =======================================================
  // DISPONIBILIDAD
  // =======================================================

  const [
    availableEmployees,
    setAvailableEmployees,
  ] = useState([])

  const [
    unavailableEmployees,
    setUnavailableEmployees,
  ] = useState([])

  const [
    selectedEmployee,
    setSelectedEmployee,
  ] = useState(null)

  const [
    loadingAvailability,
    setLoadingAvailability,
  ] = useState(false)

  const [
    availabilityChecked,
    setAvailabilityChecked,
  ] = useState(false)


  // =======================================================
  // AUTOMATIZACIONES
  // =======================================================

  const [
    automations,
    setAutomations,
  ] = useState([])

  const [
    loadingAutomations,
    setLoadingAutomations,
  ] = useState(false)


  // =======================================================
  // GENERAL
  // =======================================================

  const [
    saving,
    setSaving,
  ] = useState(false)

  const [
    message,
    setMessage,
  ] = useState({
    type: '',
    text: '',
  })

  const [reviewUrl, setReviewUrl] = useState('')
  const [loadingReviewUrl, setLoadingReviewUrl] = useState(false)

  const [showReviewConfig, setShowReviewConfig] =
    useState(false)


  // =======================================================
  // SERVICIO SELECCIONADO
  // =======================================================

  const selectedService =
    useMemo(() => {

      return services.find(
        service =>
          Number(service.id) ===
          Number(selectedServiceId)
      ) || null

    }, [
      services,
      selectedServiceId,
    ])


  const serviceDuration =
    getServiceDuration(
      selectedService
    )


  const servicePrice =
    selectedService?.service_price ??
    selectedService?.price ??
    null


  const appointmentEndTime =
    calculateEndTime(
      appointmentTime,
      serviceDuration
    )


  // =======================================================
  // INICIALIZAR
  // =======================================================

  useEffect(() => {

    if (!open) return

    setMessage({
      type: '',
      text: '',
    })

    setReviewUrl('')
    setLoadingReviewUrl(true)

    setAvailabilityChecked(false)

    setAvailableEmployees([])

    setUnavailableEmployees([])

    setSelectedEmployee(null)

    if (
      isEdit &&
      appointment
    ) {

      setAppointmentDate(
        String(
          appointment.appointment_date ||
          ''
        ).slice(0, 10)
      )

      setAppointmentTime(
        normalizeTime(
          appointment.appointment_time
        )
      )

      setStatus(
        appointment.status ||
        'scheduled'
      )

      setNotes(
        appointment.notes ||
        ''
      )

      setCustomerSearch('')

      setSelectedCustomer(null)

      setSelectedServiceId(
        appointment.service_id
          ? String(
              appointment.service_id
            )
          : ''
      )

      if (
        appointment.employee_id
      ) {

        setSelectedEmployee({
          id:
            appointment.employee_id,

          first_name:
            appointment.employee_first_name ||
            '',

          last_name:
            appointment.employee_last_name ||
            '',

          color:
            appointment.employee_color ||
            '#3B82F6',

          available: true,
        })
      }

      return
    }


    setAppointmentDate(
      formatDateForApi(date)
    )

    setAppointmentTime(
      normalizeTime(time)
    )

    setCustomerSearch('')

    setSelectedCustomer(null)

    setSelectedServiceId('')

    setSelectedEmployee(null)

    setStatus('scheduled')

    setNotes('')

    setAutomations([])

  }, [
    open,
    isEdit,
    appointment,
    date,
    time,
  ])


  // =======================================================
  // CLIENTES
  // =======================================================

  useEffect(() => {

    if (!open) return

    const loadCustomers =
      async () => {

        const token =
          localStorage.getItem(
            'access_token'
          )

        if (!token) {
          setMessage({
            type: 'error',
            text: t('appointmentDialog.errors.invalidSession'),
          })

          return
        }

        try {

          setLoadingCustomers(true)

          const response =
            await fetch(
              `${API_URL}?action=customers`,
              {
                method: 'GET',

                headers: {
                  Authorization:
                    `Bearer ${token}`,

                  Accept:
                    'application/json',
                },

                cache: 'no-store',
              }
            )

          const result =
            await response.json()

          if (
            response.status === 401
          ) {
            throw new Error(
              t('appointmentDialog.errors.sessionExpired')
            )
          }

          if (!response.ok) {
            throw new Error(
              result?.message ||
              t('appointmentDialog.errors.loadCustomers')
            )
          }

          let data = []

          if (
            Array.isArray(result)
          ) {
            data = result
          } else if (
            Array.isArray(result?.data)
          ) {
            data = result.data
          } else if (
            Array.isArray(
              result?.data?.customers
            )
          ) {
            data =
              result.data.customers
          } else if (
            Array.isArray(
              result?.customers
            )
          ) {
            data =
              result.customers
          }

          setCustomers(data)


          if (
            isEdit &&
            appointment
          ) {

            const current =
              data.find(
                customer =>
                  Number(
                    getCustomerId(
                      customer
                    )
                  ) ===
                  Number(
                    appointment.customer_id
                  )
              )

            if (current) {

              setSelectedCustomer(
                current
              )

            } else {

              setSelectedCustomer({
                id:
                  appointment.customer_id,

                full_name:
                  appointment.customer_name ||
                  appointment.full_name ||
                  'Cliente',

                phone_number:
                  appointment.customer_phone ||
                  '',

                dial_code:
                  appointment.customer_dial_code ||
                  '',
              })
            }
          }

        } catch (error) {

          console.error(
            '❌ ERROR CLIENTES:',
            error
          )

          setMessage({
            type: 'error',
            text:
              error?.message ||
              'No se pudieron cargar los clientes.',
          })

        } finally {

          setLoadingCustomers(false)
        }
      }

    loadCustomers()

  }, [
    open,
    isEdit,
    appointment,
  ])


  // =======================================================
  // SERVICIOS
  // =======================================================

  useEffect(() => {

    if (!open) return

    const loadServices =
      async () => {

        const token =
          localStorage.getItem(
            'access_token'
          )

        if (!token) return

        try {

          setLoadingServices(true)

          const response =
            await fetch(
              `${API_URL}?action=services`,
              {
                method: 'GET',

                headers: {
                  Authorization:
                    `Bearer ${token}`,

                  Accept:
                    'application/json',
                },

                cache: 'no-store',
              }
            )

          const result =
            await response.json()

          if (
            response.status === 401
          ) {
            throw new Error(
              t('appointmentDialog.errors.sessionExpired')
            )
          }

          if (!response.ok) {
            throw new Error(
              result?.message ||
              t('appointmentDialog.errors.loadServices')
            )
          }

          let data = []

          if (
            Array.isArray(result)
          ) {
            data = result
          } else if (
            Array.isArray(result?.data)
          ) {
            data = result.data
          } else if (
            Array.isArray(
              result?.data?.services
            )
          ) {
            data =
              result.data.services
          }

          setServices(
            data.filter(
              service =>
                Number(
                  service.is_active
                ) === 1
            )
          )

        } catch (error) {

          console.error(
            '❌ ERROR SERVICIOS:',
            error
          )

          setMessage({
            type: 'error',
            text:
              error?.message ||
              'No se pudieron cargar los servicios.',
          })

        } finally {

          setLoadingServices(false)
        }
      }

    loadServices()

  }, [open])


  // =======================================================
  // CONFIGURACIÓN DE RESEÑAS
  // =======================================================

  useEffect(() => {
    if (!open) return

    let cancelled = false

    const loadBusinessSettings = async () => {
      const token = localStorage.getItem('access_token')

      if (!token) {
        setLoadingReviewUrl(false)
        return
      }

      try {
        const response = await fetch(
          `${API_URL}?action=business-settings`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
            cache: 'no-store',
          }
        )

        if (response.status === 401) {
          throw new Error('Tu sesión ha expirado.')
        }

        const result = await response.json()

        if (!response.ok || !result?.success) {
          throw new Error(
            result?.message ||
            'No se pudo cargar la configuración del negocio.'
          )
        }

        if (cancelled) return

        const business = result?.data || {}
        setReviewUrl(
          String(business.review_url || '').trim()
        )
      } catch (error) {
        if (cancelled) return

        console.error(
          '❌ ERROR CONFIGURACIÓN RESEÑAS:',
          error
        )

        // No bloqueamos la creación de citas si la consulta falla.
        setReviewUrl('')
      } finally {
        if (!cancelled) {
          setLoadingReviewUrl(false)
        }
      }
    }

    loadBusinessSettings()

    return () => {
      cancelled = true
    }
  }, [open])


  // =======================================================
  // AUTOMATIZACIONES
  // =======================================================

  useEffect(() => {

    if (
      !open ||
      !isEdit ||
      !appointment
    ) {
      return
    }

    const appointmentId =
      appointment?.id ||
      appointment?.appointment_id

    if (!appointmentId) return

    const loadAutomations =
      async () => {

        const token =
          localStorage.getItem(
            'access_token'
          )

        if (!token) return

        try {

          setLoadingAutomations(true)

          const response =
            await fetch(
              `${API_URL}?action=appointment-automations&appointment_id=${appointmentId}`,
              {
                method: 'GET',

                headers: {
                  Authorization:
                    `Bearer ${token}`,

                  Accept:
                    'application/json',
                },

                cache: 'no-store',
              }
            )

          const result =
            await response.json()

          if (
            response.status === 401
          ) {
            throw new Error(
              t('appointmentDialog.errors.sessionExpired')
            )
          }

          if (
            !response.ok ||
            !result?.success
          ) {
            throw new Error(
              result?.message ||
              t('appointmentDialog.errors.loadAutomations')
            )
          }

          const data =
            Array.isArray(
              result?.data
            )
              ? [...result.data].sort(
                  (a, b) =>
                    Number(
                      a.automation_number
                    ) -
                    Number(
                      b.automation_number
                    )
                )
              : []

          setAutomations(data)

        } catch (error) {

          console.error(
            '❌ ERROR AUTOMATIZACIONES:',
            error
          )

          setMessage({
            type: 'error',
            text:
              error?.message ||
              'No se pudieron cargar las notificaciones.',
          })

        } finally {

          setLoadingAutomations(false)
        }
      }

    loadAutomations()

  }, [
    open,
    isEdit,
    appointment,
  ])


  // =======================================================
  // DISPONIBILIDAD
  // =======================================================

  useEffect(() => {

    if (
      !open ||
      !selectedServiceId ||
      !appointmentDate ||
      !appointmentTime
    ) {

      setAvailabilityChecked(false)

      setAvailableEmployees([])

      setUnavailableEmployees([])

      setSelectedEmployee(null)

      return
    }

    let cancelled = false

    const checkAvailability =
      async () => {

        const token =
          localStorage.getItem(
            'access_token'
          )

        if (!token) return

        try {

          setLoadingAvailability(true)

          setAvailabilityChecked(false)

          const appointmentId =
            appointment?.id ||
            appointment?.appointment_id ||
            null

          const response =
            await fetch(
              `${API_URL}?action=availability`,
              {
                method: 'POST',

                headers: {
                  Authorization:
                    `Bearer ${token}`,

                  'Content-Type':
                    'application/json',

                  Accept:
                    'application/json',
                },

                body:
                  JSON.stringify({
                    service_id:
                      Number(
                        selectedServiceId
                      ),

                    date:
                      appointmentDate,

                    time:
                      appointmentTime,

                    appointment_id:
                      appointmentId
                        ? Number(
                            appointmentId
                          )
                        : null,
                  }),
              }
            )

          const result =
            await response.json()

          if (
            response.status === 401
          ) {
            throw new Error(
              t('appointmentDialog.errors.sessionExpired')
            )
          }

          if (
            !response.ok ||
            !result?.success
          ) {
            throw new Error(
              result?.message ||
              t('appointmentDialog.errors.checkAvailability')
            )
          }

          if (cancelled) return

          const data =
            result?.data || {}

          const available =
            Array.isArray(
              data.available_employees
            )
              ? data.available_employees
              : []

          const unavailable =
            Array.isArray(
              data.unavailable_employees
            )
              ? data.unavailable_employees
              : []

          setAvailableEmployees(
            available
          )

          setUnavailableEmployees(
            unavailable
          )

          setAvailabilityChecked(
            true
          )


          // Un solo empleado
          if (
            Number(
              data.employee_count
            ) === 1
          ) {

            setSelectedEmployee(
              available.length === 1
                ? available[0]
                : null
            )

            return
          }


          // Edición
          if (
            isEdit &&
            appointment?.employee_id
          ) {

            const current =
              available.find(
                employee =>
                  Number(
                    employee.id
                  ) ===
                  Number(
                    appointment.employee_id
                  )
              )

            if (current) {

              setSelectedEmployee(
                current
              )

              return
            }
          }

          setSelectedEmployee(null)

        } catch (error) {

          if (cancelled) return

          console.error(
            '❌ ERROR DISPONIBILIDAD:',
            error
          )

          setAvailabilityChecked(true)

          setAvailableEmployees([])

          setUnavailableEmployees([])

          setSelectedEmployee(null)

          setMessage({
            type: 'error',
            text:
              error?.message ||
              t('appointmentDialog.errors.checkAvailability'),
          })

        } finally {

          if (!cancelled) {
            setLoadingAvailability(
              false
            )
          }
        }
      }

    checkAvailability()

    return () => {
      cancelled = true
    }

  }, [
    open,
    selectedServiceId,
    appointmentDate,
    appointmentTime,
    appointment?.id,
    appointment?.appointment_id,
    appointment?.employee_id,
    isEdit,
  ])


  // =======================================================
  // CLIENTES FILTRADOS
  // =======================================================

  const filteredCustomers =
    useMemo(() => {

      const search =
        customerSearch
          .trim()
          .toLowerCase()

      if (!search) {
        return customers.slice(0, 8)
      }

      return customers
        .filter(customer => {

          const name =
            getCustomerName(
              customer
            ).toLowerCase()

          const phone =
            getCustomerPhone(
              customer
            ).toLowerCase()

          return (
            name.includes(search) ||
            phone.includes(search)
          )
        })
        .slice(0, 8)

    }, [
      customers,
      customerSearch,
    ])


  // =======================================================
  // EMPLEADOS
  // =======================================================

  const employeeCards =
    useMemo(() => {

      return [
        ...availableEmployees.map(
          employee => ({
            ...employee,
            available: true,
          })
        ),

        ...unavailableEmployees.map(
          employee => ({
            ...employee,
            available: false,
          })
        ),
      ]

    }, [
      availableEmployees,
      unavailableEmployees,
    ])


  const hasAvailability =
    availableEmployees.length > 0


  // =======================================================
  // HANDLERS
  // =======================================================

  const handleSelectCustomer =
    customer => {

      setSelectedCustomer(
        customer
      )

      setCustomerSearch('')

      setMessage({
        type: '',
        text: '',
      })
    }


  const handleChangeCustomer =
    () => {

      setSelectedCustomer(null)

      setCustomerSearch('')
    }


  const handleSelectEmployee =
    employee => {

      if (!employee?.available) {
        return
      }

      setSelectedEmployee(
        employee
      )

      setMessage({
        type: '',
        text: '',
      })
    }


  const handleToggleAutomation =
    automationId => {

      setAutomations(
        current =>
          current.map(
            automation =>
              Number(
                automation.id
              ) ===
              Number(automationId)
                ? {
                    ...automation,
                    enabled:
                      Number(
                        automation.enabled
                      ) === 1
                        ? 0
                        : 1,
                  }
                : automation
          )
      )
    }


  // =======================================================
  // GUARDAR
  // =======================================================

  const handleSubmit =
    async event => {

      event.preventDefault()

      const token =
        localStorage.getItem(
          'access_token'
        )

      if (!token) {

        setMessage({
          type: 'error',
          text: t('appointmentDialog.errors.invalidSession'),
        })

        return
      }


      if (!selectedCustomer) {

        setMessage({
          type: 'error',
          text:
            t('appointmentDialog.errors.selectCustomer'),
        })

        return
      }


      const customerId =
        getCustomerId(
          selectedCustomer
        )


      if (!customerId) {

        setMessage({
          type: 'error',
          text:
            'El cliente seleccionado no tiene un ID válido.',
        })

        return
      }


      if (!selectedServiceId) {

        setMessage({
          type: 'error',
          text:
            t('appointmentDialog.errors.selectService'),
        })

        return
      }


      if (!appointmentDate) {

        setMessage({
          type: 'error',
          text:
            t('appointmentDialog.errors.selectDate'),
        })

        return
      }


      if (!appointmentTime) {

        setMessage({
          type: 'error',
          text:
            t('appointmentDialog.errors.selectTime'),
        })

        return
      }


      if (!selectedEmployee) {

        setMessage({
          type: 'error',
          text:
            t('appointmentDialog.errors.noEmployee'),
        })

        return
      }


      const appointmentId =
        appointment?.id ||
        appointment?.appointment_id


      try {

        setSaving(true)

        setMessage({
          type: '',
          text: '',
        })


        const payload = {

          customer_id:
            Number(customerId),

          service_id:
            Number(
              selectedServiceId
            ),

          employee_id:
            Number(
              selectedEmployee.id
            ),

          appointment_date:
            appointmentDate,

          appointment_time:
            appointmentTime,

          status,

          notes:
            notes.trim(),
        }


        const response =
          await fetch(

            isEdit
              ? `${API_URL}?action=appointment&id=${appointmentId}`
              : `${API_URL}?action=appointments`,

            {

              method:
                isEdit
                  ? 'PUT'
                  : 'POST',

              headers: {

                Authorization:
                  `Bearer ${token}`,

                'Content-Type':
                  'application/json',

                Accept:
                  'application/json',
              },

              body:
                JSON.stringify(
                  payload
                ),
            }
          )


        const result =
          await response.json()


        if (
          response.status === 401
        ) {
          throw new Error(
            'Tu sesión ha expirado.'
          )
        }


        if (
          !response.ok ||
          !result?.success
        ) {
          throw new Error(
            result?.message ||
            t('appointmentDialog.errors.saveAppointment')
          )
        }


        // =================================================
        // AUTOMATIZACIONES
        // =================================================

        if (
          isEdit &&
          automations.length === 3
        ) {

          for (
            const automation
            of automations
          ) {

            const automationResponse =
              await fetch(
                `${API_URL}?action=appointment-automation&appointment_id=${appointmentId}&automation_id=${automation.id}`,
                {

                  method: 'PUT',

                  headers: {

                    Authorization:
                      `Bearer ${token}`,

                    'Content-Type':
                      'application/json',

                    Accept:
                      'application/json',
                  },

                  body:
                    JSON.stringify({

                      enabled:
                        Number(
                          automation.enabled
                        ) === 1,

                      offset_value:
                        Number(
                          automation.offset_value
                        ),

                      offset_unit:
                        automation.offset_unit,

                      offset_direction:
                        automation.offset_direction,

                      message:
                        automation.message ||
                        null,
                    }),
                }
              )


            const automationResult =
              await automationResponse.json()


            if (
              !automationResponse.ok ||
              !automationResult?.success
            ) {

              throw new Error(
                automationResult?.message ||
                t('appointmentDialog.errors.updateAutomation')
              )
            }
          }
        }


        if (
          !isEdit &&
          typeof onCreated ===
          'function'
        ) {

          await onCreated(result)

          onClose()

          return
        }


        if (
          isEdit &&
          typeof onUpdated ===
          'function'
        ) {

          await onUpdated(result)

          return
        }


        onClose()

      } catch (error) {

        console.error(
          '❌ ERROR GUARDANDO CITA:',
          error
        )

        setMessage({
          type: 'error',
          text:
            error?.message ||
            t('appointmentDialog.errors.saveAppointment'),
        })

      } finally {

        setSaving(false)
      }
    }


  const handleReviewLinkSaved = savedUrl => {
    setReviewUrl(
      String(savedUrl || '').trim()
    )
    setShowReviewConfig(false)
  }


  // =======================================================
  // RENDER
  // =======================================================

  if (!open) {
    return null
  }


  return (
    <div
      className="appointment-dialog-overlay"
      onMouseDown={event => {

        if (
          event.target ===
          event.currentTarget
        ) {
          onClose()
        }

      }}
    >

      <div className="appointment-dialog">


        {/* =================================================
            HEADER COMPACTO
        ================================================= */}

        <header className="appointment-dialog-header">

          <div className="appointment-header-left">

            <div className="appointment-dialog-title-icon">
              📅
            </div>

            <div>

              <h2>
                {
                  isEdit
                    ? t('appointmentDialog.editTitle')
                    : t('appointmentDialog.createTitle')
                }
              </h2>

              <p>

                {
                  appointmentDate
                    ? formatApiDateForDisplay(
                        appointmentDate
                      )
                    : t('appointmentDialog.selectDate')
                }

                {appointmentTime && (
                  <>
                    {' · '}
                    {appointmentTime}
                  </>
                )}

              </p>

            </div>

          </div>


          {!loadingReviewUrl && !reviewUrl && (
            <div className="appointment-review-warning">
              <div className="appointment-review-warning-icon">
                ⭐
              </div>

              <div className="appointment-review-warning-content">
                <strong>
                  {t('appointmentDialog.reviewWarning.title')}
                </strong>

                <span>
                  {t('appointmentDialog.reviewWarning.description')}
                </span>
              </div>

              <button
                type="button"
                className="appointment-review-warning-button"
                onClick={() => {
                  setShowReviewConfig(true)
                  onConfigureReviews?.()
                }}
                disabled={saving}
              >
                <span>⚙️</span>
                <span>{t('appointmentDialog.reviewWarning.configure')}</span>
              </button>
            </div>
          )}

          <button
            type="button"
            className="appointment-dialog-close"
            onClick={onClose}
            disabled={saving}
          >
            ×
          </button>

        </header>


        {/* =================================================
            BODY
        ================================================= */}

        <div className="appointment-dialog-body">


          {/* =================================================
              CLIENTE
          ================================================= */}

          <section className="compact-section">

            <div className="compact-section-header">

              <div className="compact-section-icon">
                👤
              </div>

              <div>

                <strong>
                  {t('appointmentDialog.customer.title')}
                </strong>

                <span>
                  {t('appointmentDialog.customer.subtitle')}
                </span>

              </div>

            </div>


            <div className="customer-row">

              {!selectedCustomer ? (

                <div className="customer-search compact">

                  <span>
                    🔎
                  </span>

                  <input
                    type="text"
                    value={
                      customerSearch
                    }
                    onChange={event =>
                      setCustomerSearch(
                        event.target.value
                      )
                    }
                    placeholder={t('appointmentDialog.customer.searchPlaceholder')}
                    disabled={
                      saving ||
                      loadingCustomers
                    }
                    autoComplete="off"
                  />

                </div>

              ) : (

                <div className="selected-customer compact">

                  <div className="customer-avatar">

                    {
                      getInitials(
                        selectedCustomer
                      )
                    }

                  </div>

                  <div className="selected-customer-info">

                    <strong>
                      {
                        getCustomerName(
                          selectedCustomer
                        )
                      }
                    </strong>

                    <span>
                      {
                        getCustomerPhone(
                          selectedCustomer
                        ) ||
                        t('appointmentDialog.customer.noPhone')
                      }
                    </span>

                  </div>

                  <button
                    type="button"
                    className="change-customer-button"
                    onClick={
                      handleChangeCustomer
                    }
                    disabled={saving}
                  >
                    {t('appointmentDialog.customer.change')}
                  </button>

                </div>

              )}



            </div>


            {!selectedCustomer &&
              customerSearch && (
                <div className="customer-list compact-list">

                  {loadingCustomers && (
                    <div className="customer-state">
                      ⏳ {t('common.loading')}
                    </div>
                  )}

                  {!loadingCustomers &&
                    filteredCustomers.length === 0 && (
                      <div className="customer-state">
                        {t('appointmentDialog.customer.noResults')}
                      </div>
                    )}

                  {!loadingCustomers &&
                    filteredCustomers.map(
                      customer => (

                        <button
                          type="button"
                          key={
                            getCustomerId(
                              customer
                            )
                          }
                          className="customer-option"
                          onClick={() =>
                            handleSelectCustomer(
                              customer
                            )
                          }
                          disabled={saving}
                        >

                          <div className="customer-avatar">

                            {
                              getInitials(
                                customer
                              )
                            }

                          </div>

                          <div className="customer-option-info">

                            <strong>
                              {
                                getCustomerName(
                                  customer
                                )
                              }
                            </strong>

                            <span>
                              {
                                getCustomerPhone(
                                  customer
                                ) ||
                                t('appointmentDialog.customer.noPhone')
                              }
                            </span>

                          </div>

                          <span className="customer-select-icon">
                            ›
                          </span>

                        </button>

                      )
                    )}

                </div>
              )}

          </section>


          {/* =================================================
              SERVICIO + EMPLEADO
          ================================================= */}

          <div className="compact-two-column">


            {/* SERVICIO */}

            <section className="compact-section">

              <div className="compact-section-header">

                <div className="compact-section-icon purple">
                  ✂️
                </div>

                <div>

                  <strong>
                    {t('appointmentDialog.service.title')}
                  </strong>

                  <span>
                    {t('appointmentDialog.service.subtitle')}
                  </span>

                </div>

              </div>


              <div className="service-inline">

                <select
                  value={
                    selectedServiceId
                  }
                  onChange={event => {

                    setSelectedServiceId(
                      event.target.value
                    )

                    setSelectedEmployee(
                      null
                    )

                  }}
                  disabled={
                    saving ||
                    loadingServices
                  }
                >

                  <option value="">
                    {
                      loadingServices
                        ? t('common.loading')
                        : t('appointmentDialog.service.select')
                    }
                  </option>

                  {services.map(
                    service => (

                      <option
                        key={
                          service.id
                        }
                        value={
                          service.id
                        }
                      >
                        {
                          getServiceName(
                            service
                          )
                        }
                      </option>

                    )
                  )}

                </select>


                {selectedService && (

                  <div className="service-info-inline">

                    <strong>
                      {
                        servicePrice !==
                          null &&
                        servicePrice !==
                          undefined &&
                        servicePrice !==
                          ''
                          ? `${servicePrice} ${selectedService?.currency_symbol || selectedService?.currency_code || ''}`
                          : '—'
                      }
                    </strong>

                    <span>
                      ·
                    </span>

                    <span>
                      {
                        formatDuration(
                          serviceDuration
                        )
                      }
                    </span>

                  </div>

                )}

              </div>

            </section>


            {/* EMPLEADO */}

            <section className="compact-section">

              <div className="compact-section-header">

                <div className="compact-section-icon orange">
                  👥
                </div>

                <div>

                  <strong>
                    {t('appointmentDialog.employee.title')}
                  </strong>

                  <span>

                    {
                      loadingAvailability
                        ? t('appointmentDialog.employee.checking')
                        : hasAvailability
                          ? `${availableEmployees.length} ${availableEmployees.length > 1 ? t('appointmentDialog.employee.availablePlural') : t('appointmentDialog.employee.available')}`
                          : t('appointmentDialog.employee.availability')
                    }

                  </span>

                </div>

              </div>


              {!selectedServiceId ? (

                <div className="mini-empty">
                  {t('appointmentDialog.employee.selectService')}
                </div>

              ) : loadingAvailability ? (

                <div className="mini-empty">
                  ⏳ {t('appointmentDialog.employee.checkingAvailability')}
                </div>

              ) : employeeCards.length === 0 ? (

                <div className="mini-empty danger">
                  ⚠️ {t('appointmentDialog.employee.noAvailable')}
                </div>

              ) : (

                <div className="employee-mini-grid">

                  {employeeCards.map(
                    employee => {

                      const selected =
                        selectedEmployee &&
                        Number(
                          selectedEmployee.id
                        ) ===
                        Number(
                          employee.id
                        )

                      return (

                        <button
                          type="button"
                          key={
                            employee.id
                          }
                          className={
                            `employee-mini ${
                              employee.available
                                ? 'available'
                                : 'unavailable'
                            } ${
                              selected
                                ? 'selected'
                                : ''
                            }`
                          }
                          onClick={() =>
                            handleSelectEmployee(
                              employee
                            )
                          }
                          disabled={
                            saving ||
                            !employee.available
                          }
                        >

                          <div
                            className="employee-mini-avatar"
                            style={{
                              background:
                                employee.color ||
                                '#334155',
                            }}
                          >

                            {
                              getEmployeeName(
                                employee
                              )
                                .split(' ')
                                .map(
                                  part =>
                                    part[0]
                                )
                                .join('')
                                .slice(
                                  0,
                                  2
                                )
                                .toUpperCase()
                            }

                          </div>


                          <div>

                            <strong>
                              {
                                getEmployeeName(
                                  employee
                                )
                              }
                            </strong>

                            <span>

                              <i />

                              {
                                employee.available
                                  ? t('appointmentDialog.employee.available')
                                  : employee.reason ===
                                      'outside_working_hours'
                                    ? t('appointmentDialog.employee.outsideHours')
                                    : t('appointmentDialog.employee.busy')
                              }

                            </span>

                          </div>


                          {selected && (
                            <b>
                              ✓
                            </b>
                          )}

                        </button>

                      )
                    }
                  )}

                </div>

              )}

            </section>

          </div>


          {/* =================================================
              FECHA + HORA
          ================================================= */}

          <section className="compact-section">

            <div className="compact-section-header">

              <div className="compact-section-icon green">
                📅
              </div>

              <div>

                <strong>
                  {t('appointmentDialog.dateTime.title')}
                </strong>

                <span>
                  {
                    appointmentEndTime
                      ? `${t('appointmentDialog.dateTime.durationUntil')} ${appointmentEndTime}`
                      : t('appointmentDialog.dateTime.subtitle')
                  }
                </span>

              </div>

            </div>


            <div className="date-time-inline">

              <div className="compact-field">

                <label>
                  Fecha
                </label>

                <input
                  type="date"
                  value={
                    appointmentDate
                  }
                  onChange={event =>
                    setAppointmentDate(
                      event.target.value
                    )
                  }
                  disabled={saving}
                />

              </div>


              <div className="compact-field">

                <label>
                  Hora
                </label>

                <input
                  type="time"
                  value={
                    appointmentTime
                  }
                  onChange={event =>
                    setAppointmentTime(
                      event.target.value
                    )
                  }
                  disabled={saving}
                />

              </div>


              {appointmentEndTime && (

                <div className="time-result">

                  <span>
                    🕐
                  </span>

                  <div>

                    <small>
                      {t('appointmentDialog.dateTime.ends')}
                    </small>

                    <strong>
                      {appointmentEndTime}
                    </strong>

                  </div>

                </div>

              )}

            </div>

          </section>


          {/* =================================================
              RESUMEN COMPACTO
          ================================================= */}

          <section className="compact-summary">

            <div className="summary-main">

              <div className="summary-item">

                <small>
                  Cliente
                </small>

                <strong>
                  {
                    selectedCustomer
                      ? getCustomerName(
                          selectedCustomer
                        )
                      : '—'
                  }
                </strong>

              </div>


              <div className="summary-separator" />


              <div className="summary-item">

                <small>
                  Servicio
                </small>

                <strong>
                  {
                    selectedService
                      ? getServiceName(
                          selectedService
                        )
                      : '—'
                  }
                </strong>

              </div>


              <div className="summary-separator" />


              <div className="summary-item">

                <small>
                  Fecha
                </small>

                <strong>
                  {
                    appointmentDate
                      ? formatApiDateForDisplay(
                          appointmentDate
                        )
                      : '—'
                  }
                </strong>

              </div>


              <div className="summary-separator" />


              <div className="summary-item">

                <small>
                  Hora
                </small>

                <strong>
                  {
                    appointmentTime || '—'
                  }

                  {appointmentEndTime && (
                    <>
                      {' – '}
                      {
                        appointmentEndTime
                      }
                    </>
                  )}

                </strong>

              </div>


              <div className="summary-separator" />


              <div className="summary-item">

                <small>
                  Empleado
                </small>

                <strong>
                  {
                    selectedEmployee
                      ? getEmployeeName(
                          selectedEmployee
                        )
                      : '—'
                  }
                </strong>

              </div>


              <div className="summary-price">

                {
                  servicePrice !==
                    null &&
                  servicePrice !==
                    undefined &&
                  servicePrice !==
                    ''
                    ? `${servicePrice} ${selectedService?.currency_symbol || selectedService?.currency_code || ''}`
                    : '—'
                }

              </div>

            </div>

          </section>


          {/* =================================================
              NOTAS
          ================================================= */}

          <section className="compact-notes">

            <div className="compact-notes-label">

              📝

              <span>
                {t('appointmentDialog.notes.title')}
                <em>
                  {' '}
                  ({t('appointmentDialog.notes.optional')})
                </em>
              </span>

            </div>


            <textarea
              value={notes}
              onChange={event =>
                setNotes(
                  event.target.value
                )
              }
              placeholder={t('appointmentDialog.notes.placeholder')}
              disabled={saving}
            />

          </section>


          {/* =================================================
              ESTADO EN EDICIÓN
          ================================================= */}

          {isEdit && (

            <div className="edit-status-row">

              <label>
                {t('appointmentDialog.status.title')}
              </label>

              <select
                value={status}
                onChange={event =>
                  setStatus(
                    event.target.value
                  )
                }
                disabled={saving}
              >

                <option value="scheduled">
                  {t('appointmentDialog.status.scheduled')}
                </option>

                <option value="confirmed">
                  {t('appointmentDialog.status.confirmed')}
                </option>

                <option value="completed">
                  {t('appointmentDialog.status.completed')}
                </option>

                <option value="cancelled">
                  {t('appointmentDialog.status.cancelled')}
                </option>

              </select>

            </div>

          )}


          {/* =================================================
              AUTOMATIZACIONES EDICIÓN
          ================================================= */}

          {isEdit && (

            <section className="compact-automations">

              <div className="compact-automations-header">

                <div>
                  🔔
                </div>

                <span>
                  {t('appointmentDialog.automations.title')}
                </span>

              </div>


              {loadingAutomations ? (

                <span className="automation-loading">
                  ⏳ {t('common.loading')}
                </span>

              ) : (

                <div className="compact-automation-list">

                  {[1, 2, 3].map(
                    number => {

                      const automation =
                        automations.find(
                          item =>
                            Number(
                              item.automation_number
                            ) ===
                            number
                        )

                      if (!automation) {
                        return null
                      }

                      const enabled =
                        Number(
                          automation.enabled
                        ) === 1

                      const title =
                        number === 1
                          ? '24 h antes'
                          : number === 2
                            ? '1 h antes'
                            : 'Reseña'

                      return (

                        <div
                          key={
                            automation.id
                          }
                          className="compact-automation"
                        >

                          <span>
                            {title}
                          </span>

                          <button
                            type="button"
                            className={
                              `automation-switch ${
                                enabled
                                  ? 'active'
                                  : ''
                              }`
                            }
                            onClick={() =>
                              handleToggleAutomation(
                                automation.id
                              )
                            }
                            disabled={saving}
                          >

                            <i />

                          </button>

                        </div>

                      )
                    }
                  )}

                </div>

              )}

            </section>

          )}


          {/* =================================================
              MENSAJE
          ================================================= */}

          {message.text && (

            <div
              className={
                `appointment-message ${message.type}`
              }
            >

              {
                message.type ===
                'error'
                  ? '⚠️'
                  : '✓'
              }

              {' '}

              {
                message.text
              }

            </div>

          )}

        </div>


        {/* =================================================
            FOOTER
        ================================================= */}

        <footer className="appointment-dialog-footer">

          <button
            type="button"
            className="appointment-dialog-cancel"
            onClick={onClose}
            disabled={saving}
          >
            {t('common.cancel')}
          </button>


          <button
            type="button"
            className="appointment-dialog-create"
            onClick={handleSubmit}
            disabled={
              saving ||
              !selectedCustomer ||
              !selectedServiceId ||
              !selectedEmployee ||
              loadingAvailability
            }
          >

            {
              saving
                ? t('common.saving')
                : isEdit
                  ? t('appointmentDialog.saveChanges')
                  : t('appointmentDialog.createAppointment')
            }

          </button>

        </footer>

      </div>

      <ReviewLinkDialog
        open={showReviewConfig}
        onClose={() => setShowReviewConfig(false)}
        onSaved={handleReviewLinkSaved}
      />

    </div>
  )
}


export default AppointmentDialog