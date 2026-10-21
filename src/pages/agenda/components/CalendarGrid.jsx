import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import './CalendarGrid.css'
import AppointmentDialog from './AppointmentDialog'

import NoCustomersDialog from './NoCustomersDialog'

import { useLanguage } from '../../../context/LanguageContext'

const API_URL =
  'https://kreandoapp.com/api/index.php'


/* =========================================================
   UTILIDADES
========================================================= */

function startOfDay(date) {
  const d = new Date(date)

  d.setHours(0, 0, 0, 0)

  return d
}


function getLocale(language) {
  const locales = {
    es: 'es-ES',
    en: 'en-US',
    fr: 'fr-FR',
    it: 'it-IT',
    pt: 'pt-PT',
  }

  return locales[language] || 'es-ES'
}


function formatDateTitle(date, language) {
  return date.toLocaleDateString(
    getLocale(language),
    {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }
  )
}


function formatDayName(date, language) {
  return date
    .toLocaleDateString(
      getLocale(language),
      {
        weekday: 'short',
      }
    )
    .replace('.', '')
}


function minutesToTime(minutes) {
  const hours =
    Math.floor(minutes / 60)

  const mins =
    minutes % 60

  return (
    `${String(hours).padStart(2, '0')}:` +
    `${String(mins).padStart(2, '0')}`
  )
}


function timeToMinutes(time) {
  if (!time) {
    return 0
  }

  const parts =
    String(time)
      .slice(0, 5)
      .split(':')

  const hours =
    Number(parts[0] || 0)

  const minutes =
    Number(parts[1] || 0)

  return (
    hours * 60 +
    minutes
  )
}


function isToday(date) {
  const today =
    startOfDay(new Date())

  const current =
    startOfDay(date)

  return (
    today.getTime() ===
    current.getTime()
  )
}


function getWeekDays(date) {
  const current =
    startOfDay(date)

  const day =
    current.getDay()

  const mondayOffset =
    day === 0
      ? -6
      : 1 - day

  current.setDate(
    current.getDate() +
    mondayOffset
  )

  return Array.from(
    { length: 7 },
    (_, index) => {

      const d =
        new Date(current)

      d.setDate(
        current.getDate() +
        index
      )

      return d
    }
  )
}


function getMonthDays(date) {
  const year =
    date.getFullYear()

  const month =
    date.getMonth()

  const firstDay =
    new Date(
      year,
      month,
      1
    )

  const lastDay =
    new Date(
      year,
      month + 1,
      0
    )

  const firstWeekDay =
    firstDay.getDay() === 0
      ? 6
      : firstDay.getDay() - 1

  const days = []


  for (
    let i = 0;
    i < firstWeekDay;
    i++
  ) {

    const d =
      new Date(firstDay)

    d.setDate(
      firstDay.getDate() -
      (firstWeekDay - i)
    )

    days.push(d)
  }


  for (
    let i = 1;
    i <= lastDay.getDate();
    i++
  ) {

    days.push(
      new Date(
        year,
        month,
        i
      )
    )
  }


  while (
    days.length % 7 !== 0
  ) {

    const d =
      new Date(
        days[days.length - 1]
      )

    d.setDate(
      d.getDate() + 1
    )

    days.push(d)
  }

  return days
}


/* =========================================================
   🕐 HORARIOS DEL NEGOCIO
========================================================= */

/*
 * JavaScript:
 *
 * Domingo = 0
 * Lunes   = 1
 * ...
 * Sábado  = 6
 *
 * Nuestra DB:
 *
 * Lunes   = 1
 * ...
 * Sábado  = 6
 * Domingo = 7
 */

function getBusinessDayOfWeek(date) {
  const jsDay =
    date.getDay()

  return jsDay === 0
    ? 7
    : jsDay
}


function getBusinessHoursForDate(
  date,
  businessHours
) {

  if (
    !Array.isArray(
      businessHours
    )
  ) {
    return null
  }

  const dayOfWeek =
    getBusinessDayOfWeek(
      date
    )

  return (
    businessHours.find(
      item =>
        Number(
          item.day_of_week
        ) === dayOfWeek
    ) || null
  )
}


function isBusinessClosed(
  date,
  businessHours
) {

  const hours =
    getBusinessHoursForDate(
      date,
      businessHours
    )

  /*
   * Si todavía no existe configuración,
   * consideramos el día cerrado para
   * no permitir crear citas accidentalmente.
   */

  if (!hours) {
    return true
  }

  return (
    Number(
      hours.is_open
    ) !== 1
  )
}


function isTimeInsideBusinessHours(
  date,
  minutes,
  businessHours
) {

  const hours =
    getBusinessHoursForDate(
      date,
      businessHours
    )

  if (
    !hours ||
    Number(hours.is_open) !== 1
  ) {
    return false
  }

  if (
    !hours.open_time ||
    !hours.close_time
  ) {
    return false
  }

  const openMinutes =
    timeToMinutes(
      hours.open_time
    )

  const closeMinutes =
    timeToMinutes(
      hours.close_time
    )

  return (
    minutes >= openMinutes &&
    minutes < closeMinutes
  )
}


/* =========================================================
   👤 EMPLEADOS
========================================================= */

function getEmployeeName(
  employee,
  fallback = 'Empleado'
) {

  const firstName =
    employee?.first_name || ''

  const lastName =
    employee?.last_name || ''

  return (
    `${firstName} ${lastName}`.trim() ||
    fallback
  )
}


function getEmployeeInitials(employee) {

  const firstName =
    employee?.first_name || ''

  const lastName =
    employee?.last_name || ''

  const first =
    firstName.trim().charAt(0)

  const last =
    lastName.trim().charAt(0)

  const initials =
    `${first}${last}`.toUpperCase()

  return initials || 'EM'
}


