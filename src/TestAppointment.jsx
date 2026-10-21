import { useEffect, useState } from 'react'

const API_URL = 'https://kreandoapp.com/api/index.php'

function TestAppointment() {
  const [customers, setCustomers] = useState([])
  const [customerId, setCustomerId] = useState('')
  const [appointmentDate, setAppointmentDate] = useState('')
  const [appointmentTime, setAppointmentTime] = useState('')
  const [notes, setNotes] = useState('PRUEBA CRON WHATSAPP')

  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [creating, setCreating] = useState(false)

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  // =====================================================
  // CARGAR CLIENTES
  // =====================================================

  const loadCustomers = async () => {
    const token = localStorage.getItem('access_token')

    if (!token) {
      setError('No hay sesión activa.')
      return
    }

    setLoadingCustomers(true)
    setError('')

    try {
      /*
       * IMPORTANTE:
       * Si tu API usa otro action para listar clientes,
       * cambia solamente esta URL.
       */
      const response = await fetch(
        `${API_URL}?action=customers`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
          cache: 'no-store',
        }
      )

      const data = await response.json()

      if (response.status === 401) {
        setError('La sesión expiró.')
        return
      }

      if (!response.ok || data.success === false) {
        setError(
          data.message ||
          'No se pudieron cargar los clientes.'
        )
        return
      }

      const list =
        data.data?.customers ||
        data.data ||
        data.customers ||
        []

      setCustomers(Array.isArray(list) ? list : [])

      if (Array.isArray(list) && list.length > 0) {
        setCustomerId(String(list[0].id))
      }

    } catch (err) {
      console.error('❌ Error cargando clientes:', err)
      setError('No se pudo consultar la API.')
    } finally {
      setLoadingCustomers(false)
    }
  }

  // =====================================================
  // FECHA / HORA INICIAL
  // =====================================================

  useEffect(() => {
    const now = new Date()

    const date =
      now.toISOString().split('T')[0]

    setAppointmentDate(date)

    /*
     * Ponemos la hora actual + 10 minutos
     * para facilitar la prueba.
     */
    now.setMinutes(now.getMinutes() + 10)

    const hours = String(
      now.getHours()
    ).padStart(2, '0')

    const minutes = String(
      now.getMinutes()
    ).padStart(2, '0')

    setAppointmentTime(
      `${hours}:${minutes}`
    )

    loadCustomers()
  }, [])

  // =====================================================
  // CREAR CITA
  // =====================================================

  const createAppointment = async () => {
    const token =
      localStorage.getItem('access_token')

    setMessage('')
    setError('')
    setResult(null)

    if (!token) {
      setError('No hay sesión activa.')
      return
    }

    if (!customerId) {
      setError('Seleccioná un cliente.')
      return
    }

    if (!appointmentDate) {
      setError('Seleccioná una fecha.')
      return
    }

    if (!appointmentTime) {
      setError('Seleccioná una hora.')
      return
    }

    setCreating(true)

    try {
      const body = {
        customer_id: Number(customerId),
        appointment_date: appointmentDate,
        appointment_time:
          appointmentTime.length === 5
            ? `${appointmentTime}:00`
            : appointmentTime,
        status: 'scheduled',
        notes,
      }

      console.log(
        '📅 Creando cita:',
        body
      )

      const response = await fetch(
        `${API_URL}?action=appointments`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(body),
        }
      )

      const data = await response.json()

      console.log(
        '📥 Respuesta API:',
        data
      )

      if (response.status === 401) {
        setError('La sesión expiró.')
        return
      }

      if (!response.ok || data.success === false) {
        setError(
          data.message ||
          'La API rechazó la creación de la cita.'
        )
        return
      }

      setResult(data)

      setMessage(
        `✅ Cita creada correctamente. ID: ${
          data.data?.appointment_id ?? '?'
        }`
      )

    } catch (err) {
      console.error(
        '❌ Error creando cita:',
        err
      )

      setError(
        'No se pudo conectar con la API.'
      )
    } finally {
      setCreating(false)
    }
  }

  // =====================================================
  // ESTILOS
  // =====================================================

  const inputStyle = {
    width: '100%',
    padding: '13px 14px',
    boxSizing: 'border-box',
    borderRadius: '10px',
    border: '1px solid #343b47',
    background: '#0f1218',
    color: '#fff',
    outline: 'none',
    fontSize: '14px',
  }

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    color: '#cbd0d8',
    fontSize: '13px',
    fontWeight: 600,
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div
      style={{
        maxWidth: '800px',
      }}
    >
      <div
        style={{
          marginBottom: '25px',
        }}
      >
        <div
          style={{
            color: '#6f7886',
            fontSize: '12px',
            marginBottom: '8px',
          }}
        >
          PRUEBAS
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: '30px',
          }}
        >
          🧪 Test cita
        </h1>

        <p
          style={{
            marginTop: '9px',
            color: '#7f8794',
            lineHeight: 1.6,
          }}
        >
          Crear una cita de prueba para comprobar la API,
          las automatizaciones y posteriormente el cron.
        </p>
      </div>

      {/* FORMULARIO */}

      <div
        style={{
          padding: '26px',
          background: '#14181f',
          border: '1px solid #272e38',
          borderRadius: '16px',
        }}
      >
        {/* CLIENTE */}

        <div
          style={{
            marginBottom: '20px',
          }}
        >
          <label style={labelStyle}>
            👤 Cliente
          </label>

          <select
            value={customerId}
            onChange={(e) =>
              setCustomerId(e.target.value)
            }
            disabled={loadingCustomers}
            style={inputStyle}
          >
            <option value="">
              {loadingCustomers
                ? 'Cargando clientes...'
                : 'Seleccionar cliente'}
            </option>

            {customers.map((customer) => (
              <option
                key={customer.id}
                value={customer.id}
              >
                {customer.name ||
                  customer.phone ||
                  `Cliente ${customer.id}`}
                {customer.phone
                  ? ` — +${customer.phone}`
                  : ''}
              </option>
            ))}
          </select>
        </div>

        {/* FECHA */}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              '1fr 1fr',
            gap: '15px',
            marginBottom: '20px',
          }}
        >
          <div>
            <label style={labelStyle}>
              📅 Fecha
            </label>

            <input
              type="date"
              value={appointmentDate}
              onChange={(e) =>
                setAppointmentDate(
                  e.target.value
                )
              }
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>
              ⏰ Hora
            </label>

            <input
              type="time"
              value={appointmentTime}
              onChange={(e) =>
                setAppointmentTime(
                  e.target.value
                )
              }
              style={inputStyle}
            />
          </div>
        </div>

        {/* NOTAS */}

        <div
          style={{
            marginBottom: '22px',
          }}
        >
          <label style={labelStyle}>
            📝 Notas
          </label>

          <input
            type="text"
            value={notes}
            onChange={(e) =>
              setNotes(e.target.value)
            }
            style={inputStyle}
          />
        </div>

        {/* ERROR */}

        {error && (
          <div
            style={{
              marginBottom: '18px',
              padding: '13px 14px',
              borderRadius: '10px',
              border: '1px solid #6b2b2b',
              background: '#241416',
              color: '#ff8585',
              fontSize: '14px',
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* ÉXITO */}

        {message && (
          <div
            style={{
              marginBottom: '18px',
              padding: '13px 14px',
              borderRadius: '10px',
              border:
                '1px solid rgba(37,211,102,0.25)',
              background:
                'rgba(37,211,102,0.07)',
              color: '#5ee78b',
              fontSize: '14px',
            }}
          >
            {message}
          </div>
        )}

        {/* BOTÓN */}

        <button
          type="button"
          onClick={createAppointment}
          disabled={creating}
          style={{
            width: '100%',
            padding: '14px',
            border: 'none',
            borderRadius: '10px',
            background: creating
              ? '#3c444e'
              : '#25D366',
            color: '#fff',
            fontSize: '15px',
            fontWeight: 700,
            cursor: creating
              ? 'not-allowed'
              : 'pointer',
          }}
        >
          {creating
            ? 'Creando cita...'
            : '📅 Crear cita de prueba'}
        </button>
      </div>

      {/* RESPUESTA */}

      {result && (
        <div
          style={{
            marginTop: '18px',
            padding: '20px',
            background: '#11151b',
            border: '1px solid #272e38',
            borderRadius: '14px',
          }}
        >
          <div
            style={{
              color: '#737c89',
              fontSize: '11px',
              marginBottom: '10px',
              textTransform: 'uppercase',
              fontWeight: 700,
            }}
          >
            Respuesta API
          </div>

          <pre
            style={{
              margin: 0,
              color: '#bfc6d0',
              fontSize: '12px',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {JSON.stringify(
              result,
              null,
              2
            )}
          </pre>
        </div>
      )}
    </div>
  )
}

export default TestAppointment