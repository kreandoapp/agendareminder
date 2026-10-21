import { useEffect, useState } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import './Hours.css'

const API_URL =
  'https://kreandoapp.com/api/index.php'

const DEFAULT_OPEN_TIME = '09:00'
const DEFAULT_CLOSE_TIME = '20:00'

const WEEK_DAYS = [
  { value: 1, key: 'monday' },
  { value: 2, key: 'tuesday' },
  { value: 3, key: 'wednesday' },
  { value: 4, key: 'thursday' },
  { value: 5, key: 'friday' },
  { value: 6, key: 'saturday' },
  { value: 7, key: 'sunday' },
]

function normalizeTime(time, fallback = '') {
  if (!time) {
    return fallback
  }

  return String(time).slice(0, 5)
}

function createDefaultDays() {
  return WEEK_DAYS.map((day) => ({
    day_of_week: day.value,
    is_open: true,
    open_time: DEFAULT_OPEN_TIME,
    close_time: DEFAULT_CLOSE_TIME,
  }))
}

function normalizeDays(data) {
  const source = Array.isArray(data)
    ? data
    : []

  return WEEK_DAYS.map((day) => {
    const existing = source.find(
      (item) =>
        Number(item.day_of_week) ===
        day.value
    )

    if (!existing) {
      return {
        day_of_week: day.value,
        is_open: true,
        open_time: DEFAULT_OPEN_TIME,
        close_time: DEFAULT_CLOSE_TIME,
      }
    }

    return {
      day_of_week: day.value,

      is_open: Boolean(
        Number(existing.is_open) === 1 ||
        existing.is_open === true
      ),

      open_time: normalizeTime(
        existing.open_time,
        DEFAULT_OPEN_TIME
      ),

      close_time: normalizeTime(
        existing.close_time,
        DEFAULT_CLOSE_TIME
      ),
    }
  })
}

function preparePayload(days) {
  return {
    days: days.map((day) => ({
      day_of_week: Number(
        day.day_of_week
      ),

      is_open: Boolean(
        day.is_open
      ),

      open_time: day.is_open
        ? normalizeTime(
            day.open_time
          )
        : null,

      close_time: day.is_open
        ? normalizeTime(
            day.close_time
          )
        : null,
    })),
  }
}

