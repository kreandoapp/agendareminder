import { useEffect, useRef, useState } from 'react'
import './Step1Location.css'
import wilbukLogo from '../../../assets/logo.png'

import { useLanguage } from '../../../context/LanguageContext'

const API_URL =
  import.meta.env.VITE_API_URL ||
  'https://kreandoapp.com/api/index.php'


/* ============================================================
   DETECTAR IDIOMA DEL NAVEGADOR
============================================================ */

function getBrowserLanguage(
  supportedLanguages
) {
  const browserLanguages =
    Array.isArray(navigator.languages) &&
    navigator.languages.length > 0
      ? navigator.languages
      : [
          navigator.language || '',
        ]

  for (
    const browserLanguage
    of browserLanguages
  ) {
    const languageCode =
      String(
        browserLanguage || ''
      )
        .toLowerCase()
        .split('-')[0]

    const supportedLanguage =
      supportedLanguages.find(
        language =>
          language.code ===
          languageCode
      )

    if (supportedLanguage) {
      return supportedLanguage.code
    }
  }

  /*
   * Si el navegador tiene un idioma
   * que todavía no soportamos,
   * usamos el primer idioma activo
   * disponible en el catálogo.
   */

  return (
    supportedLanguages[0]?.code ||
    ''
  )
}


/* ============================================================
   LIMPIAR IDIOMA ANTERIOR
============================================================ */

function resetOnboardingLanguage() {
  try {
    const rawUser =
      localStorage.getItem('user')

    const user =
      rawUser
        ? JSON.parse(rawUser)
        : null

    /*
     * Eliminamos la preferencia anterior
     * al comenzar nuevamente el Step 1.
     */

    if (user?.id) {
      localStorage.removeItem(
        `language_${user.id}`
      )
    }

    localStorage.removeItem(
      'language_active'
    )
  } catch (error) {
    console.warn(
      'No se pudo limpiar la preferencia de idioma del onboarding:',
      error
    )
  }
}


/* ============================================================
   ICONS
============================================================ */

function GlobeIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
      />

      <line
        x1="3"
        y1="12"
        x2="21"
        y2="12"
      />

      <path d="M12 3c2.5 2.6 3.7 5.6 3.7 9s-1.2 6.4-3.7 9c-2.5-2.6-3.7-5.6-3.7-9S9.5 5.6 12 3z" />
    </svg>
  )
}


function ChevronDownIcon({
  open = false,
}) {
  return (
    <svg
      className={`step1-chevron ${
        open ? 'open' : ''
      }`}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}


function ArrowRightIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line
        x1="5"
        y1="12"
        x2="19"
        y2="12"
      />

      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}


function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}


function SearchIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle
        cx="11"
        cy="11"
        r="7"
      />

      <line
        x1="16.5"
        y1="16.5"
        x2="21"
        y2="21"
      />
    </svg>
  )
}


/* ============================================================
   LANGUAGE PICKER — BANDERA SUPERIOR
============================================================ */

function LanguagePicker({
  value,
  options,
  onChange,
  disabled = false,
}) {
  const [
    open,
    setOpen,
  ] = useState(false)

  const wrapperRef =
    useRef(null)

  const selectedLanguage =
    options.find(
      option =>
        option.value === value
    ) || options[0]


  useEffect(() => {

    function handleOutsideClick(
      event
    ) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(
          event.target
        )
      ) {
        setOpen(false)
      }
    }


    function handleEscape(
      event
    ) {
      if (
        event.key === 'Escape'
      ) {
        setOpen(false)
      }
    }


    document.addEventListener(
      'mousedown',
      handleOutsideClick
    )

    document.addEventListener(
      'keydown',
      handleEscape
    )


    return () => {

      document.removeEventListener(
        'mousedown',
        handleOutsideClick
      )

      document.removeEventListener(
        'keydown',
        handleEscape
      )

    }

  }, [])


  return (
    <div
      className={`step1-language-picker ${
        open ? 'is-open' : ''
      }`}
      ref={wrapperRef}
    >

      <button
        type="button"
        className="step1-language-picker-trigger"
        onClick={() =>
          !disabled &&
          setOpen(
            previous =>
              !previous
          )
        }
        disabled={disabled}
        aria-label="Seleccionar idioma"
        aria-haspopup="listbox"
        aria-expanded={open}
      >

        <span className="step1-language-picker-flag">
          {
            selectedLanguage?.flag ||
            '🌐'
          }
        </span>

        <ChevronDownIcon
          open={open}
        />

      </button>


      {open && (
        <div
          className="step1-language-picker-menu"
          role="listbox"
        >

          {options.map(
            option => {

              const selected =
                option.value ===
                value

              return (
                <button
                  key={
                    option.value
                  }
                  type="button"
                  className={`step1-language-picker-option ${
                    selected
                      ? 'selected'
                      : ''
                  }`}
                  onClick={
                    event => {
                      event.preventDefault()

                      onChange(
                        option.value
                      )

                      setOpen(false)
                    }
                  }
                  role="option"
                  aria-selected={
                    selected
                  }
                >

                  <span className="step1-language-picker-option-flag">
                    {option.flag}
                  </span>

                  <span className="step1-language-picker-option-name">
                    {option.label}
                  </span>

                  {selected && (
                    <span className="step1-language-picker-option-check">
                      <CheckIcon />
                    </span>
                  )}

                </button>
              )
            }
          )}

        </div>
      )}

    </div>
  )
}


