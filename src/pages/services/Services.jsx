import { useEffect, useMemo, useState } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import './Services.css'

const API_URL =
  'https://kreandoapp.com/api/index.php'

function Services() {
  const { t } = useLanguage()

  const [services, setServices] = useState([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [currencySymbol, setCurrencySymbol] = useState('€')

  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] =
    useState(false)

  const [editingService, setEditingService] =
    useState(null)

  const [deletingService, setDeletingService] =
    useState(null)

  const [form, setForm] = useState({
    service_name: '',
    service_description: '',
    service_duration: '',
    service_price: '',
    service_color: '#3B82F6',
    is_active: true,
  })

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
  // TOKEN
  // =====================================================

  const getToken = () => {
    return localStorage.getItem('access_token')
  }

  // =====================================================
  // CARGAR SERVICIOS
  // =====================================================

  const loadServices = async () => {
    const token = getToken()

    if (!token) {
      setError(t('services.errors.invalidSession'))
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError('')

      const response = await fetch(
        `${API_URL}?action=services`,
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

      if (response.status === 401) {
        setError(t('services.errors.sessionExpired'))
        return
      }

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            t('services.errors.loadServices')
        )
      }

      setServices(result.data || [])
    } catch (err) {
      console.error(
        '❌ Error cargando servicios:',
        err
      )

      setError(
        err.message ||
          t('services.errors.loadServices')
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadServices()
    loadCurrency()
  }, [])

  const loadCurrency = async () => {
    const token = getToken()

    if (!token) {
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

      const result = await response.json()

      if (!response.ok || !result.success) {
        return
      }

      setCurrencySymbol(
        result.data?.currency_symbol || '€'
      )
    } catch (err) {
      console.error(
        '❌ Error cargando moneda:',
        err
      )
    }
  }

  // =====================================================
  // BÚSQUEDA
  // =====================================================

  const filteredServices = useMemo(() => {
    const value =
      search.trim().toLowerCase()

    if (!value) {
      return services
    }

    return services.filter((service) => {
      const name =
        service.service_name || ''

      const description =
        service.service_description || ''

      return (
        name.toLowerCase().includes(value) ||
        description
          .toLowerCase()
          .includes(value)
      )
    })
  }, [services, search])

  // =====================================================
  // FORMULARIO
  // =====================================================

  const updateForm = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))

    setError('')
  }

  // =====================================================
  // NUEVO
  // =====================================================

  const openCreateDialog = () => {
    setEditingService(null)

    setForm({
      service_name: '',
      service_description: '',
      service_duration: '',
      service_price: '',
      service_color: '#3B82F6',
      is_active: true,
    })

    setError('')
    setDialogOpen(true)
  }

  // =====================================================
  // EDITAR
  // =====================================================

  const openEditDialog = (service) => {
    setEditingService(service)

    setForm({
      service_name:
        service.service_name || '',

      service_description:
        service.service_description || '',

      service_duration:
        String(
          service.service_duration || 60
        ),

      service_price:
        service.service_price !== null &&
        service.service_price !== undefined
          ? String(service.service_price)
          : '',

      service_color:
        service.service_color ||
        '#3B82F6',

      is_active:
        Number(service.is_active) === 1,
    })

    setError('')
    setDialogOpen(true)
  }

  // =====================================================
  // CERRAR
  // =====================================================

  const closeDialog = () => {
    if (saving) {
      return
    }

    setDialogOpen(false)
    setEditingService(null)
    setError('')
  }

  // =====================================================
  // GUARDAR
  // =====================================================

  const saveService = async () => {
    const token = getToken()

    if (!token) {
      setError(t('services.errors.invalidSession'))
      return
    }

    if (!form.service_name.trim()) {
      setError(
        t('services.errors.nameRequired')
      )
      return
    }

    const duration = Number(
      form.service_duration
    )

    if (
      !Number.isInteger(duration) ||
      duration <= 0
    ) {
      setError(
        t('services.errors.durationInvalid')
      )
      return
    }

    if (
      form.service_price !== '' &&
      Number(form.service_price) < 0
    ) {
      setError(
        t('services.errors.priceNegative')
      )
      return
    }

    if (
      !/^#[0-9A-Fa-f]{6}$/.test(
        form.service_color
      )
    ) {
      setError(
        t('services.errors.colorInvalid')
      )
      return
    }

    try {
      setSaving(true)
      setError('')

      const isEditing =
        editingService !== null

      const url = isEditing
        ? `${API_URL}?action=service&id=${editingService.id}`
        : `${API_URL}?action=service`

      const response = await fetch(
        url,
        {
          method: isEditing
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

          body: JSON.stringify({
            service_name:
              form.service_name.trim(),

            service_description:
              form.service_description.trim() ||
              null,

            service_duration:
              duration,

            service_price:
              form.service_price === ''
                ? null
                : Number(
                    form.service_price
                  ),

            service_color:
              form.service_color,

            is_active:
              form.is_active,
          }),
        }
      )

      const result =
        await response.json()

      if (response.status === 401) {
        throw new Error(
          t('services.errors.sessionExpired')
        )
      }

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            t('services.errors.saveService')
        )
      }

      setDialogOpen(false)
      setEditingService(null)

      await loadServices()
    } catch (err) {
      console.error(
        '❌ Error guardando servicio:',
        err
      )

      setError(
        err.message ||
          t('services.errors.saveService')
      )
    } finally {
      setSaving(false)
    }
  }

  // =====================================================
  // ELIMINAR
  // =====================================================

  const openDeleteDialog = (service) => {
    setDeletingService(service)
    setDeleteDialogOpen(true)
    setError('')
  }

  const closeDeleteDialog = () => {
    if (saving) {
      return
    }

    setDeleteDialogOpen(false)
    setDeletingService(null)
    setError('')
  }

  const deleteService = async () => {
    const token = getToken()

    if (!token || !deletingService) {
      return
    }

    try {
      setSaving(true)
      setError('')

      const response = await fetch(
        `${API_URL}?action=service&id=${deletingService.id}`,
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
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            t('services.errors.deleteService')
        )
      }

      setDeleteDialogOpen(false)
      setDeletingService(null)

      await loadServices()
    } catch (err) {
      console.error(
        '❌ Error eliminando servicio:',
        err
      )

      setError(
        err.message ||
          t('services.errors.deleteService')
      )
    } finally {
      setSaving(false)
    }
  }

  // =====================================================
  // ACTIVAR / DESACTIVAR
  // =====================================================

  const toggleService = async (service) => {
    const token = getToken()

    if (!token) {
      return
    }

    const currentActive =
      Number(service.is_active) === 1

    try {
      setSaving(true)
      setError('')

      const response = await fetch(
        `${API_URL}?action=service&id=${service.id}`,
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

          body: JSON.stringify({
            is_active:
              !currentActive,
          }),
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
            t('services.errors.toggleStatus')
        )
      }

      await loadServices()
    } catch (err) {
      console.error(
        '❌ Error cambiando estado:',
        err
      )

      setError(
        err.message ||
          t('services.errors.toggleStatus')
      )
    } finally {
      setSaving(false)
    }
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="services-page">

      {/* HEADER */}

      <div className="services-header">

        <div className="services-heading">

          <div className="services-eyebrow">
            {t('services.eyebrow')}
          </div>

          <h1 className="services-title">

            <span
              className="services-title-icon"
              aria-hidden="true"
            >
              💼
            </span>

            <span>
              {t('services.title')}
            </span>

          </h1>

          <p className="services-description">
            {t('services.description')}
          </p>

        </div>

        <button
          type="button"
          className="services-primary-button"
          onClick={openCreateDialog}
        >
          <span>＋</span>
          {t('services.newService')}
        </button>

      </div>

      {/* ERROR */}

      {error &&
        !dialogOpen &&
        !deleteDialogOpen && (
          <div className="services-error">
            ⚠️ {error}
          </div>
        )}

      {/* SEARCH */}

      <div className="services-search-wrapper">

        <input
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value
            )
          }
          placeholder={t(
            'services.searchPlaceholder'
          )}
          className="services-search"
        />

      </div>

      {/* TABLE */}

      <div className="services-table">

        {loading ? (

          <div className="services-state">
            {t('services.loading')}
          </div>

        ) : filteredServices.length === 0 ? (

          <div className="services-empty">

            <div className="services-empty-icon">
              ✂️
            </div>

            <div className="services-empty-title">
              {search
                ? t('services.empty.searchTitle')
                : t('services.empty.title')}
            </div>

            <div className="services-empty-text">
              {search
                ? t('services.empty.searchText')
                : t('services.empty.text')}
            </div>

            {!search && (

              <button
                type="button"
                className="services-primary-button"
                onClick={
                  openCreateDialog
                }
              >
                <span>＋</span>
                {t('services.createService')}
              </button>

            )}

          </div>

        ) : (

          <>

            {/* TABLE HEADER */}

            <div className="services-table-header">

              <div>
                {t('services.table.service')}
              </div>

              <div>
                {t('services.table.duration')}
              </div>

              <div>
                {t('services.table.price')}
              </div>

              <div>
                {t('services.table.status')}
              </div>

              <div>
                {t('services.table.actions')}
              </div>

            </div>

            {/* ROWS */}

            {filteredServices.map(
              (service) => {

                const active =
                  Number(
                    service.is_active
                  ) === 1

                const color =
                  service.service_color ||
                  '#3B82F6'

                return (

                  <div
                    key={service.id}
                    className="services-table-row"
                  >

                    {/* SERVICE */}

                    <div className="service-info">

                      <div
                        className="service-color"
                        style={{
                          background:
                            color,

                          boxShadow:
                            `0 0 0 3px ${color}22`,
                        }}
                      />

                      <div className="service-text">

                        <div className="service-name">
                          {service.service_name}
                        </div>

                        <div className="service-description">
                          {service.service_description ||
                            t('services.noDescription')}
                        </div>

                      </div>

                    </div>

                    {/* DURATION */}

                    <div className="service-duration">
                      ⏱️{' '}
                      {service.service_duration}{' '}
                      {t('services.minutes')}
                    </div>

                    {/* PRICE */}

                    <div className="service-price">

                      {service.service_price !==
                        null &&
                      service.service_price !==
                        undefined
                        ? `${Number(
                            service.service_price
                          ).toFixed(2)} ${currencySymbol}`
                        : t('services.noPrice')}

                    </div>

                    {/* STATUS */}

                    <div>

                      <button
                        type="button"
                        className={
                          `service-status ${
                            active
                              ? 'active'
                              : 'inactive'
                          }`
                        }
                        onClick={() =>
                          toggleService(
                            service
                          )
                        }
                        disabled={
                          saving
                        }
                      >
                        {active
                          ? t('services.status.active')
                          : t('services.status.inactive')}
                      </button>

                    </div>

                    {/* ACTIONS */}

                    <div className="service-actions">

                      <button
                        type="button"
                        title={t('common.edit')}
                        aria-label={t('common.edit')}
                        className="service-action edit"
                        onClick={() =>
                          openEditDialog(
                            service
                          )
                        }
                      >
                        ✏️
                      </button>

                      <button
                        type="button"
                        title={t('common.delete')}
                        aria-label={t('common.delete')}
                        className="service-action delete"
                        onClick={() =>
                          openDeleteDialog(
                            service
                          )
                        }
                      >
                        🗑️
                      </button>

                    </div>

                  </div>

                )
              }
            )}

            {/* FOOTER */}

            <div className="services-footer">

              {t('services.footer.showing', {
                shown: filteredServices.length,
                total: services.length,
              })}

            </div>

          </>

        )}

      </div>

      {/* CREATE / EDIT DIALOG */}

      {dialogOpen && (

        <div
          className="services-dialog-overlay"
          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {
              closeDialog()
            }

          }}
        >

          <div className="services-dialog">

            {/* HEADER */}

            <div className="services-dialog-header">

              <div>

                <h2>
                  {editingService
                    ? t('services.dialog.editTitle')
                    : t('services.dialog.createTitle')}
                </h2>

                <p>
                  {editingService
                    ? t('services.dialog.editDescription')
                    : t('services.dialog.createDescription')}
                </p>

              </div>

              <button
                type="button"
                className="services-dialog-close"
                onClick={
                  closeDialog
                }
                disabled={
                  saving
                }
                aria-label={t('common.close')}
              >
                ×
              </button>

            </div>

            {/* BODY */}

            <div className="services-dialog-body">

              {error && (

                <div className="services-dialog-error">
                  ⚠️ {error}
                </div>

              )}

              {/* NAME */}

              <div className="services-field">

                <label>
                  {t('services.fields.name')} *
                </label>

                <input
                  value={
                    form.service_name
                  }
                  onChange={(event) =>
                    updateForm(
                      'service_name',
                      event.target.value
                    )
                  }
                  placeholder={t(
                    'services.fields.namePlaceholder'
                  )}
                  disabled={
                    saving
                  }
                  autoFocus
                />

              </div>

              {/* DESCRIPTION */}

              <div className="services-field">

                <label>
                  {t('services.fields.description')}
                </label>

                <textarea
                  value={
                    form.service_description
                  }
                  onChange={(event) =>
                    updateForm(
                      'service_description',
                      event.target.value
                    )
                  }
                  placeholder={t(
                    'services.fields.descriptionPlaceholder'
                  )}
                  disabled={
                    saving
                  }
                />

              </div>

              {/* DURATION / PRICE */}

              <div className="services-form-grid">

                <div className="services-field">

                  <label>
                    {t('services.fields.duration')} *
                  </label>

                  <div className="services-input-suffix">

                    <input
                      type="number"
                      min="1"
                      step="5"
                      value={
                        form.service_duration
                      }
                      onChange={(event) =>
                        updateForm(
                          'service_duration',
                          event.target.value
                        )
                      }
                      disabled={
                        saving
                      }
                    />

                    <span>
                      {t('services.minutes')}
                    </span>

                  </div>

                </div>

                <div className="services-field">

                  <label>
                    {t('services.fields.price')}
                  </label>

                  <div className="services-input-suffix">

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        form.service_price
                      }
                      onChange={(event) =>
                        updateForm(
                          'service_price',
                          event.target.value
                        )
                      }
                      placeholder="0.00"
                      disabled={
                        saving
                      }
                    />

                    <span>
                      {currencySymbol}
                    </span>

                  </div>

                </div>

              </div>

              {/* COLOR */}

              <div className="services-field">

                <label>
                  {t('services.fields.color')}
                </label>

                <div className="services-color-row">

                  <input
                    type="color"
                    value={
                      form.service_color
                    }
                    onChange={(event) =>
                      updateForm(
                        'service_color',
                        event.target.value.toUpperCase()
                      )
                    }
                    className="services-color-picker"
                    disabled={
                      saving
                    }
                  />

                  <input
                    type="text"
                    value={
                      form.service_color
                    }
                    onChange={(event) => {

                      const value =
                        event.target.value

                      if (
                        /^#[0-9A-Fa-f]{0,6}$/.test(
                          value
                        )
                      ) {
                        updateForm(
                          'service_color',
                          value.toUpperCase()
                        )
                      }

                    }}
                    maxLength={7}
                    className="services-color-input"
                    disabled={
                      saving
                    }
                  />

                  <div
                    className="services-color-preview"
                    style={{
                      background:
                        form.service_color,
                    }}
                  />

                </div>

                <div className="services-color-presets">

                  {colorPresets.map(
                    (color) => (

                      <button
                        key={color}
                        type="button"
                        title={color}
                        aria-label={color}
                        className={
                          `services-color-preset ${
                            form.service_color.toUpperCase() ===
                            color.toUpperCase()
                              ? 'selected'
                              : ''
                          }`
                        }
                        style={{
                          background:
                            color,
                        }}
                        onClick={() =>
                          updateForm(
                            'service_color',
                            color
                          )
                        }
                        disabled={
                          saving
                        }
                      />

                    )
                  )}

                </div>

                <small>
                  {t('services.fields.colorHelp')}
                </small>

              </div>

              {/* STATUS */}

              <div className="services-field">

                <label>
                  {t('services.fields.status')}
                </label>

                <button
                  type="button"
                  className={
                    `services-toggle ${
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

                  <span className="services-toggle-track">

                    <span className="services-toggle-thumb" />

                  </span>

                  <span>
                    {form.is_active
                      ? t('services.form.active')
                      : t('services.form.inactive')}
                  </span>

                </button>

              </div>

            </div>

            {/* FOOTER */}

            <div className="services-dialog-footer">

              <button
                type="button"
                className="services-secondary-button"
                onClick={
                  closeDialog
                }
                disabled={
                  saving
                }
              >
                {t('common.cancel')}
              </button>

              <button
                type="button"
                className="services-save-button"
                onClick={
                  saveService
                }
                disabled={
                  saving ||
                  !form.service_name.trim() ||
                  !form.service_duration ||
                  !/^#[0-9A-Fa-f]{6}$/.test(
                    form.service_color
                  )
                }
              >
                {saving
                  ? t('common.saving')
                  : editingService
                    ? t('services.dialog.saveChanges')
                    : t('services.dialog.createService')}
              </button>

            </div>

          </div>

        </div>

      )}

      {/* DELETE DIALOG */}

      {deleteDialogOpen &&
        deletingService && (

          <div
            className="services-dialog-overlay"
            onMouseDown={(event) => {

              if (
                event.target ===
                event.currentTarget
              ) {
                closeDeleteDialog()
              }

            }}
          >

            <div className="services-delete-dialog">

              <div className="services-delete-icon">
                🗑️
              </div>

              <h2>
                {t('services.deleteDialog.title')}
              </h2>

              <p>

                {t('services.deleteDialog.question')}{' '}

                <strong>
                  {
                    deletingService.service_name
                  }
                </strong>
                ?

                <br />

                {t('services.deleteDialog.warning')}

              </p>

              {error && (

                <div className="services-dialog-error">
                  ⚠️ {error}
                </div>

              )}

              <div className="services-delete-actions">

                <button
                  type="button"
                  className="services-secondary-button"
                  onClick={
                    closeDeleteDialog
                  }
                  disabled={
                    saving
                  }
                >
                  {t('common.cancel')}
                </button>

                <button
                  type="button"
                  className="services-delete-button"
                  onClick={
                    deleteService
                  }
                  disabled={
                    saving
                  }
                >
                  {saving
                    ? t('services.deleteDialog.deleting')
                    : t('common.delete')}
                </button>

              </div>

            </div>

          </div>

        )}

    </div>
  )
}

export default Services