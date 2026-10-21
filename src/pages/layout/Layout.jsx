import React, {
  useEffect,
  useMemo,
  useState,
} from 'react'

import { useLanguage } from '../../context/LanguageContext'

import './Layout.css'


/* =========================================================
   CONFIGURATION
========================================================= */

const API_URL =
  'https://kreandoapp.com/api/index.php'


const AUTOMATIONS = [
  {
    number: 1,
    key: '24h',
    icon: '🕐',
  },
  {
    number: 2,
    key: '1h',
    icon: '⏰',
  },
  {
    number: 3,
    key: '2h',
    icon: '⭐',
  },
]


/* =========================================================
   TRANSLATIONS
========================================================= */

/* =========================================================
   HELPERS
========================================================= */

function normalizeLanguage(language) {
  return String(language || 'es')
    .toLowerCase()
    .trim()
    .split('-')[0] || 'es'
}


function getTemplateTexts(t) {
  return {
    title: t('templates.title'),
    subtitle: t('templates.subtitle'),

    appointment24: t('templates.appointment24'),
    appointment1: t('templates.appointment1'),
    review: t('templates.review'),

    before24: t('templates.before24'),
    before1: t('templates.before1'),
    after2: t('templates.after2'),

    formal: t('templates.formal'),
    friendly: t('templates.friendly'),

    formalDescription:
      t('templates.formalDescription'),

    friendlyDescription:
      t('templates.friendlyDescription'),

    formalReviewDescription:
      t('templates.formalReviewDescription'),

    friendlyReviewDescription:
      t('templates.friendlyReviewDescription'),

    selected: t('templates.selected'),
    select: t('templates.select'),

    loading: t('templates.loading'),
    error: t('templates.error'),
    retry: t('templates.retry'),
    noTemplates: t('templates.noTemplates'),

    preview: t('templates.preview'),
    whatsapp: t('templates.whatsapp'),

    customer: t('templates.customer'),
    service: t('templates.service'),
    employee: t('templates.employee'),
    business: t('templates.business'),
    date: t('templates.date'),
    time: t('templates.time'),
    reviewUrl: t('templates.reviewUrl'),
    address: t('templates.address'),

    saving: t('templates.saving'),
    saved: t('templates.saved'),
    saveError: t('templates.saveError'),
  }
}


function replaceVariables(
  message,
  values
) {

  if (!message) {
    return ''
  }

  return message
    .replace(
      /{{\s*name\s*}}/gi,
      values.name
    )
    .replace(
      /{{\s*date\s*}}/gi,
      values.date
    )
    .replace(
      /{{\s*time\s*}}/gi,
      values.time
    )
    .replace(
      /{{\s*service\s*}}/gi,
      values.service
    )
    .replace(
      /{{\s*employee\s*}}/gi,
      values.employee
    )
    .replace(
      /{{\s*business\s*}}/gi,
      values.business
    )
    .replace(
      /{{\s*phone\s*}}/gi,
      values.phone
    )
    .replace(
      /{{\s*address\s*}}/gi,
      values.address
    )
    .replace(
      /{{\s*review_url\s*}}/gi,
      values.review_url
    )
}


function getTemplateTranslation(
  template,
  language
) {

  if (!template) {
    return ''
  }

  const translations =
    template.translations || {}

  const normalized =
    normalizeLanguage(language)

  return (
    translations[normalized] ||
    translations.es ||
    Object.values(translations)[0] ||
    ''
  )
}

function getTemplateMessage(
  template,
  language
) {
  if (!template) {
    return ''
  }

  const translations =
    template.translations || {}

  const normalized =
    normalizeLanguage(language)

  return (
    translations[normalized] ||
    translations.es ||
    Object.values(translations)[0] ||
    ''
  )
}


/* =========================================================
   WHATSAPP PREVIEW
========================================================= */

function WhatsAppPreview({
  message,
  texts,
}) {


  const values = {

    name:
      texts.customer,

    date:
      texts.date,

    time:
      texts.time,

    service:
      texts.service,

    employee:
      texts.employee,

    business:
      texts.business,

    phone:
      '+34 647 376 352',

    address:
      texts.address,

    review_url:
      texts.reviewUrl,

  }


  const finalMessage =
    replaceVariables(
      message,
      values
    )


  return (

    <div className="templates-preview">

      <div className="templates-preview-header">

        <span>
          {texts.preview}
        </span>

        <span>
          {texts.whatsapp}
        </span>

      </div>


      <div className="templates-whatsapp">

        <div className="templates-whatsapp-avatar">

          {values.business
            .charAt(0)
            .toUpperCase()}

        </div>


        <div className="templates-whatsapp-content">

          <div className="templates-whatsapp-business">

            {values.business}

          </div>


          <div className="templates-whatsapp-message">

            {finalMessage}

            <div className="templates-whatsapp-time">

              {values.time} ✓✓

            </div>

          </div>

        </div>

      </div>

    </div>

  )
}


