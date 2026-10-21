import React, { useEffect, useMemo, useState } from 'react'
import './AdminLayout.css'

const API_URL = 'https://kreandoapp.com/api/index.php'

const TYPES = [
  ['confirmation', '✓', 'green', 'Confirmación de cita', 'Se envía al crear la cita'],
  ['24h', '🔔', 'blue', 'Recordatorio 24 horas', 'Se envía 24h antes'],
  ['1h', '◷', 'purple', 'Recordatorio 1 hora', 'Se envía 1h antes'],
  ['review', '★', 'yellow', 'Solicitud de reseña', 'Se envía 2h después'],
]

const LANGS = [
  ['es', '🇪🇸', 'Español'],
  ['en', '🇬🇧', 'English'],
  ['fr', '🇫🇷', 'Français'],
  ['it', '🇮🇹', 'Italiano'],
  ['pt', '🇵🇹', 'Português'],
  ['ro', '🇷🇴', 'Română'],
  ['de', '🇩🇪', 'Deutsch'],
]

const VARIABLES = [
  ['{{name}}', 'Cliente'],
  ['{{date}}', 'Fecha'],
  ['{{time}}', 'Hora'],
  ['{{service}}', 'Servicio'],
  ['{{employee}}', 'Empleado'],
  ['{{business}}', 'Negocio'],
  ['{{review_url}}', 'URL de reseña'],
]

const TYPE_TO_AUTOMATION = {
  '24h': 1,
  '1h': 2,
  review: 3,
}

const SAMPLE = {
  name: 'Laura Martínez',
  date: '25 de septiembre de 2026',
  time: '10:00',
  service: 'Limpieza facial',
  employee: 'Nadia',
  business: 'Studio Glow Skin',
  review_url: 'https://g.page/r/ejemplo/review',
}

const replaceVars = (text) =>
  (text || '').replace(
    /\{\{(name|date|time|service|employee|business|review_url)\}\}/g,
    (_, key) => SAMPLE[key] ?? `{{${key}}}`
  )

function Status({ code, source, message }) {
  if (source) {
    return <span className="at-status source">Fuente</span>
  }

  if (!message) {
    return <span className="at-status missing">Sin traducción</span>
  }

  return <span className="at-status updated">Disponible</span>
}

function Preview({ message }) {
  const rendered = replaceVars(message)
  const lines = rendered.split('\n')

  return (
    <aside className="at-preview">
      <div className="at-preview-title">
        <strong>Vista previa</strong>
        <select defaultValue="whatsapp">
          <option value="whatsapp">WhatsApp</option>
        </select>
      </div>

      <div className="at-phone">
        <div className="at-phone-head">
          <span className="at-back">‹</span>
          <span className="at-avatar">A</span>
          <div>
            <b>AgendaReminder</b>
            <small>en línea</small>
          </div>
          <span className="at-phone-icons">⋮</span>
        </div>

        <div className="at-chat">
          {message ? (
            <div className="at-bubble">
              {lines.map((line, index) => (
                <React.Fragment key={`${line}-${index}`}>
                  {line}
                  {index < lines.length - 1 && <br />}
                </React.Fragment>
              ))}
              <small>10:30 ✓✓</small>
            </div>
          ) : (
            <div className="at-empty-preview">
              No hay traducción para este idioma.
            </div>
          )}
        </div>

        <div className="at-input">
          <span>☺</span>
          <em>Mensaje</em>
          <span>⌕</span>
          <b>●</b>
        </div>
      </div>

      <div className="at-sample">
        <div className="at-sample-title">
          Datos de ejemplo
          <span>⌃</span>
        </div>

        {Object.entries(SAMPLE).map(([key, value]) => (
          <div className="at-sample-row" key={key}>
            <span>
              {{
                name: 'Cliente',
                date: 'Fecha',
                time: 'Hora',
                service: 'Servicio',
                employee: 'Empleado',
                business: 'Negocio',
                review_url: 'URL de reseña',
              }[key]}
            </span>
            <b>{value}</b>
          </div>
        ))}
      </div>
    </aside>
  )
}