function getAppointmentEmployeeInitials(
  appointment
) {

  const firstName =
    appointment?.employee_first_name ||
    ''

  const lastName =
    appointment?.employee_last_name ||
    ''

  const first =
    firstName.trim().charAt(0)

  const last =
    lastName.trim().charAt(0)

  const initials =
    `${first}${last}`.toUpperCase()

  return initials || 'EM'
}


/* =========================================================
   📡 CITAS
========================================================= */

async function fetchAppointments(t) {

  const token =
    localStorage.getItem(
      'access_token'
    )

  if (!token) {
    throw new Error(
      t('calendar.errors.invalidSession')
    )
  }

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

        cache: 'no-store',
      }
    )

  const result =
    await response.json()

  if (
    response.status === 401
  ) {

    throw new Error(
      t('calendar.errors.sessionExpired')
    )
  }

  if (!response.ok) {

    throw new Error(
      result?.message ||
      t('calendar.errors.loadAppointments')
    )
  }

  if (
    Array.isArray(result)
  ) {
    return result
  }

  if (
    Array.isArray(result?.data)
  ) {
    return result.data
  }

  if (
    Array.isArray(
      result?.data?.appointments
    )
  ) {
    return result.data.appointments
  }

  if (
    Array.isArray(
      result?.appointments
    )
  ) {
    return result.appointments
  }

  return []
}


/* =========================================================
   👥 EMPLEADOS API
========================================================= */

async function fetchEmployees(t) {

  const token =
    localStorage.getItem(
      'access_token'
    )

  if (!token) {

    throw new Error(
      t('calendar.errors.invalidSession')
    )
  }

  const response =
    await fetch(
      `${API_URL}?action=employees`,
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
      t('calendar.errors.sessionExpired')
    )
  }

  if (!response.ok) {

    throw new Error(
      result?.message ||
      t('calendar.errors.loadEmployees')
    )
  }

  if (
    Array.isArray(
      result?.data
    )
  ) {

    return result.data
  }

  return []
}


/* =========================================================
   🕐 HORARIO DEL NEGOCIO API
========================================================= */

async function fetchBusinessHours(t) {

  const token =
    localStorage.getItem(
      'access_token'
    )

  if (!token) {

    throw new Error(
      t('calendar.errors.invalidSession')
    )
  }

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

        cache: 'no-store',
      }
    )

  const result =
    await response.json()

  if (
    response.status === 401
  ) {

    throw new Error(
      t('calendar.errors.sessionExpired')
    )
  }

  if (!response.ok) {

    throw new Error(
      result?.message ||
      t('calendar.errors.loadBusinessHours')
    )
  }

  if (
    Array.isArray(
      result?.data
    )
  ) {

    return result.data
  }

  return []
}



/* =========================================================
   👥 CLIENTES API
========================================================= */

async function fetchCustomers(t) {

  const token =
    localStorage.getItem(
      'access_token'
    )

  if (!token) {
    throw new Error(
      t('calendar.errors.invalidSession')
    )
  }

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

  console.log(
    '👥 CLIENTES API:',
    result
  )

  if (
    response.status === 401
  ) {
    throw new Error(
      t('calendar.errors.sessionExpired')
    )
  }

  if (!response.ok) {
    throw new Error(
      result?.message ||
      t('clients.loading.description')
    )
  }

  if (
    Array.isArray(result)
  ) {
    return result
  }

  if (
    Array.isArray(result?.data)
  ) {
    return result.data
  }

  if (
    Array.isArray(
      result?.data?.customers
    )
  ) {
    return result.data.customers
  }

  if (
    Array.isArray(
      result?.customers
    )
  ) {
    return result.customers
  }

  return []
}

/* =========================================================
   CALENDAR
========================================================= */

