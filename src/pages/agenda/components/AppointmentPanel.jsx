import { useState } from 'react'

import './AppointmentPanel.css'


const API_URL =
  'https://kreandoapp.com/api/index.php'


function AppointmentPanel({
  appointment,
  onClose,
  onUpdated,
  onEdit,
}) {

  const [
    deleting,
    setDeleting,
  ] = useState(false)


  const [
    deleteError,
    setDeleteError,
  ] = useState('')


  const customerName =
    appointment.customer_name ||
    appointment.full_name ||
    appointment.customer_full_name ||
    'Cliente'


  const date =
    appointment.appointment_date ||
    ''


  const time =
    String(
      appointment.appointment_time ||
      ''
    ).slice(
      0,
      5
    )


  // =====================================================
  // 🗑️ ELIMINAR
  // =====================================================

  const handleDelete =
    async () => {

      const appointmentId =
        appointment.id ||
        appointment.appointment_id


      if (!appointmentId) {

        setDeleteError(
          'No se encontró el ID de la cita.'
        )

        return
      }


      const confirmed =
        window.confirm(
          `¿Seguro que quieres eliminar la cita de ${customerName}?\n\nEsta acción no se puede deshacer.`
        )


      if (!confirmed) {
        return
      }


      const token =
        localStorage.getItem(
          'access_token'
        )


      if (!token) {

        setDeleteError(
          'Sesión no válida.'
        )

        return
      }


      try {

        setDeleting(true)

        setDeleteError('')


        const response =
          await fetch(
            `${API_URL}?action=appointment&id=${appointmentId}`,
            {
              method: 'DELETE',

              headers: {
                Authorization:
                  `Bearer ${token}`,

                Accept:
                  'application/json',
              },
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
          !result.success
        ) {

          throw new Error(
            result.message ||
            'No se pudo eliminar la cita.'
          )
        }


        console.log(
          '🗑️ CITA ELIMINADA'
        )


        if (
          typeof onUpdated ===
          'function'
        ) {

          await onUpdated()

        }


        onClose()

      } catch (err) {

        console.error(
          '❌ ERROR ELIMINANDO CITA:',
          err
        )


        setDeleteError(
          err.message ||
          'No se pudo eliminar la cita.'
        )

      } finally {

        setDeleting(false)

      }

    }


  // =====================================================
  // ✏️ EDITAR
  // =====================================================

  const handleEdit =
    () => {

      console.log(
        '✏️ BOTÓN EDITAR:',
        appointment
      )


      if (
        typeof onEdit !==
        'function'
      ) {

        console.error(
          '❌ onEdit no está definido.'
        )

        return
      }


      onEdit(
        appointment
      )
    }


  return (

    <div className="appointment-panel-overlay">


      <aside className="appointment-panel">


        {/* =================================================
            HEADER
        ================================================= */}

        <div className="appointment-panel-header">

          <div>

            <span className="appointment-panel-label">
              CITA
            </span>

            <h2>
              {customerName}
            </h2>

          </div>


          <button
            type="button"
            onClick={
              onClose
            }
            className="appointment-panel-close"
          >
            ×
          </button>

        </div>


        {/* =================================================
            BODY
        ================================================= */}

        <div className="appointment-panel-body">


          <div className="appointment-detail">

            <span>
              Fecha
            </span>

            <strong>
              {date}
            </strong>

          </div>


          <div className="appointment-detail">

            <span>
              Hora
            </span>

            <strong>
              {time}
            </strong>

          </div>


          <div className="appointment-detail">

            <span>
              Estado
            </span>

            <strong className="appointment-status">
              {
                appointment.status ||
                'scheduled'
              }
            </strong>

          </div>


          {appointment.notes && (

            <div className="appointment-notes">

              <span>
                Notas
              </span>

              <p>
                {
                  appointment.notes
                }
              </p>

            </div>

          )}


          {deleteError && (

            <div className="appointment-delete-error">

              {
                deleteError
              }

            </div>

          )}

        </div>


        {/* =================================================
            FOOTER
        ================================================= */}

        <div className="appointment-panel-footer">


          {/* 🗑️ ELIMINAR */}

          <button
            type="button"
            className="appointment-delete-button"
            onClick={
              handleDelete
            }
            disabled={
              deleting
            }
            title="Eliminar cita"
            aria-label="Eliminar cita"
          >

            {deleting ? (

              <span className="appointment-delete-spinner" />

            ) : (

              <svg
                className="appointment-delete-icon"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >

                <path d="M9 3h6" />

                <path d="M4 6h16" />

                <path d="M8 6l1 15h6l1-15" />

                <path d="M10 10v7" />

                <path d="M14 10v7" />

              </svg>

            )}

          </button>


          {/* ✏️ EDITAR */}

          <button
            type="button"
            className="appointment-secondary-button"
            onClick={
              handleEdit
            }
            disabled={
              deleting
            }
          >
            Editar
          </button>


          {/* 🔄 REPROGRAMAR */}

          <button
            type="button"
            className="appointment-primary-button"
          >
            Reprogramar
          </button>


        </div>

      </aside>

    </div>

  )
}


export default AppointmentPanel