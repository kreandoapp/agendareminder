import { useEffect, useState } from 'react'

import { useTheme } from '../../context/ThemeContext'
import { useLanguage } from '../../context/LanguageContext'

import './Settings.css'


const API_URL =
  'https://kreandoapp.com/api/index.php'



export default function Settings() {

  /* =====================================================
     THEME
  ===================================================== */

  const {
    theme,
    setTheme,
  } = useTheme()


  /* =====================================================
     LANGUAGE
  ===================================================== */

  const {
    t,
    setLanguageFromBusiness,
  } = useLanguage()


  /* =====================================================
     BUSINESS SETTINGS
  ===================================================== */

  const [
    countries,
    setCountries,
  ] = useState([])


  const [
    languages,
    setLanguages,
  ] = useState([])


  const [
    name,
    setName,
  ] = useState('')


  const [
    address,
    setAddress,
  ] = useState('')


  const [
    reviewUrl,
    setReviewUrl,
  ] = useState('')


  const [
    country,
    setCountry,
  ] = useState('')


  const [
    dialCode,
    setDialCode,
  ] = useState('')


  const [
    timezone,
    setTimezone,
  ] = useState('')


  const [
    currencyCode,
    setCurrencyCode,
  ] = useState('')


  const [
    currencySymbol,
    setCurrencySymbol,
  ] = useState('')


  const [
    language,
    setLanguage,
  ] = useState('es')


  /* =====================================================
     STATE
  ===================================================== */

  const [
    loading,
    setLoading,
  ] = useState(true)


  const [
    saving,
    setSaving,
  ] = useState(false)


  const [
    message,
    setMessage,
  ] = useState('')


  const [
    error,
    setError,
  ] = useState('')


  const token =
    localStorage.getItem(
      'access_token'
    )


  /* =====================================================
     LOAD
  ===================================================== */

  useEffect(() => {

    loadSettings()

  }, [])


  /* =====================================================
     LOAD SETTINGS
  ===================================================== */

  async function loadSettings() {

    try {

      setLoading(true)

      setError('')


      const headers = {
        Authorization:
          `Bearer ${token}`,
      }


      const [
        catalogsResponse,
        settingsResponse,
      ] = await Promise.all([

        fetch(
          `${API_URL}?action=catalogs`,
          {
            headers,
          }
        ),

        fetch(
          `${API_URL}?action=business-settings`,
          {
            headers,
          }
        ),

      ])


      const catalogsData =
        await catalogsResponse.json()


      const settingsData =
        await settingsResponse.json()


      /* =================================================
         CATALOGS
      ================================================= */

      if (
        !catalogsResponse.ok ||
        !catalogsData.success
      ) {

        throw new Error(
          catalogsData.message ||
            t('settings.errors.loadCountries')
        )

      }


      /* =================================================
         SETTINGS
      ================================================= */

      if (
        !settingsResponse.ok ||
        !settingsData.success
      ) {

        throw new Error(
          settingsData.message ||
            t('settings.errors.loadSettings')
        )

      }


      const catalogData =
        catalogsData.data || {}


      const availableCountries =
        catalogData.countries || []


      const availableLanguages =
        catalogData.languages || []


      const settings =
        settingsData.data || {}


      setCountries(
        availableCountries
      )


      setLanguages(
        availableLanguages
      )


      /* =================================================
         BUSINESS
      ================================================= */

      setName(
        settings.name || ''
      )


      setAddress(
        settings.address || ''
      )


      setReviewUrl(
        settings.review_url || ''
      )


      /* =================================================
         COUNTRY
      ================================================= */

      const savedCountry =
        settings.country || ''


      setCountry(
        savedCountry
      )


      const savedCountryData =
        availableCountries.find(
          (item) =>
            item.code ===
            savedCountry
        )


      /* =================================================
         DIAL CODE
      ================================================= */

      setDialCode(
        savedCountryData?.dial_code ||
          settings.dial_code ||
          ''
      )


      /* =================================================
         TIMEZONE
      ================================================= */

      setTimezone(
        savedCountryData?.timezone ||
          settings.timezone ||
          ''
      )


      /* =================================================
         CURRENCY CODE
      ================================================= */

      setCurrencyCode(
        savedCountryData?.currency_code ||
          settings.currency_code ||
          ''
      )


      /* =================================================
         CURRENCY SYMBOL
      ================================================= */

      setCurrencySymbol(
        savedCountryData?.currency_symbol ||
          settings.currency_symbol ||
          ''
      )


      /* =================================================
         LANGUAGE
      ================================================= */

      const savedLanguage =
        availableLanguages.some(
          (item) =>
            item.code === settings.language
        )
          ? settings.language
          : (
              availableLanguages[0]?.code ||
              'es'
            )


      setLanguage(
        savedLanguage
      )


      /*
       * El idioma de una cuenta autenticada
       * viene de business.language.
       *
       * No usamos setLanguagePreference()
       * porque esa función pertenece al
       * idioma utilizado antes del login.
       */
      setLanguageFromBusiness(
        savedLanguage
      )


    } catch (err) {

      console.error(
        'Error cargando configuración:',
        err
      )


      setError(
        err.message ||
          t('settings.errors.loadSettings')
      )

    } finally {

      setLoading(false)

    }

  }


  /* =====================================================
     COUNTRY CHANGE
  ===================================================== */

  function handleCountryChange(
    event
  ) {

    const code =
      event.target.value


    setCountry(code)


    const selected =
      countries.find(
        (item) =>
          item.code === code
      )


    setDialCode(
      selected?.dial_code || ''
    )


    setTimezone(
      selected?.timezone || ''
    )


    setCurrencyCode(
      selected?.currency_code || ''
    )


    setCurrencySymbol(
      selected?.currency_symbol || ''
    )


    setMessage('')

    setError('')

  }


  /* =====================================================
     SAVE SETTINGS
  ===================================================== */

  async function saveSettings() {

    const cleanName =
      name.trim()


    const cleanAddress =
      address.trim()


    const cleanReviewUrl =
      reviewUrl.trim()


    /* =================================================
       VALIDATION
    ================================================= */

    if (!cleanName) {

      setError(
        t('settings.errors.nameRequired')
      )

      return
    }


    if (
      cleanReviewUrl &&
      !filterValidUrl(
        cleanReviewUrl
      )
    ) {

      setError(
        t('settings.errors.reviewUrlInvalid')
      )

      return
    }


    if (!country) {

      setError(
        t('settings.errors.countryRequired')
      )

      return
    }


    if (!dialCode) {

      setError(
        t('settings.errors.dialCodeMissing')
      )

      return
    }


    if (!timezone) {

      setError(
        t('settings.errors.timezoneMissing')
      )

      return
    }


    if (!currencyCode) {

      setError(
        t('settings.errors.currencyMissing')
      )

      return
    }


    if (!currencySymbol) {

      setError(
        t('settings.errors.currencySymbolMissing')
      )

      return
    }


    if (!language) {

      setError(
        t('settings.errors.languageRequired')
      )

      return
    }


    /* =================================================
       SAVE
    ================================================= */

    try {

      setSaving(true)

      setMessage('')

      setError('')


      const response =
        await fetch(
          `${API_URL}?action=business-settings`,
          {
            method: 'PUT',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({

              name:
                cleanName,

              address:
                cleanAddress,

              review_url:
                cleanReviewUrl,

              country,

              dial_code:
                dialCode,

              timezone,

              currency_code:
                currencyCode,

              currency_symbol:
                currencySymbol,

              language,

            }),
          }
        )


      const data =
        await response.json()


      if (
        !response.ok ||
        !data.success
      ) {

        throw new Error(
          data.message ||
            t('settings.errors.saveSettings')
        )

      }


      /*
       * La API ya guardó el idioma en
       * businesses.language.
       *
       * Actualizamos inmediatamente el
       * LanguageContext para que toda la
       * aplicación cambie sin recargar.
       */
      setLanguageFromBusiness(
        language
      )


      setMessage(
        t('settings.success.saved')
      )


    } catch (err) {

      console.error(
        'Error guardando configuración:',
        err
      )


      setError(
        err.message ||
          t('settings.errors.saveSettings')
      )

    } finally {

      setSaving(false)

    }

  }


  /* =====================================================
     URL VALIDATION
  ===================================================== */

  function filterValidUrl(
    value
  ) {

    try {

      const url =
        new URL(value)


      return (
        url.protocol ===
          'http:' ||

        url.protocol ===
          'https:'
      )

    } catch {

      return false

    }

  }


  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {

    return (

      <div className="settings-page">

        <div className="settings-loading">

          <div className="settings-loading-icon">
            ⚙️
          </div>


          <div className="settings-loading-title">
            AgendaReminder
          </div>


          <div className="settings-loading-text">
            {t('settings.loading')}
          </div>


          <div className="settings-loading-bar">

            <div className="settings-loading-progress" />

          </div>

        </div>

      </div>

    )

  }


  /* =====================================================
     RENDER
  ===================================================== */

  return (

    <div className="settings-page">


      {/* =================================================
          HEADER
      ================================================= */}

      <div className="settings-header">

        <div className="settings-heading">

          <div className="settings-eyebrow">
            {t('settings.eyebrow')}
          </div>


          <h1 className="settings-title">

            <span
              className="settings-title-icon"
              aria-hidden="true"
            >
              ⚙️
            </span>

            <span>
              {t('settings.title')}
            </span>

          </h1>


          <p className="settings-description">
            {t('settings.description')}
          </p>

        </div>

      </div>


      {/* =================================================
          INFORMACIÓN DEL NEGOCIO
      ================================================= */}

      <div className="settings-card">

        <div className="settings-card-header">

          <div className="settings-card-icon">
            🏢
          </div>


          <div>

            <div className="settings-card-title">
              {t('settings.business.title')}
            </div>


            <div className="settings-card-description">
              {t('settings.business.description')}
            </div>

          </div>

        </div>


        {/* =================================================
            NAME
        ================================================= */}

        <div className="settings-section">

          <label>
            {t('settings.fields.businessName')}
          </label>


          <input
            type="text"
            value={name}
            onChange={(event) => {

              setName(
                event.target.value
              )

              setMessage('')

              setError('')

            }}
            placeholder={t(
              'settings.fields.businessNamePlaceholder'
            )}
            maxLength={150}
          />

        </div>


        {/* =================================================
            ADDRESS
        ================================================= */}

        <div className="settings-section">

          <label>
            {t('settings.fields.address')}
          </label>


          <input
            type="text"
            value={address}
            onChange={(event) => {

              setAddress(
                event.target.value
              )

              setMessage('')

              setError('')

            }}
            placeholder={t(
              'settings.fields.addressPlaceholder'
            )}
            maxLength={255}
          />

        </div>


        {/* =================================================
            GOOGLE REVIEWS
        ================================================= */}

        <div className="settings-section">

          <label>
            {t('settings.fields.reviewUrl')}
          </label>


          <input
            type="url"
            value={reviewUrl}
            onChange={(event) => {

              setReviewUrl(
                event.target.value
              )

              setMessage('')

              setError('')

            }}
            placeholder={t(
              'settings.fields.reviewUrlPlaceholder'
            )}
            maxLength={500}
          />

        </div>

      </div>


      {/* =================================================
          CONFIGURACIÓN REGIONAL
      ================================================= */}

      <div className="settings-card">

        <div className="settings-card-header">

          <div className="settings-card-icon">
            🌎
          </div>


          <div>

            <div className="settings-card-title">
              {t('settings.regional.title')}
            </div>


            <div className="settings-card-description">
              {t('settings.regional.description')}
            </div>

          </div>

        </div>


        {/* =================================================
            COUNTRY
        ================================================= */}

        <div className="settings-section">

          <label>
            {t('settings.fields.country')}
          </label>


          <select
            value={country}
            onChange={
              handleCountryChange
            }
          >

            <option value="">
              {t('settings.fields.selectCountry')}
            </option>


            {countries.map(
              (item) => (

                <option
                  key={item.id}
                  value={item.code}
                >
                  {item.flag}{' '}
                  {item.name}
                </option>

              )
            )}

          </select>

        </div>


        {/* =================================================
            TIMEZONE
        ================================================= */}

        <div className="settings-section">

          <label>
            {t('settings.fields.timezone')}
          </label>


          <div className="settings-value-box">

            <span>
              🕐
            </span>


            <div>

              <strong>
                {timezone ||
                  t('settings.values.notConfigured')}
              </strong>


              <small>
                {t('settings.fields.timezoneHelp')}
              </small>

            </div>

          </div>

        </div>


        {/* =================================================
            CURRENCY
        ================================================= */}

        <div className="settings-section">

          <label>
            {t('settings.fields.currency')}
          </label>


          <div className="settings-value-box">

            <span>
              💰
            </span>


            <div>

              <strong>

                {currencyCode ||
                  t('settings.values.notConfigured')}

                {currencySymbol
                  ? ` · ${currencySymbol}`
                  : ''}

              </strong>


              <small>
                {t('settings.fields.currencyHelp')}
              </small>

            </div>

          </div>

        </div>

      </div>


      {/* =================================================
          IDIOMA
      ================================================= */}

      <div className="settings-card">

        <div className="settings-card-header">

          <div className="settings-card-icon">
            🌐
          </div>


          <div>

            <div className="settings-card-title">
              {t('settings.language.title')}
            </div>


            <div className="settings-card-description">
              {t('settings.language.description')}
            </div>

          </div>

        </div>


        <div className="settings-section">

          <label>
            {t('settings.language.label')}
          </label>


          <select
            value={language}
            onChange={(event) => {

              setLanguage(
                event.target.value
              )

              setMessage('')

              setError('')

            }}
          >

            {languages.map(
              (item) => (

                <option
                  key={item.code}
                  value={item.code}
                >
                  {item.flag}{' '}
                  {item.name}
                </option>

              )
            )}

          </select>

        </div>

      </div>


      {/* =================================================
          APARIENCIA
      ================================================= */}

      <div className="settings-card">

        <div className="settings-card-header">

          <div className="settings-card-icon">
            🎨
          </div>


          <div>

            <div className="settings-card-title">
              {t('settings.appearance.title')}
            </div>


            <div className="settings-card-description">
              {t('settings.appearance.description')}
            </div>

          </div>

        </div>


        <div className="settings-section">

          <label>
            {t('settings.appearance.themeLabel')}
          </label>


          <div
            className="settings-theme-options"
            role="radiogroup"
            aria-label={t(
              'settings.appearance.themeAria'
            )}
          >

            {/* =================================================
                LIGHT
            ================================================= */}

            <button
              type="button"
              role="radio"
              aria-checked={
                theme === 'light'
              }
              className={
                `settings-theme-option ${
                  theme === 'light'
                    ? 'active'
                    : ''
                }`
              }
              onClick={() =>
                setTheme('light')
              }
            >

              <span className="settings-theme-option-icon">
                ☀️
              </span>


              <span className="settings-theme-option-content">

                <strong>
                  {t(
                    'settings.appearance.light.title'
                  )}
                </strong>


                <small>
                  {t(
                    'settings.appearance.light.description'
                  )}
                </small>

              </span>


              <span className="settings-theme-check">

                {theme === 'light'
                  ? '✓'
                  : ''}

              </span>

            </button>


            {/* =================================================
                DARK
            ================================================= */}

            <button
              type="button"
              role="radio"
              aria-checked={
                theme === 'dark'
              }
              className={
                `settings-theme-option ${
                  theme === 'dark'
                    ? 'active'
                    : ''
                }`
              }
              onClick={() =>
                setTheme('dark')
              }
            >

              <span className="settings-theme-option-icon">
                🌙
              </span>


              <span className="settings-theme-option-content">

                <strong>
                  {t(
                    'settings.appearance.dark.title'
                  )}
                </strong>


                <small>
                  {t(
                    'settings.appearance.dark.description'
                  )}
                </small>

              </span>


              <span className="settings-theme-check">

                {theme === 'dark'
                  ? '✓'
                  : ''}

              </span>

            </button>

          </div>

        </div>

      </div>


      {/* =================================================
          ACTION
      ================================================= */}

      <div className="settings-actions">

        <button
          type="button"
          className="settings-save-button"
          onClick={saveSettings}
          disabled={saving}
        >

          {saving
            ? t('common.saving')
            : `💾 ${t('settings.saveButton')}`}

        </button>

      </div>


      {/* =================================================
          SUCCESS
      ================================================= */}

      {message && (

        <div className="settings-success">

          ✓ {message}

        </div>

      )}


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (

        <div className="settings-error">

          ⚠️ {error}

        </div>

      )}

    </div>

  )
}