export default function AdminLayout() {
  const [type, setType] = useState('24h')
  const [selectedTemplateId, setSelectedTemplateId] = useState(null)
  const [lang, setLang] = useState('es')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(false)

  const [templates, setTemplates] = useState([])
  const [drafts, setDrafts] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saveMessage, setSaveMessage] = useState('')

  const token = localStorage.getItem('access_token')

  const loadTemplates = async () => {
    if (!token) {
      setError('No hay una sesión válida.')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError('')

      const response = await fetch(
        `${API_URL}?action=message-templates`,
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
        throw new Error('La sesión ha expirado.')
      }

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'No se pudieron cargar las plantillas.'
        )
      }

      const data = Array.isArray(result.templates)
        ? result.templates
        : Array.isArray(result.data)
          ? result.data
          : []

      setTemplates(data)

      setDrafts((previous) => {
        const next = { ...previous }

        data.forEach((template) => {
          Object.entries(template.translations || {}).forEach(
            ([languageCode, message]) => {
              next[`${template.id}:${languageCode}`] = message
            }
          )
        })

        return next
      })

      if (data.length > 0) {
        setSelectedTemplateId((current) => current ?? data[0].id)
      }
    } catch (err) {
      console.error('❌ Error cargando plantillas:', err)
      setError(err.message || 'No se pudieron cargar las plantillas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTemplates()
  }, [])

  const templatesForType = useMemo(() => {
    const automationNumber = TYPE_TO_AUTOMATION[type]

    if (type === 'confirmation') {
      return []
    }

    return templates.filter(
      (template) =>
        Number(template.automation_number) === automationNumber
    )
  }, [templates, type])

  const selectedTemplate = useMemo(
    () =>
      templates.find(
        (template) => Number(template.id) === Number(selectedTemplateId)
      ) || templatesForType[0] || null,
    [templates, selectedTemplateId, templatesForType]
  )

  const currentMessage =
    drafts[`${selectedTemplate?.id}:${lang}`] ??
    selectedTemplate?.translations?.[lang] ??
    ''

  const filteredLanguages = LANGS.filter((item) =>
    item[2].toLowerCase().includes(search.toLowerCase())
  )

  const selectType = (nextType) => {
    setType(nextType)
    setEditing(false)
    setSaveMessage('')
    setSelectedTemplateId(null)
  }

  const updateMessage = (value) => {
    if (!selectedTemplate) return

    setDrafts((previous) => ({
      ...previous,
      [`${selectedTemplate.id}:${lang}`]: value,
    }))
  }

  const insertVariable = (variable) => {
    const separator =
      currentMessage && !currentMessage.endsWith(' ') ? ' ' : ''

    updateMessage(`${currentMessage}${separator}${variable}`)
    setEditing(true)
  }

  const copySpanish = () => {
    if (!selectedTemplate) return

    const spanish =
      drafts[`${selectedTemplate.id}:es`] ??
      selectedTemplate.translations?.es ??
      ''

    updateMessage(spanish)
    setEditing(true)
  }

  const handleSave = async () => {
    if (!selectedTemplate) return

    const message = currentMessage.trim()

    if (!message) {
      setError('El mensaje no puede estar vacío.')
      return
    }

    if (!token) {
      setError('No hay una sesión válida.')
      return
    }

    try {
      setSaving(true)
      setError('')
      setSaveMessage('')

      const response = await fetch(
        `${API_URL}?action=message-template-translation`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            template_id: selectedTemplate.id,
            language_code: lang,
            message,
          }),
        }
      )

      const result = await response.json()

      if (response.status === 401) {
        throw new Error('La sesión ha expirado.')
      }

      if (response.status === 403) {
        throw new Error('No tienes permisos de administrador.')
      }

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'No se pudo guardar la traducción.'
        )
      }

      const updatedTemplate = result.template

      if (updatedTemplate) {
        setTemplates((previous) =>
          previous.map((template) =>
            Number(template.id) === Number(updatedTemplate.id)
              ? updatedTemplate
              : template
          )
        )

        setDrafts((previous) => ({
          ...previous,
          [`${updatedTemplate.id}:${lang}`]: message,
        }))
      }

      setEditing(false)
      setSaveMessage('Cambios guardados correctamente.')
    } catch (err) {
      console.error('❌ Error guardando traducción:', err)
      setError(err.message || 'No se pudo guardar la traducción.')
    } finally {
      setSaving(false)
    }
  }

  const languageMessage = (languageCode) => {
    if (!selectedTemplate) return ''

    return (
      drafts[`${selectedTemplate.id}:${languageCode}`] ??
      selectedTemplate.translations?.[languageCode] ??
      ''
    )
  }

  const availableCount = filteredLanguages.filter(
    ([code]) => languageMessage(code)
  ).length

  return (
    <div className="admin-templates-page">
      <header className="at-header">
        <div>
          <h1>Plantillas de mensajes</h1>
          <p>
            Gestiona los mensajes de WhatsApp para todas las empresas y todos
            los idiomas
          </p>
        </div>

        <button className="at-top-preview">
          ◉ &nbsp; Vista previa con datos de ejemplo
        </button>
      </header>

      <section className="at-types">
        {TYPES.map(([id, icon, color, title, description]) => (
          <button
            key={id}
            type="button"
            onClick={() => selectType(id)}
            className={`at-type ${color} ${type === id ? 'selected' : ''}`}
          >
            <span className="at-type-icon">{icon}</span>

            <span>
              <strong>{title}</strong>
              <small>{description}</small>
            </span>
          </button>
        ))}
      </section>

      {error && <div className="at-error">{error}</div>}
      {saveMessage && <div className="at-success">{saveMessage}</div>}

      {loading ? (
        <div className="at-loading">Cargando plantillas...</div>
      ) : (
        <section className="at-workspace">
          <aside className="at-languages">
            <h2>Idiomas</h2>

            <div className="at-search">
              ⌕
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar idioma..."
              />
            </div>

            {filteredLanguages.map(([code, flag, name]) => {
              const message = languageMessage(code)

              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => {
                    setLang(code)
                    setEditing(false)
                    setSaveMessage('')
                  }}
                  className={`at-language ${
                    lang === code ? 'selected' : ''
                  }`}
                >
                  <span className="at-flag">{flag}</span>

                  <span className="at-language-info">
                    <strong>{name}</strong>
                    <Status
                      code={code}
                      source={code === 'es'}
                      message={message}
                    />
                  </span>

                  <small>{message ? 'Disponible' : '—'}</small>
                </button>
              )
            })}

            <button type="button" className="at-add-language">
              ＋ Agregar idioma
            </button>
          </aside>

          <main className="at-editor">
            {!selectedTemplate && type === 'confirmation' && (
              <div className="at-empty-state">
                <div className="at-empty-icon">✓</div>
                <h2>Confirmación de cita</h2>
                <p>
                  El backend actual no devuelve todavía una plantilla para la
                  confirmación inmediata. La consulta está limitada a
                  automation_number 1, 2 y 3.
                </p>
              </div>
            )}

            {!selectedTemplate && type !== 'confirmation' && (
              <div className="at-empty-state">
                <div className="at-empty-icon">!</div>
                <h2>Sin plantilla</h2>
                <p>
                  No hay una plantilla activa para este tipo de automatización.
                </p>
              </div>
            )}

            {selectedTemplate && (
              <>
                {templatesForType.length > 1 && (
                  <div className="at-variants">
                    {templatesForType.map((template, index) => (
                      <button
                        key={template.id}
                        type="button"
                        className={`at-variant ${
                          Number(selectedTemplate.id) === Number(template.id)
                            ? 'selected'
                            : ''
                        }`}
                        onClick={() => {
                          setSelectedTemplateId(template.id)
                          setEditing(false)
                          setSaveMessage('')
                        }}
                      >
                        Plantilla {String.fromCharCode(65 + index)}
                        <small>#{template.id}</small>
                      </button>
                    ))}
                  </div>
                )}

                <div className="at-editor-head">
                  <div className="at-editor-language">
                    <span>
                      {LANGS.find((item) => item[0] === lang)?.[1]}
                    </span>

                    <h2>
                      {LANGS.find((item) => item[0] === lang)?.[2]}
                    </h2>

                    {lang === 'es' && <b>Idioma fuente</b>}
                  </div>

                  <div className="at-template-meta">
                    <span>
                      {selectedTemplate.title}
                    </span>
                    <small>
                      Plantilla #{selectedTemplate.id}
                    </small>
                  </div>
                </div>

                <label>
                  Asunto interno <span>(opcional)</span>
                </label>

                <input
                  className="at-subject"
                  value={selectedTemplate.title || ''}
                  readOnly
                />

                <label>Mensaje</label>

                <textarea
                  className="at-message"
                  value={currentMessage}
                  onChange={(event) =>
                    updateMessage(event.target.value)
                  }
                  readOnly={!editing}
                  spellCheck="false"
                  placeholder="No hay traducción para este idioma."
                />

                <div className="at-editor-tools">
                  <span>{currentMessage.length}/1000</span>
                  <div>↶ &nbsp; ↷</div>
                </div>

                <label>Insertar variable</label>

                <div className="at-vars">
                  {VARIABLES.map(([variable, label]) => (
                    <button
                      type="button"
                      key={variable}
                      onClick={() => insertVariable(variable)}
                    >
                      <b>{variable}</b>
                      <small>{label}</small>
                    </button>
                  ))}
                </div>

                <div className="at-info">
                  ⓘ &nbsp; Las variables se insertan automáticamente. No las
                  escribas manualmente.
                </div>

                <div className="at-translation-status">
                  <span>
                    ● &nbsp;{availableCount} idiomas con traducción
                  </span>
                  <span>
                    ● &nbsp;
                    {filteredLanguages.length - availableCount} sin traducción
                  </span>
                </div>

                <div className="at-actions">
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => {
                      setEditing(false)
                      setDrafts((previous) => ({
                        ...previous,
                        [`${selectedTemplate.id}:${lang}`]:
                          selectedTemplate.translations?.[lang] ?? '',
                      }))
                    }}
                  >
                    ↶ &nbsp; Restablecer
                  </button>

                  {lang !== 'es' && (
                    <>
                      <button
                        type="button"
                        className="secondary"
                        onClick={copySpanish}
                      >
                        ▣ &nbsp; Copiar español
                      </button>

                      <button type="button" className="ai">
                        ✨ &nbsp; Traducir con IA
                      </button>
                    </>
                  )}

                  {!editing && (
                    <button
                      type="button"
                      className="edit"
                      onClick={() => setEditing(true)}
                    >
                      ✎ &nbsp; Editar
                    </button>
                  )}

                  <button
                    type="button"
                    className="save"
                    disabled={saving}
                    onClick={handleSave}
                  >
                    {saving ? 'Guardando...' : '✓ Guardar cambios'}
                  </button>
                </div>
              </>
            )}
          </main>

          <Preview message={currentMessage} />
        </section>
      )}
    </div>
  )
}