function CalendarGrid({
  appointments = [],
  onAppointmentClick = () => {},
  onAppointmentCreated = null,
  onNavigateToClients = null,
}) {

  const {
    t,
    language = 'es',
  } = useLanguage()


  const [
    localAppointments,
    setLocalAppointments,
  ] = useState(
    appointments
  )


  const [
    employees,
    setEmployees,
  ] = useState([])


  const [
    businessHours,
    setBusinessHours,
  ] = useState([])


  /*
   * null = Todos
   * number = empleado concreto
   */

  const [
    selectedEmployeeId,
    setSelectedEmployeeId,
  ] = useState(null)


  const [
    employeeFilterOpen,
    setEmployeeFilterOpen,
  ] = useState(false)


  const employeeFilterRef =
    useRef(null)


  /* =====================================================
     📱 MOBILE
  ===================================================== */

  const [
    isMobile,
    setIsMobile,
  ] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia(
        '(max-width: 600px)'
      ).matches
  )


  const [
    view,
    setView,
  ] = useState('day')


  const [
    currentDate,
    setCurrentDate,
  ] = useState(
    startOfDay(new Date())
  )


  const [
    dialogOpen,
    setDialogOpen,
  ] = useState(false)


  const [
    dialogDate,
    setDialogDate,
  ] = useState(null)


  const [
    dialogTime,
    setDialogTime,
  ] = useState(null)


  const [
    dialogEmployeeId,
    setDialogEmployeeId,
  ] = useState(null)


  const [
    refreshing,
    setRefreshing,
  ] = useState(false)


  const [
    employeesLoading,
    setEmployeesLoading,
  ] = useState(true)


  const [
    businessHoursLoading,
    setBusinessHoursLoading,
  ] = useState(true)


  const [
    customersLoading,
    setCustomersLoading,
  ] = useState(true)


 const [
  customers,
  setCustomers,
] = useState([])


  const [
    noCustomersDialogOpen,
    setNoCustomersDialogOpen,
  ] = useState(false)


  /* =====================================================
     📱 DETECTAR MOBILE
  ===================================================== */

  useEffect(() => {

    const mediaQuery =
      window.matchMedia(
        '(max-width: 600px)'
      )

    const handleChange =
      event => {
        setIsMobile(
          event.matches
        )
      }

    setIsMobile(
      mediaQuery.matches
    )

    mediaQuery.addEventListener(
      'change',
      handleChange
    )

    return () => {
      mediaQuery.removeEventListener(
        'change',
        handleChange
      )
    }

  }, [])


  /* =====================================================
     SINCRONIZAR CITAS
  ===================================================== */

  useEffect(() => {

    setLocalAppointments(
      appointments
    )

  }, [appointments])


  /* =====================================================
     CARGAR EMPLEADOS
  ===================================================== */

  useEffect(() => {

    let cancelled = false

    const loadEmployees =
      async () => {

        try {

          setEmployeesLoading(
            true
          )

          const data =
            await fetchEmployees(t)

          if (cancelled) {
            return
          }

          const activeEmployees =
            data.filter(
              employee =>
                Number(
                  employee.is_active
                ) === 1
            )

          setEmployees(
            activeEmployees
          )

        } catch (error) {

          if (cancelled) {
            return
          }

          console.error(
            '❌ ERROR CARGANDO EMPLEADOS:',
            error
          )

          setEmployees([])

        } finally {

          if (!cancelled) {
            setEmployeesLoading(false)
          }

        }
      }

    loadEmployees()

    return () => {
      cancelled = true
    }

  }, [t])


  /* =====================================================
     🕐 CARGAR HORARIOS
  ===================================================== */

  useEffect(() => {

    let cancelled = false

    const loadBusinessHours =
      async () => {

        try {

          setBusinessHoursLoading(
            true
          )

          const data =
            await fetchBusinessHours(t)

          if (cancelled) {
            return
          }

          console.log(
            '🕐 HORARIOS DEL NEGOCIO:',
            data
          )

          setBusinessHours(
            data
          )

        } catch (error) {

          if (cancelled) {
            return
          }

          console.error(
            '❌ ERROR CARGANDO HORARIOS:',
            error
          )

          setBusinessHours([])

        } finally {

          if (!cancelled) {
            setBusinessHoursLoading(
              false
            )
          }

        }
      }

    loadBusinessHours()

    return () => {
      cancelled = true
    }

  }, [t])


  /* =====================================================
     👥 CARGAR CLIENTES
  ===================================================== */

  useEffect(() => {

    let cancelled = false

    const loadCustomers =
      async () => {

        try {

          setCustomersLoading(
            true
          )

          const data =
            await fetchCustomers(t)

          if (cancelled) {
            return
          }

          setCustomers(
          Array.isArray(data)
            ? data
            : []
        )

        } catch (error) {

          if (cancelled) {
            return
          }

          console.error(
            '❌ ERROR CARGANDO CLIENTES:',
            error
          )

          setCustomers([])

        } finally {

          if (!cancelled) {
            setCustomersLoading(false)
          }

        }
      }

    loadCustomers()

    return () => {
      cancelled = true
    }

  }, [t])


  /* =====================================================
     CERRAR SELECTOR DE EMPLEADOS
  ===================================================== */

  useEffect(() => {

    const handlePointerDown = event => {

      if (
        !employeeFilterRef.current?.contains(
          event.target
        )
      ) {
        setEmployeeFilterOpen(false)
      }
    }


    const handleKeyDown = event => {

      if (event.key === 'Escape') {
        setEmployeeFilterOpen(false)
      }
    }


    document.addEventListener(
      'pointerdown',
      handlePointerDown
    )

    document.addEventListener(
      'keydown',
      handleKeyDown
    )


    return () => {

      document.removeEventListener(
        'pointerdown',
        handlePointerDown
      )

      document.removeEventListener(
        'keydown',
        handleKeyDown
      )
    }

  }, [])


  /* =====================================================
     VALIDAR EMPLEADO
  ===================================================== */

  useEffect(() => {

    if (
      employees.length <= 1
    ) {

      setSelectedEmployeeId(
        null
      )

      return
    }

    if (
      selectedEmployeeId !== null &&
      !employees.some(
        employee =>
          Number(employee.id) ===
          Number(selectedEmployeeId)
      )
    ) {

      setSelectedEmployeeId(
        null
      )
    }

  }, [
    employees,
    selectedEmployeeId,
  ])


  /* =====================================================
     📱 MOBILE → UN EMPLEADO
  ===================================================== */

  useEffect(() => {

    if (
      !isMobile ||
      employees.length <= 1
    ) {
      return
    }

    if (
      selectedEmployeeId === null
    ) {

      setSelectedEmployeeId(
        Number(
          employees[0].id
        )
      )
    }

  }, [
    isMobile,
    employees,
    selectedEmployeeId,
  ])


  /* =====================================================
     EMPLEADOS VISIBLES
  ===================================================== */

  const visibleEmployees =
    useMemo(() => {

      if (
        selectedEmployeeId === null
      ) {
        return employees
      }

      return employees.filter(
        employee =>
          Number(employee.id) ===
          Number(selectedEmployeeId)
      )

    }, [
      employees,
      selectedEmployeeId,
    ])


  /* =====================================================
     CITAS FILTRADAS
  ===================================================== */

  const filteredAppointments =
    useMemo(() => {

      if (
        selectedEmployeeId === null
      ) {
        return localAppointments
      }

      return localAppointments.filter(
        appointment =>
          Number(
            appointment.employee_id
          ) ===
          Number(
            selectedEmployeeId
          )
      )

    }, [
      localAppointments,
      selectedEmployeeId,
    ])


  /* =====================================================
     ACTUALIZAR CITAS
  ===================================================== */

  const refreshAppointments =
    async () => {

      setRefreshing(true)

      try {

        const freshAppointments =
          await fetchAppointments(t)

        setLocalAppointments(
          freshAppointments
        )

      } catch (error) {

        console.error(
          '❌ ERROR ACTUALIZANDO AGENDA:',
          error
        )

      } finally {

        setRefreshing(false)
      }
    }


  /* =====================================================
     DÍAS
  ===================================================== */

  const days =
    useMemo(() => {

      if (
        view === 'day'
      ) {
        return [
          currentDate,
        ]
      }

      if (
        view === 'week'
      ) {
        return getWeekDays(
          currentDate
        )
      }

      return getMonthDays(
        currentDate
      )

    }, [
      view,
      currentDate,
    ])


  /* =====================================================
     HOY
  ===================================================== */

  const handleToday = () => {

    setCurrentDate(
      startOfDay(
        new Date()
      )
    )
  }


  /* =====================================================
     ANTERIOR
  ===================================================== */

  const handlePrevious = () => {

    const date =
      new Date(
        currentDate
      )

    if (
      view === 'day'
    ) {
      date.setDate(
        date.getDate() - 1
      )
    }

    if (
      view === 'week'
    ) {
      date.setDate(
        date.getDate() - 7
      )
    }

    if (
      view === 'month'
    ) {
      date.setMonth(
        date.getMonth() - 1
      )
    }

    setCurrentDate(
      date
    )
  }


  /* =====================================================
     SIGUIENTE
  ===================================================== */

  const handleNext = () => {

    const date =
      new Date(
        currentDate
      )

    if (
      view === 'day'
    ) {
      date.setDate(
        date.getDate() + 1
      )
    }

    if (
      view === 'week'
    ) {
      date.setDate(
        date.getDate() + 7
      )
    }

    if (
      view === 'month'
    ) {
      date.setMonth(
        date.getMonth() + 1
      )
    }

    setCurrentDate(
      date
    )
  }


  /* =====================================================
     CLICK FECHA
  ===================================================== */

  const handleDateClick = (
    date
  ) => {

    /*
     * En Mes no permitimos entrar
     * a un día cerrado para crear citas.
     */

    if (
      isBusinessClosed(
        date,
        businessHours
      )
    ) {

      return
    }

    /*
     * El click de fecha no crea directamente
     * una cita. Conservamos el comportamiento
     * actual.
     */

    console.log(
      '📅 FECHA SELECCIONADA:',
      date
    )
  }


  /* =====================================================
     CLICK HORA
  ===================================================== */

  const handleDateTimeClick = async (
  date,
  minutes,
  employeeId = null
) => {

  /* =====================================================
     🔒 NEGOCIO CERRADO
  ===================================================== */

  if (
    isBusinessClosed(
      date,
      businessHours
    )
  ) {
    return
  }


  /* =====================================================
     🔒 FUERA DEL HORARIO
  ===================================================== */

  if (
    !isTimeInsideBusinessHours(
      date,
      minutes,
      businessHours
    )
  ) {
    return
  }


  /* =====================================================
     👥 VALIDAR CLIENTES
     
     IMPORTANTE:
     consultamos la API justo antes de abrir
     AppointmentDialog.
  ===================================================== */

  let currentCustomers = []

  try {

    currentCustomers =
      await fetchCustomers(t)

  } catch (error) {

    console.error(
      '❌ ERROR VALIDANDO CLIENTES:',
      error
    )

    setDialogOpen(false)

    setDialogDate(null)

    setDialogTime(null)

    setDialogEmployeeId(null)

    return
  }


  /* =====================================================
     🚫 NO HAY CLIENTES
  ===================================================== */

  if (
    !Array.isArray(
      currentCustomers
    ) ||
    currentCustomers.length === 0
  ) {

    console.log(
      '🚫 NO HAY CLIENTES → NO ABRIR APPOINTMENT DIALOG'
    )

    setDialogOpen(false)

    setDialogDate(null)

    setDialogTime(null)

    setDialogEmployeeId(null)

    setNoCustomersDialogOpen(true)

    return
  }


  /* =====================================================
     ✅ HAY CLIENTES
  ===================================================== */

  console.log(
    '✅ CLIENTES DISPONIBLES:',
    currentCustomers.length
  )

  setCustomers(
    currentCustomers
  )


  const selectedTime =
    minutesToTime(
      minutes
    )


  setDialogDate(
    date
  )

  setDialogTime(
    selectedTime
  )

  setDialogEmployeeId(
    employeeId
  )

  setNoCustomersDialogOpen(
    false
  )

  setDialogOpen(
    true
  )
}


  /* =====================================================
     CITA CREADA
  ===================================================== */

  const handleAppointmentCreated =
    async () => {

      await refreshAppointments()

      setDialogOpen(
        false
      )

      setDialogDate(
        null
      )

      setDialogTime(
        null
      )

      setDialogEmployeeId(
        null
      )

      if (
        onAppointmentCreated
      ) {

        await onAppointmentCreated()
      }
    }


  /* =====================================================
     CERRAR DIALOG
  ===================================================== */

  const handleCloseDialog = () => {

    setDialogOpen(
      false
    )

    setDialogDate(
      null
    )

    setDialogTime(
      null
    )

    setDialogEmployeeId(
      null
    )
  }


  /* =====================================================
     LOADING
  ===================================================== */

  if (
    employeesLoading ||
    businessHoursLoading ||
    customersLoading
  ) {

    return (

      <div className="calendar-loading">

        <div className="calendar-loading-icon">
          📅
        </div>

        <h2>
          {t('calendar.loading.title')}
        </h2>

        <p>
          {t('calendar.loading.text')}
        </p>

        <div className="calendar-loading-bar">

          <div className="calendar-loading-progress" />

        </div>

        <span>
          {t('calendar.loading.preparing')}
        </span>

      </div>
    )
  }


  /* =====================================================
     RENDER
  ===================================================== */

  return (

    <div className="calendar">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="calendar-header">

        <div className="calendar-navigation">

          <button
            type="button"
            className="calendar-nav-button"
            onClick={
              handlePrevious
            }
            aria-label={t('calendar.previous')}
          >
            ‹
          </button>

          <button
            type="button"
            className="calendar-today-button"
            onClick={
              handleToday
            }
          >
            {t('calendar.today')}
          </button>

          <button
            type="button"
            className="calendar-nav-button"
            onClick={
              handleNext
            }
            aria-label={t('calendar.next')}
          >
            ›
          </button>

        </div>


        <div className="calendar-current-title">

          {
            formatDateTitle(
              currentDate,
              language
            )
          }

        </div>


        <div className="calendar-view-switcher">

          <button
            type="button"
            className={
              view === 'day'
                ? 'active'
                : ''
            }
            onClick={() =>
              setView('day')
            }
          >
            {t('calendar.day')}
          </button>

          <button
            type="button"
            className={
              view === 'week'
                ? 'active'
                : ''
            }
            onClick={() =>
              setView('week')
            }
          >
            {t('calendar.week')}
          </button>

          <button
            type="button"
            className={
              view === 'month'
                ? 'active'
                : ''
            }
            onClick={() =>
              setView('month')
            }
          >
            {t('calendar.month')}
          </button>

        </div>

      </div>


      {/* =================================================
          SELECTOR EMPLEADO
      ================================================= */}

      {!employeesLoading &&
        employees.length > 1 && (

          <div
            className="calendar-employee-filter"
            ref={employeeFilterRef}
          >

            <span className="calendar-employee-filter-label">

              <span
                className="calendar-employee-filter-label-icon"
                aria-hidden="true"
              >
                👤
              </span>

              <span>
                {t('calendar.employees')}
              </span>

            </span>


            <div className="calendar-employee-picker">

              <button
                type="button"
                className={
                  `calendar-employee-picker-trigger ${
                    employeeFilterOpen
                      ? 'open'
                      : ''
                  }`
                }
                aria-haspopup="listbox"
                aria-expanded={
                  employeeFilterOpen
                }
                onClick={() =>
                  setEmployeeFilterOpen(
                    previous => !previous
                  )
                }
              >

                <span className="calendar-employee-picker-current">

                  {selectedEmployeeId === null ? (

                    <span className="calendar-employee-picker-avatar all">
                      👥
                    </span>

                  ) : (

                    (() => {

                      const selectedEmployee =
                        employees.find(
                          employee =>
                            Number(
                              employee.id
                            ) ===
                            Number(
                              selectedEmployeeId
                            )
                        )

                      return (

                        <span
                          className="calendar-employee-picker-avatar"
                          style={{
                            background:
                              selectedEmployee?.color ||
                              '#3B82F6',
                          }}
                        >
                          {
                            getEmployeeInitials(
                              selectedEmployee
                            )
                          }
                        </span>

                      )
                    })()

                  )}


                  <span className="calendar-employee-picker-text">

                    <strong>
                      {
                        selectedEmployeeId === null
                          ? t('calendar.allEmployees')
                          : getEmployeeName(
                              employees.find(
                                employee =>
                                  Number(
                                    employee.id
                                  ) ===
                                  Number(
                                    selectedEmployeeId
                                  )
                              ),
                              t('calendar.employee')
                            )
                      }
                    </strong>

                    <small>
                      {
                        selectedEmployeeId === null
                          ? t('calendar.employeesCount')
                              .replace(
                                '{count}',
                                String(
                                  employees.length
                                )
                              )
                          : t('calendar.selectedEmployee')
                      }
                    </small>

                  </span>

                </span>


                <span
                  className="calendar-employee-picker-chevron"
                  aria-hidden="true"
                >
                  ⌄
                </span>

              </button>


              {employeeFilterOpen && (

                <div
                  className="calendar-employee-picker-menu"
                  role="listbox"
                  aria-label={
                    t('calendar.selectEmployee')
                  }
                >

                  <div className="calendar-employee-picker-heading">

                    <span>
                      {t('calendar.employeesHeading')}
                    </span>

                    <span>
                      {employees.length}
                    </span>

                  </div>


                  <button
                    type="button"
                    role="option"
                    aria-selected={
                      selectedEmployeeId === null
                    }
                    className={
                      `calendar-employee-option ${
                        selectedEmployeeId === null
                          ? 'selected'
                          : ''
                      }`
                    }
                    onClick={() => {

                      setSelectedEmployeeId(
                        null
                      )

                      setEmployeeFilterOpen(
                        false
                      )
                    }}
                  >

                    <span className="calendar-employee-option-avatar all">
                      👥
                    </span>

                    <span className="calendar-employee-option-info">

                      <strong>
                        {t('calendar.allEmployees')}
                      </strong>

                      <small>
                        {
                          t('calendar.employeesCount')
                            .replace(
                              '{count}',
                              String(
                                employees.length
                              )
                            )
                        }
                      </small>

                    </span>

                    <span className="calendar-employee-option-check">
                      {
                        selectedEmployeeId === null
                          ? '✓'
                          : ''
                      }
                    </span>

                  </button>


                  <div className="calendar-employee-options-divider" />


                  {employees.map(
                    employee => {

                      const selected =
                        Number(
                          selectedEmployeeId
                        ) ===
                        Number(
                          employee.id
                        )

                      const employeeColor =
                        employee.color ||
                        '#3B82F6'


                      return (

                        <button
                          type="button"
                          role="option"
                          aria-selected={
                            selected
                          }
                          key={
                            employee.id
                          }
                          className={
                            `calendar-employee-option ${
                              selected
                                ? 'selected'
                                : ''
                            }`
                          }
                          onClick={() => {

                            setSelectedEmployeeId(
                              Number(
                                employee.id
                              )
                            )

                            setEmployeeFilterOpen(
                              false
                            )
                          }}
                        >

                          <span
                            className="calendar-employee-option-avatar"
                            style={{
                              background:
                                employeeColor,
                              boxShadow:
                                `0 0 0 3px ${employeeColor}22`,
                            }}
                          >
                            {
                              getEmployeeInitials(
                                employee
                              )
                            }
                          </span>


                          <span className="calendar-employee-option-info">

                            <strong>
                              {
                                getEmployeeName(
                                  employee,
                                  t('calendar.employee')
                                )
                              }
                            </strong>

                            <small>
                              {
                                employee.start_time
                                  ? String(
                                      employee.start_time
                                    ).slice(0, 5)
                                  : '--:--'
                              }
                              {' – '}
                              {
                                employee.end_time
                                  ? String(
                                      employee.end_time
                                    ).slice(0, 5)
                                  : '--:--'
                              }
                            </small>

                          </span>


                          <span className="calendar-employee-option-check">
                            {
                              selected
                                ? '✓'
                                : ''
                            }
                          </span>

                        </button>
                      )
                    }
                  )}

                </div>
              )}

            </div>

          </div>
        )}


      {/* =================================================
          CALENDARIO
      ================================================= */}

      {view === 'month' ? (

        <MonthGrid
          days={days}
          appointments={
            filteredAppointments
          }
          businessHours={
            businessHours
          }
          onDateClick={
            handleDateClick
          }
          onAppointmentClick={
            onAppointmentClick
          }
          language={
            language
          }
          t={
            t
          }
        />

      ) : view === 'day' ? (

        <EmployeeDayGrid
          day={
            currentDate
          }
          employees={
            visibleEmployees
          }
          appointments={
            filteredAppointments
          }
          businessHours={
            businessHours
          }
          onDateTimeClick={
            handleDateTimeClick
          }
          onAppointmentClick={
            onAppointmentClick
          }
          t={
            t
          }
        />

      ) : (

        <TimeGrid
          days={days}
          appointments={
            filteredAppointments
          }
          businessHours={
            businessHours
          }
          onDateTimeClick={
            handleDateTimeClick
          }
          onAppointmentClick={
            onAppointmentClick
          }
          language={
            language
          }
          t={
            t
          }
        />

      )}


      {/* =================================================
          ACTUALIZANDO
      ================================================= */}

      {refreshing && (

        <div className="calendar-refresh-indicator">
          🔄 {t('calendar.refreshing')}
        </div>

      )}


      {/* =================================================
          DIALOG
      ================================================= */}

    <NoCustomersDialog
    open={noCustomersDialogOpen}
    onClose={() =>
      setNoCustomersDialogOpen(false)
    }
    onGoToCustomers={() => {
      setNoCustomersDialogOpen(false)

      if (onNavigateToClients) {
        onNavigateToClients()
      }
    }}
  />

      <AppointmentDialog
        open={
          dialogOpen &&
          customers.length > 0
        }

        date={
          dialogDate
        }

        time={
          dialogTime
        }

        initialEmployeeId={
          dialogEmployeeId
        }

        onClose={
          handleCloseDialog
        }

        onCreated={
          handleAppointmentCreated
        }
      />

    </div>
  )
}