/* ============================================================
   CUSTOM SELECT
============================================================ */

function CustomSelect({
  label,
  value,
  options,
  t,
  onChange,
  placeholder,
  disabled = false,
  searchable = false,
  icon,
  emptyMessage = 'No hay resultados.',
}) {

  const [
    open,
    setOpen,
  ] = useState(false)

  const [
    search,
    setSearch,
  ] = useState('')

  const wrapperRef =
    useRef(null)

  const searchRef =
    useRef(null)


  const selectedOption =
    options.find(
      option =>
        option.value === value
    ) || null


  const filteredOptions =
    searchable
      ? options.filter(
          option =>
            `${option.label} ${
              option.searchText ||
              ''
            }`
              .toLowerCase()
              .includes(
                search
                  .trim()
                  .toLowerCase()
              )
        )
      : options


  useEffect(() => {

    if (!open) {
      setSearch('')
      return
    }


    if (searchable) {

      requestAnimationFrame(
        () => {
          searchRef.current?.focus()
        }
      )

    }

  }, [
    open,
    searchable,
  ])


  useEffect(() => {

    function handleOutsideClick(
      event
    ) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(
          event.target
        )
      ) {
        setOpen(false)
      }
    }


    function handleEscape(
      event
    ) {
      if (
        event.key === 'Escape'
      ) {
        setOpen(false)
      }
    }


    document.addEventListener(
      'mousedown',
      handleOutsideClick
    )

    document.addEventListener(
      'keydown',
      handleEscape
    )


    return () => {

      document.removeEventListener(
        'mousedown',
        handleOutsideClick
      )

      document.removeEventListener(
        'keydown',
        handleEscape
      )

    }

  }, [])


  function handleToggle() {

    if (disabled) {
      return
    }

    setOpen(
      previous =>
        !previous
    )
  }


  function handleSelect(
    option
  ) {

    onChange(
      option.value
    )

    setOpen(false)
    setSearch('')
  }


  return (
    <div
      className={`step1-custom-select ${
        open ? 'is-open' : ''
      }`}
      ref={wrapperRef}
    >

      <button
        type="button"
        className="step1-custom-select-trigger"
        onClick={
          handleToggle
        }
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >

        <span className="step1-custom-select-trigger-left">

          {icon && (
            <span className="step1-custom-select-icon">
              {icon}
            </span>
          )}

          {selectedOption?.flag && (
            <span className="step1-custom-select-flag">
              {
                selectedOption.flag
              }
            </span>
          )}

          <span
            className={
              selectedOption
                ? 'step1-custom-select-value'
                : 'step1-custom-select-placeholder'
            }
          >
            {
              selectedOption?.label ||
              placeholder
            }
          </span>

        </span>


        <ChevronDownIcon
          open={open}
        />

      </button>


      {open && (
        <div
          className="step1-custom-select-menu"
          role="listbox"
        >

          {searchable && (
            <div className="step1-custom-select-search">

              <SearchIcon />

              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={
                  event =>
                    setSearch(
                      event.target.value
                    )
                }
                placeholder={t(
                  'onboarding.step1.searchCountry'
                )}
                onClick={
                  event =>
                    event.stopPropagation()
                }
              />

            </div>
          )}


          <div className="step1-custom-select-options">

            {filteredOptions.length >
            0 ? (

              filteredOptions.map(
                option => {

                  const selected =
                    option.value ===
                    value

                  return (
                    <button
                      key={
                        option.value
                      }
                      type="button"
                      className={`step1-custom-select-option ${
                        selected
                          ? 'selected'
                          : ''
                      }`}
                      onClick={() =>
                        handleSelect(
                          option
                        )
                      }
                      role="option"
                      aria-selected={
                        selected
                      }
                    >

                      {option.flag && (
                        <span className="step1-option-flag">
                          {option.flag}
                        </span>
                      )}

                      <span className="step1-option-content">

                        <span className="step1-option-label">
                          {
                            option.label
                          }
                        </span>

                        {option.secondary && (
                          <span className="step1-option-secondary">
                            {
                              option.secondary
                            }
                          </span>
                        )}

                      </span>

                      {selected && (
                        <span className="step1-option-check">
                          <CheckIcon />
                        </span>
                      )}

                    </button>
                  )
                }
              )

            ) : (

              <div className="step1-custom-select-empty">
                {
                  emptyMessage
                }
              </div>

            )}

          </div>

        </div>
      )}

    </div>
  )
}


