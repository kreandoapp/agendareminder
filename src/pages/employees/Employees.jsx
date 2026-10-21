import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import './Employees.css'

import {
  useLanguage,
} from '../../context/LanguageContext'


const API_URL =
  'https://kreandoapp.com/api/index.php'


function Employees() {

  const { t } = useLanguage()


  const [
    employees,
    setEmployees,
  ] = useState([])


  const [
    employeeIdsWithAppointments,
    setEmployeeIdsWithAppointments,
  ] = useState(new Set())


  const [
    loading,
    setLoading,
  ] = useState(true)


  const [
    saving,
    setSaving,
  ] = useState(false)


  const [
    error,
    setError,
  ] = useState('')


  const [
    search,
    setSearch,
  ] = useState('')


  const [
    dialogOpen,
    setDialogOpen,
  ] = useState(false)


  const [
    deleteDialogOpen,
    setDeleteDialogOpen,
  ] = useState(false)


  const [
    editingEmployee,
    setEditingEmployee,
  ] = useState(null)


  const [
    deletingEmployee,
    setDeletingEmployee,
  ] = useState(null)


  const [
    businessHours,
    setBusinessHours,
  ] = useState([])


  const [
    form,
    setForm,
  ] = useState({
    first_name: '',
    last_name: '',
    employee_phone: '',
    color: '#22C55E',
    start_time: '09:00',
    end_time: '18:00',
    is_active: true,
  })


  // =====================================================
  // TOKEN
  // =====================================================

  const getToken = () => {

    return localStorage.getItem(
      'access_token'
    )

  }


  // =====================================================
  // CARGAR EMPLEADOS
  // =====================================================

  const loadEmployees = async () => {

    const token =
      getToken()


    if (!token) {

      setError(
        t(
          'employees.errors.invalidSession'
        )
      )

      setLoading(false)

      return
    }


    try {

      setLoading(true)
      setError('')


      const [
        employeesResponse,
        appointmentsResponse,
        businessHoursResponse,
      ] =
        await Promise.all([
          fetch(
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
          ),

          fetch(
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
          ),

          fetch(
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
          ),
        ])


      const employeesResult =
        await employeesResponse.json()


      const appointmentsResult =
        await appointmentsResponse.json()

      const businessHoursResult =
        await businessHoursResponse.json()


      if (
        employeesResponse.status === 401 ||
        appointmentsResponse.status === 401 ||
        businessHoursResponse.status === 401
      ) {

        setError(
          t(
            'employees.errors.sessionExpired'
          )
        )

        return
      }


      if (
        !employeesResponse.ok ||
        !employeesResult.success
      ) {

        throw new Error(
          employeesResult.message ||
            t(
              'employees.errors.loadEmployees'
            )
        )

      }


      if (
        !appointmentsResponse.ok ||
        !appointmentsResult.success
      ) {

        throw new Error(
          appointmentsResult.message ||
            'No se pudieron cargar las citas'
        )

      }


      if (
        !businessHoursResponse.ok ||
        !businessHoursResult.success
      ) {

        throw new Error(
          businessHoursResult.message ||
            'No se pudieron cargar los horarios del negocio'
        )

      }


      const businessHoursData =
        Array.isArray(
          businessHoursResult.data
        )
          ? businessHoursResult.data
          : []


      setBusinessHours(
        businessHoursData
      )


      const employeesData =
        Array.isArray(
          employeesResult.data
        )
          ? employeesResult.data
          : []


      const appointmentsData =
        Array.isArray(
          appointmentsResult.data
        )
          ? appointmentsResult.data
          : []


      const employeeIds =
        new Set(
          appointmentsData
            .map(
              (appointment) =>
                Number(
                  appointment?.employee_id
                )
            )
            .filter(
              (employeeId) =>
                Number.isFinite(
                  employeeId
                ) &&
                employeeId > 0
            )
        )


      setEmployees(
        employeesData
      )


      setEmployeeIdsWithAppointments(
        employeeIds
      )

    } catch (err) {

      console.error(
        '❌ Error cargando empleados/citas:',
        err
      )


      setError(
        err.message ||
          t(
            'employees.errors.loadEmployees'
          )
      )

    } finally {

      setLoading(false)

    }

  }


  useEffect(() => {

    loadEmployees()

  }, [])


  // =====================================================
  // BÚSQUEDA
  // =====================================================

  const filteredEmployees =
    useMemo(() => {

      const value =
        search
          .trim()
          .toLowerCase()


      if (!value) {

        return employees

      }


      return employees.filter(
        (employee) => {

          const firstName =
            employee.first_name || ''


          const lastName =
            employee.last_name || ''


          const phone =
            employee.employee_phone || ''


          return (
            firstName
              .toLowerCase()
              .includes(value) ||

            lastName
              .toLowerCase()
              .includes(value) ||

            `${firstName} ${lastName}`
              .toLowerCase()
              .includes(value) ||

            phone
              .toLowerCase()
              .includes(value)
          )

        }
      )

    }, [
      employees,
      search,
    ])


  // =====================================================
  // HORARIOS SEMANALES
  // =====================================================

  const dayKeys = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ]

  const getDayName = (dayOfWeek) => {
    const dayKey =
      dayKeys[Number(dayOfWeek) - 1]

    return dayKey
      ? t(`hours.days.${dayKey}`)
      : ''
  }

  const getBusinessHour = (dayOfWeek) => {
    return (
      businessHours.find(
        (day) =>
          Number(day?.day_of_week) ===
          Number(dayOfWeek)
      ) || null
    )
  }


  const isBusinessDayOpen = (dayOfWeek) => {
    const businessDay =
      getBusinessHour(dayOfWeek)

    return Boolean(
      businessDay &&
      (
        Number(businessDay.is_open) === 1 ||
        businessDay.is_open === true
      ) &&
      businessDay.open_time &&
      businessDay.close_time
    )
  }


  const normalizeTime = (value) => {
    if (!value) {
      return ''
    }

    return String(value).substring(0, 5)
  }


  const timeToMinutes = (value) => {
    if (!value) {
      return null
    }

    const [
      hours,
      minutes,
    ] = String(value)
      .substring(0, 5)
      .split(':')
      .map(Number)

    if (
      !Number.isFinite(hours) ||
      !Number.isFinite(minutes)
    ) {
      return null
    }

    return (
      hours * 60 +
      minutes
    )
  }


  const minutesToTime = (minutes) => {
    const hours =
      Math.floor(minutes / 60)

    const remainingMinutes =
      minutes % 60

    return [
      String(hours).padStart(2, '0'),
      String(remainingMinutes).padStart(2, '0'),
    ].join(':')
  }


  const formatTime = (value) => {
    if (!value) {
      return ''
    }

    const [
      hours,
      minutes,
    ] = value.split(':').map(Number)

    if (
      !Number.isFinite(hours) ||
      !Number.isFinite(minutes)
    ) {
      return value
    }

    const suffix =
      hours >= 12
        ? 'p.m.'
        : 'a.m.'

    const displayHour =
      hours % 12 || 12

    return `${String(displayHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${suffix}`
  }


  const getTimeOptions = (
    dayOfWeek,
    type,
    currentValue,
    startValue
  ) => {
    const businessDay =
      getBusinessHour(dayOfWeek)

    if (
      !businessDay ||
      !isBusinessDayOpen(dayOfWeek)
    ) {
      return []
    }

    const openTime =
      normalizeTime(
        businessDay.open_time
      )

    const closeTime =
      normalizeTime(
        businessDay.close_time
      )

    const openMinutes =
      timeToMinutes(openTime)

    const closeMinutes =
      timeToMinutes(closeTime)

    if (
      openMinutes === null ||
      closeMinutes === null ||
      openMinutes >= closeMinutes
    ) {
      return []
    }

    let minMinutes =
      openMinutes

    if (
      type === 'end' &&
      startValue
    ) {
      const startMinutes =
        timeToMinutes(startValue)

      if (
        startMinutes !== null
      ) {
        minMinutes =
          Math.max(
            openMinutes,
            startMinutes + 30
          )
      }
    }

    const options = []

    for (
      let minutes = minMinutes;
      minutes <= closeMinutes;
      minutes += 30
    ) {
      options.push(
        minutesToTime(minutes)
      )
    }

    if (
      currentValue &&
      timeToMinutes(currentValue) >= minMinutes &&
      timeToMinutes(currentValue) <= closeMinutes &&
      !options.includes(currentValue)
    ) {
      options.push(currentValue)
    }

    return options.sort()
  }


  const normalizeWorkingHours = (
    workingHours
  ) => {
    const sourceHours =
      Array.isArray(workingHours)
        ? workingHours
        : []

    return dayKeys.map((_, index) => {
      const dayOfWeek =
        index + 1

      const existing =
        sourceHours.find(
          (day) =>
            Number(day?.day_of_week) ===
            dayOfWeek
        )

      const businessDay =
        getBusinessHour(
          dayOfWeek
        )

      const businessOpen =
        isBusinessDayOpen(
          dayOfWeek
        )

      return {
        day_of_week:
          dayOfWeek,

        start_time:
          businessOpen
            ? normalizeTime(
                existing?.start_time
              ) ||
              normalizeTime(
                businessDay?.open_time
              )
            : '',

        end_time:
          businessOpen
            ? normalizeTime(
                existing?.end_time
              ) ||
              normalizeTime(
                businessDay?.close_time
              )
            : '',

        is_active:
          businessOpen &&
          existing
            ? Number(
                existing.is_active
              ) === 1
            : businessOpen,
      }
    })
  }


  const updateWorkingHour = (
    dayOfWeek,
    field,
    value
  ) => {
    setForm((current) => ({
      ...current,
      working_hours: current.working_hours.map(
        (day) => {
          if (
            Number(day.day_of_week) !==
            Number(dayOfWeek)
          ) {
            return day
          }

          if (
            field === 'start_time'
          ) {
            const nextEnd =
              timeToMinutes(
                day.end_time
              )

            const nextStart =
              timeToMinutes(value)

            if (
              nextStart !== null &&
              nextEnd !== null &&
              nextEnd <= nextStart
            ) {
              const businessDay =
                getBusinessHour(
                  dayOfWeek
                )

              const closeTime =
                normalizeTime(
                  businessDay?.close_time
                )

              const closeMinutes =
                timeToMinutes(
                  closeTime
                )

              const newEndMinutes =
                nextStart + 30

              return {
                ...day,
                start_time:
                  value,
                end_time:
                  newEndMinutes <= closeMinutes
                    ? minutesToTime(
                        newEndMinutes
                      )
                    : closeTime,
              }
            }
          }

          if (
            field === 'end_time'
          ) {
            const nextStart =
              timeToMinutes(
                day.start_time
              )

            const nextEnd =
              timeToMinutes(value)

            if (
              nextStart !== null &&
              nextEnd !== null &&
              nextEnd <= nextStart
            ) {
              return day
            }
          }

          return {
            ...day,
            [field]: value,
          }
        }
      ),
    }))

    setError('')
  }

  // =====================================================
  // FORMULARIO
  // =====================================================

  const updateForm =
    (field, value) => {

      setForm(
        (current) => ({
          ...current,
          [field]: value,
        })
      )


      setError('')

    }


  // =====================================================
  // NUEVO EMPLEADO
  // =====================================================

  const openCreateDialog = () => {

    setEditingEmployee(null)


    setForm({
      first_name: '',
      last_name: '',
      employee_phone: '',
      color: '#22C55E',
      start_time: '09:00',
      end_time: '18:00',
      is_active: true,
    })


    setError('')
    setDialogOpen(true)

  }


  // =====================================================
  // EDITAR EMPLEADO
  // =====================================================

  const openEditDialog =
    (employee) => {

      setEditingEmployee(
        employee
      )


      setForm({

        first_name:
          employee.first_name ||
          '',

        last_name:
          employee.last_name ||
          '',

        employee_phone:
          employee.employee_phone ||
          '',

        color:
          employee.color ||
          '#22C55E',

        start_time:
          employee.start_time
            ? employee.start_time.substring(
                0,
                5
              )
            : '09:00',

        end_time:
          employee.end_time
            ? employee.end_time.substring(
                0,
                5
              )
            : '18:00',

        working_hours:
          normalizeWorkingHours(
            employee.working_hours
          ),

        is_active:
          Number(
            employee.is_active
          ) === 1,

      })


      setError('')
      setDialogOpen(true)

    }


  // =====================================================
  // CERRAR DIÁLOGO
  // =====================================================

  const closeDialog = () => {

    if (saving) {

      return

    }


    setDialogOpen(false)
    setEditingEmployee(null)
    setError('')

  }


  // =====================================================
  // TELÉFONO
  // =====================================================

  const handlePhoneChange =
    (value) => {

      const onlyNumbers =
        value.replace(
          /\D/g,
          ''
        )


      updateForm(
        'employee_phone',
        onlyNumbers
      )

    }


  // =====================================================
  // COLOR
  // =====================================================

  const colorPresets = [

    '#22C55E',
    '#3B82F6',
    '#8B5CF6',
    '#EC4899',
    '#F97316',
    '#EAB308',
    '#14B8A6',
    '#06B6D4',
    '#EF4444',
    '#64748B',

  ]


  // =====================================================
  // GUARDAR
  // =====================================================

  const saveEmployee =
    async () => {

      const token =
        getToken()


      if (!token) {

        setError(
          t(
            'employees.errors.invalidSession'
          )
        )

        return

      }


      if (
        !form.first_name.trim()
      ) {

        setError(
          t(
            'employees.errors.firstNameRequired'
          )
        )

        return

      }


      if (
        !form.last_name.trim()
      ) {

        setError(
          t(
            'employees.errors.lastNameRequired'
          )
        )

        return

      }


      const isEditing =
        editingEmployee !== null


      if (!isEditing) {

        if (!form.start_time) {

          setError(
            t(
              'employees.errors.startTimeRequired'
            )
          )

          return

        }


        if (!form.end_time) {

          setError(
            t(
              'employees.errors.endTimeRequired'
            )
          )

          return

        }


        if (
          form.start_time >=
          form.end_time
        ) {

          setError(
            t(
              'employees.errors.endTimeAfterStart'
            )
          )

          return

        }

      } else {

        if (
          !Array.isArray(form.working_hours) ||
          form.working_hours.length !== 7
        ) {

          setError(
            'Debes configurar los 7 días de la semana.'
          )

          return

        }


        for (const day of form.working_hours) {

          if (!day.is_active) {
            continue
          }

          if (
            !day.start_time ||
            !day.end_time
          ) {

            setError(
              `Completa el horario del ${
                getDayName(
                  day.day_of_week
                ).toLowerCase()
              }.`
            )

            return

          }

          if (
            day.start_time >=
            day.end_time
          ) {

            setError(
              `La hora de fin debe ser posterior a la hora de inicio del ${
                getDayName(
                  day.day_of_week
                ).toLowerCase()
              }.`
            )

            return

          }

        }

      }


      try {

        setSaving(true)
        setError('')


        const url =
          isEditing
            ? `${API_URL}?action=employee&id=${editingEmployee.id}`
            : `${API_URL}?action=employee`


        const response =
          await fetch(
            url,
            {

              method:
                isEditing
                  ? 'PUT'
                  : 'POST',

              headers: {

                Authorization:
                  `Bearer ${token}`,

                Accept:
                  'application/json',

                'Content-Type':
                  'application/json',

              },

              body:
                JSON.stringify({

                  first_name:
                    form.first_name.trim(),

                  last_name:
                    form.last_name.trim(),

                  color:
                    form.color,

                  start_time:
                    form.start_time,

                  end_time:
                    form.end_time,

                  ...(isEditing
                    ? {
                        working_hours:
                          form.working_hours.map(
                            (day) => ({
                              day_of_week:
                                Number(day.day_of_week),
                              start_time:
                                day.is_active
                                  ? day.start_time
                                  : null,
                              end_time:
                                day.is_active
                                  ? day.end_time
                                  : null,
                              is_active:
                                Boolean(day.is_active),
                            })
                          ),
                      }
                    : {}),

                  employee_phone:
                    form.employee_phone.trim() ||
                    null,

                  is_active:
                    form.is_active,

                }),

            }
          )


        const result =
          await response.json()


        if (
          response.status === 401
        ) {

          throw new Error(
            t(
              'employees.errors.sessionExpired'
            )
          )

        }


        if (
          !response.ok ||
          !result.success
        ) {

          throw new Error(
            result.message ||
              t(
                'employees.errors.saveEmployee'
              )
          )

        }


        setDialogOpen(false)
        setEditingEmployee(null)


        await loadEmployees()

      } catch (err) {

        console.error(
          '❌ Error guardando empleado:',
          err
        )


        setError(
          err.message ||
            t(
              'employees.errors.saveEmployee'
            )
        )

      } finally {

        setSaving(false)

      }

    }


  // =====================================================
  // ELIMINAR
  // =====================================================

  const openDeleteDialog =
    (employee) => {

      if (
        employeeIdsWithAppointments.has(
          Number(employee?.id)
        )
      ) {

        return

      }


      setDeletingEmployee(
        employee
      )

      setDeleteDialogOpen(
        true
      )

      setError('')

    }


  const closeDeleteDialog =
    () => {

      if (saving) {

        return

      }


      setDeleteDialogOpen(
        false
      )

      setDeletingEmployee(
        null
      )

      setError('')

    }


  const deleteEmployee =
    async () => {

      const token =
        getToken()


      if (
        !token ||
        !deletingEmployee
      ) {

        return

      }


      if (
        employeeIdsWithAppointments.has(
          Number(deletingEmployee.id)
        )
      ) {

        return

      }


      try {

        setSaving(true)
        setError('')


        const response =
          await fetch(
            `${API_URL}?action=employee&id=${deletingEmployee.id}`,
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
            t(
              'employees.errors.sessionExpired'
            )
          )

        }


        if (
          !response.ok ||
          !result.success
        ) {

          throw new Error(
            result.message ||
              t(
                'employees.errors.deleteEmployee'
              )
          )

        }


        setDeleteDialogOpen(
          false
        )

        setDeletingEmployee(
          null
        )


        await loadEmployees()

      } catch (err) {

        console.error(
          '❌ Error eliminando empleado:',
          err
        )


        setError(
          err.message ||
            t(
              'employees.errors.deleteEmployee'
            )
        )

      } finally {

        setSaving(false)

      }

    }


  // =====================================================
  // ACTIVAR / DESACTIVAR
  // =====================================================

  const toggleEmployee =
    async (employee) => {

      const token =
        getToken()


      if (!token) {

        return

      }


      const currentActive =
        Number(
          employee.is_active
        ) === 1


      try {

        setSaving(true)
        setError('')


        const response =
          await fetch(
            `${API_URL}?action=employee&id=${employee.id}`,
            {

              method: 'PATCH',

              headers: {

                Authorization:
                  `Bearer ${token}`,

                Accept:
                  'application/json',

                'Content-Type':
                  'application/json',

              },

              body:
                JSON.stringify({

                  is_active:
                    !currentActive,

                }),

            }
          )


        const result =
          await response.json()


        if (
          response.status === 401
        ) {

          throw new Error(
            t(
              'employees.errors.sessionExpired'
            )
          )

        }


        if (
          !response.ok ||
          !result.success
        ) {

          throw new Error(
            result.message ||
              t(
                'employees.errors.toggleStatus'
              )
          )

        }


        await loadEmployees()

      } catch (err) {

        console.error(
          '❌ Error cambiando estado:',
          err
        )


        setError(
          err.message ||
            t(
              'employees.errors.toggleStatus'
            )
        )

      } finally {

        setSaving(false)

      }

    }


  // =====================================================
  // HELPERS
  // =====================================================

  const getEmployeeName =
    (employee) => {

      const first =
        employee.first_name ||
        ''


      const last =
        employee.last_name ||
        ''


      const full =
        `${first} ${last}`.trim()


      return (
        full ||
        t(
          'employees.noName'
        )
      )

    }


  const getInitials =
    (name) => {

      const parts =
        name
          .trim()
          .split(/\s+/)
          .filter(Boolean)


      if (
        parts.length === 0
      ) {

        return '?'

      }


      if (
        parts.length === 1
      ) {

        return parts[0]
          .substring(
            0,
            2
          )
          .toUpperCase()

      }


      return (
        parts[0][0] +
        parts[
          parts.length - 1
        ][0]
      ).toUpperCase()

    }


  // =====================================================
  // RENDER
  // =====================================================

  return (

    <div className="employees-page">

      {/* =================================================
          CABECERA
      ================================================= */}

      <div className="employees-header">

        <div className="employees-heading">

          <div className="employees-eyebrow">
            {t('employees.eyebrow')}
          </div>

          <h1 className="employees-title">

            <span
              className="employees-title-icon"
              aria-hidden="true"
            >
              👤
            </span>

            <span>
              {t('employees.title')}
            </span>

          </h1>

          <p className="employees-description">
            {t(
              'employees.description'
            )}
          </p>

        </div>


        <button
          type="button"
          className="employees-primary-button"
          onClick={
            openCreateDialog
          }
        >

          <span>
            ＋
          </span>

          {t(
            'employees.newEmployee'
          )}

        </button>

      </div>


      {/* =================================================
          ERROR
      ================================================= */}

      {error &&
        !dialogOpen &&
        !deleteDialogOpen && (

          <div className="employees-error">

            ⚠️ {error}

          </div>

        )}


      {/* =================================================
          BÚSQUEDA
      ================================================= */}

      <div className="employees-search-wrapper">

        <input
          value={search}
          onChange={
            (event) =>
              setSearch(
                event.target.value
              )
          }
          placeholder={
            t(
              'employees.searchPlaceholder'
            )
          }
          className="employees-search"
        />

      </div>


      {/* =================================================
          TABLA
      ================================================= */}

      <div className="employees-table">

        {loading ? (

          <div className="employees-state">

            {t(
              'employees.loading'
            )}

          </div>

        ) : filteredEmployees.length === 0 ? (

          <div className="employees-empty">

            <div className="employees-empty-icon">
              👥
            </div>


            <div className="employees-empty-title">

              {search
                ? t(
                    'employees.empty.searchTitle'
                  )
                : t(
                    'employees.empty.title'
                  )}

            </div>


            <div className="employees-empty-text">

              {search
                ? t(
                    'employees.empty.searchText'
                  )
                : t(
                    'employees.empty.text'
                  )}

            </div>


            {!search && (

              <button
                type="button"
                onClick={
                  openCreateDialog
                }
                className="employees-primary-button"
              >

                +
                {' '}
                {t(
                  'employees.createEmployee'
                )}

              </button>

            )}

          </div>

        ) : (

          <>

            {/* CABECERA */}

            <div className="employees-table-header">

              <div>
                {t(
                  'employees.table.employee'
                )}
              </div>

              <div>
                {t(
                  'employees.table.schedule'
                )}
              </div>

              <div>
                {t(
                  'employees.table.status'
                )}
              </div>

              <div>
                {t(
                  'employees.table.actions'
                )}
              </div>

            </div>


            {/* FILAS */}

            {filteredEmployees.map(
              (employee) => {

                const name =
                  getEmployeeName(
                    employee
                  )


                const active =
                  Number(
                    employee.is_active
                  ) === 1


                const employeeColor =
                  employee.color ||
                  '#22C55E'


                return (

                  <div
                    key={
                      employee.id
                    }
                    className="employees-table-row"
                  >

                    {/* EMPLEADO */}

                    <div className="employee-person">

                      <div
                        className="employee-avatar"
                        style={{
                          background:
                            employeeColor,

                          boxShadow:
                            `0 0 0 3px ${employeeColor}22`,
                        }}
                      >

                        {
                          getInitials(
                            name
                          )
                        }

                      </div>


                      <div>

                        <div className="employee-name">

                          {name}

                        </div>


                        <div className="employee-phone">

                          {employee.employee_phone
                            ? employee.employee_phone
                            : t(
                                'employees.noPhone'
                              )}

                        </div>

                      </div>

                    </div>


                    {/* HORARIO */}

                    <div className="employee-schedule">

                      <div>
                        {employee.working_hours &&
                        employee.working_hours.length > 0
                          ? `${employee.working_hours.filter(
                              (day) =>
                                Number(day.is_active) === 1
                            ).length} días`
                          : employee.start_time
                            ? `${employee.start_time.substring(0, 5)} — ${employee.end_time.substring(0, 5)}`
                            : '--:--'}
                      </div>

                    </div>


                    {/* ESTADO */}

                    <div>

                      <button
                        type="button"
                        className={
                          `employee-status ${
                            active
                              ? 'active'
                              : 'inactive'
                          }`
                        }
                        onClick={() =>
                          toggleEmployee(
                            employee
                          )
                        }
                        disabled={
                          saving
                        }
                      >

                        {active
                          ? t(
                              'employees.status.active'
                            )
                          : t(
                              'employees.status.inactive'
                            )}

                      </button>

                    </div>


                    {/* ACCIONES */}

                    <div className="employee-actions">

                      <button
                        type="button"
                        title={
                          t(
                            'common.edit'
                          )
                        }
                        aria-label={
                          t(
                            'common.edit'
                          )
                        }
                        onClick={() =>
                          openEditDialog(
                            employee
                          )
                        }
                        className="employee-action edit"
                      >
                        ✏️
                      </button>


                      <button
                        type="button"
                        title={
                          employeeIdsWithAppointments.has(
                            Number(employee.id)
                          )
                            ? 'No se puede eliminar: este empleado tiene citas'
                            : t(
                                'common.delete'
                              )
                        }
                        aria-label={
                          employeeIdsWithAppointments.has(
                            Number(employee.id)
                          )
                            ? 'No se puede eliminar: este empleado tiene citas'
                            : t(
                                'common.delete'
                              )
                        }
                        disabled={
                          employeeIdsWithAppointments.has(
                            Number(employee.id)
                          )
                        }
                        onClick={() =>
                          openDeleteDialog(
                            employee
                          )
                        }
                        className={
                          `employee-action delete ${
                            employeeIdsWithAppointments.has(
                              Number(employee.id)
                            )
                              ? 'disabled'
                              : ''
                          }`
                        }
                      >
                        🗑️
                      </button>

                    </div>

                  </div>

                )

              }
            )}


            <div className="employees-footer">

              {t(
                'employees.footer.showing',
                {
                  shown:
                    filteredEmployees.length,

                  total:
                    employees.length,
                }
              )}

            </div>

          </>

        )}

      </div>


      {/* =================================================
          DIÁLOGO CREAR / EDITAR
      ================================================= */}

      {dialogOpen && (

        <div
          className="employees-dialog-overlay"
          onMouseDown={
            (event) => {

              if (
                event.target ===
                event.currentTarget
              ) {

                closeDialog()

              }

            }
          }
        >

          <div className="employees-dialog">

            {/* HEADER */}

            <div className="employees-dialog-header">

              <div>

                <h2>

                  {editingEmployee
                    ? t(
                        'employees.dialog.editTitle'
                      )
                    : t(
                        'employees.dialog.createTitle'
                      )}

                </h2>


                <p>

                  {editingEmployee
                    ? t(
                        'employees.dialog.editDescription'
                      )
                    : t(
                        'employees.dialog.createDescription'
                      )}

                </p>

              </div>


              <button
                type="button"
                onClick={
                  closeDialog
                }
                disabled={
                  saving
                }
                className="employees-dialog-close"
                aria-label={
                  t(
                    'common.close'
                  )
                }
              >
                ×
              </button>

            </div>


            {/* BODY */}

            <div className="employees-dialog-body">

              {error && (

                <div className="employees-dialog-error">

                  ⚠️ {error}

                </div>

              )}


              {/* NOMBRE */}

              <div className="employees-form-grid">

                <div className="employees-field">

                  <label>
                    {t(
                      'employees.fields.firstName'
                    )}
                    {' '}
                    *
                  </label>


                  <input
                    value={
                      form.first_name
                    }
                    onChange={
                      (event) =>
                        updateForm(
                          'first_name',
                          event.target.value
                        )
                    }
                    placeholder={
                      t(
                        'employees.fields.firstNamePlaceholder'
                      )
                    }
                    disabled={
                      saving
                    }
                    autoFocus
                  />

                </div>


                <div className="employees-field">

                  <label>
                    {t(
                      'employees.fields.lastName'
                    )}
                    {' '}
                    *
                  </label>


                  <input
                    value={
                      form.last_name
                    }
                    onChange={
                      (event) =>
                        updateForm(
                          'last_name',
                          event.target.value
                        )
                    }
                    placeholder={
                      t(
                        'employees.fields.lastNamePlaceholder'
                      )
                    }
                    disabled={
                      saving
                    }
                  />

                </div>

              </div>


              {/* TELÉFONO */}

              <div className="employees-field">

                <label>
                  {t(
                    'employees.fields.phone'
                  )}
                </label>


                <input
                  value={
                    form.employee_phone
                  }
                  onChange={
                    (event) =>
                      handlePhoneChange(
                        event.target.value
                      )
                  }
                  placeholder={
                    t(
                      'employees.fields.phonePlaceholder'
                    )
                  }
                  inputMode="numeric"
                  pattern="[0-9]*"
                  disabled={
                    saving
                  }
                />


                <small>
                  {t(
                    'employees.fields.phoneHelp'
                  )}
                </small>

              </div>


              {/* HORARIOS */}

              {!editingEmployee ? (

                <div className="employees-form-grid">

                  <div className="employees-field">

                    <label>
                      {t(
                        'employees.fields.startTime'
                      )}
                      {' '}
                      *
                    </label>

                    <input
                      type="time"
                      value={form.start_time}
                      onChange={
                        (event) =>
                          updateForm(
                            'start_time',
                            event.target.value
                          )
                      }
                      disabled={saving}
                    />

                  </div>


                  <div className="employees-field">

                    <label>
                      {t(
                        'employees.fields.endTime'
                      )}
                      {' '}
                      *
                    </label>

                    <input
                      type="time"
                      value={form.end_time}
                      onChange={
                        (event) =>
                          updateForm(
                            'end_time',
                            event.target.value
                          )
                      }
                      disabled={saving}
                    />

                  </div>

                </div>

              ) : (

                <div className="employees-weekly-schedule">

                  <div className="employees-weekly-schedule-title">
                    {t('hours.weekly.title')}
                  </div>

                  {form.working_hours.map(
                    (day) => {

                      const dayIndex =
                        Number(day.day_of_week) - 1

                      return (

                        <div
                          key={day.day_of_week}
                          className={
                            `employees-weekly-row ${
                              !isBusinessDayOpen(
                                day.day_of_week
                              )
                                ? 'inactive'
                                : ''
                            }`
                          }
                        >

                          <button
                            type="button"
                            className={
                              `employees-weekly-day-toggle ${
                                day.is_active
                                  ? 'active'
                                  : ''
                              }`
                            }
                            onClick={() =>
                              updateWorkingHour(
                                day.day_of_week,
                                'is_active',
                                !day.is_active
                              )
                            }
                            disabled={
                              saving ||
                              !isBusinessDayOpen(
                                day.day_of_week
                              )
                            }
                            aria-label={
                              day.is_active
                                ? `Desactivar ${getDayName(day.day_of_week)}`
                                : `Activar ${getDayName(day.day_of_week)}`
                            }
                          >
                            <span className="employees-weekly-day-toggle-thumb" />
                          </button>

                          <div className="employees-weekly-day-name">
                            {getDayName(day.day_of_week)}
                          </div>

                          {(() => {
                            const startOptions =
                              getTimeOptions(
                                day.day_of_week,
                                'start',
                                day.start_time,
                                ''
                              )

                            const endOptions =
                              getTimeOptions(
                                day.day_of_week,
                                'end',
                                day.end_time,
                                day.start_time
                              )

                            const businessOpen =
                              isBusinessDayOpen(
                                day.day_of_week
                              )

                            if (!businessOpen) {
                              return (
                                <span className="employees-weekly-closed">
                                  {t('hours.status.closed')}
                                </span>
                              )
                            }

                            return (
                              <>
                                <select
                                  value={
                                    day.start_time || ''
                                  }
                                  onChange={
                                    (event) =>
                                      updateWorkingHour(
                                        day.day_of_week,
                                        'start_time',
                                        event.target.value
                                      )
                                  }
                                  disabled={
                                    saving ||
                                    !day.is_active ||
                                    !businessOpen
                                  }
                                >
                                  {startOptions.map(
                                    (time) => (
                                      <option
                                        key={time}
                                        value={time}
                                      >
                                        {formatTime(time)}
                                      </option>
                                    )
                                  )}
                                </select>

                                <span>—</span>

                                <select
                                  value={
                                    day.end_time || ''
                                  }
                                  onChange={
                                    (event) =>
                                      updateWorkingHour(
                                        day.day_of_week,
                                        'end_time',
                                        event.target.value
                                      )
                                  }
                                  disabled={
                                    saving ||
                                    !day.is_active ||
                                    !businessOpen
                                  }
                                >
                                  {endOptions.map(
                                    (time) => (
                                      <option
                                        key={time}
                                        value={time}
                                      >
                                        {formatTime(time)}
                                      </option>
                                    )
                                  )}
                                </select>
                              </>
                            )
                          })()}

                        </div>

                      )

                    }
                  )}

                </div>

              )}

              {/* COLOR */}

              <div className="employees-field">

                <label>
                  {t(
                    'employees.fields.color'
                  )}
                </label>


                <div className="employees-color-row">

                  <input
                    type="color"
                    value={
                      form.color
                    }
                    onChange={
                      (event) =>
                        updateForm(
                          'color',
                          event.target.value.toUpperCase()
                        )
                    }
                    className="employees-color-picker"
                    disabled={
                      saving
                    }
                  />


                  <input
                    type="text"
                    value={
                      form.color
                    }
                    onChange={
                      (event) => {

                        const value =
                          event.target.value


                        if (
                          /^#[0-9A-Fa-f]{0,6}$/.test(
                            value
                          )
                        ) {

                          updateForm(
                            'color',
                            value.toUpperCase()
                          )

                        }

                      }
                    }
                    maxLength={7}
                    className="employees-color-input"
                    disabled={
                      saving
                    }
                  />


                  <div
                    className="employees-color-preview"
                    style={{
                      background:
                        form.color,
                    }}
                  />

                </div>


                <div className="employees-color-presets">

                  {colorPresets.map(
                    (color) => (

                      <button
                        key={color}
                        type="button"
                        title={color}
                        onClick={() =>
                          updateForm(
                            'color',
                            color
                          )
                        }
                        disabled={
                          saving
                        }
                        className={
                          `employees-color-preset ${
                            form.color.toUpperCase() ===
                            color.toUpperCase()
                              ? 'selected'
                              : ''
                          }`
                        }
                        style={{
                          background:
                            color,
                        }}
                      />

                    )
                  )}

                </div>


                <small>
                  {t(
                    'employees.fields.colorHelp'
                  )}
                </small>

              </div>


              {/* ESTADO */}

              <div className="employees-field">

                <label>
                  {t(
                    'employees.fields.status'
                  )}
                </label>


                <button
                  type="button"
                  className={
                    `employees-toggle ${
                      form.is_active
                        ? 'active'
                        : ''
                    }`
                  }
                  onClick={() =>
                    updateForm(
                      'is_active',
                      !form.is_active
                    )
                  }
                  disabled={
                    saving
                  }
                >

                  <span className="employees-toggle-track">

                    <span className="employees-toggle-thumb" />

                  </span>


                  <span>

                    {form.is_active
                      ? t(
                          'employees.form.active'
                        )
                      : t(
                          'employees.form.inactive'
                        )}

                  </span>

                </button>

              </div>

            </div>


            {/* FOOTER */}

            <div className="employees-dialog-footer">

              <button
                type="button"
                onClick={
                  closeDialog
                }
                disabled={
                  saving
                }
                className="employees-secondary-button"
              >

                {t(
                  'common.cancel'
                )}

              </button>


              <button
                type="button"
                onClick={
                  saveEmployee
                }
                disabled={
                  saving ||
                  !form.first_name.trim() ||
                  !form.last_name.trim() ||
                  !form.start_time ||
                  !form.end_time ||
                  !/^#[0-9A-Fa-f]{6}$/.test(
                    form.color
                  )
                }
                className="employees-save-button"
              >

                {saving

                  ? t(
                      'common.saving'
                    )

                  : editingEmployee

                    ? t(
                        'employees.dialog.saveChanges'
                      )

                    : t(
                        'employees.dialog.createEmployee'
                      )}

              </button>

            </div>

          </div>

        </div>

      )}


      {/* =================================================
          DIÁLOGO ELIMINAR
      ================================================= */}

      {deleteDialogOpen &&
        deletingEmployee && (

          <div
            className="employees-dialog-overlay"
            onMouseDown={
              (event) => {

                if (
                  event.target ===
                  event.currentTarget
                ) {

                  closeDeleteDialog()

                }

              }
            }
          >

            <div className="employees-delete-dialog">

              <div className="employees-delete-icon">
                🗑️
              </div>


              <h2>
                {t(
                  'employees.deleteDialog.title'
                )}
              </h2>


              <p>

                {t(
                  'employees.deleteDialog.question'
                )}

                {' '}

                <strong>
                  {
                    getEmployeeName(
                      deletingEmployee
                    )
                  }
                </strong>

                ?

                <br />

                {t(
                  'employees.deleteDialog.warning'
                )}

              </p>


              {error && (

                <div className="employees-dialog-error">

                  ⚠️ {error}

                </div>

              )}


              <div className="employees-delete-actions">

                <button
                  type="button"
                  onClick={
                    closeDeleteDialog
                  }
                  disabled={
                    saving
                  }
                  className="employees-secondary-button"
                >

                  {t(
                    'common.cancel'
                  )}

                </button>


                <button
                  type="button"
                  onClick={
                    deleteEmployee
                  }
                  disabled={
                    saving
                  }
                  className="employees-delete-button"
                >

                  {saving
                    ? t(
                        'employees.deleteDialog.deleting'
                      )
                    : t(
                        'common.delete'
                      )}

                </button>

              </div>

            </div>

          </div>

        )}

    </div>

  )

}


export default Employees