/* =========================================================
   👥 EMPLOYEE DAY GRID
========================================================= */

function EmployeeDayGrid({
  day,
  employees,
  appointments,
  businessHours,
  onDateTimeClick,
  onAppointmentClick,
  t,
}) {

  const slots = []

  const dayHours =
    getBusinessHoursForDate(
      day,
      businessHours
    )


  if (
    dayHours &&
    Number(
      dayHours.is_open
    ) === 1 &&
    dayHours.open_time &&
    dayHours.close_time
  ) {

    const openingMinutes =
      timeToMinutes(
        dayHours.open_time
      )

    const closingMinutes =
      timeToMinutes(
        dayHours.close_time
      )

    for (
      let minutes = openingMinutes;
      minutes < closingMinutes;
      minutes += 30
    ) {

      slots.push(
        minutes
      )
    }
  }


  if (
    employees.length === 0
  ) {

    return (

      <div className="employee-day-grid empty">

        <div className="employee-day-empty">

          👥

          <strong>
            {t('calendar.empty.noEmployees')}
          </strong>

          <span>
            {t('calendar.empty.addEmployee')}
          </span>

        </div>

      </div>
    )
  }


  /* =====================================================
     NEGOCIO CERRADO
  ===================================================== */

  if (
    slots.length === 0
  ) {

    return (

      <div className="employee-day-grid empty">

        <div className="employee-day-empty">

          <span className="business-closed-lock">
            🔒
          </span>

          <strong>
            {t('calendar.closed.title')}
          </strong>

          <span>
            {t('calendar.closed.description')}
          </span>

        </div>

      </div>
    )
  }


  return (

    <div className="employee-day-grid">

      <div
        className="employee-day-header"
        style={{
          '--employee-count':
            employees.length,
        }}
      >

        <div className="employee-time-header" />

        {employees.map(
          employee => (

            <EmployeeHeader
              key={
                employee.id
              }
              employee={
                employee
              }
              t={
                t
              }
            />

          )
        )}

      </div>


      <div
        className="employee-day-body"
        style={{
          '--employee-count':
            employees.length,
        }}
      >

        <div className="employee-time-axis">

          {slots.map(
            minutes => (

              <div
                key={
                  minutes
                }
                className="employee-time-label"
              >
                {
                  minutesToTime(
                    minutes
                  )
                }
              </div>

            )
          )}

        </div>


        {employees.map(
          employee => (

            <EmployeeDayColumn
              key={
                employee.id
              }
              day={
                day
              }
              employee={
                employee
              }
              slots={
                slots
              }
              appointments={
                appointments
              }
              businessStartMinutes={
                timeToMinutes(
                  dayHours.open_time
                )
              }
              onDateTimeClick={
                onDateTimeClick
              }
              onAppointmentClick={
                onAppointmentClick
              }
              t={
                t
              }
            />

          )
        )}

      </div>

    </div>
  )
}


