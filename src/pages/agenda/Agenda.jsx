import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import './Agenda.css'

import { useLanguage } from '../../context/LanguageContext'

import CalendarGrid from './components/CalendarGrid'
import AppointmentPanel from './components/AppointmentPanel'
import AppointmentDialog from './components/AppointmentDialog'

const API_URL =
  'https://kreandoapp.com/api/index.php'

function Agenda({
  navigate = () => {},
}) {

  const { t } = useLanguage()

  const [
    appointments,
    setAppointments,
  ] = useState([])

  // =====================================================
  // 🕐 HORARIOS DEL NEGOCIO
  // =====================================================

  const [
    businessHours,
    setBusinessHours,
  ] = useState([])

  const [
    selectedAppointment,
    setSelectedAppointment,
  ] = useState(null)

  // =====================================================
  // ✏️ EDICIÓN
  // =====================================================

  const [
    editAppointment,
    setEditAppointment,
  ] = useState(null)

  const [
    editDialogOpen,
    setEditDialogOpen,
  ] = useState(false)

  // =====================================================
  // 📊 ESTADO
  // =====================================================

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    refreshing,
    setRefreshing,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState('')

  // =====================================================
  // 📡 CARGAR CITAS
  // =====================================================

  const loadAppointments =
    useCallback(
      async ({
        silent = false,
      } = {}) => {

        const token =
          localStorage.getItem(
            'access_token'
          )

        if (!token) {
          setError(
            t('agenda.errors.invalidSession')
          )

          setLoading(false)

          return []
        }

        // =================================================
        // 🏢 BUSINESS ID
        // =================================================

        const businessId =
          Number(
            localStorage.getItem(
              'business_id'
            )
          )

        if (
          !Number.isInteger(
            businessId
          ) ||
          businessId <= 0
        ) {
          setError(
            t('agenda.errors.invalidBusinessId')
          )

          setLoading(false)

          return []
        }

        try {

          if (silent) {
            setRefreshing(true)
          } else {
            setLoading(true)
          }

          setError('')

          const response =
            await fetch(
              `${API_URL}?action=appointments`,
              {
                method: 'GET',

                headers: {
                  Authorization:
                    `Bearer ${token}`,

                  Accept:
                    'application/json',
                },

                cache:
                  'no-store',
              }
            )

          const result =
            await response.json()

          if (
            response.status === 401
          ) {
            setError(
              t('agenda.errors.sessionExpired')
            )

            return []
          }

          if (
            !response.ok ||
            !result.success
          ) {
            throw new Error(
              result.message ||
                t('agenda.errors.loadAppointments')
            )
          }

          const data =
            result.data || []

          const freshAppointments =
            Array.isArray(data)
              ? data
              : Array.isArray(
                  data.appointments
                )
                ? data.appointments
                : []

          // =================================================
          // 🔒 FILTRAR POR NEGOCIO
          // =================================================

          const filteredAppointments =
            freshAppointments.filter(
              appointment =>
                Number(
                  appointment.business_id
                ) === businessId
            )

          console.log(
            '🏢 BUSINESS ID ACTUAL:',
            businessId
          )

          console.log(
            '📅 CITAS RECIBIDAS:',
            freshAppointments
          )

          console.log(
            '🔒 CITAS DEL NEGOCIO:',
            filteredAppointments
          )

          setAppointments(
            filteredAppointments
          )

          return filteredAppointments

        } catch (err) {

          console.error(
            '❌ ERROR CARGANDO CITAS:',
            err
          )

          setError(
            err.message ||
              t('agenda.errors.loadAppointments')
          )

          return []

        } finally {

          if (silent) {
            setRefreshing(false)
          } else {
            setLoading(false)
          }

        }
      },
      [t]
    )

  // =====================================================
  // 🕐 CARGAR HORARIOS
  // =====================================================

  const loadBusinessHours =
    useCallback(
      async () => {

        const token =
          localStorage.getItem(
            'access_token'
          )

        if (!token) {

          console.error(
            '❌ No hay token para cargar horarios.'
          )

          return
        }

        try {

          const response =
            await fetch(
              `${API_URL}?action=business-hours`,
              {
                method: 'GET',

                headers: {
                  Authorization:
                    `Bearer ${token}`,

                  Accept:
                    'application/json',
                },

                cache:
                  'no-store',
              }
            )

          const result =
            await response.json()

          if (
            response.status === 401
          ) {

            console.error(
              '❌ Sesión expirada al cargar horarios.'
            )

            return
          }

          if (
            !response.ok ||
            !result.success
          ) {
            throw new Error(
              result.message ||
                t('agenda.errors.loadBusinessHours')
            )
          }

          const hours =
            Array.isArray(
              result.data
            )
              ? result.data
              : []

          console.log(
            '🕐 HORARIOS DEL NEGOCIO:',
            hours
          )

          setBusinessHours(
            hours
          )

        } catch (err) {

          console.error(
            '❌ ERROR CARGANDO HORARIOS:',
            err
          )

          setBusinessHours([])
        }
      },
      [t]
    )

  // =====================================================
  // 🚀 PRIMERA CARGA
  // =====================================================

  useEffect(() => {

    loadAppointments()

    loadBusinessHours()

  }, [
    loadAppointments,
    loadBusinessHours,
  ])

  // =====================================================
  // 🟢 CITA CREADA
  // =====================================================

  const handleAppointmentCreated =
    async () => {

      console.log(
        '🎉 NUEVA CITA CREADA'
      )

      await loadAppointments({
        silent: true,
      })
    }

  // =====================================================
  // ✏️ ABRIR EDICIÓN
  // =====================================================

  const handleEditAppointment =
    (appointment) => {

      console.log(
        '✏️ ABRIENDO EDICIÓN:',
        appointment
      )

      setSelectedAppointment(
        null
      )

      setEditAppointment(
        appointment
      )

      setEditDialogOpen(
        true
      )
    }

  // =====================================================
  // ❌ CERRAR EDICIÓN
  // =====================================================

  const handleCloseEditDialog =
    () => {

      setEditDialogOpen(
        false
      )

      setEditAppointment(
        null
      )
    }

  // =====================================================
  // 💾 CITA ACTUALIZADA
  // =====================================================

  const handleAppointmentUpdated =
    async () => {

      console.log(
        '💾 CITA ACTUALIZADA'
      )

      await loadAppointments({
        silent: true,
      })

      handleCloseEditDialog()
    }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="agenda-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="agenda-header">

        <div className="agenda-header-content">

          <div className="agenda-eyebrow">
            {t('agenda.eyebrow')}
          </div>

          <h1 className="agenda-title">

            <span
              className="agenda-title-icon"
              aria-hidden="true"
            >
              📅
            </span>

            <span>
              {t('agenda.title')}
            </span>

          </h1>

          <p className="agenda-description">
            {t('agenda.description')}
          </p>

        </div>

      </header>

      {/* =================================================
          CALENDARIO
      ================================================= */}

      <section
        className="agenda-calendar-container"
        aria-label={t('agenda.calendarLabel')}
      >

        {/* =================================================
            LOADING
        ================================================= */}

        {loading && (

          <div className="agenda-loading">

            <div
              className="agenda-spinner"
              aria-hidden="true"
            />

            <span>
              {t('agenda.loading')}
            </span>

          </div>

        )}

        {/* =================================================
            ERROR
        ================================================= */}

        {!loading && error && (

          <div className="agenda-error">

            <div
              className="agenda-error-icon"
              aria-hidden="true"
            >
              ⚠️
            </div>

            <div className="agenda-error-title">
              {t('agenda.errorTitle')}
            </div>

            <div className="agenda-error-message">
              {error}
            </div>

            <button
              type="button"
              onClick={() => {
                loadAppointments()
                loadBusinessHours()
              }}
            >
              {t('agenda.retry')}
            </button>

          </div>

        )}

        {/* =================================================
            CALENDARIO
        ================================================= */}

        {!loading && !error && (

          <div className="agenda-grid-wrapper">

            <CalendarGrid
              appointments={
                appointments
              }

              businessHours={
                businessHours
              }

              onAppointmentClick={
                setSelectedAppointment
              }

              onAppointmentCreated={
                handleAppointmentCreated
              }

              onNavigateToClients={() =>
                navigate('clients')
              }
            />

            {refreshing && (

              <div className="agenda-refresh-indicator">

                <span
                  aria-hidden="true"
                >
                  ↻
                </span>

                {t('agenda.refreshing')}

              </div>

            )}

          </div>

        )}

      </section>

      {/* =================================================
          📋 PANEL DE CITA
      ================================================= */}

      {selectedAppointment && (

        <AppointmentPanel
          appointment={
            selectedAppointment
          }

          onClose={() =>
            setSelectedAppointment(
              null
            )
          }

          onUpdated={() =>
            loadAppointments({
              silent: true,
            })
          }

          onEdit={
            handleEditAppointment
          }
        />

      )}

      {/* =================================================
          ✏️ DIÁLOGO DE EDICIÓN
      ================================================= */}

      {editAppointment && (

        <AppointmentDialog
          open={
            editDialogOpen
          }

          mode="edit"

          appointment={
            editAppointment
          }

          onClose={
            handleCloseEditDialog
          }

          onUpdated={
            handleAppointmentUpdated
          }
        />

      )}

    </div>
  )
}

export default Agenda