/* =========================================================
   TEMPLATE CARD
========================================================= */

function TemplateCard({
  template,
  type,
  selected,
  saving,
  onSelect,
  language,
  texts,
  review = false,
}) {


  const isFormal =
    type === 'formal'


  const message =
    getTemplateMessage(
      template,
      language
    )


  let title

  let description


  if (review) {

    if (isFormal) {

      title =
        texts.formal

      description =
        texts.formalReviewDescription

    } else {

      title =
        texts.friendly

      description =
        texts.friendlyReviewDescription

    }

  } else {

    if (isFormal) {

      title =
        texts.formal

      description =
        texts.formalDescription

    } else {

      title =
        texts.friendly

      description =
        texts.friendlyDescription

    }

  }


  return (

    <article
      className={
        `templates-card ${
          selected
            ? 'is-selected'
            : ''
        }`
      }
    >

      <div className="templates-card-top">

        <div className="templates-card-type">

          <span
            className={
              `templates-type-badge ${
                isFormal
                  ? 'formal'
                  : 'friendly'
              }`
            }
          >

            {title}

          </span>

        </div>


        {selected && (

          <span className="templates-selected-badge">

            ✓ {texts.selected}

          </span>

        )}

      </div>


      <WhatsAppPreview
        message={message}
        texts={texts}
      />


      <div className="templates-card-bottom">

        <div className="templates-card-copy">

          <h3>
            {title}
          </h3>

          <p>
            {description}
          </p>

        </div>


        <button
          type="button"
          className={
            `templates-select-button ${
              selected
                ? 'selected'
                : ''
            }`
          }
          onClick={onSelect}
          disabled={
            selected ||
            saving
          }
        >

          {saving
            ? texts.saving
            : selected
              ? `✓ ${texts.selected}`
              : texts.select}

        </button>

      </div>

    </article>

  )
}


/* =========================================================
   MAIN LAYOUT
========================================================= */

