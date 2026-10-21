import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import './Clients.css'
import { useLanguage } from '../../context/LanguageContext'

const API_URL =
  'https://kreandoapp.com/api/index.php'

const getClientLanguage = (
  languageCode,
  supportedLanguages
) => {
  return (
    supportedLanguages.find(
      (language) => language.code === languageCode
    ) || supportedLanguages[0] || null
  )
}

function Clients() {
  const { t, supportedLanguages } = useLanguage()
  const [clients, setClients] = useState([])
  const [countries, setCountries] = useState([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] =
    useState(false)

  const [editingClient, setEditingClient] =
    useState(null)

  const [deletingClient, setDeletingClient] =
    useState(null)

  const [form, setForm] = useState({
    full_name: '',
    dial_code: '+34',
    dial_code_source: 'catalog',
    phone_number: '',
    language_code: 'es',
    email: '',
    notes: '',
  })

  const getToken = () =>
    localStorage.getItem('access_token')

  // =====================================================
  // CARGAR CLIENTES
  // =====================================================

  const loadClients = async () => {
    const token = getToken()

    if (!token) {
      setError(t('clients.errors.invalidSession'))
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError('')

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

      const result =
        await response.json()

      if (response.status === 401) {
        setError(
          t('clients.errors.sessionExpired')
        )
        return
      }

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            t('clients.errors.loadClients')
        )
      }

      setClients(
        result.data || []
      )
    } catch (err) {
      console.error(
        '❌ Error cargando clientes:',
        err
      )

      setError(
        err.message ||
          t('clients.errors.loadClients')
      )
    } finally {
      setLoading(false)
    }
  }

  // =====================================================
  // CARGAR PAÍSES
  // =====================================================

  const loadCountries = async () => {
    const token = getToken()

    if (!token) return

    try {
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

      if (
        !response.ok ||
        !result.success
      ) {
        return
      }

      setCountries(
        result.data || []
      )
    } catch (err) {
      console.error(
        '❌ Error cargando países:',
        err
      )
    }
  }

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    loadClients()
    loadCountries()
  }, [])

  // =====================================================
  // FILTRAR CLIENTES
  // =====================================================

  const filteredClients =
    useMemo(() => {
      const value =
        search.trim().toLowerCase()

      if (!value) {
        return clients
      }

      return clients.filter(
        (client) => {
          const name =
            client.full_name ||
            client.name ||
            ''

          const phone =
            client.phone_number ||
            client.phone ||
            ''

          const dialCode =
            client.dial_code || ''

          const email =
            client.email || ''

          return (
            name
              .toLowerCase()
              .includes(value) ||
            phone
              .toLowerCase()
              .includes(value) ||
            dialCode
              .toLowerCase()
              .includes(value) ||
            email
              .toLowerCase()
              .includes(value)
          )
        }
      )
    }, [clients, search])

  // =====================================================
  // FORM
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
  // PAÍS SELECCIONADO
  // =====================================================

  const selectedCountry =
    useMemo(() => {
      if (
        form.dial_code_source !==
        'catalog'
      ) {
        return null
      }

      return (
        countries.find(
          (country) =>
            country.dial_code ===
            form.dial_code
        ) || null
      )
    }, [
      countries,
      form.dial_code,
      form.dial_code_source,
    ])

  // =====================================================
  // TELÉFONO
  // =====================================================

  const handlePhoneChange =
    (value) => {
      updateForm(
        'phone_number',
        value.replace(/\D/g, '')
      )
    }

  const isPhoneValid =
    useMemo(() => {
      const phone =
        form.phone_number.trim()

      if (!phone) {
        return false
      }

      if (
        form.dial_code_source ===
        'manual'
      ) {
        return (
          /^\+[0-9]{1,4}$/.test(
            form.dial_code
          ) &&
          /^[0-9]+$/.test(phone)
        )
      }

      if (!selectedCountry) {
        return false
      }

      const minDigits =
        Number(
          selectedCountry.min_digits
        )

      const maxDigits =
        Number(
          selectedCountry.max_digits
        )

      if (
        !Number.isInteger(
          minDigits
        ) ||
        !Number.isInteger(
          maxDigits
        )
      ) {
        return false
      }

      return (
        /^[0-9]+$/.test(phone) &&
        phone.length >= minDigits &&
        phone.length <= maxDigits
      )
    }, [
      form.dial_code,
      form.dial_code_source,
      form.phone_number,
      selectedCountry,
    ])

  const isFormValid =
    form.full_name.trim() !== '' &&
    isPhoneValid &&
    (!form.email.trim() ||
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.email.trim()
      ))

  // =====================================================
  // CREAR CLIENTE
  // =====================================================

  const openCreateDialog = () => {
    const defaultCountry =
      countries.find(
        (country) =>
          country.dial_code === '+34'
      ) ||
      countries[0] ||
      null

    setEditingClient(null)

    setForm({
      full_name: '',
      dial_code:
        defaultCountry?.dial_code ||
        '+34',
      dial_code_source:
        'catalog',
      phone_number: '',
      language_code: 'es',
      email: '',
      notes: '',
    })

    setError('')
    setDialogOpen(true)
  }

  // =====================================================
  // EDITAR CLIENTE
  // =====================================================

  const openEditDialog = (
    client
  ) => {
    setEditingClient(client)

    setForm({
      full_name:
        client.full_name || '',
      dial_code:
        client.dial_code || '+34',
      dial_code_source:
        client.dial_code_source ||
        'catalog',
      phone_number:
        String(
          client.phone_number || ''
        ).replace(/\D/g, ''),
      language_code:
        client.language_code || 'es',
      email:
        client.email || '',
      notes:
        client.notes || '',
    })

    setError('')
    setDialogOpen(true)
  }

  // =====================================================
  // CÓDIGO DE PAÍS
  // =====================================================

  const handleDialCodeChange =
    (value) => {
      if (
        value === '__manual__'
      ) {
        setForm((current) => ({
          ...current,
          dial_code_source:
            'manual',
          dial_code: '',
          phone_number: '',
        }))

        setError('')
        return
      }

      setForm((current) => ({
        ...current,
        dial_code_source:
          'catalog',
        dial_code: value,
        phone_number: '',
      }))

      setError('')
    }

  // =====================================================
  // CERRAR MODAL
  // =====================================================

  const closeDialog = () => {
    if (saving) return

    setDialogOpen(false)
    setEditingClient(null)
    setError('')
  }

  // =====================================================
  // GUARDAR CLIENTE
  // =====================================================

  const saveClient = async () => {
    if (!isFormValid) return

    const token = getToken()

    if (!token) {
      setError(
        t('clients.errors.invalidSession')
      )
      return
    }

    try {
      setSaving(true)
      setError('')

      const isEditing =
        editingClient !== null

      const url = isEditing
        ? `${API_URL}?action=customer&id=${editingClient.id}`
        : `${API_URL}?action=customer`

      const response =
        await fetch(url, {
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
            full_name:
              form.full_name.trim(),

            dial_code:
              form.dial_code.trim(),

            dial_code_source:
              form.dial_code_source,

            phone_number:
              form.phone_number.trim(),

            language_code:
              form.language_code,

            email:
              form.email.trim() ||
              null,

            notes:
              form.notes.trim() ||
              null,
          }),
        })

      const result =
        await response.json()

      if (
        response.status === 401
      ) {
        throw new Error(
          t('clients.errors.sessionExpired')
        )
      }

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            t('clients.errors.saveClient')
        )
      }

      setDialogOpen(false)
      setEditingClient(null)

      await loadClients()
    } catch (err) {
      console.error(
        '❌ Error guardando cliente:',
        err
      )

      setError(
        err.message ||
          t('clients.errors.saveClient')
      )
    } finally {
      setSaving(false)
    }
  }

  // =====================================================
  // ELIMINAR
  // =====================================================

  const openDeleteDialog =
    (client) => {
      setDeletingClient(client)
      setDeleteDialogOpen(true)
      setError('')
    }

  const closeDeleteDialog =
    () => {
      if (saving) return

      setDeleteDialogOpen(false)
      setDeletingClient(null)
      setError('')
    }

  const deleteClient =
    async () => {
      const token = getToken()

      if (
        !token ||
        !deletingClient
      ) {
        return
      }

      try {
        setSaving(true)
        setError('')

        const response =
          await fetch(
            `${API_URL}?action=customer&id=${deletingClient.id}`,
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
            t('clients.errors.sessionExpired')
          )
        }

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.message ||
              t('clients.errors.deleteClient')
          )
        }

        setDeleteDialogOpen(
          false
        )

        setDeletingClient(null)

        await loadClients()
      } catch (err) {
        console.error(
          '❌ Error eliminando cliente:',
          err
        )

        setError(
          err.message ||
            t('clients.errors.deleteClient')
        )
      } finally {
        setSaving(false)
      }
    }

  // =====================================================
  // HELPERS
  // =====================================================

  const getClientName =
    (client) =>
      client.full_name ||
      client.name ||
      t('clients.fallbacks.noName')

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
          .substring(0, 2)
          .toUpperCase()
      }

      return `${parts[0][0]}${parts[parts.length - 1][0]}`
        .toUpperCase()
    }

  const getPhone =
    (client) => {
      const dialCode =
        client.dial_code || ''

      const phone =
        client.phone_number ||
        ''

      if (!phone) {
        return t('clients.fallbacks.noPhone')
      }

      return `${dialCode} ${phone}`.trim()
    }

  const getCountryName =
    () => {
      if (
        form.dial_code_source ===
        'manual'
      ) {
        return t('clients.phone.manualCode')
      }

      return (
        selectedCountry?.name ||
        t('clients.phone.selectCountry')
      )
    }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <section className="clients-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="clients-header">

        <div className="clients-heading">

          <div className="clients-eyebrow">
            {t('clients.eyebrow')}
          </div>

          <h1 className="clients-title">

            <span
              className="clients-title-icon"
              aria-hidden="true"
            >
              👥
            </span>

            <span>
              {t('clients.title')}
            </span>

          </h1>

          <p className="clients-description">
            {t('clients.description')}
          </p>

        </div>

        <button
          type="button"
          className="clients-primary-button"
          onClick={
            openCreateDialog
          }
        >
          <span>＋</span>
          {t('clients.actions.new')}
        </button>

      </header>


      {/* =================================================
          ERROR
      ================================================= */}

      {error &&
        !dialogOpen &&
        !deleteDialogOpen && (
          <div className="clients-global-error">

            <span>⚠️</span>

            {error}

          </div>
        )}


      {/* =================================================
          TOOLBAR
      ================================================= */}

      <div className="clients-toolbar">

        <div className="clients-search">

          <span className="clients-search-icon">
            ⌕
          </span>

          <input
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder={t('clients.search.placeholder')}
            aria-label={t('clients.search.aria')}
          />

          {search && (
            <button
              type="button"
              className="clients-search-clear"
              onClick={() =>
                setSearch('')
              }
              aria-label={t('clients.search.clear')}
            >
              ×
            </button>
          )}

        </div>

        <div className="clients-results">

          <strong>
            {filteredClients.length}
          </strong>

          <span>
            {filteredClients.length ===
            1
              ? t('clients.results.singular')
              : t('clients.results.plural')}
          </span>

        </div>

      </div>


      {/* =================================================
          SUMMARY
      ================================================= */}

      <div className="clients-summary">

        <div className="clients-summary-card">

          <span className="clients-summary-icon">
            👥
          </span>

          <div>

            <strong>
              {clients.length}
            </strong>

            <span>
              {t('clients.summary.total')}
            </span>

          </div>

        </div>


        <div className="clients-summary-card clients-summary-card-accent">

          <span className="clients-summary-icon">
            ✓
          </span>

          <div>

            <strong>
              {filteredClients.length}
            </strong>

            <span>
              {t('clients.summary.matches')}
            </span>

          </div>

        </div>

      </div>


      {/* =================================================
          LISTA
      ================================================= */}

      <div className="clients-list-shell">

        {loading ? (

          <div className="clients-state">

            <div className="clients-spinner" />

            <strong>
              {t('clients.loading.title')}
            </strong>

            <span>
              {t('clients.loading.description')}
            </span>

          </div>

        ) : filteredClients.length ===
          0 ? (

          <div className="clients-state clients-empty-state">

            <div className="clients-empty-icon">
              {search
                ? '⌕'
                : '👥'}
            </div>

            <strong>
              {search
                ? t('clients.empty.searchTitle')
                : t('clients.empty.title')}
            </strong>

            <span>
              {search
                ? t('clients.empty.searchDescription')
                : t('clients.empty.description')}
            </span>

            {!search && (
              <button
                type="button"
                className="clients-secondary-primary"
                onClick={
                  openCreateDialog
                }
              >
                {`＋ ${t('clients.actions.create')}`}
              </button>
            )}

          </div>

        ) : (

          <>

            {/* DESKTOP */}

            <div className="clients-table">

              <div className="clients-table-head">

                <span>
                  {t('clients.table.client')}
                </span>

                <span>
                  {t('clients.table.contact')}
                </span>

                <span>
                  {t('clients.table.notes')}
                </span>

                <span>
                  {t('clients.table.actions')}
                </span>

              </div>


              {filteredClients.map(
                (client) => {

                  const name =
                    getClientName(
                      client
                    )

                  return (
                    <article
                      className="client-row"
                      key={client.id}
                    >

                      <div className="client-main">

                        <div className="client-avatar">
                          {getInitials(
                            name
                          )}
                        </div>

                        <div className="client-main-info">

                          <strong>
                            {name}
                          </strong>

                          <span
                            className="client-language-badge"
                            title={getClientLanguage(client.language_code, supportedLanguages)?.name || client.language_code}
                            aria-label={`${t('clients.form.language')}: ${getClientLanguage(client.language_code, supportedLanguages)?.name || client.language_code}`}
                          >
                            {getClientLanguage(client.language_code, supportedLanguages)?.flag || '🌐'}
                          </span>

                          {client.email && (
                            <span>
                              {client.email}
                            </span>
                          )}

                        </div>

                      </div>


                      <div className="client-contact">

                        <strong>
                          {getPhone(
                            client
                          )}
                        </strong>

                        {client.email && (
                          <span>
                            {client.email}
                          </span>
                        )}

                      </div>


                      <div className="client-notes">
                        {client.notes ||
                          t('clients.fallbacks.noNotes')}
                      </div>


                      <div className="client-actions">

                        <button
                          type="button"
                          className="client-action-button"
                          onClick={() =>
                            openEditDialog(
                              client
                            )
                          }
                          title={t('clients.actions.edit')}
                          aria-label={`${t('clients.actions.edit')} ${name}`}
                        >
                          ✎
                        </button>

                        <button
                          type="button"
                          className="client-action-button client-action-delete"
                          onClick={() =>
                            openDeleteDialog(
                              client
                            )
                          }
                          title={t('clients.actions.delete')}
                          aria-label={`${t('clients.actions.delete')} ${name}`}
                        >
                          🗑
                        </button>

                      </div>

                    </article>
                  )
                }
              )}

            </div>


            {/* MOBILE */}

            <div className="clients-mobile-list">

              {filteredClients.map(
                (client) => {

                  const name =
                    getClientName(
                      client
                    )

                  return (
                    <article
                      className="client-mobile-card"
                      key={client.id}
                    >

                      <div className="client-mobile-top">

                        <div className="client-main">

                          <div className="client-avatar">
                            {getInitials(
                              name
                            )}
                          </div>

                          <div className="client-main-info">

                            <strong>
                              {name}
                            </strong>

                            <span
                              className="client-language-badge"
                              title={getClientLanguage(client.language_code, supportedLanguages)?.name || client.language_code}
                              aria-label={`${t('clients.form.language')}: ${getClientLanguage(client.language_code, supportedLanguages)?.name || client.language_code}`}
                            >
                              {getClientLanguage(client.language_code, supportedLanguages)?.flag || '🌐'}
                            </span>

                            <span>
                              {getPhone(
                                client
                              )}
                            </span>

                          </div>

                        </div>

                        <span className="client-mobile-arrow">
                          ›
                        </span>

                      </div>


                      <div className="client-mobile-details">

                        {client.email && (
                          <div className="client-mobile-detail">

                            <span>
                              ✉
                            </span>

                            <span>
                              {client.email}
                            </span>

                          </div>
                        )}

                        {client.notes && (
                          <div className="client-mobile-detail">

                            <span>
                              ✎
                            </span>

                            <span>
                              {client.notes}
                            </span>

                          </div>
                        )}

                      </div>


                      <div className="client-mobile-actions">

                        <button
                          type="button"
                          className="client-mobile-edit"
                          onClick={() =>
                            openEditDialog(
                              client
                            )
                          }
                        >
                          {`✎ ${t('clients.actions.edit')}`}
                        </button>

                        <button
                          type="button"
                          className="client-mobile-delete"
                          onClick={() =>
                            openDeleteDialog(
                              client
                            )
                          }
                        >
                          {`🗑 ${t('clients.actions.delete')}`}
                        </button>

                      </div>

                    </article>
                  )
                }
              )}

            </div>


            <footer className="clients-list-footer">

              <span>
                {t('clients.footer.showing')}{' '}
                <strong>{filteredClients.length}</strong>{' '}
                {t('clients.footer.of')}{' '}
                <strong>{clients.length}</strong>{' '}
                {filteredClients.length === 1
                  ? t('clients.results.singular')
                  : t('clients.results.plural')}
              </span>

            </footer>

          </>

        )}

      </div>


      {/* =================================================
          MODAL CLIENTE
      ================================================= */}

      {dialogOpen && (

        <div
          className="client-modal-backdrop"
          onMouseDown={(e) => {
            if (
              e.target ===
              e.currentTarget
            ) {
              closeDialog()
            }
          }}
        >

          <div
            className="client-modal"
            role="dialog"
            aria-modal="true"
          >

            <div className="client-modal-header">

              <div>

                <span className="client-modal-eyebrow">
                  {editingClient
                    ? t('clients.modal.eyebrowEdit')
                    : t('clients.modal.eyebrowNew')}
                </span>

                <h2>
                  {editingClient
                    ? t('clients.modal.editTitle')
                    : t('clients.modal.newTitle')}
                </h2>

                <p>
                  {t('clients.modal.description')}
                </p>

              </div>

              <button
                type="button"
                className="client-modal-close"
                onClick={
                  closeDialog
                }
                disabled={saving}
                aria-label={t('common.close')}
              >
                ×
              </button>

            </div>


            <div className="client-modal-body">

              {error && (
                <div className="client-modal-error">
                  ⚠️ {error}
                </div>
              )}

              <div className="client-form-grid">

                <label className="client-field client-field-full">

                  <span>
                    {t('clients.form.fullName')} <b>*</b>
                  </span>

                  <input
                    value={
                      form.full_name
                    }
                    onChange={(e) =>
                      updateForm(
                        'full_name',
                        e.target.value
                      )
                    }
                    placeholder={t('clients.form.fullNamePlaceholder')}
                    autoComplete="name"
                  />

                </label>


                <div className="client-field client-field-full">

                  <span>
                    {t('clients.form.phone')} <b>*</b>
                  </span>

                  <div className="client-phone-grid">

                    <select
                      value={
                        form.dial_code_source ===
                        'manual'
                          ? '__manual__'
                          : form.dial_code
                      }
                      onChange={(e) =>
                        handleDialCodeChange(
                          e.target.value
                        )
                      }
                    >

                      {countries.map(
                        (country) => (
                          <option
                            key={
                              country.id
                            }
                            value={
                              country.dial_code
                            }
                          >
                            {country.flag}{' '}
                            {country.dial_code}
                          </option>
                        )
                      )}

                      <option value="__manual__">
                        {t('clients.phone.manualOption')}
                      </option>

                    </select>

                    <input
                      value={
                        form.phone_number
                      }
                      onChange={(e) =>
                        handlePhoneChange(
                          e.target.value
                        )
                      }
                      placeholder="612345678"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete="tel-national"
                      className={
                        form.phone_number
                          ? isPhoneValid
                            ? 'is-valid'
                            : 'is-invalid'
                          : ''
                      }
                    />

                  </div>


                  <small
                    className={
                      form.phone_number &&
                      isPhoneValid
                        ? 'client-field-hint valid'
                        : form.phone_number
                          ? 'client-field-hint invalid'
                          : 'client-field-hint'
                    }
                  >
                    {form.phone_number
                      ? isPhoneValid
                        ? `✓ ${t('clients.phone.validFor')} ${getCountryName()}`
                        : form.dial_code_source ===
                            'manual'
                          ? t('clients.phone.invalid')
                          : selectedCountry
                            ? `${t('clients.phone.rangePrefix')} ${selectedCountry.min_digits} ${t('clients.phone.rangeMiddle')} ${selectedCountry.max_digits} ${t('clients.phone.rangeSuffix')}`
                            : t('clients.phone.selectCountryHint')
                      : form.dial_code_source ===
                          'manual'
                        ? t('clients.phone.manualHint')
                        : selectedCountry
                          ? `${selectedCountry.name}: ${selectedCountry.min_digits}–${selectedCountry.max_digits} ${t('clients.phone.countrySuffix')}`
                          : t('clients.phone.selectCountryHint')}
                  </small>

                </div>


                <label className="client-field client-field-full">

                  <span>
                    🌍 {t('clients.form.language')}
                  </span>

                  <select
                    value={form.language_code}
                    onChange={(e) =>
                      updateForm(
                        'language_code',
                        e.target.value
                      )
                    }
                  >
                    {supportedLanguages.map(
                      (language) => (
                        <option
                          key={language.code}
                          value={language.code}
                        >
                          {language.flag}{' '}
                          {language.native_name ||
                            language.name}
                        </option>
                      )
                    )}
                  </select>

                </label>


                <label className="client-field client-field-full">

                  <span>
                    {t('clients.form.email')}
                  </span>

                  <input
                    type="email"
                    value={
                      form.email
                    }
                    onChange={(e) =>
                      updateForm(
                        'email',
                        e.target.value
                      )
                    }
                    placeholder={t('clients.form.emailPlaceholder')}
                    autoComplete="email"
                  />

                </label>


                <label className="client-field client-field-full">

                  <span>
                    {t('clients.table.notes')}
                  </span>

                  <textarea
                    value={
                      form.notes
                    }
                    onChange={(e) =>
                      updateForm(
                        'notes',
                        e.target.value
                      )
                    }
                    placeholder={t('clients.form.notesPlaceholder')}
                    rows={4}
                  />

                </label>

              </div>

            </div>


            <div className="client-modal-footer">

              <button
                type="button"
                className="client-button-secondary"
                onClick={
                  closeDialog
                }
                disabled={saving}
              >
                {t('common.cancel')}
              </button>

              <button
                type="button"
                className="client-button-primary"
                onClick={
                  saveClient
                }
                disabled={
                  saving ||
                  !isFormValid
                }
              >
                {saving
                  ? t('common.saving')
                  : editingClient
                    ? t('common.saveChanges')
                    : t('clients.actions.create')}
              </button>

            </div>

          </div>

        </div>

      )}


      {/* =================================================
          MODAL ELIMINAR
      ================================================= */}

      {deleteDialogOpen &&
        deletingClient && (

          <div
            className="client-modal-backdrop client-delete-backdrop"
            onMouseDown={(e) => {
              if (
                e.target ===
                e.currentTarget
              ) {
                closeDeleteDialog()
              }
            }}
          >

            <div
              className="client-delete-modal"
              role="dialog"
              aria-modal="true"
            >

              <div className="client-delete-icon">
                🗑
              </div>

              <span className="client-modal-eyebrow">
                {t('clients.delete.eyebrow')}
              </span>

              <h2>
                {t('clients.delete.title')}
              </h2>

              <p>
                {t('clients.delete.confirmPrefix')}{' '}
                <strong>
                  {getClientName(
                    deletingClient
                  )}
                </strong>
                ?
                <br />
                {t('clients.delete.irreversible')}
              </p>

              {error && (
                <div className="client-modal-error">
                  ⚠️ {error}
                </div>
              )}

              <div className="client-delete-actions">

                <button
                  type="button"
                  className="client-button-secondary"
                  onClick={
                    closeDeleteDialog
                  }
                  disabled={saving}
                >
                  {t('common.cancel')}
                </button>

                <button
                  type="button"
                  className="client-button-danger"
                  onClick={
                    deleteClient
                  }
                  disabled={saving}
                >
                  {saving
                    ? t('clients.delete.deleting')
                    : t('clients.actions.delete')}
                </button>

              </div>

            </div>

          </div>

        )}

    </section>
  )
}

export default Clients