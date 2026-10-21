import { useEffect, useMemo, useState } from 'react'
import './Countries.css'

const API_URL =
  'https://kreandoapp.com/api/index.php'

const EMPTY_FORM = {
  code: '',
  name: '',
  flag: '',
  dial_code: '',
  currency_code: '',
  currency_symbol: '',
  min_digits: '1',
  max_digits: '15',
  timezone: '',
  enabled: true,
}

function Countries() {
  const [countries, setCountries] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const [dialogOpen, setDialogOpen] =
    useState(false)

  const [deleteDialogOpen, setDeleteDialogOpen] =
    useState(false)

  const [editingCountry, setEditingCountry] =
    useState(null)

  const [deletingCountry, setDeletingCountry] =
    useState(null)

  const [form, setForm] = useState(EMPTY_FORM)

  // =====================================================
  // TOKEN
  // =====================================================

  const getToken = () => {
    return localStorage.getItem(
      'access_token'
    )
  }

  // =====================================================
  // CARGAR PAÍSES
  // =====================================================

  const loadCountries = async () => {
    const token = getToken()

    if (!token) {
      setError(
        'La sesión no es válida. Inicia sesión nuevamente.'
      )
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError('')

      const response = await fetch(
        `${API_URL}?action=countries`,
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

      if (response.status === 401) {
        throw new Error(
          'La sesión ha expirado.'
        )
      }

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            'No se pudieron cargar los países.'
        )
      }

      setCountries(
        Array.isArray(result.data)
          ? result.data
          : []
      )
    } catch (err) {
      console.error(
        '❌ Error cargando países:',
        err
      )

      setError(
        err.message ||
          'No se pudieron cargar los países.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCountries()
  }, [])

  // =====================================================
  // BÚSQUEDA
  // =====================================================

  const filteredCountries = useMemo(() => {
    const value =
      search.trim().toLowerCase()

    if (!value) {
      return countries
    }

    return countries.filter(
      (country) => {
        const name =
          country.name || ''

        const code =
          country.code || ''

        const dialCode =
          country.dial_code || ''

        const currency =
          country.currency_code || ''

        return (
          name
            .toLowerCase()
            .includes(value) ||
          code
            .toLowerCase()
            .includes(value) ||
          dialCode
            .toLowerCase()
            .includes(value) ||
          currency
            .toLowerCase()
            .includes(value)
        )
      }
    )
  }, [countries, search])

  // =====================================================
  // FORMULARIO
  // =====================================================

  const updateForm = (
    field,
    value
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))

    setError('')
  }

  // =====================================================
  // NUEVO PAÍS
  // =====================================================

  const openCreateDialog = () => {
    setEditingCountry(null)
    setForm({
      ...EMPTY_FORM,
    })
    setError('')
    setDialogOpen(true)
  }

  // =====================================================
  // EDITAR PAÍS
  // =====================================================

  const openEditDialog = (
    country
  ) => {
    setEditingCountry(country)

    setForm({
      code:
        country.code || '',

      name:
        country.name || '',

      flag:
        country.flag || '',

      dial_code:
        country.dial_code || '',

      currency_code:
        country.currency_code || '',

      currency_symbol:
        country.currency_symbol || '',

      min_digits:
        String(
          country.min_digits ?? ''
        ),

      max_digits:
        String(
          country.max_digits ?? ''
        ),

      timezone:
        country.timezone || '',

      enabled:
        Number(country.enabled) === 1,
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
    setEditingCountry(null)
    setError('')
  }

  // =====================================================
  // VALIDAR
  // =====================================================

  const validateForm = () => {
    if (!form.name.trim()) {
      return 'El nombre del país es obligatorio.'
    }

    if (!form.code.trim()) {
      return 'El código del país es obligatorio.'
    }

    if (!/^[A-Za-z]{2}$/.test(
      form.code.trim()
    )) {
      return 'El código del país debe tener 2 letras. Ejemplo: ES.'
    }

    if (!form.flag.trim()) {
      return 'La bandera es obligatoria.'
    }

    if (!form.dial_code.trim()) {
      return 'El código telefónico es obligatorio.'
    }

    if (
      !/^\+?[0-9]+$/.test(
        form.dial_code.trim()
      )
    ) {
      return 'El código telefónico no es válido.'
    }

    if (
      !form.currency_code.trim()
    ) {
      return 'El código de moneda es obligatorio.'
    }

    if (
      !/^[A-Za-z]{3}$/.test(
        form.currency_code.trim()
      )
    ) {
      return 'El código de moneda debe tener 3 letras. Ejemplo: EUR.'
    }

    if (
      !form.currency_symbol.trim()
    ) {
      return 'El símbolo de moneda es obligatorio.'
    }

    if (!form.timezone.trim()) {
      return 'La zona horaria es obligatoria.'
    }

    const minDigits =
      Number(form.min_digits)

    const maxDigits =
      Number(form.max_digits)

    if (
      !Number.isInteger(minDigits) ||
      minDigits <= 0
    ) {
      return 'Los dígitos mínimos deben ser mayores que 0.'
    }

    if (
      !Number.isInteger(maxDigits) ||
      maxDigits <= 0
    ) {
      return 'Los dígitos máximos deben ser mayores que 0.'
    }

    if (
      minDigits > maxDigits
    ) {
      return 'Los dígitos mínimos no pueden ser mayores que los máximos.'
    }

    return ''
  }

  // =====================================================
  // GUARDAR
  // =====================================================

  const saveCountry = async () => {
    const token = getToken()

    if (!token) {
      setError(
        'La sesión no es válida.'
      )
      return
    }

    const validationError =
      validateForm()

    if (validationError) {
      setError(validationError)
      return
    }

    try {
      setSaving(true)
      setError('')

      const isEditing =
        editingCountry !== null

      const url = isEditing
        ? `${API_URL}?action=country&id=${editingCountry.id}`
        : `${API_URL}?action=country`

      const response =
        await fetch(
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
              code:
                form.code
                  .trim()
                  .toUpperCase(),

              name:
                form.name.trim(),

              flag:
                form.flag.trim(),

              dial_code:
                form.dial_code.trim(),

              currency_code:
                form.currency_code
                  .trim()
                  .toUpperCase(),

              currency_symbol:
                form.currency_symbol.trim(),

              min_digits:
                Number(
                  form.min_digits
                ),

              max_digits:
                Number(
                  form.max_digits
                ),

              timezone:
                form.timezone.trim(),

              enabled:
                form.enabled,
            }),
          }
        )

      const result =
        await response.json()

      if (response.status === 401) {
        throw new Error(
          'La sesión ha expirado.'
        )
      }

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            'No se pudo guardar el país.'
        )
      }

      setDialogOpen(false)
      setEditingCountry(null)

      await loadCountries()
    } catch (err) {
      console.error(
        '❌ Error guardando país:',
        err
      )

      setError(
        err.message ||
          'No se pudo guardar el país.'
      )
    } finally {
      setSaving(false)
    }
  }

  // =====================================================
  // ACTIVAR / DESACTIVAR
  // =====================================================

  const toggleCountry = async (
    country
  ) => {
    const token = getToken()

    if (!token) {
      return
    }

    const currentEnabled =
      Number(country.enabled) === 1

    try {
      setSaving(true)
      setError('')

      const response =
        await fetch(
          `${API_URL}?action=country&id=${country.id}`,
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
              enabled:
                !currentEnabled,
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
            'No se pudo cambiar el estado.'
        )
      }

      await loadCountries()
    } catch (err) {
      console.error(
        '❌ Error cambiando estado:',
        err
      )

      setError(
        err.message ||
          'No se pudo cambiar el estado.'
      )
    } finally {
      setSaving(false)
    }
  }

  // =====================================================
  // ELIMINAR
  // =====================================================

  const openDeleteDialog = (
    country
  ) => {
    setDeletingCountry(country)
    setDeleteDialogOpen(true)
    setError('')
  }

  const closeDeleteDialog = () => {
    if (saving) {
      return
    }

    setDeleteDialogOpen(false)
    setDeletingCountry(null)
    setError('')
  }

  const deleteCountry = async () => {
    const token = getToken()

    if (
      !token ||
      !deletingCountry
    ) {
      return
    }

    try {
      setSaving(true)
      setError('')

      const response =
        await fetch(
          `${API_URL}?action=country&id=${deletingCountry.id}`,
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
            'No se pudo eliminar el país.'
        )
      }

      setDeleteDialogOpen(false)
      setDeletingCountry(null)

      setDialogOpen(false)
      setEditingCountry(null)

      await loadCountries()
    } catch (err) {
      console.error(
        '❌ Error eliminando país:',
        err
      )

      setError(
        err.message ||
          'No se pudo eliminar el país.'
      )
    } finally {
      setSaving(false)
    }
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="countries-page">

      {/* HEADER */}

      <div className="countries-header">

        <div className="countries-heading">

          <div className="countries-eyebrow">
            Administración
          </div>

          <h1 className="countries-title">
            <span
              className="countries-title-icon"
              aria-hidden="true"
            >
              🌍
            </span>

            <span>
              Países
            </span>
          </h1>

          <p className="countries-description">
            Gestiona los países disponibles
            en el sistema.
          </p>

        </div>

        <button
          type="button"
          className="countries-primary-button"
          onClick={
            openCreateDialog
          }
        >
          <span>＋</span>
          Nuevo país
        </button>

      </div>

      {/* ERROR */}

      {error &&
        !dialogOpen &&
        !deleteDialogOpen && (
          <div className="countries-error">
            ⚠️ {error}
          </div>
        )}

      {/* SEARCH */}

      <div className="countries-search-wrapper">

        <span className="countries-search-icon">
          🔎
        </span>

        <input
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value
            )
          }
          placeholder="Buscar país..."
          className="countries-search"
        />

        {search && (
          <button
            type="button"
            className="countries-search-clear"
            onClick={() =>
              setSearch('')
            }
            aria-label="Limpiar búsqueda"
          >
            ×
          </button>
        )}

      </div>

      {/* LIST */}

      <div className="countries-list">

        {loading ? (

          <div className="countries-state">
            Cargando países...
          </div>

        ) : filteredCountries.length === 0 ? (

          <div className="countries-empty">

            <div className="countries-empty-icon">
              🌍
            </div>

            <div className="countries-empty-title">
              {search
                ? 'No encontramos países'
                : 'Todavía no hay países'}
            </div>

            <div className="countries-empty-text">
              {search
                ? 'Prueba con otro nombre o código.'
                : 'Agrega el primer país para comenzar.'}
            </div>

            {!search && (
              <button
                type="button"
                className="countries-primary-button"
                onClick={
                  openCreateDialog
                }
              >
                <span>＋</span>
                Nuevo país
              </button>
            )}

          </div>

        ) : (

          <>

            {/* HEADER */}

            <div className="countries-list-header">

              <div>
                País
              </div>

              <div>
                Teléfono
              </div>

              <div>
                Moneda
              </div>

              <div>
                Estado
              </div>

              <div>
                Acciones
              </div>

            </div>

            {/* ROWS */}

            {filteredCountries.map(
              (country) => {

                const active =
                  Number(
                    country.enabled
                  ) === 1

                return (
                  <div
                    key={country.id}
                    className="countries-row"
                  >

                    {/* COUNTRY */}

                    <div className="country-info">

                      <div className="country-flag">
                        {country.flag}
                      </div>

                      <div className="country-text">

                        <div className="country-name">
                          {country.name}
                        </div>

                        <div className="country-code">
                          {country.code}
                        </div>

                      </div>

                    </div>

                    {/* PHONE */}

                    <div className="country-phone">
                      {country.dial_code}
                    </div>

                    {/* CURRENCY */}

                    <div className="country-currency">

                      <strong>
                        {country.currency_code}
                      </strong>

                      <span>
                        {country.currency_symbol}
                      </span>

                    </div>

                    {/* STATUS */}

                    <div>

                      <button
                        type="button"
                        className={
                          `country-status ${
                            active
                              ? 'active'
                              : 'inactive'
                          }`
                        }
                        onClick={() =>
                          toggleCountry(
                            country
                          )
                        }
                        disabled={saving}
                      >
                        <span className="country-status-dot" />

                        {active
                          ? 'Activo'
                          : 'Inactivo'}
                      </button>

                    </div>

                    {/* ACTION */}

                    <div className="country-actions">

                      <button
                        type="button"
                        className="country-edit-button"
                        onClick={() =>
                          openEditDialog(
                            country
                          )
                        }
                        disabled={saving}
                        title="Editar"
                        aria-label="Editar país"
                      >
                        ✏️
                      </button>

                    </div>

                  </div>
                )
              }
            )}

            <div className="countries-footer">
              Mostrando{' '}
              <strong>
                {filteredCountries.length}
              </strong>{' '}
              de{' '}
              <strong>
                {countries.length}
              </strong>{' '}
              países
            </div>

          </>

        )}

      </div>

      {/* CREATE / EDIT DIALOG */}

      {dialogOpen && (

        <div
          className="countries-dialog-overlay"
          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {
              closeDialog()
            }

          }}
        >

          <div className="countries-dialog">

            {/* HEADER */}

            <div className="countries-dialog-header">

              <div>

                <h2>
                  {editingCountry
                    ? 'Editar país'
                    : 'Nuevo país'}
                </h2>

                <p>
                  {editingCountry
                    ? 'Modifica la información del país.'
                    : 'Agrega un nuevo país al sistema.'}
                </p>

              </div>

              <button
                type="button"
                className="countries-dialog-close"
                onClick={
                  closeDialog
                }
                disabled={saving}
                aria-label="Cerrar"
              >
                ×
              </button>

            </div>

            {/* BODY */}

            <div className="countries-dialog-body">

              {error && (
                <div className="countries-dialog-error">
                  ⚠️ {error}
                </div>
              )}

              {/* NAME + FLAG */}

              <div className="countries-form-grid country-main-grid">

                <div className="countries-field">

                  <label>
                    Nombre *
                  </label>

                  <input
                    value={
                      form.name
                    }
                    onChange={(event) =>
                      updateForm(
                        'name',
                        event.target.value
                      )
                    }
                    placeholder="España"
                    disabled={saving}
                    autoFocus
                  />

                </div>

                <div className="countries-field">

                  <label>
                    Bandera *
                  </label>

                  <input
                    value={
                      form.flag
                    }
                    onChange={(event) =>
                      updateForm(
                        'flag',
                        event.target.value
                      )
                    }
                    placeholder="🇪🇸"
                    maxLength={8}
                    disabled={saving}
                  />

                </div>

              </div>

              {/* CODE + DIAL CODE */}

              <div className="countries-form-grid">

                <div className="countries-field">

                  <label>
                    Código *
                  </label>

                  <input
                    value={
                      form.code
                    }
                    onChange={(event) =>
                      updateForm(
                        'code',
                        event.target.value
                          .toUpperCase()
                      )
                    }
                    placeholder="ES"
                    maxLength={2}
                    disabled={saving}
                  />

                  <small>
                    Código ISO de 2 letras.
                  </small>

                </div>

                <div className="countries-field">

                  <label>
                    Código telefónico *
                  </label>

                  <input
                    value={
                      form.dial_code
                    }
                    onChange={(event) =>
                      updateForm(
                        'dial_code',
                        event.target.value
                      )
                    }
                    placeholder="+34"
                    disabled={saving}
                  />

                </div>

              </div>

              {/* CURRENCY */}

              <div className="countries-form-grid">

                <div className="countries-field">

                  <label>
                    Moneda *
                  </label>

                  <input
                    value={
                      form.currency_code
                    }
                    onChange={(event) =>
                      updateForm(
                        'currency_code',
                        event.target.value
                          .toUpperCase()
                      )
                    }
                    placeholder="EUR"
                    maxLength={3}
                    disabled={saving}
                  />

                </div>

                <div className="countries-field">

                  <label>
                    Símbolo *
                  </label>

                  <input
                    value={
                      form.currency_symbol
                    }
                    onChange={(event) =>
                      updateForm(
                        'currency_symbol',
                        event.target.value
                      )
                    }
                    placeholder="€"
                    maxLength={5}
                    disabled={saving}
                  />

                </div>

              </div>

              {/* PHONE DIGITS */}

              <div className="countries-section-label">
                Configuración telefónica
              </div>

              <div className="countries-form-grid">

                <div className="countries-field">

                  <label>
                    Mín. dígitos *
                  </label>

                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={
                      form.min_digits
                    }
                    onChange={(event) =>
                      updateForm(
                        'min_digits',
                        event.target.value
                      )
                    }
                    disabled={saving}
                  />

                </div>

                <div className="countries-field">

                  <label>
                    Máx. dígitos *
                  </label>

                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={
                      form.max_digits
                    }
                    onChange={(event) =>
                      updateForm(
                        'max_digits',
                        event.target.value
                      )
                    }
                    disabled={saving}
                  />

                </div>

              </div>

              {/* TIMEZONE */}

              <div className="countries-field">

                <label>
                  Zona horaria *
                </label>

                <input
                  value={
                    form.timezone
                  }
                  onChange={(event) =>
                    updateForm(
                      'timezone',
                      event.target.value
                    )
                  }
                  placeholder="Europe/Madrid"
                  disabled={saving}
                />

              </div>

              {/* STATUS */}

              <div className="countries-field">

                <label>
                  Estado
                </label>

                <button
                  type="button"
                  className={
                    `countries-toggle ${
                      form.enabled
                        ? 'active'
                        : ''
                    }`
                  }
                  onClick={() =>
                    updateForm(
                      'enabled',
                      !form.enabled
                    )
                  }
                  disabled={saving}
                >

                  <span className="countries-toggle-track">
                    <span className="countries-toggle-thumb" />
                  </span>

                  <span>
                    {form.enabled
                      ? 'Activo'
                      : 'Inactivo'}
                  </span>

                </button>

              </div>

            </div>

            {/* FOOTER */}

            <div className="countries-dialog-footer">

              {editingCountry && (
                <button
                  type="button"
                  className="countries-delete-button"
                  onClick={() =>
                    openDeleteDialog(
                      editingCountry
                    )
                  }
                  disabled={saving}
                >
                  🗑️ Eliminar
                </button>
              )}

              <div className="countries-dialog-footer-right">

                <button
                  type="button"
                  className="countries-secondary-button"
                  onClick={
                    closeDialog
                  }
                  disabled={saving}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  className="countries-save-button"
                  onClick={
                    saveCountry
                  }
                  disabled={saving}
                >
                  {saving
                    ? 'Guardando...'
                    : editingCountry
                      ? 'Guardar cambios'
                      : 'Crear país'}
                </button>

              </div>

            </div>

          </div>

        </div>

      )}

      {/* DELETE DIALOG */}

      {deleteDialogOpen &&
        deletingCountry && (

          <div
            className="countries-dialog-overlay"
            onMouseDown={(event) => {

              if (
                event.target ===
                event.currentTarget
              ) {
                closeDeleteDialog()
              }

            }}
          >

            <div className="countries-delete-dialog">

              <div className="countries-delete-icon">
                🗑️
              </div>

              <h2>
                Eliminar país
              </h2>

              <p>
                ¿Quieres eliminar{' '}
                <strong>
                  {deletingCountry.flag}{' '}
                  {deletingCountry.name}
                </strong>
                ?
              </p>

              <p className="countries-delete-warning">
                Esta acción no se puede
                deshacer.
              </p>

              {error && (
                <div className="countries-dialog-error">
                  ⚠️ {error}
                </div>
              )}

              <div className="countries-delete-actions">

                <button
                  type="button"
                  className="countries-secondary-button"
                  onClick={
                    closeDeleteDialog
                  }
                  disabled={saving}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  className="countries-delete-confirm-button"
                  onClick={
                    deleteCountry
                  }
                  disabled={saving}
                >
                  {saving
                    ? 'Eliminando...'
                    : 'Eliminar'}
                </button>

              </div>

            </div>

          </div>

        )}

    </div>
  )
}

export default Countries