export default function Layout() {

  const {
    language,
    t,
  } = useLanguage()


  const texts =
    getTemplateTexts(t)


  /* -------------------------------------------------------
     STATE
  ------------------------------------------------------- */

  const [
    templates,
    setTemplates,
  ] = useState([])


  const [
    businessTemplates,
    setBusinessTemplates,
  ] = useState([])


  const [
    loading,
    setLoading,
  ] = useState(true)


  const [
    error,
    setError,
  ] = useState(null)


  const [
    savingAutomation,
    setSavingAutomation,
  ] = useState(null)


  /*
   * This state contains the template selected
   * for each automation.
   *
   * It will be populated from:
   *
   * GET ?action=business-automation-templates
   */

  const [
    selectedTemplates,
    setSelectedTemplates,
  ] = useState({})


  /* -------------------------------------------------------
     AUTH HEADERS
  ------------------------------------------------------- */

  const getHeaders =
    () => {

      const token =
        localStorage.getItem(
          'access_token'
        )


      const headers = {
        Accept:
          'application/json',
        'Content-Type':
          'application/json',
      }


      if (token) {

        headers.Authorization =
          `Bearer ${token}`

      }


      return headers

    }


  /* -------------------------------------------------------
     LOAD MESSAGE TEMPLATES
  ------------------------------------------------------- */

  const loadMessageTemplates =
    async () => {

      const response =
        await fetch(
          `${API_URL}?action=message-templates`,
          {
            method: 'GET',
            headers: getHeaders(),
          }
        )


      const data =
        await response.json()


      if (!response.ok) {

        throw new Error(
          data?.message ||
          texts.error
        )

      }


      if (!data?.success) {

        throw new Error(
          data?.message ||
          texts.error
        )

      }


      const loadedTemplates =
        Array.isArray(
          data.templates
        )
          ? data.templates
          : []


      setTemplates(
        loadedTemplates
      )


      return loadedTemplates

    }


  /* -------------------------------------------------------
     LOAD BUSINESS AUTOMATION CONFIGURATION
  ------------------------------------------------------- */

  const loadBusinessTemplates =
    async () => {

      const response =
        await fetch(
          `${API_URL}?action=business-automation-templates`,
          {
            method: 'GET',
            headers: getHeaders(),
          }
        )


      const data =
        await response.json()


      if (!response.ok) {

        throw new Error(
          data?.message ||
          texts.error
        )

      }


      if (!data?.success) {

        throw new Error(
          data?.message ||
          texts.error
        )

      }


      const configurations =
        Array.isArray(
          data.data
        )
          ? data.data
          : []


      setBusinessTemplates(
        configurations
      )


      /*
       * Convert backend response into:
       *
       * {
       *   1: 2,
       *   2: 3,
       *   3: 5
       * }
       */

      const selections = {}


      configurations.forEach(
        configuration => {

          const automationNumber =
            Number(
              configuration.automation_number
            )


          const templateId =
            Number(
              configuration.template_id
            )


          if (
            automationNumber >= 1 &&
            automationNumber <= 3 &&
            templateId > 0
          ) {

            selections[
              automationNumber
            ] = templateId

          }

        }
      )


      setSelectedTemplates(
        selections
      )


      return configurations

    }


  /* -------------------------------------------------------
     LOAD EVERYTHING
  ------------------------------------------------------- */

  const loadData =
    async () => {

      try {

        setLoading(true)

        setError(null)


        await Promise.all([
          loadMessageTemplates(),
          loadBusinessTemplates(),
        ])

      } catch (err) {

        console.error(
          'Error loading template configuration:',
          err
        )


        setError(
          err?.message ||
          texts.error
        )

      } finally {

        setLoading(false)

      }

    }


  useEffect(() => {

    loadData()

  }, [])


  /* -------------------------------------------------------
     GROUP TEMPLATES
  ------------------------------------------------------- */

  const templateGroups =
    useMemo(() => {

      return AUTOMATIONS.map(
        automation => {

          const groupTemplates =
            templates
              .filter(
                template =>
                  Number(
                    template.automation_number
                  ) ===
                  Number(
                    automation.number
                  )
              )
              .sort(
                (a, b) =>
                  Number(
                    a.sort_order
                  ) -
                  Number(
                    b.sort_order
                  )
              )


          return {

            ...automation,

            templates:
              groupTemplates,

            formal:
              groupTemplates.find(
                template =>
                  Number(
                    template.sort_order
                  ) === 1
              ) ||
              groupTemplates[0] ||
              null,

            friendly:
              groupTemplates.find(
                template =>
                  Number(
                    template.sort_order
                  ) === 2
              ) ||
              groupTemplates[1] ||
              null,

          }

        }
      )

    }, [templates])


  /* -------------------------------------------------------
     AUTOMATION TITLES
  ------------------------------------------------------- */

  const getAutomationTitle =
    number => {

      switch (
        Number(number)
      ) {

        case 1:
          return texts.appointment24

        case 2:
          return texts.appointment1

        case 3:
          return texts.review

        default:
          return ''

      }

    }


  const getAutomationDescription =
    number => {

      switch (
        Number(number)
      ) {

        case 1:
          return texts.before24

        case 2:
          return texts.before1

        case 3:
          return texts.after2

        default:
          return ''

      }

    }


  /* -------------------------------------------------------
     SAVE TEMPLATE SELECTION
  ------------------------------------------------------- */

  const handleSelectTemplate =
    async (
      automationNumber,
      templateId
    ) => {

      const previousTemplateId =
        selectedTemplates[
          automationNumber
        ]


      /*
       * Optimistic UI:
       * change immediately.
       */

      setSelectedTemplates(
        previous => ({

          ...previous,

          [automationNumber]:
            Number(templateId),

        })
      )


      setSavingAutomation(
        Number(automationNumber)
      )


      try {

        const response =
          await fetch(
            `${API_URL}?action=business-automation-template`,
            {
              method: 'PUT',

              headers:
                getHeaders(),

              body:
                JSON.stringify({

                  automation_number:
                    Number(
                      automationNumber
                    ),

                  template_id:
                    Number(
                      templateId
                    ),

                }),
            }
          )


        const data =
          await response.json()


        if (!response.ok) {

          throw new Error(
            data?.message ||
            texts.saveError
          )

        }


        if (!data?.success) {

          throw new Error(
            data?.message ||
            texts.saveError
          )

        }


        /*
         * Backend is the source of truth.
         *
         * Use the returned configuration.
         */

        if (
          data?.data &&
          data.data.template_id
        ) {

          setSelectedTemplates(
            previous => ({

              ...previous,

              [automationNumber]:
                Number(
                  data.data.template_id
                ),

            })
          )

        }


        /*
         * Update local business configuration.
         */

        setBusinessTemplates(
          previous => {

            const existingIndex =
              previous.findIndex(
                item =>
                  Number(
                    item.automation_number
                  ) ===
                  Number(
                    automationNumber
                  )
              )


            if (
              existingIndex === -1
            ) {

              return [

                ...previous,

                data.data,

              ]

            }


            return previous.map(
              (item, index) => {

                if (
                  index !==
                  existingIndex
                ) {

                  return item

                }


                return data.data

              }
            )

          }
        )


      } catch (err) {

        console.error(
          'Error saving template selection:',
          err
        )


        /*
         * Roll back optimistic UI.
         */

        setSelectedTemplates(
          previous => {

            const next = {
              ...previous,
            }


            if (
              previousTemplateId
            ) {

              next[
                automationNumber
              ] =
                Number(
                  previousTemplateId
                )

            } else {

              delete next[
                automationNumber
              ]

            }


            return next

          }
        )


        /*
         * Show error.
         */

        window.alert(
          err?.message ||
          texts.saveError
        )

      } finally {

        setSavingAutomation(
          null
        )

      }

    }


  /* -------------------------------------------------------
     LOADING
  ------------------------------------------------------- */

  if (loading) {

    return (

      <div className="templates-layout">

        <div className="templates-loading">

          <div className="templates-spinner" />

          <p>
            {texts.loading}
          </p>

        </div>

      </div>

    )

  }


  /* -------------------------------------------------------
     ERROR
  ------------------------------------------------------- */

  if (error) {

    return (

      <div className="templates-layout">

        <div className="templates-error">

          <div className="templates-error-icon">
            ⚠️
          </div>

          <h2>
            {texts.error}
          </h2>

          <p>
            {error}
          </p>

          <button
            type="button"
            onClick={loadData}
          >
            {texts.retry}
          </button>

        </div>

      </div>

    )

  }


  /* -------------------------------------------------------
     EMPTY
  ------------------------------------------------------- */

  if (!templates.length) {

    return (

      <div className="templates-layout">

        <div className="templates-empty">

          <div className="templates-empty-icon">
            💬
          </div>

          <p>
            {texts.noTemplates}
          </p>

        </div>

      </div>

    )

  }


  /* -------------------------------------------------------
     RENDER
  ------------------------------------------------------- */

  return (

    <div className="templates-layout">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="templates-header">

        <div>

          <h1>
            {texts.title}
          </h1>

          <p>
            {texts.subtitle}
          </p>

        </div>

      </header>


      {/* =================================================
          AUTOMATIONS
      ================================================= */}

      <main className="templates-content">

        {templateGroups.map(
          group => {

            const formalTemplate =
              group.formal


            const friendlyTemplate =
              group.friendly


            const selectedTemplateId =
              selectedTemplates[
                group.number
              ]


            const saving =
              savingAutomation ===
              group.number


            const isReview =
              group.number === 3


            return (

              <section
                key={
                  group.number
                }
                className="templates-section"
              >

                {/* ---------------------------------------
                    SECTION HEADER
                --------------------------------------- */}

                <div className="templates-section-header">

                  <div className="templates-section-icon">

                    {group.icon}

                  </div>


                  <div>

                    <h2>

                      {getAutomationTitle(
                        group.number
                      )}

                    </h2>

                    <p>

                      {getAutomationDescription(
                        group.number
                      )}

                    </p>

                  </div>

                </div>


                {/* ---------------------------------------
                    TEMPLATES
                --------------------------------------- */}

                <div className="templates-grid">

                  {formalTemplate && (

                    <TemplateCard

                      template={
                        formalTemplate
                      }

                      type="formal"

                      language={
                        language
                      }

                      selected={
                        Number(
                          selectedTemplateId
                        ) ===
                        Number(
                          formalTemplate.id
                        )
                      }

                      saving={
                        saving
                      }

                      onSelect={() =>
                        handleSelectTemplate(
                          group.number,
                          formalTemplate.id
                        )
                      }

                      texts={
                        texts
                      }

                      review={
                        isReview
                      }

                    />

                  )}


                  {friendlyTemplate && (

                    <TemplateCard

                      template={
                        friendlyTemplate
                      }

                      type="friendly"

                      language={
                        language
                      }

                      selected={
                        Number(
                          selectedTemplateId
                        ) ===
                        Number(
                          friendlyTemplate.id
                        )
                      }

                      saving={
                        saving
                      }

                      onSelect={() =>
                        handleSelectTemplate(
                          group.number,
                          friendlyTemplate.id
                        )
                      }

                      texts={
                        texts
                      }

                      review={
                        isReview
                      }

                    />

                  )}

                </div>

              </section>

            )

          }
        )}

      </main>

    </div>

  )

}