/* =========================================================
   👤 EMPLOYEE HEADER
========================================================= */

function EmployeeHeader({
  employee,
  t,
}) {

  const name =
    getEmployeeName(
      employee,
      t('calendar.employee')
    )

  const initials =
    getEmployeeInitials(
      employee
    )

  const color =
    employee.color ||
    '#3B82F6'

  const startTime =
    employee.start_time
      ? String(
          employee.start_time
        ).slice(0, 5)
      : '--:--'

  const endTime =
    employee.end_time
      ? String(
          employee.end_time
        ).slice(0, 5)
      : '--:--'


  return (

    <div className="employee-column-header">

      <div
        className="employee-column-avatar"
        style={{
          background:
            color,
          boxShadow:
            `0 0 0 4px ${color}22`,
        }}
      >
        {
          initials
        }
      </div>


      <div className="employee-column-info">

        <strong>
          {
            name
          }
        </strong>

        <span>
          {
            startTime
          }
          {' – '}
          {
            endTime
          }
        </span>

      </div>


      <span className="employee-column-status">
        {t('calendar.active')}
      </span>

    </div>
  )
}


/* =========================================================
   👤 EMPLOYEE DAY COLUMN
========================================================= */

function EmployeeDayColumn({
  day,
  employee,
  slots,
  appointments,
  businessStartMinutes,
  onDateTimeClick,
  onAppointmentClick,
  t,
}) {

  const dayAppointments =
    appointments.filter(
      appointment => {

        if (
          !appointment.appointment_date
        ) {
          return false
        }

        const appointmentDate =
          String(
            appointment.appointment_date
          ).slice(0, 10)

        const year =
          day.getFullYear()

        const month =
          String(
            day.getMonth() + 1
          ).padStart(2, '0')

        const dayNumber =
          String(
            day.getDate()
          ).padStart(2, '0')

        const sameDate =
          appointmentDate ===
          `${year}-${month}-${dayNumber}`

        const sameEmployee =
          Number(
            appointment.employee_id
          ) ===
          Number(
            employee.id
          )

        return (
          sameDate &&
          sameEmployee
        )
      }
    )


  return (

    <div
      className="employee-day-column"
      data-employee-id={
        employee.id
      }
    >

      {slots.map(
        minutes => (

          <button
            type="button"
            key={
              minutes
            }
            className="employee-time-cell"
            onClick={() =>
              onDateTimeClick(
                day,
                minutes,
                employee.id
              )
            }
          />

        )
      )}


      {dayAppointments.map(
        appointment => {

          const appointmentMinutes =
            timeToMinutes(
              appointment.appointment_time
            )

          const pixelsPer30Minutes =
            56

          const serviceDuration =
            Number(
              appointment.service_duration
            ) || 30

          const top =
            (
              (
                appointmentMinutes -
                businessStartMinutes
              ) /
              30
            ) *
            pixelsPer30Minutes

          const height =
            (
              serviceDuration / 30
            ) *
            pixelsPer30Minutes - 6

          const employeeColor =
            appointment.employee_color ||
            employee.color ||
            '#3B82F6'

          const initials =
            getAppointmentEmployeeInitials(
              appointment
            )


          return (

            <button
              type="button"
              key={
                appointment.id
              }
              className="appointment-card"
              style={{
                top:
                  `${top + 3}px`,

                height:
                  `${Math.max(
                    height,
                    38
                  )}px`,
              }}
              onClick={event => {

                event.stopPropagation()

                onAppointmentClick(
                  appointment
                )

              }}
            >

              <div className="appointment-employee">

                <span
                  className="appointment-employee-avatar"
                  style={{
                    backgroundColor:
                      employeeColor,
                  }}
                >
                  {
                    initials
                  }
                </span>

                <strong>
                  {
                    appointment.customer_name ||
                    appointment.full_name ||
                    appointment.customer?.full_name ||
                    t('calendar.customer')
                  }
                </strong>

              </div>

              <span>
                {
                  appointment
                    .appointment_time
                    ?.slice(0, 5)
                }
              </span>

            </button>
          )
        }
      )}

    </div>
  )
}