export default function Hours() {
  const { t } = useLanguage()

  const [days, setDays] =
    useState(createDefaultDays())

  const [
    applyOpenTime,
    setApplyOpenTime,
  ] = useState(
    DEFAULT_OPEN_TIME
  )

  const [
    applyCloseTime,
    setApplyCloseTime,
  ] = useState(
    DEFAULT_CLOSE_TIME
  )

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [
    applyingAll,
    setApplyingAll,
  ] = useState(false)

  const [error, setError] =
    useState('')

  const [success, setSuccess] =
    useState('')

  /*
   * =====================================================
   * TOKEN
   * =====================================================
   */

  const getToken = () => {
    return localStorage.getItem(
      'access_token'
    )
  }

  /*
   * =====================================================
   * NOMBRE DEL DÍA
   * =====================================================
   */

  const getDayName = (dayOfWeek) => {
    const day = WEEK_DAYS.find(
      (item) =>
        item.value ===
        Number(dayOfWeek)
    )

    return day
      ? t(`hours.days.${day.key}`)
      : t('hours.thisDay')
  }

  /*
   * =====================================================
   * VALIDAR HORARIOS
   * =====================================================
   */

  const validateDays = (currentDays) => {
    for (const day of currentDays) {
      if (!day.is_open) {
        continue
      }

      if (
        !day.open_time ||
        !day.close_time
      ) {
        return t(
          'hours.errors.completeDay',
          {
            day: getDayName(
              day.day_of_week
            ),
          }
        )
      }

      if (
        day.open_time >=
        day.close_time
      ) {
        return t(
          'hours.errors.openBeforeClose',
          {
            day: getDayName(
              day.day_of_week
            ),
          }
        )
      }
    }

    return null
  }

  /*
   * =====================================================
   * CARGAR HORARIOS
   * =====================================================
   */

  const loadHours = async () => {
    setLoading(true)
    setError('')

    try {
      const token = getToken()

      if (!token) {
        throw new Error(
          t('hours.errors.sessionExpired')
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
            },
          }
        )

      const result =
        await response.json()

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            t('hours.errors.loadHours')
        )
      }

      const normalized =
        normalizeDays(
          result.data
        )

      setDays(normalized)

      const firstOpenDay =
        normalized.find(
          (day) => day.is_open
        )

      if (firstOpenDay) {
        setApplyOpenTime(
          normalizeTime(
            firstOpenDay.open_time,
            DEFAULT_OPEN_TIME
          )
        )

        setApplyCloseTime(
          normalizeTime(
            firstOpenDay.close_time,
            DEFAULT_CLOSE_TIME
          )
        )
      }
    } catch (err) {
      console.error(
        'Error loading business hours:',
        err
      )

      setError(
        err.message ||
          t('hours.errors.loadHours')
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHours()
  }, [])

  /*
   * =====================================================
   * CAMBIAR APERTURA / CIERRE
   * =====================================================
   */

  const handleTimeChange = (
    dayOfWeek,
    field,
    value
  ) => {
    setSuccess('')
    setError('')

    setDays(
      (currentDays) =>
        currentDays.map((day) =>
          Number(
            day.day_of_week
          ) === Number(dayOfWeek)
            ? {
                ...day,
                [field]: value,
              }
            : day
        )
    )
  }

  /*
   * =====================================================
   * ABRIR / CERRAR DÍA
   * =====================================================
   */

  const handleToggleDay = (
    dayOfWeek
  ) => {
    setSuccess('')
    setError('')

    setDays(
      (currentDays) =>
        currentDays.map((day) =>
          Number(
            day.day_of_week
          ) === Number(dayOfWeek)
            ? {
                ...day,

                is_open:
                  !day.is_open,

                open_time:
                  !day.is_open &&
                  !day.open_time
                    ? DEFAULT_OPEN_TIME
                    : day.open_time,

                close_time:
                  !day.is_open &&
                  !day.close_time
                    ? DEFAULT_CLOSE_TIME
                    : day.close_time,
              }
            : day
        )
    )
  }

  /*
   * =====================================================
   * GUARDAR EN API
   * =====================================================
   */

  const saveDays = async (
    nextDays,
    successMessage
  ) => {
    setError('')

    const validationError =
      validateDays(nextDays)

    if (validationError) {
      setError(validationError)
      return false
    }

    const token = getToken()

    if (!token) {
      setError(
        t('hours.errors.sessionExpiredSave')
      )

      return false
    }

    try {
      const payload =
        preparePayload(nextDays)

      console.log(
        'Guardando horarios:',
        payload
      )

      const response =
        await fetch(
          `${API_URL}?action=business-hours`,
          {
            method: 'PUT',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify(
              payload
            ),
          }
        )

      const result =
        await response.json()

      console.log(
        'Respuesta horarios:',
        result
      )

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            t('hours.errors.saveHours')
        )
      }

      if (
        Array.isArray(
          result.data
        )
      ) {
        const normalized =
          normalizeDays(
            result.data
          )

        setDays(normalized)
      }

      setSuccess(
        successMessage ||
          t('hours.success.saved')
      )

      return true
    } catch (err) {
      console.error(
        'Error saving business hours:',
        err
      )

      setError(
        err.message ||
          t('hours.errors.saveHours')
      )

      return false
    }
  }

  /*
   * =====================================================
   * GUARDAR HORARIOS
   * =====================================================
   */

  const handleSave = async () => {
    setSaving(true)
    setSuccess('')
    setError('')

    try {
      await saveDays(
        days,
        t('hours.success.saved')
      )
    } finally {
      setSaving(false)
    }
  }

  /*
   * =====================================================
   * APLICAR HORARIO A TODOS
   * =====================================================
   */

  const handleApplyToAll =
    async () => {
      setApplyingAll(true)
      setSuccess('')
      setError('')

      try {
        if (
          !applyOpenTime ||
          !applyCloseTime
        ) {
          setError(
            t('hours.errors.selectTimes')
          )

          return
        }

        if (
          applyOpenTime >=
          applyCloseTime
        ) {
          setError(
            t('hours.errors.openBeforeCloseGlobal')
          )

          return
        }

        const nextDays =
          WEEK_DAYS.map((day) => ({
            day_of_week:
              day.value,

            is_open: true,

            open_time:
              normalizeTime(
                applyOpenTime
              ),

            close_time:
              normalizeTime(
                applyCloseTime
              ),
          }))

        setDays(nextDays)

        const saved =
          await saveDays(
            nextDays,
            t('hours.success.appliedToAll')
          )

        if (!saved) {
          await loadHours()
        }
      } finally {
        setApplyingAll(false)
      }
    }

  /*
   * =====================================================
   * LOADING
   * =====================================================
   */

  if (loading) {
    return (
      <div className="hours-page">

        <div className="hours-loading">

          <div className="hours-spinner" />

          <span>
            {t('hours.loading')}
          </span>

        </div>

      </div>
    )
  }

  /*
   * =====================================================
   * UI
   * =====================================================
   */

  return (
    <div className="hours-page">

      {/* =================================================
          HEADER
          ================================================= */}

      <div className="hours-header">

        <div className="hours-heading">

          <div className="hours-eyebrow">
            {t('hours.eyebrow')}
          </div>

          <h1 className="hours-title">

            <span
              className="hours-title-icon"
              aria-hidden="true"
            >
              🕐
            </span>

            <span>
              {t('hours.title')}
            </span>

          </h1>

          <p className="hours-description">
            {t('hours.description')}
          </p>

        </div>

        <button
          type="button"
          className="hours-save-button"
          onClick={handleSave}
          disabled={
            saving ||
            applyingAll
          }
        >
          {saving
            ? t('common.saving')
            : t('hours.saveButton')}
        </button>

      </div>


      {/* =================================================
          MENSAJES
          ================================================= */}

      {error && (
        <div className="hours-message hours-message-error">

          <span>⚠️</span>

          <span>
            {error}
          </span>

        </div>
      )}

      {success && (
        <div className="hours-message hours-message-success">

          <span>✓</span>

          <span>
            {success}
          </span>

        </div>
      )}


      {/* =================================================
          APLICAR A TODOS
          ================================================= */}

      <section className="hours-global-card">

        <div className="hours-global-header">

          <div>

            <h2>
              {t('hours.applyAll.title')}
            </h2>

            <p>
              {t('hours.applyAll.description')}
            </p>

          </div>

          <span className="hours-global-icon">
            📅
          </span>

        </div>


        <div className="hours-global-form">

          <div className="hours-field">

            <label htmlFor="global-open">
              {t('hours.fields.from')}
            </label>

            <input
              id="global-open"
              type="time"
              value={
                applyOpenTime
              }
              onChange={(event) =>
                setApplyOpenTime(
                  event.target.value
                )
              }
              disabled={
                applyingAll ||
                saving
              }
            />

          </div>


          <div className="hours-field">

            <label htmlFor="global-close">
              {t('hours.fields.until')}
            </label>

            <input
              id="global-close"
              type="time"
              value={
                applyCloseTime
              }
              onChange={(event) =>
                setApplyCloseTime(
                  event.target.value
                )
              }
              disabled={
                applyingAll ||
                saving
              }
            />

          </div>


          <button
            type="button"
            className="hours-apply-button"
            onClick={
              handleApplyToAll
            }
            disabled={
              applyingAll ||
              saving
            }
          >
            {applyingAll
              ? t('hours.applyAll.applying')
              : t('hours.applyAll.button')}
          </button>

        </div>

      </section>


      {/* =================================================
          DÍAS
          ================================================= */}

      <section className="hours-days-section">

        <div className="hours-section-header">

          <div>

            <h2>
              {t('hours.weekly.title')}
            </h2>

            <p>
              {t('hours.weekly.description')}
            </p>

          </div>

        </div>


        <div className="hours-days-list">

          {days.map((day) => {

            const dayInfo =
              WEEK_DAYS.find(
                (item) =>
                  item.value ===
                  Number(
                    day.day_of_week
                  )
              )

            return (
              <div
                key={
                  day.day_of_week
                }
                className={`hours-day-card ${
                  day.is_open
                    ? 'is-open'
                    : 'is-closed'
                }`}
              >

                {/* DÍA */}

                <div className="hours-day-info">

                  <div className="hours-day-icon">
                    {day.is_open
                      ? '🟢'
                      : '⚪'}
                  </div>

                  <div>

                    <strong>
                      {dayInfo
                        ? t(
                            `hours.days.${dayInfo.key}`
                          )
                        : ''}
                    </strong>

                    <span>
                      {day.is_open
                        ? t('hours.status.open')
                        : t('hours.status.closed')}
                    </span>

                  </div>

                </div>


                {/* HORARIOS */}

                {day.is_open ? (

                  <div className="hours-day-times">

                    <div className="hours-field">

                      <label>
                        {t('hours.fields.from')}
                      </label>

                      <input
                        type="time"
                        value={normalizeTime(
                          day.open_time,
                          DEFAULT_OPEN_TIME
                        )}
                        onChange={(
                          event
                        ) =>
                          handleTimeChange(
                            day.day_of_week,
                            'open_time',
                            event.target.value
                          )
                        }
                        disabled={
                          saving ||
                          applyingAll
                        }
                      />

                    </div>


                    <span className="hours-separator">
                      →
                    </span>


                    <div className="hours-field">

                      <label>
                        {t('hours.fields.until')}
                      </label>

                      <input
                        type="time"
                        value={normalizeTime(
                          day.close_time,
                          DEFAULT_CLOSE_TIME
                        )}
                        onChange={(
                          event
                        ) =>
                          handleTimeChange(
                            day.day_of_week,
                            'close_time',
                            event.target.value
                          )
                        }
                        disabled={
                          saving ||
                          applyingAll
                        }
                      />

                    </div>

                  </div>

                ) : (

                  <div className="hours-closed-label">
                    {t('hours.closedBusiness')}
                  </div>

                )}


                {/* TOGGLE */}

                <button
                  type="button"
                  className={`hours-toggle ${
                    day.is_open
                      ? 'active'
                      : ''
                  }`}
                  onClick={() =>
                    handleToggleDay(
                      day.day_of_week
                    )
                  }
                  disabled={
                    saving ||
                    applyingAll
                  }
                  aria-label={
                    day.is_open
                      ? t(
                          'hours.aria.closeDay',
                          {
                            day: dayInfo
                              ? t(
                                  `hours.days.${dayInfo.key}`
                                )
                              : '',
                          }
                        )
                      : t(
                          'hours.aria.openDay',
                          {
                            day: dayInfo
                              ? t(
                                  `hours.days.${dayInfo.key}`
                                )
                              : '',
                          }
                        )
                  }
                >

                  <span />

                </button>

              </div>
            )
          })}

        </div>

      </section>

    </div>
  )
}