/* ============================================================
   COMPONENT
============================================================ */

export default function Step1Location({
  onNext,
  onSaved,
  onSessionExpired,
}) {

  const {
    t,
    setLanguageFromBusiness,
    supportedLanguages,
    catalogsLoaded,
  } = useLanguage()


  /* ============================================================
     STATE
  ============================================================ */

  const [
    countries,
    setCountries,
  ] = useState([])


  const [
    selectedCountryCode,
    setSelectedCountryCode,
  ] = useState('')


  const [
    suggestedCountryCode,
    setSuggestedCountryCode,
  ] = useState('')


  const [
    selectedLanguage,
    setSelectedLanguage,
  ] = useState('')


  const [
    businessName,
    setBusinessName,
  ] = useState('')


  const [
    loadingBusiness,
    setLoadingBusiness,
  ] = useState(true)


  const [
    loadingCountries,
    setLoadingCountries,
  ] = useState(true)


  const [
    detectingCountry,
    setDetectingCountry,
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
    success,
    setSuccess,
  ] = useState('')


  /* ============================================================
     DETECTAR IDIOMA AL ENTRAR
  ============================================================ */

  useEffect(() => {

    if (
      !catalogsLoaded ||
      !Array.isArray(supportedLanguages) ||
      supportedLanguages.length === 0
    ) {
      return
    }

    /*
     * Limpiamos la preferencia anterior.
     */

    resetOnboardingLanguage()


    /*
     * Detectamos el idioma del navegador
     * usando el catálogo activo de la API.
     */

    const initialLanguage =
      getBrowserLanguage(
        supportedLanguages
      )

    if (!initialLanguage) {
      return
    }


    setSelectedLanguage(
      initialLanguage
    )


    /*
     * Actualizamos temporalmente
     * la interfaz.
     *
     * Todavía no se guarda.
     */

    setLanguageFromBusiness(
      initialLanguage
    )

  }, [
    catalogsLoaded,
    supportedLanguages,
    setLanguageFromBusiness,
  ])


  /* ============================================================
     CARGAR PAÍSES
  ============================================================ */

  useEffect(() => {

    let cancelled = false


    async function loadCountries() {

      try {

        setLoadingCountries(
          true
        )

        setError('')


        const response =
          await fetch(
            `${API_URL}?action=countries`,
            {
              method: 'GET',

              headers: {
                Accept:
                  'application/json',
              },
            }
          )


        const data =
          await response.json()


        if (
          !response.ok ||
          !data?.success
        ) {
          throw new Error(
            data?.message ||
              'No se pudieron cargar los países.'
          )
        }


        if (cancelled) {
          return
        }


        const list =
          Array.isArray(
            data.data
          )
            ? data.data
            : []


        const activeCountries =
          list.filter(
            country =>
              Number(
                country.enabled
              ) === 1 ||
              country.enabled ===
                true
          )


        setCountries(
          activeCountries
        )

      } catch (err) {

        if (cancelled) {
          return
        }


        console.error(
          'Error cargando países:',
          err
        )


        setError(
          t(
            'onboarding.step1.errors.loadCountries'
          )
        )

      } finally {

        if (!cancelled) {
          setLoadingCountries(
            false
          )
        }

      }

    }


    loadCountries()


    return () => {
      cancelled = true
    }

  }, [t])


  /* ============================================================
     CARGAR NEGOCIO
  ============================================================ */

  useEffect(() => {

    let cancelled = false


    async function loadBusinessSettings() {

      const token =
        localStorage.getItem(
          'access_token'
        )


      if (!token) {

        setLoadingBusiness(
          false
        )


        if (
          typeof onSessionExpired ===
          'function'
        ) {
          onSessionExpired()
        }


        return
      }


      try {

        const response =
          await fetch(
            `${API_URL}?action=business-settings`,
            {
              method: 'GET',

              headers: {
                Accept:
                  'application/json',

                Authorization:
                  `Bearer ${token}`,
              },

              cache: 'no-store',
            }
          )


        if (
          response.status ===
          401
        ) {

          if (
            typeof onSessionExpired ===
            'function'
          ) {
            onSessionExpired()
          }

          return
        }


        const data =
          await response.json()


        if (
          !response.ok ||
          !data?.success
        ) {
          throw new Error(
            data?.message ||
              t(
                'onboarding.step1.errors.loadBusiness'
              )
          )
        }


        if (cancelled) {
          return
        }


        const business =
          data.data || {}


        const savedName =
          String(
            business.name ||
              business.business_name ||
              ''
          ).trim()


        setBusinessName(
          savedName
        )

      } catch (err) {

        if (cancelled) {
          return
        }


        console.error(
          'Error cargando datos del negocio:',
          err
        )

      } finally {

        if (!cancelled) {
          setLoadingBusiness(
            false
          )
        }

      }

    }


    loadBusinessSettings()


    return () => {
      cancelled = true
    }

  }, [
    onSessionExpired,
    t,
  ])


  /* ============================================================
     DETECTAR PAÍS
  ============================================================ */

  useEffect(() => {

    let cancelled = false


    async function detectCountry() {

      try {

        setDetectingCountry(
          true
        )


        let detectedCode = ''


        try {

          const response =
            await fetch(
              'https://ipapi.co/json/',
              {
                method: 'GET',

                headers: {
                  Accept:
                    'application/json',
                },
              }
            )


          if (response.ok) {

            const data =
              await response.json()


            detectedCode =
              String(
                data?.country_code ||
                  ''
              )
                .trim()
                .toUpperCase()

          }

        } catch (
          primaryError
        ) {

          console.warn(
            'ipapi.co no respondió:',
            primaryError
          )

        }


        if (!detectedCode) {

          try {

            const response =
              await fetch(
                'https://ipwho.is/',
                {
                  method: 'GET',

                  headers: {
                    Accept:
                      'application/json',
                  },
                }
              )


            if (response.ok) {

              const data =
                await response.json()


              detectedCode =
                String(
                  data?.country_code ||
                    ''
                )
                  .trim()
                  .toUpperCase()

            }

          } catch (
            fallbackError
          ) {

            console.warn(
              'No se pudo detectar el país:',
              fallbackError
            )

          }

        }


        if (
          cancelled ||
          !detectedCode
        ) {
          return
        }


        setSuggestedCountryCode(
          detectedCode
        )

      } catch (err) {

        console.warn(
          'No se pudo detectar el país:',
          err
        )

      } finally {

        if (!cancelled) {
          setDetectingCountry(
            false
          )
        }

      }

    }


    detectCountry()


    return () => {
      cancelled = true
    }

  }, [])


  /* ============================================================
     APLICAR PAÍS DETECTADO
  ============================================================ */

  useEffect(() => {

    if (
      !suggestedCountryCode ||
      selectedCountryCode ||
      countries.length === 0
    ) {
      return
    }


    const suggestedCountry =
      countries.find(
        country =>
          String(
            country.code
          ).toUpperCase() ===
          suggestedCountryCode
      )


    if (!suggestedCountry) {
      return
    }


    setSelectedCountryCode(
      String(
        suggestedCountry.code
      ).toUpperCase()
    )

  }, [
    countries,
    suggestedCountryCode,
    selectedCountryCode,
  ])


  /* ============================================================
     PAÍS ACTUAL
  ============================================================ */

  const selectedCountry =
    countries.find(
      country =>
        String(
          country.code
        ).toUpperCase() ===
        String(
          selectedCountryCode
        ).toUpperCase()
    ) || null


  /* ============================================================
     PAÍS DETECTADO
  ============================================================ */

  const suggestedCountry =
    countries.find(
      country =>
        String(
          country.code
        ).toUpperCase() ===
        suggestedCountryCode
    ) || null



  /* ============================================================
     OPCIONES PAÍSES
  ============================================================ */

  const countryOptions =
    countries.map(
      country => ({
        value:
          String(
            country.code
          ).toUpperCase(),

        label:
          country.name,

        flag:
          country.flag ||
          '🌎',

        secondary:
          country.dial_code
            ? country.dial_code
            : '',

        searchText:
          `${country.name} ${
            country.code
          } ${
            country.dial_code ||
            ''
          }`,
      })
    )


  /* ============================================================
     OPCIONES IDIOMA
  ============================================================ */

  const languageOptions =
    supportedLanguages.map(
      language => ({
        value:
          language.code,

        label:
          language.native_name ||
          language.name,

        flag:
          language.flag ||
          '🌐',
      })
    )


  /* ============================================================
     CAMBIAR PAÍS
  ============================================================ */

  function handleCountryChange(
    countryCode
  ) {

    setSelectedCountryCode(
      countryCode
    )

    setError('')
    setSuccess('')
  }


  /* ============================================================
     CAMBIAR IDIOMA
  ============================================================ */

  function handleLanguageChange(
    languageCode
  ) {

    /*
     * Actualizamos la selección
     * del selector inferior.
     */

    setSelectedLanguage(
      languageCode
    )


    /*
     * Cambiamos inmediatamente
     * el idioma de toda la interfaz.
     *
     * NO se persiste todavía.
     */

    setLanguageFromBusiness(
      languageCode
    )


    setError('')
    setSuccess('')
  }


  /* ============================================================
     GUARDAR
  ============================================================ */

  async function handleContinue() {

    const normalizedBusinessName =
      businessName.trim()


    if (
      !normalizedBusinessName ||
      !selectedCountry ||
      !selectedLanguage ||
      saving
    ) {
      return
    }


    try {

      setSaving(true)

      setError('')
      setSuccess('')


      const payload = {
        name:
          normalizedBusinessName,

        country:
          selectedCountry.code,

        dial_code:
          selectedCountry.dial_code,

        timezone:
          selectedCountry.timezone,

        currency_code:
          selectedCountry.currency_code,

        currency_symbol:
          selectedCountry.currency_symbol,

        language:
          selectedLanguage,
      }


      const token =
        localStorage.getItem(
          'access_token'
        )


      if (!token) {

        if (
          typeof onSessionExpired ===
          'function'
        ) {
          onSessionExpired()
        }

        return
      }


      const response =
        await fetch(
          `${API_URL}?action=business-settings`,
          {
            method: 'PUT',

            headers: {
              'Content-Type':
                'application/json',

              Accept:
                'application/json',

              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify(
                payload
              ),
          }
        )


      if (
        response.status ===
        401
      ) {

        if (
          typeof onSessionExpired ===
          'function'
        ) {
          onSessionExpired()
        }

        return
      }


      const data =
        await response.json()


      if (
        !response.ok ||
        !data?.success
      ) {
        throw new Error(
          data?.message ||
            t(
              'onboarding.step1.errors.saveSettings'
            )
        )
      }


      /* ========================================================
         ACTUALIZAR ONBOARDING
      ======================================================== */

      const onboardingResponse =
        await fetch(
          `${API_URL}?action=onboarding-step`,
          {
            method: 'PUT',

            headers: {
              'Content-Type':
                'application/json',

              Accept:
                'application/json',

              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify({
                current_step: 2,
              }),
          }
        )


      if (
        onboardingResponse.status ===
        401
      ) {

        if (
          typeof onSessionExpired ===
          'function'
        ) {
          onSessionExpired()
        }

        return
      }


      const onboardingData =
        await onboardingResponse.json()


      if (
        !onboardingResponse.ok ||
        !onboardingData?.success
      ) {
        throw new Error(
          onboardingData?.message ||
            t(
              'onboarding.step1.errors.advance'
            )
        )
      }


      /* ========================================================
         GUARDAR IDIOMA DEFINITIVAMENTE
      ======================================================== */

      setLanguageFromBusiness(
        selectedLanguage
      )


      /* ========================================================
         DATOS GUARDADOS
      ======================================================== */

      const savedData = {
        name:
          normalizedBusinessName,

        country:
          selectedCountry.name,

        country_code:
          selectedCountry.code,

        dial_code:
          selectedCountry.dial_code,

        timezone:
          selectedCountry.timezone,

        currency_code:
          selectedCountry.currency_code,

        currency_symbol:
          selectedCountry.currency_symbol,

        language:
          selectedLanguage,
      }


      /* ========================================================
         CONTINUAR
      ======================================================== */

      setSuccess(
        t(
          'onboarding.step1.success'
        )
      )


      if (
        typeof onSaved ===
        'function'
      ) {
        onSaved(savedData)
      }


      if (
        typeof onNext ===
        'function'
      ) {
        onNext(savedData)
      }


    } catch (err) {

      console.error(
        'Error guardando configuración:',
        err
      )


      setError(
        err?.message ||
          t(
            'onboarding.step1.errors.saveSettings'
          )
      )

    } finally {

      setSaving(false)

    }

  }


  /* ============================================================
     VALIDACIÓN
  ============================================================ */

  const canContinue =
    Boolean(
      businessName.trim()
    ) &&
    Boolean(
      selectedCountry
    ) &&
    Boolean(
      selectedLanguage
    ) &&
    !saving &&
    !loadingBusiness


  /* ============================================================
     CERRAR SESIÓN
  ============================================================ */

  function handleLogout() {
    try {
      const rawUser = localStorage.getItem('user')

      if (rawUser) {
        try {
          const user = JSON.parse(rawUser)

          if (user?.id) {
            localStorage.removeItem(`language_${user.id}`)
          }
        } catch {
          // Si el usuario no puede parsearse, continuamos limpiando la sesión.
        }
      }

      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      localStorage.removeItem('language_active')
    } catch (error) {
      console.warn('No se pudo limpiar la sesión local:', error)
    }

    window.location.href = 'https://kreandoapp.com/wilbuk/'
  }


  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div className="step1-location">

      <div className="step1-container">

        {/* ======================================================
            BRAND
        ====================================================== */}

        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            marginBottom: '18px',
          }}
        >

          <div className="step1-brand">

            <div className="step1-brand-icon">
              <img
                src={wilbukLogo}
                alt="Wilbuk"
                style={{
                  width: '34px',
                  height: '34px',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            </div>

            <div className="step1-brand-name">

              <span
                style={{
                  color: 'var(--color-text)',
                  fontWeight: 800,
                }}
              >
                Wil
              </span>

              <span
                style={{
                  background:
                    'linear-gradient(135deg, #08bdf5 0%, #168cff 42%, #6638ff 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontWeight: 800,
                }}
              >
                buk
              </span>

            </div>

          </div>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              flexShrink: 0,
              border: 'none',
              background: 'transparent',
              color: 'var(--color-text-secondary, #7a8490)',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              padding: '7px 9px',
              borderRadius: '8px',
              transition: 'color 0.2s ease, background 0.2s ease',
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.color = 'var(--color-danger, #d94b4b)'
              event.currentTarget.style.background = 'rgba(217, 75, 75, 0.06)'
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.color = 'var(--color-text-secondary, #7a8490)'
              event.currentTarget.style.background = 'transparent'
            }}
          >
            {t('sidebar.logout')}
          </button>

        </div>


        {/* ======================================================
            PROGRESS
        ====================================================== */}

        <div className="step1-progress">

          <div className="step1-progress-info">

            <span>
              {t(
                'onboarding.step1.initialSetup'
              )}
            </span>

            <strong>
              {t(
                'onboarding.step1.progress'
              )}
            </strong>

          </div>


          <div className="step1-progress-track">

            <div className="step1-progress-bar" />

          </div>

        </div>


        {/* ======================================================
            CARD
        ====================================================== */}

        <div className="step1-card">

          {/* BANDERA SUPERIOR */}

          <LanguagePicker
            value={
              selectedLanguage
            }
            options={
              languageOptions
            }
            onChange={
              handleLanguageChange
            }
            disabled={
              saving
            }
          />


          <div className="step1-icon-box">
            <GlobeIcon />
          </div>


          <h1>
            {t(
              'onboarding.step1.title'
            )}
          </h1>


          <p className="step1-description">
            {t(
              'onboarding.step1.description'
            )}
          </p>


          {/* ====================================================
              NOMBRE
          ==================================================== */}

          <label
            htmlFor="step1-business-name"
            className="step1-label"
          >
            {t(
              'onboarding.step1.businessName'
            )}
          </label>


          <input
            id="step1-business-name"
            type="text"
            value={
              businessName
            }
            onChange={
              event => {

                setBusinessName(
                  event.target.value
                )

                setError('')
                setSuccess('')

              }
            }
            placeholder={
              t(
                'onboarding.step1.businessNamePlaceholder'
              )
            }
            maxLength={100}
            disabled={
              saving ||
              loadingBusiness
            }
            autoComplete="organization"
          />


          {/* ====================================================
              PAÍS
          ==================================================== */}

          <label className="step1-label">

            {t(
              'onboarding.step1.country'
            )}

          </label>


          <CustomSelect
            t={t}
            value={
              selectedCountryCode
            }
            options={
              countryOptions
            }
            onChange={
              handleCountryChange
            }
            placeholder={
              loadingCountries
                ? t(
                    'onboarding.step1.loadingCountries'
                  )
                : t(
                    'onboarding.step1.selectCountry'
                  )
            }
            disabled={
              loadingCountries ||
              saving
            }
            searchable
            icon={
              <GlobeIcon />
            }
            emptyMessage={
              t(
                'onboarding.step1.noCountryResults'
              )
            }
          />


          {/* ====================================================
              PAÍS DETECTADO
          ==================================================== */}

          {suggestedCountry && (
            <div className="step1-suggestion">

              <span className="step1-suggestion-dot" />

              <span>

                {t(
                  'onboarding.step1.detectedCountry'
                )}{' '}

                <strong>

                  {
                    suggestedCountry.flag
                  }{' '}

                  {
                    suggestedCountry.name
                  }

                </strong>

              </span>

            </div>
          )}


          {/* ====================================================
              INFORMACIÓN DEL PAÍS
          ==================================================== */}

          {selectedCountry && (
            <div className="step1-country-info">

              <div className="step1-country-flag">

                {
                  selectedCountry.flag
                }

              </div>


              <div>

                <div className="step1-country-name">

                  {
                    selectedCountry.name
                  }

                </div>


                <div className="step1-country-details">

                  {
                    selectedCountry.dial_code
                  }

                  {' · '}

                  {
                    selectedCountry.timezone
                  }

                </div>

              </div>

            </div>
          )}


          {/* ====================================================
              IDIOMA — SELECCIÓN MANUAL
          ==================================================== */}

          <label className="step1-label">

            🌐{' '}
            {t(
              'onboarding.step1.language'
            )}

          </label>


          <CustomSelect
            t={t}
            value={
              selectedLanguage
            }
            options={
              languageOptions
            }
            onChange={
              handleLanguageChange
            }
            placeholder={
              t(
                'onboarding.step1.selectLanguage'
              )
            }
            disabled={
              saving
            }
          />


          {/* ====================================================
              IDIOMA DETECTADO
          ==================================================== */}

          <div className="step1-language-detected">

            <span className="step1-suggestion-dot" />

            <span>

              {t(
                'onboarding.step1.detectedLanguage'
              )}

            </span>

          </div>


          {/* ====================================================
              ERROR
          ==================================================== */}

          {error && (
            <div className="step1-error">

              {error}

            </div>
          )}


          {/* ====================================================
              SUCCESS
          ==================================================== */}

          {success && (
            <div className="step1-success">

              <CheckIcon />

              <span>
                {success}
              </span>

            </div>
          )}


          {/* ====================================================
              ACTION
          ==================================================== */}

          <div className="step1-actions">

            <button
              type="button"
              className="step1-continue"
              disabled={
                !canContinue
              }
              onClick={
                handleContinue
              }
            >

              {saving ? (
                <>
                  <span className="step1-spinner" />

                  {t(
                    'onboarding.step1.saving'
                  )}
                </>
              ) : (
                <>
                  {t(
                    'onboarding.step1.continue'
                  )}

                  <ArrowRightIcon />

                </>
              )}

            </button>

          </div>

        </div>

      </div>

    </div>
  )
}