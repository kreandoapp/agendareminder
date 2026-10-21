import { useEffect, useMemo, useState } from 'react'
import './Languages.css'

const API_URL = 'https://kreandoapp.com/api/index.php'

const EMPTY_FORM = {
  code: '',
  name: '',
  native_name: '',
  flag: '',
  sort_order: '0',
  active: false,
}

function getToken() {
  return localStorage.getItem('access_token')
}

export default function Languages({ user }) {
  const [languages, setLanguages] = useState([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')

  const [search, setSearch] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const [editingLanguage, setEditingLanguage] = useState(null)
  const [deletingLanguage, setDeletingLanguage] = useState(null)

  const [form, setForm] = useState(EMPTY_FORM)

  // =========================================================
  // LOAD LANGUAGES
  // =========================================================

  const loadLanguages = async () => {
    try {
      setLoading(true)
      setError('')

      const token = getToken()

      const response = await fetch(
        `${API_URL}?action=languages`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
          cache: 'no-store',
        }
      )

      if (response.status === 401) {
        throw new Error(
          'Sesión expirada. Vuelve a iniciar sesión.'
        )
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(
          result.message ||
            'No se pudieron cargar los idiomas.'
        )
      }

      const data = Array.isArray(result.data)
        ? result.data
        : []

      /*
       * Normalizamos active/enabled por compatibilidad.
       *
       * La base de datos utiliza "active".
       */
      const normalizedLanguages = data.map((language) => ({
        ...language,
        active: Boolean(
          language.active ??
            language.enabled ??
            false
        ),
      }))

      setLanguages(normalizedLanguages)
    } catch (err) {
      console.error(
        'Error loading languages:',
        err
      )

      setError(
        err.message ||
          'No se pudieron cargar los idiomas.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLanguages()
  }, [])

  // =========================================================
  // SEARCH
  // =========================================================

  const filteredLanguages = useMemo(() => {
    const value = search
      .trim()
      .toLowerCase()

    if (!value) {
      return languages
    }

    return languages.filter((language) => {
      return (
        String(language.name || '')
          .toLowerCase()
          .includes(value) ||
        String(language.native_name || '')
          .toLowerCase()
          .includes(value) ||
        String(language.code || '')
          .toLowerCase()
          .includes(value)
      )
    })
  }, [languages, search])

  // =========================================================
  // CREATE
  // =========================================================

  const openCreateDialog = () => {
    setEditingLanguage(null)

    /*
     * MUY IMPORTANTE:
     *
     * Todo idioma nuevo comienza SIEMPRE inactivo.
     */
    setForm({
      ...EMPTY_FORM,
      active: false,
    })

    setError('')
    setDialogOpen(true)
  }

  // =========================================================
  // EDIT
  // =========================================================

  const openEditDialog = (language) => {
    setEditingLanguage(language)

    setForm({
      code: language.code || '',
      name: language.name || '',
      native_name: language.native_name || '',
      flag: language.flag || '',
      sort_order: String(
        language.sort_order ?? 0
      ),
      active: Boolean(language.active),
    })

    setError('')
    setDialogOpen(true)
  }

  // =========================================================
  // CLOSE
  // =========================================================

  const closeDialog = () => {
    if (saving) {
      return
    }

    setDialogOpen(false)
    setEditingLanguage(null)
    setForm(EMPTY_FORM)
    setError('')
  }

  // =========================================================
  // FORM CHANGE
  // =========================================================

  const handleChange = (
    field,
    value
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  // =========================================================
  // VALIDATE
  // =========================================================

  const validateForm = () => {
    const code = form.code
      .trim()
      .toLowerCase()

    const name = form.name.trim()

    const nativeName =
      form.native_name.trim()

    const flag = form.flag.trim()

    const sortOrder =
      Number(form.sort_order)

    if (!name) {
      return 'El nombre del idioma es obligatorio.'
    }

    if (!nativeName) {
      return 'El nombre nativo es obligatorio.'
    }

    if (!/^[a-z]{2,3}$/.test(code)) {
      return (
        'El código debe tener 2 o 3 letras. ' +
        'Ejemplo: es, en, ro.'
      )
    }

    if (!flag) {
      return 'La bandera es obligatoria.'
    }

    if (
      !Number.isInteger(sortOrder) ||
      sortOrder < 0
    ) {
      return (
        'El orden debe ser un número entero igual o mayor que 0.'
      )
    }

    return ''
  }

  // =========================================================
  // SAVE
  // =========================================================

  const saveLanguage = async () => {
    const validationError =
      validateForm()

    if (validationError) {
      setError(validationError)
      return
    }

    try {
      setSaving(true)
      setError('')

      const token = getToken()

      const isEditing =
        Boolean(editingLanguage)

      const url = isEditing
        ? `${API_URL}?action=language&id=${editingLanguage.id}`
        : `${API_URL}?action=language`

      /*
       * IMPORTANTE:
       *
       * CREATE:
       * active = false SIEMPRE.
       *
       * EDIT:
       * respetamos el estado actual seleccionado.
       */
      const payload = {
        code: form.code
          .trim()
          .toLowerCase(),

        name: form.name.trim(),

        native_name:
          form.native_name.trim(),

        flag: form.flag.trim(),

        sort_order:
          Number(form.sort_order),

        active: isEditing
          ? Boolean(form.active)
          : false,
      }

      const response = await fetch(
        url,
        {
          method: isEditing
            ? 'PUT'
            : 'POST',

          headers: {
            'Content-Type':
              'application/json',

            Accept:
              'application/json',

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify(payload),
        }
      )

      if (response.status === 401) {
        throw new Error(
          'Sesión expirada. Vuelve a iniciar sesión.'
        )
      }

      const result =
        await response.json()

      if (!result.success) {
        throw new Error(
          result.message ||
            'No se pudo guardar el idioma.'
        )
      }

      setDialogOpen(false)
      setEditingLanguage(null)
      setForm(EMPTY_FORM)

      await loadLanguages()
    } catch (err) {
      console.error(
        'Error saving language:',
        err
      )

      setError(
        err.message ||
          'No se pudo guardar el idioma.'
      )
    } finally {
      setSaving(false)
    }
  }

  // =========================================================
  // TOGGLE ACTIVE
  // =========================================================

  const toggleLanguage = async (
    language
  ) => {
    try {
      setError('')

      const token = getToken()

      const newActive =
        !Boolean(language.active)

      const response = await fetch(
        `${API_URL}?action=language&id=${language.id}`,
        {
          method: 'PATCH',

          headers: {
            'Content-Type':
              'application/json',

            Accept:
              'application/json',

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            active: newActive,
          }),
        }
      )

      if (response.status === 401) {
        throw new Error(
          'Sesión expirada. Vuelve a iniciar sesión.'
        )
      }

      const result =
        await response.json()

      if (!result.success) {
        throw new Error(
          result.message ||
            'No se pudo cambiar el estado del idioma.'
        )
      }

      await loadLanguages()
    } catch (err) {
      console.error(
        'Error toggling language:',
        err
      )

      setError(
        err.message ||
          'No se pudo cambiar el estado del idioma.'
      )
    }
  }

  // =========================================================
  // DELETE
  // =========================================================

  const openDeleteDialog = (
    language
  ) => {
    setDeletingLanguage(language)
    setDeleteDialogOpen(true)
    setError('')
  }

  const closeDeleteDialog = () => {
    if (saving) {
      return
    }

    setDeleteDialogOpen(false)
    setDeletingLanguage(null)
  }

  const deleteLanguage = async () => {
    if (!deletingLanguage) {
      return
    }

    try {
      setSaving(true)
      setError('')

      const token = getToken()

      const response = await fetch(
        `${API_URL}?action=language&id=${deletingLanguage.id}`,
        {
          method: 'DELETE',

          headers: {
            Accept:
              'application/json',

            Authorization:
              `Bearer ${token}`,
          },
        }
      )

      if (response.status === 401) {
        throw new Error(
          'Sesión expirada. Vuelve a iniciar sesión.'
        )
      }

      const result =
        await response.json()

      if (!result.success) {
        throw new Error(
          result.message ||
            'No se pudo eliminar el idioma.'
        )
      }

      setDeleteDialogOpen(false)
      setDeletingLanguage(null)

      await loadLanguages()
    } catch (err) {
      console.error(
        'Error deleting language:',
        err
      )

      setError(
        err.message ||
          'No se pudo eliminar el idioma.'
      )
    } finally {
      setSaving(false)
    }
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="languages-page">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="languages-header">

        <div>
          <div className="languages-breadcrumb">
            Administración / 🌐 Idiomas
          </div>

          <h1>
            Idiomas
          </h1>

          <p>
            Gestiona los idiomas disponibles
            en el sistema.
          </p>
        </div>

        <button
          type="button"
          className="languages-primary-button"
          onClick={openCreateDialog}
        >
          <span>+</span>
          Nuevo idioma
        </button>

      </div>

      {/* =====================================================
          INFO
          ===================================================== */}

      <div className="languages-info-box">

        <div className="languages-info-icon">
          ℹ️
        </div>

        <div>

          <strong>
            Los idiomas nuevos se crean desactivados
          </strong>

          <p>
            Primero se agrega el idioma al
            catálogo del sistema. Puedes activarlo
            cuando esté preparado.
          </p>

        </div>

      </div>

      {/* =====================================================
          ERROR
          ===================================================== */}

      {error && (
        <div className="languages-error">

          <span>
            ⚠️
          </span>

          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={() =>
              setError('')
            }
          >
            ×
          </button>

        </div>
      )}

      {/* =====================================================
          SEARCH
          ===================================================== */}

      <div className="languages-toolbar">

        <div className="languages-search">

          <span className="languages-search-icon">
            🔍
          </span>

          <input
            type="text"
            placeholder="Buscar idioma..."
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />

          {search && (
            <button
              type="button"
              className="languages-search-clear"
              onClick={() =>
                setSearch('')
              }
            >
              ×
            </button>
          )}

        </div>

      </div>

      {/* =====================================================
          TABLE CARD
          ===================================================== */}

      <div className="languages-card">

        {loading ? (

          <div className="languages-empty">

            <div className="languages-spinner" />

            <p>
              Cargando idiomas...
            </p>

          </div>

        ) : filteredLanguages.length === 0 ? (

          <div className="languages-empty">

            <div className="languages-empty-icon">
              🌐
            </div>

            <h3>
              {search
                ? 'No se encontraron idiomas'
                : 'No hay idiomas'}
            </h3>

            <p>
              {search
                ? 'Prueba con otro término de búsqueda.'
                : 'Agrega el primer idioma del sistema.'}
            </p>

            {!search && (
              <button
                type="button"
                className="languages-primary-button"
                onClick={
                  openCreateDialog
                }
              >
                <span>
                  +
                </span>

                Nuevo idioma
              </button>
            )}

          </div>

        ) : (

          <div className="languages-table-wrapper">

            <table className="languages-table">

              <thead>

                <tr>

                  <th>
                    Idioma
                  </th>

                  <th>
                    Código
                  </th>

                  <th>
                    Bandera
                  </th>

                  <th>
                    Orden
                  </th>

                  <th>
                    Estado
                  </th>

                  <th>
                    Acciones
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredLanguages.map(
                  (language) => (

                    <tr
                      key={language.id}
                    >

                      {/* IDIOMA */}

                      <td>

                        <div className="language-name-cell">

                          <div className="language-icon">

                            {language.flag ||
                              '🌐'}

                          </div>

                          <div>

                            <strong>
                              {language.native_name ||
                                language.name}
                            </strong>

                            {language.name &&
                              language.native_name &&
                              language.name !==
                                language.native_name && (
                                <span>
                                  {language.name}
                                </span>
                              )}

                          </div>

                        </div>

                      </td>

                      {/* CODE */}

                      <td>

                        <span className="language-code">

                          {language.code}

                        </span>

                      </td>

                      {/* FLAG */}

                      <td>

                        <span className="language-flag">

                          {language.flag ||
                            '—'}

                        </span>

                      </td>

                      {/* SORT ORDER */}

                      <td>

                        <span className="language-order">

                          {language.sort_order ??
                            0}

                        </span>

                      </td>

                      {/* STATUS */}

                      <td>

                        <button
                          type="button"
                          className={`language-status ${
                            language.active
                              ? 'active'
                              : 'inactive'
                          }`}
                          onClick={() =>
                            toggleLanguage(
                              language
                            )
                          }
                          title={
                            language.active
                              ? 'Desactivar idioma'
                              : 'Activar idioma'
                          }
                        >

                          <span className="language-status-dot" />

                          {language.active
                            ? 'Activo'
                            : 'Inactivo'}

                        </button>

                      </td>

                      {/* ACTIONS */}

                      <td>

                        <div className="language-actions">

                          <button
                            type="button"
                            className="language-action-button"
                            onClick={() =>
                              openEditDialog(
                                language
                              )
                            }
                          >

                            ✏️

                            <span>
                              Editar
                            </span>

                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

      {/* =====================================================
          CREATE / EDIT MODAL
          ===================================================== */}

      {dialogOpen && (

        <div
          className="languages-modal-overlay"
          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {
              closeDialog()
            }

          }}
        >

          <div className="languages-modal">

            {/* HEADER */}

            <div className="languages-modal-header">

              <div>

                <h2>

                  {editingLanguage
                    ? 'Editar idioma'
                    : 'Nuevo idioma'}

                </h2>

                <p>

                  {editingLanguage
                    ? 'Modifica la información del idioma.'
                    : 'Agrega un nuevo idioma al sistema.'}

                </p>

              </div>

              <button
                type="button"
                className="languages-modal-close"
                onClick={
                  closeDialog
                }
                disabled={saving}
              >
                ×
              </button>

            </div>

            {/* BODY */}

            <div className="languages-modal-body">

              {!editingLanguage && (

                <div className="languages-modal-notice">

                  <span>
                    🔒
                  </span>

                  <div>

                    <strong>
                      Se creará como inactivo
                    </strong>

                    <p>
                      Un idioma nuevo siempre
                      comienza desactivado.
                    </p>

                  </div>

                </div>

              )}

              {/* NAME */}

              <div className="languages-field">

                <label>
                  Nombre
                </label>

                <input
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    handleChange(
                      'name',
                      event.target.value
                    )
                  }
                  placeholder="Spanish"
                  autoComplete="off"
                />

              </div>

              {/* NATIVE NAME */}

              <div className="languages-field">

                <label>
                  Nombre nativo
                </label>

                <input
                  type="text"
                  value={
                    form.native_name
                  }
                  onChange={(event) =>
                    handleChange(
                      'native_name',
                      event.target.value
                    )
                  }
                  placeholder="Español"
                  autoComplete="off"
                />

              </div>

              {/* CODE */}

              <div className="languages-field">

                <label>
                  Código
                </label>

                <input
                  type="text"
                  value={form.code}
                  onChange={(event) =>
                    handleChange(
                      'code',
                      event.target.value
                        .toLowerCase()
                    )
                  }
                  placeholder="es"
                  maxLength={3}
                  autoComplete="off"
                />

                <small>
                  2 o 3 letras. Ejemplo:
                  es, en, ro.
                </small>

              </div>

              {/* FLAG */}

              <div className="languages-field">

                <label>
                  Bandera
                </label>

                <input
                  type="text"
                  value={form.flag}
                  onChange={(event) =>
                    handleChange(
                      'flag',
                      event.target.value
                    )
                  }
                  placeholder="🇪🇸"
                  maxLength={10}
                  autoComplete="off"
                />

                <small>
                  Ejemplo: 🇪🇸 🇬🇧 🇷🇴
                </small>

              </div>

              {/* SORT ORDER */}

              <div className="languages-field">

                <label>
                  Orden
                </label>

                <input
                  type="number"
                  min="0"
                  step="1"
                  value={
                    form.sort_order
                  }
                  onChange={(event) =>
                    handleChange(
                      'sort_order',
                      event.target.value
                    )
                  }
                  placeholder="0"
                />

                <small>
                  Define el orden en que
                  aparecerá el idioma.
                </small>

              </div>

              {/* ACTIVE */}

              <div className="languages-field">

                <label>
                  Estado
                </label>

                <div
                  className={`languages-status-control ${
                    form.active
                      ? 'enabled'
                      : ''
                  } ${
                    !editingLanguage
                      ? 'disabled-control'
                      : ''
                  }`}
                >

                  <div>

                    <strong>
                      {form.active
                        ? 'Activo'
                        : 'Inactivo'}
                    </strong>

                    <span>

                      {editingLanguage
                        ? form.active
                          ? 'El idioma está disponible en el sistema.'
                          : 'El idioma está desactivado.'
                        : 'Los idiomas nuevos siempre se crean inactivos.'}

                    </span>

                  </div>

                  {editingLanguage ? (

                    <button
                      type="button"
                      className={`languages-ios-switch ${
                        form.active
                          ? 'active'
                          : ''
                      }`}
                      onClick={() =>
                        handleChange(
                          'active',
                          !form.active
                        )
                      }
                      aria-label={
                        form.active
                          ? 'Desactivar idioma'
                          : 'Activar idioma'
                      }
                    >

                      <span />

                    </button>

                  ) : (

                    <div className="languages-ios-switch disabled">

                      <span />

                    </div>

                  )}

                </div>

              </div>

            </div>

            {/* FOOTER */}

            <div className="languages-modal-footer">

              {editingLanguage && (

                <button
                  type="button"
                  className="languages-delete-button"
                  onClick={() => {

                    closeDialog()

                    openDeleteDialog(
                      editingLanguage
                    )

                  }}
                  disabled={saving}
                >
                  🗑️ Eliminar
                </button>

              )}

              <div className="languages-footer-actions">

                <button
                  type="button"
                  className="languages-secondary-button"
                  onClick={
                    closeDialog
                  }
                  disabled={saving}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  className="languages-primary-button"
                  onClick={
                    saveLanguage
                  }
                  disabled={saving}
                >

                  {saving
                    ? 'Guardando...'
                    : editingLanguage
                      ? 'Guardar cambios'
                      : 'Crear idioma'}

                </button>

              </div>

            </div>

          </div>

        </div>

      )}

      {/* =====================================================
          DELETE MODAL
          ===================================================== */}

      {deleteDialogOpen &&
        deletingLanguage && (

          <div
            className="languages-modal-overlay"
            onMouseDown={(event) => {

              if (
                event.target ===
                event.currentTarget
              ) {
                closeDeleteDialog()
              }

            }}
          >

            <div className="languages-delete-modal">

              <div className="languages-delete-icon">
                🗑️
              </div>

              <h2>
                Eliminar idioma
              </h2>

              <p>

                ¿Seguro que quieres
                eliminar{' '}

                <strong>
                  {deletingLanguage.native_name ||
                    deletingLanguage.name}
                </strong>
                ?

              </p>

              <p className="languages-delete-warning">

                Esta acción no se puede
                deshacer.

              </p>

              <div className="languages-delete-actions">

                <button
                  type="button"
                  className="languages-secondary-button"
                  onClick={
                    closeDeleteDialog
                  }
                  disabled={saving}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  className="languages-danger-button"
                  onClick={
                    deleteLanguage
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