/* =========================================================
   TIME GRID — SEMANA
========================================================= */

function TimeGrid({
  days,
  appointments,
  businessHours,
  onDateTimeClick,
  onAppointmentClick,
  language,
  t,
}) {

  const slots = []

  for (
    let minutes = 8 * 60;
    minutes < 24 * 60;
    minutes += 30
  ) {

    slots.push(
      minutes
    )
  }


  return (

    <div
      className="time-grid"
      style={{
        '--day-count':
          days.length,
      }}
    >

      <div className="time-grid-header">

        <div className="time-axis-header" />

        {days.map(
          day => {

            const closed =
              isBusinessClosed(
                day,
                businessHours
              )

            return (

              <div
                key={
                  day.toISOString()
                }
                className={
                  [
                    'day-header',
                    isToday(day)
                      ? 'today'
                      : '',
                    closed
                      ? 'business-closed-header'
                      : '',
                  ]
                    .filter(Boolean)
                    .join(' ')
                }
              >

                <span className="day-header-name">
                  {
                    formatDayName(
                      day,
                      language
                    )
                  }
                </span>

                <span className="day-header-number">
                  {
                    day.getDate()
                  }
                </span>

                {closed && (
                  <span className="business-closed-label">
                    {t('calendar.closed.short')}
                  </span>
                )}

              </div>
            )
          }
        )}

      </div>


      <div className="time-grid-body">

        <div className="time-axis">

          {slots.map(
            minutes => (

              <div
                key={
                  minutes
                }
                className="time-label"
              >
                {
                  minutesToTime(
                    minutes
                  )
                }
              </div>

            )
          )}

        </div>


        {days.map(
          day => (

            <DayColumn
              key={
                day.toISOString()
              }
              day={
                day
              }
              slots={
                slots
              }
              appointments={
                appointments
              }
              businessHours={
                businessHours
              }
              onDateTimeClick={
                onDateTimeClick
              }
              onAppointmentClick={
                onAppointmentClick
              }
              t={
                t
              }
            />

          )
        )}

      </div>

    </div>
  )
}


/* =========================================================
   DAY COLUMN — SEMANA
========================================================= */

function DayColumn({
  day,
  slots,
  appointments,
  businessHours,
  onDateTimeClick,
  onAppointmentClick,
  t,
}) {

  const closed =
    isBusinessClosed(
      day,
      businessHours
    )


  const dayAppointments =
    appointments.filter(
      appointment => {

        if (
          !appointment.appointment_date
        ) {
          return false
        }

        const appointmentDate =
          String(
            appointment.appointment_date
          ).slice(0, 10)

        const year =
          day.getFullYear()

        const month =
          String(
            day.getMonth() + 1
          ).padStart(2, '0')

        const dayNumber =
          String(
            day.getDate()
          ).padStart(2, '0')

        return (
          appointmentDate ===
          `${year}-${month}-${dayNumber}`
        )
      }
    )


  return (

    <div
      className={
        closed
          ? 'day-column business-closed-column'
          : 'day-column'
      }
    >

      {slots.map(
        minutes => {

          const available =
            !closed &&
            isTimeInsideBusinessHours(
              day,
              minutes,
              businessHours
            )

          return (

            <button
              type="button"
              key={
                minutes
              }
              className={
                available
                  ? 'time-cell'
                  : 'time-cell business-closed-cell'
              }
              disabled={
                !available
              }
              onClick={() => {

                if (!available) {
                  return
                }

                onDateTimeClick(
                  day,
                  minutes
                )
              }}
            />

          )
        }
      )}


      {closed && (

        <div className="business-closed-overlay">

          <span className="business-closed-lock">
            🔒
          </span>

          <strong>
            {t('calendar.closed.title')}
          </strong>

        </div>

      )}


      {dayAppointments.map(
        appointment => {

          const appointmentMinutes =
            timeToMinutes(
              appointment.appointment_time
            )

          const calendarStart =
            8 * 60

          const pixelsPer30Minutes =
            56

          const serviceDuration =
            Number(
              appointment.service_duration
            ) || 30

          const top =
            (
              (
                appointmentMinutes -
                calendarStart
              ) /
              30
            ) *
            pixelsPer30Minutes

          const height =
            (
              serviceDuration / 30
            ) *
            pixelsPer30Minutes - 6

          const employeeInitials =
            getAppointmentEmployeeInitials(
              appointment
            )

          const employeeColor =
            appointment.employee_color ||
            '#3B82F6'


          return (

            <button
              type="button"
              key={
                appointment.id
              }
              className="appointment-card"
              style={{
                top:
                  `${top + 3}px`,

                height:
                  `${Math.max(
                    height,
                    38
                  )}px`,
              }}
              onClick={event => {

                event.stopPropagation()

                onAppointmentClick(
                  appointment
                )

              }}
            >

              <div className="appointment-employee">

                <span
                  className="appointment-employee-avatar"
                  style={{
                    backgroundColor:
                      employeeColor,
                  }}
                >
                  {
                    employeeInitials
                  }
                </span>

                <strong>
                  {
                    appointment.customer_name ||
                    appointment.full_name ||
                    appointment.customer?.full_name ||
                    t('calendar.customer')
                  }
                </strong>

              </div>

              <span>
                {
                  appointment
                    .appointment_time
                    ?.slice(0, 5)
                }
              </span>

            </button>
          )
        }
      )}

    </div>
  )
}


/* =========================================================
   MONTH
========================================================= */

function MonthGrid({
  days,
  appointments,
  businessHours,
  onDateClick,
  onAppointmentClick,
  language,
  t,
}) {

  const weekdays = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ]


  return (

    <div className="month-grid">

      {weekdays.map(
        day => (

          <div
            key={
              day
            }
            className="month-weekday"
          >
            {
              t(
                `calendar.weekdays.${day}`
              )
            }
          </div>

        )
      )}


      {days.map(
        day => {

          const year =
            day.getFullYear()

          const month =
            String(
              day.getMonth() + 1
            ).padStart(2, '0')

          const dayNumber =
            String(
              day.getDate()
            ).padStart(2, '0')

          const dateString =
            `${year}-${month}-${dayNumber}`


          const closed =
            isBusinessClosed(
              day,
              businessHours
            )


          const dayAppointments =
            appointments.filter(
              appointment =>
                String(
                  appointment.appointment_date
                ).slice(0, 10) ===
                dateString
            )


          return (

            <button
              type="button"
              key={
                day.toISOString()
              }
              className={
                [
                  'month-cell',
                  isToday(day)
                    ? 'today'
                    : '',
                  closed
                    ? 'business-closed-month'
                    : '',
                ]
                  .filter(Boolean)
                  .join(' ')
              }
              onClick={() => {

                if (closed) {
                  return
                }

                onDateClick(
                  day
                )

              }}
              disabled={
                closed
              }
            >

              <span className="month-day-number">
                {
                  day.getDate()
                }
              </span>


              {closed && (

                <span className="month-closed-label">
                  🔒 {t('calendar.closed.short')}
                </span>

              )}


              {dayAppointments.map(
                appointment => (

                  <span
                    key={
                      appointment.id
                    }
                    className="month-appointment"
                    onClick={event => {

                      event.stopPropagation()

                      onAppointmentClick(
                        appointment
                      )

                    }}
                  >

                    {
                      appointment.customer_name ||
                      appointment.full_name ||
                      appointment.customer?.full_name ||
                      t('calendar.customer')
                    }

                  </span>

                )
              )}

            </button>
          )
        }
      )}

    </div>
  )
}


export default CalendarGrid