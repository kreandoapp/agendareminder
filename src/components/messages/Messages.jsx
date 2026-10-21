import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import './Messages.css'

const API_URL =
  'https://kreandoapp.com/api/index.php'

const AUTOMATIONS = [
  {
    number: 1,
    title: '24 horas antes',
    subtitle: 'Recordatorio de cita',
    icon: '⏰',
    description:
      'Mensaje que se enviará automáticamente 24 horas antes de la cita.',
    defaultMessage:
      'Hola {{nombre}} 👋\n\nTe recordamos que mañana tienes una cita en {{negocio}}.\n\n📅 Fecha: {{fecha}}\n🕐 Hora: {{hora}}\n✂️ Servicio: {{servicio}}\n👤 Profesional: {{empleado}}\n\n¡Te esperamos! 😊',
  },
  {
    number: 2,
    title: '1 hora antes',
    subtitle: 'Recordatorio de cita',
    icon: '🔔',
    description:
      'Mensaje que se enviará automáticamente 1 hora antes de la cita.',
    defaultMessage:
      'Hola {{nombre}} 👋\n\nTu cita en {{negocio}} es dentro de 1 hora.\n\n🕐 Hora: {{hora}}\n✂️ Servicio: {{servicio}}\n👤 Profesional: {{empleado}}\n\n¡Nos vemos pronto! 😊',
  },
  {
    number: 3,
    title: '2 horas después',
    subtitle: 'Solicitud de reseña',
    icon: '⭐',
    description:
      'Mensaje que se enviará automáticamente 2 horas después de la cita.',
    defaultMessage:
      'Hola {{nombre}} 👋\n\nEsperamos que hayas disfrutado tu visita a {{negocio}}. ❤️\n\nNos ayudaría muchísimo conocer tu opinión.\n\n⭐ Déjanos tu reseña:\n{{reseña}}\n\n¡Muchas gracias! 🙌',
  },
]

const VARIABLES = [
  {
    key: '{{nombre}}',
    label: 'Nombre',
    icon: '👤',
  },
  {
    key: '{{fecha}}',
    label: 'Fecha',
    icon: '📅',
  },
  {
    key: '{{hora}}',
    label: 'Hora',
    icon: '🕐',
  },
  {
    key: '{{servicio}}',
    label: 'Servicio',
    icon: '✂️',
  },
  {
    key: '{{empleado}}',
    label: 'Empleado',
    icon: '👨‍💼',
  },
  {
    key: '{{negocio}}',
    label: 'Negocio',
    icon: '🏢',
  },
  {
    key: '{{telefono}}',
    label: 'Teléfono',
    icon: '📱',
  },
  {
    key: '{{direccion}}',
    label: 'Dirección',
    icon: '📍',
  },
  {
    key: '{{reseña}}',
    label: 'Reseña',
    icon: '⭐',
  },
]

const PREVIEW_VALUES = {
  '{{nombre}}': 'María',
  '{{fecha}}': '15/09/2026',
  '{{hora}}': '16:30',
  '{{servicio}}': 'Corte + Peinado',
  '{{empleado}}': 'Carlos',
  '{{negocio}}': 'Agendareminder',
  '{{telefono}}': '+34 600 123 456',
  '{{direccion}}': '',
  '{{reseña}}':
    'https://g.page/r/tu-negocio/review',
}

function replaceVariables(
  message,
  previewValues = PREVIEW_VALUES
) {
  let result = message

  Object.entries(previewValues).forEach(
    ([variable, value]) => {
      result = result.replaceAll(
        variable,
        value
      )
    }
  )

  return result
}


/*
 * =====================================================
 * EDITOR DE MENSAJES CON VARIABLES PROTEGIDAS
 * =====================================================
 */

function ProtectedMessageEditor({
  message,
  loading,
  availableVariables,
  onChange,
  insertVariableRef,
}) {
  const editorRef = React.useRef(null)
  const lastMessageRef = React.useRef(null)
  const selectionRef = React.useRef(null)

  const variableMap = useMemo(
    () =>
      VARIABLES.reduce((acc, variable) => {
        acc[variable.key] = variable
        return acc
      }, {}),
    []
  )

  const placeCaretAtEnd = () => {
    const editor = editorRef.current

    if (!editor) return

    const range = document.createRange()

    range.selectNodeContents(editor)
    range.collapse(false)

    const selection = window.getSelection()

    selection.removeAllRanges()
    selection.addRange(range)
  }

  const restoreSelection = () => {
    const editor = editorRef.current
    const saved = selectionRef.current

    if (!editor || !saved) {
      return false
    }

    try {
      const range = document.createRange()

      const startNode =
        saved.startNode?.isConnected
          ? saved.startNode
          : editor

      const endNode =
        saved.endNode?.isConnected
          ? saved.endNode
          : editor

      range.setStart(
        startNode,
        Math.min(
          saved.startOffset || 0,
          startNode.nodeType === Node.TEXT_NODE
            ? startNode.textContent.length
            : startNode.childNodes.length
        )
      )

      range.setEnd(
        endNode,
        Math.min(
          saved.endOffset || 0,
          endNode.nodeType === Node.TEXT_NODE
            ? endNode.textContent.length
            : endNode.childNodes.length
        )
      )

      const selection = window.getSelection()

      selection.removeAllRanges()
      selection.addRange(range)

      return true
    } catch {
      return false
    }
  }

  const saveSelection = () => {
    const editor = editorRef.current
    const selection = window.getSelection()

    if (
      !editor ||
      !selection ||
      selection.rangeCount === 0
    ) {
      return
    }

    const range = selection.getRangeAt(0)

    if (
      !editor.contains(
        range.commonAncestorContainer
      )
    ) {
      return
    }

    selectionRef.current = {
      startNode:
        range.startContainer,
      startOffset:
        range.startOffset,
      endNode:
        range.endContainer,
      endOffset:
        range.endOffset,
    }
  }

  const createVariableChip = (
    variable
  ) => {
    const chip =
      document.createElement('span')

    chip.className =
      'messages-editor-variable'

    chip.setAttribute(
      'contenteditable',
      'false'
    )

    chip.dataset.variable =
      variable.key

    chip.setAttribute(
      'data-variable',
      variable.key
    )

    chip.setAttribute(
      'title',
      `${variable.label} · Variable protegida`
    )

    const icon =
      document.createElement('span')

    icon.className =
      'messages-editor-variable-icon'

    icon.textContent =
      variable.icon

    icon.setAttribute(
      'aria-hidden',
      'true'
    )

    const label =
      document.createElement('span')

    label.className =
      'messages-editor-variable-label'

    label.textContent =
      variable.label

    const remove =
      document.createElement('button')

    remove.type = 'button'

    remove.className =
      'messages-editor-variable-remove'

    remove.textContent = '×'

    remove.setAttribute(
      'aria-label',
      `Eliminar variable ${variable.label}`
    )

    remove.setAttribute(
      'title',
      `Eliminar ${variable.label}`
    )

    remove.addEventListener(
      'mousedown',
      (event) => {
        event.preventDefault()
        event.stopPropagation()
      }
    )

    remove.addEventListener(
      'click',
      (event) => {
        event.preventDefault()
        event.stopPropagation()

        chip.remove()

        const editor =
          editorRef.current

        if (editor) {
          editor.focus()
        }

        emitMessage()
      }
    )

    chip.appendChild(icon)
    chip.appendChild(label)
    chip.appendChild(remove)

    return chip
  }

  const renderMessage = (value) => {
    const editor =
      editorRef.current

    if (!editor) return

    editor.innerHTML = ''

    const text =
      String(value || '')

    const variablePattern =
      /{{[^{}]+}}/g

    let lastIndex = 0
    let match

    while (
      (match =
        variablePattern.exec(text)) !==
      null
    ) {
      const variable =
        variableMap[match[0]]

      if (!variable) {
        editor.appendChild(
          document.createTextNode(
            text.slice(
              lastIndex,
              match.index +
                match[0].length
            )
          )
        )

        lastIndex =
          variablePattern.lastIndex

        continue
      }

      const before =
        text.slice(
          lastIndex,
          match.index
        )

      if (before) {
        editor.appendChild(
          document.createTextNode(
            before
          )
        )
      }

      editor.appendChild(
        createVariableChip(
          variable
        )
      )

      lastIndex =
        variablePattern.lastIndex
    }

    const remaining =
      text.slice(lastIndex)

    if (remaining) {
      editor.appendChild(
        document.createTextNode(
          remaining
        )
      )
    }

    if (!editor.childNodes.length) {
      editor.appendChild(
        document.createTextNode('')
      )
    }
  }

  const serializeEditor = () => {
    const editor =
      editorRef.current

    if (!editor) {
      return {
        message: '',
        invalidVariables: [],
      }
    }

    let message = ''

    const invalidVariables =
      new Set()

    const walk = (node) => {
      if (
        node.nodeType ===
        Node.TEXT_NODE
      ) {
        const text =
          node.textContent || ''

        const matches =
          text.match(
            /{{[^{}]+}}/g
          ) || []

        matches.forEach(
          (value) => {
            if (!variableMap[value]) {
              invalidVariables.add(
                value
              )
            } else {
              invalidVariables.add(
                value
              )
            }
          }
        )

        message += text

        return
      }

      if (
        node.nodeType !==
        Node.ELEMENT_NODE
      ) {
        return
      }

      if (node.dataset.variable) {
        message +=
          node.dataset.variable

        return
      }

      if (node.tagName === 'BR') {
        message += '\n'

        return
      }

      Array.from(
        node.childNodes
      ).forEach(walk)

      if (
        node !== editor &&
        node.tagName === 'DIV'
      ) {
        message += '\n'
      }
    }

    Array.from(
      editor.childNodes
    ).forEach(walk)

    return {
      message,
      invalidVariables:
        Array.from(
          invalidVariables
        ),
    }
  }

  const emitMessage = () => {
    const result =
      serializeEditor()

    lastMessageRef.current =
      result.message

    onChange({
      target: {
        value: result.message,
      },
      invalidVariables:
        result.invalidVariables,
    })
  }

  const handleInput = () => {
    saveSelection()
    emitMessage()
  }

  const handleKeyDown = (
    event
  ) => {
    const editor =
      editorRef.current

    if (!editor) return

    const selection =
      window.getSelection()

    if (
      !selection ||
      selection.rangeCount === 0
    ) {
      return
    }

    const range =
      selection.getRangeAt(0)

    if (
      !editor.contains(
        range.commonAncestorContainer
      )
    ) {
      return
    }

    if (
      event.key !== 'Backspace' &&
      event.key !== 'Delete'
    ) {
      return
    }

    const getVariableFromNode = (
      node
    ) => {
      if (!node) return null

      if (
        node.nodeType ===
          Node.ELEMENT_NODE &&
        node.dataset?.variable
      ) {
        return node
      }

      if (
        node.parentElement?.dataset
          ?.variable
      ) {
        return node.parentElement
      }

      return null
    }

    let adjacentVariable = null

    if (event.key === 'Backspace') {
      if (
        range.collapsed &&
        range.startContainer
          .nodeType ===
          Node.ELEMENT_NODE
      ) {
        const child =
          range.startContainer
            .childNodes[
            range.startOffset - 1
          ]

        adjacentVariable =
          getVariableFromNode(
            child
          )
      }

      if (
        range.collapsed &&
        range.startContainer
          .nodeType ===
          Node.TEXT_NODE &&
        range.startOffset === 0
      ) {
        adjacentVariable =
          getVariableFromNode(
            range.startContainer
              .previousSibling
          )
      }
    }

    if (event.key === 'Delete') {
      if (
        range.collapsed &&
        range.startContainer
          .nodeType ===
          Node.ELEMENT_NODE
      ) {
        const child =
          range.startContainer
            .childNodes[
            range.startOffset
          ]

        adjacentVariable =
          getVariableFromNode(
            child
          )
      }

      if (
        range.collapsed &&
        range.startContainer
          .nodeType ===
          Node.TEXT_NODE &&
        range.startOffset ===
          range.startContainer
            .textContent.length
      ) {
        adjacentVariable =
          getVariableFromNode(
            range.startContainer
              .nextSibling
          )
      }
    }

    if (adjacentVariable) {
      event.preventDefault()
      event.stopPropagation()
    }
  }

  const handleBeforeInput = (
    event
  ) => {
    if (
      event.inputType ===
        'deleteContentBackward' ||
      event.inputType ===
        'deleteContentForward' ||
      event.inputType ===
        'deleteByCut'
    ) {
      const editor =
        editorRef.current

      const selection =
        window.getSelection()

      if (
        !editor ||
        !selection ||
        selection.rangeCount === 0
      ) {
        return
      }

      const range =
        selection.getRangeAt(0)

      if (
        !editor.contains(
          range.commonAncestorContainer
        )
      ) {
        return
      }

      const variableElement =
        range.startContainer
          .nodeType ===
          Node.ELEMENT_NODE
          ? range.startContainer
              .childNodes[
              event.inputType ===
              'deleteContentBackward'
                ? range.startOffset - 1
                : range.startOffset
            ]
          : null

      if (
        variableElement?.nodeType ===
          Node.ELEMENT_NODE &&
        variableElement.dataset
          ?.variable
      ) {
        event.preventDefault()
      }
    }
  }

  const insertVariable = (
    variable
  ) => {
    const editor =
      editorRef.current

    if (!editor || loading) {
      return
    }

    editor.focus()

    if (!restoreSelection()) {
      placeCaretAtEnd()
    }

    const selection =
      window.getSelection()

    if (
      !selection ||
      selection.rangeCount === 0
    ) {
      placeCaretAtEnd()
    }

    const currentSelection =
      window.getSelection()

    if (
      !currentSelection ||
      currentSelection.rangeCount === 0
    ) {
      return
    }

    const range =
      currentSelection.getRangeAt(0)

    if (
      !editor.contains(
        range.commonAncestorContainer
      )
    ) {
      placeCaretAtEnd()
    }

    const finalSelection =
      window.getSelection()

    if (
      !finalSelection ||
      finalSelection.rangeCount === 0
    ) {
      return
    }

    const finalRange =
      finalSelection.getRangeAt(0)

    const chip =
      createVariableChip(
        variable
      )

    const spacer =
      document.createTextNode(
        ' '
      )

    finalRange.deleteContents()

    finalRange.insertNode(
      spacer
    )

    finalRange.insertNode(
      chip
    )

    const caretRange =
      document.createRange()

    caretRange.setStartAfter(
      spacer
    )

    caretRange.collapse(true)

    finalSelection.removeAllRanges()

    finalSelection.addRange(
      caretRange
    )

    saveSelection()
    emitMessage()
  }

  useEffect(() => {
    if (!insertVariableRef) {
      return
    }

    insertVariableRef.current =
      insertVariable

    return () => {
      if (
        insertVariableRef.current ===
        insertVariable
      ) {
        insertVariableRef.current =
          null
      }
    }
  }, [
    insertVariable,
    insertVariableRef,
  ])

  useEffect(() => {
    if (loading) {
      return
    }

    if (
      lastMessageRef.current ===
        message &&
      editorRef.current?.childNodes
        .length
    ) {
      return
    }

    renderMessage(message)

    lastMessageRef.current =
      message

    selectionRef.current =
      null
  }, [
    message,
    loading,
  ])

  return (
    <>
      <div
        ref={editorRef}
        id="message-editor"
        className="messages-textarea messages-protected-editor"
        contentEditable={!loading}
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        data-placeholder="Escribe aquí el mensaje que recibirán tus clientes..."
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onBeforeInput={
          handleBeforeInput
        }
        onKeyUp={saveSelection}
        onMouseUp={
          saveSelection
        }
        onFocus={
          saveSelection
        }
        onBlur={
          saveSelection
        }
        spellCheck="false"
      />

      <div className="messages-protected-editor-help">
        <span>💡</span>

        <span>
          Las variables son cajas
          protegidas. Coloca el cursor
          donde quieras y pulsa una
          variable para insertarla.
          Solo puedes eliminar una
          variable desde su{' '}
          <strong>×</strong>.
        </span>
      </div>
    </>
  )
}

export default function Messages() {
  const editorInsertVariableRef =
    useRef(null)

  const [
    selectedNumber,
    setSelectedNumber,
  ] = useState(1)

  const messageEditorRef =
    React.useRef(null)

  const [messages, setMessages] =
    useState(() =>
      AUTOMATIONS.reduce(
        (acc, automation) => {
          acc[automation.number] =
            automation.defaultMessage

          return acc
        },
        {}
      )
    )

  const [
    savedMessages,
    setSavedMessages,
  ] = useState(() =>
    AUTOMATIONS.reduce(
      (acc, automation) => {
        acc[automation.number] =
          automation.defaultMessage

        return acc
      },
      {}
    )
  )

  const [saved, setSaved] =
    useState(false)

  const [
    invalidVariables,
    setInvalidVariables,
  ] = useState([])

  const [
    businessAddress,
    setBusinessAddress,
  ] = useState('')

  const [
    loadingBusiness,
    setLoadingBusiness,
  ] = useState(true)

  const [
    addressDialogOpen,
    setAddressDialogOpen,
  ] = useState(false)

  const [
    addressDraft,
    setAddressDraft,
  ] = useState('')

  const [
    savingAddress,
    setSavingAddress,
  ] = useState(false)

  const [
    addressError,
    setAddressError,
  ] = useState('')

  const [
    loadingMessages,
    setLoadingMessages,
  ] = useState(true)

  /*
   * =====================================================
   * CARGAR CONFIGURACIÓN DEL NEGOCIO
   * =====================================================
   */

  useEffect(() => {
    const loadBusinessSettings =
      async () => {
        const token =
          localStorage.getItem(
            'access_token'
          )

        if (!token) {
          setLoadingBusiness(false)
          return
        }

        try {
          const response =
            await fetch(
              `${API_URL}?action=business-settings`,
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

          if (response.status === 401) {
            setLoadingBusiness(false)
            return
          }

          const result =
            await response.json()

          if (
            !response.ok ||
            !result.success
          ) {
            console.error(
              '❌ Error cargando configuración del negocio:',
              result
            )

            setLoadingBusiness(false)
            return
          }

          const data =
            result.data || {}

          setBusinessAddress(
            String(
              data.address || ''
            ).trim()
          )
        } catch (error) {
          console.error(
            '❌ Error consultando configuración del negocio:',
            error
          )
        } finally {
          setLoadingBusiness(false)
        }
      }

    loadBusinessSettings()
  }, [])

  /*
   * =====================================================
   * CARGAR MENSAJES DESDE LA BASE DE DATOS
   * =====================================================
   */

  useEffect(() => {
    const loadMessages =
      async () => {
        const token =
          localStorage.getItem(
            'access_token'
          )

        if (!token) {
          console.error(
            '❌ No hay token para cargar mensajes.'
          )

          setLoadingMessages(false)
          return
        }

        try {
          const response =
            await fetch(
              `${API_URL}?action=business-automation-templates`,
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

          if (response.status === 401) {
            console.error(
              '❌ Sesión expirada al cargar mensajes.'
            )

            setLoadingMessages(false)
            return
          }

          const result =
            await response.json()

          if (
            !response.ok ||
            !result.success
          ) {
            console.error(
              '❌ Error cargando mensajes:',
              result
            )

            setLoadingMessages(false)
            return
          }

          const templates =
            result.data || []

          setMessages(
            (previous) => {
              const updated = {
                ...previous,
              }

              templates.forEach(
                (template) => {
                  const number =
                    Number(
                      template.automation_number
                    )

                  if (
                    number >= 1 &&
                    number <= 3
                  ) {
                    if (
                      template.message !==
                        null &&
                      template.message !==
                        undefined
                    ) {
                      updated[number] =
                        template.message
                    }
                  }
                }
              )

              setSavedMessages({
                ...updated,
              })

              return updated
            }
          )

          console.log(
            '✅ Mensajes cargados desde la base de datos:',
            templates
          )
        } catch (error) {
          console.error(
            '❌ Error consultando mensajes:',
            error
          )
        } finally {
          setLoadingMessages(false)
        }
      }

    loadMessages()
  }, [])

  const selectedAutomation =
    useMemo(
      () =>
        AUTOMATIONS.find(
          (automation) =>
            automation.number ===
            selectedNumber
        ) ||
        AUTOMATIONS[0],
      [selectedNumber]
    )

  const currentMessage =
    messages[selectedNumber] || ''

  const savedMessage =
    savedMessages[selectedNumber] ||
    ''

  const hasChanges =
    currentMessage !== savedMessage

  const addressConfigured =
    businessAddress.trim() !== ''

  const availableVariables =
    VARIABLES.filter(
      (variable) =>
        variable.key !==
          '{{direccion}}' ||
        addressConfigured
    )

  const previewValues = {
    ...PREVIEW_VALUES,
    '{{direccion}}':
      addressConfigured
        ? businessAddress
        : '⚠️ Dirección no configurada',
  }

  const previewMessage =
    replaceVariables(
      currentMessage,
      previewValues
    )

  const characterCount =
    currentMessage.length

  /*
   * =====================================================
   * CAMBIAR MENSAJE
   * =====================================================
   */

  const handleMessageChange = (
    event
  ) => {
    setMessages(
      (previous) => ({
        ...previous,
        [selectedNumber]:
          event.target.value,
      })
    )

    setInvalidVariables(
      Array.isArray(
        event.invalidVariables
      )
        ? event.invalidVariables
        : []
    )

    setSaved(false)
  }

  /*
   * =====================================================
   * INSERTAR VARIABLE
   * =====================================================
   */

  const insertVariable = (
    variable
  ) => {
    messageEditorRef.current?.insertVariable(
      variable
    )
  }

  /*
   * =====================================================
   * CONFIGURAR DIRECCIÓN
   * =====================================================
   */

  const openAddressDialog = () => {
    setAddressDraft(
      businessAddress
    )

    setAddressError('')
    setAddressDialogOpen(true)
  }

  const closeAddressDialog = () => {
    if (savingAddress) {
      return
    }

    setAddressDialogOpen(false)
    setAddressError('')
  }

  const handleSaveAddress =
    async () => {
      const token =
        localStorage.getItem(
          'access_token'
        )

      if (!token) {
        setAddressError(
          'Tu sesión ha expirado. Vuelve a iniciar sesión.'
        )

        return
      }

      const address =
        addressDraft.trim()

      if (!address) {
        setAddressError(
          'La dirección es obligatoria.'
        )

        return
      }

      setSavingAddress(true)
      setAddressError('')

      try {
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

                Accept:
                  'application/json',
              },

              body: JSON.stringify({
                address,
              }),
            }
          )

        const result =
          await response.json()

        if (
          response.status === 401
        ) {
          setAddressError(
            'Tu sesión ha expirado. Vuelve a iniciar sesión.'
          )

          return
        }

        if (
          !response.ok ||
          !result.success
        ) {
          setAddressError(
            result.message ||
              'No se pudo guardar la dirección.'
          )

          return
        }

        setBusinessAddress(address)

        setAddressDialogOpen(
          false
        )

        setAddressError('')
      } catch (error) {
        console.error(
          '❌ Error guardando dirección:',
          error
        )

        setAddressError(
          'No se pudo conectar con la API.'
        )
      } finally {
        setSavingAddress(false)
      }
    }

  /*
   * =====================================================
   * GUARDAR MENSAJE
   * =====================================================
   */

  const handleSave =
    async () => {
      const token =
        localStorage.getItem(
          'access_token'
        )

      if (
        invalidVariables.length >
        0
      ) {
        window.alert(
          `El mensaje contiene variables escritas manualmente o inválidas: ${invalidVariables.join(
            ', '
          )}. Las variables solo pueden agregarse desde los botones de variables disponibles.`
        )

        return
      }

      if (
        !addressConfigured &&
        currentMessage.includes(
          '{{direccion}}'
        )
      ) {
        window.alert(
          'Este mensaje utiliza {{direccion}}, pero la dirección de tu negocio no está configurada. Configura la dirección antes de guardar.'
        )

        return
      }

      if (!token) {
        window.alert(
          'Tu sesión ha expirado. Vuelve a iniciar sesión.'
        )

        return
      }

      try {
        const response =
          await fetch(
            `${API_URL}?action=business-automation-template`,
            {
              method: 'PUT',

              headers: {
                'Content-Type':
                  'application/json',

                Authorization:
                  `Bearer ${token}`,

                Accept:
                  'application/json',
              },

              body: JSON.stringify({
                automation_number:
                  selectedNumber,

                message:
                  currentMessage,
              }),
            }
          )

        const result =
          await response.json()

        if (
          response.status === 401
        ) {
          window.alert(
            'Tu sesión ha expirado. Vuelve a iniciar sesión.'
          )

          return
        }

        if (
          !response.ok ||
          !result.success
        ) {
          console.error(
            '❌ Error guardando mensaje:',
            result
          )

          window.alert(
            result.message ||
              'No se pudo guardar el mensaje.'
          )

          return
        }

        console.log(
          '✅ Mensaje guardado correctamente:',
          result.data
        )

        setSavedMessages(
          (previous) => ({
            ...previous,
            [selectedNumber]:
              currentMessage,
          })
        )

        setSaved(true)

        window.setTimeout(
          () => {
            setSaved(false)
          },
          2500
        )
      } catch (error) {
        console.error(
          '❌ Error guardando mensaje:',
          error
        )

        window.alert(
          'No se pudo conectar con la API.'
        )
      }
    }

  /*
   * =====================================================
   * RESTAURAR MENSAJE
   * =====================================================
   */

  const handleReset = () => {
    const confirmed =
      window.confirm(
        '¿Restaurar el mensaje predeterminado?'
      )

    if (!confirmed) {
      return
    }

    setMessages(
      (previous) => ({
        ...previous,
        [selectedNumber]:
          selectedAutomation.defaultMessage,
      })
    )

    setSaved(false)
  }

  return (
    <main className="messages-page">

      <div className="messages-container">

        {/* =================================================
            HEADER
        ================================================= */}

        <header className="messages-header">

          <div className="messages-heading">

            <div className="messages-eyebrow">
              Comunicación
            </div>

            <h1 className="messages-title">

              <span
                className="messages-title-icon"
                aria-hidden="true"
              >
                💬
              </span>

              <span>
                Mensajes
              </span>

            </h1>

            <p className="messages-description">
              Personalizá los mensajes que
              Agendareminder enviará
              automáticamente a tus clientes.
            </p>

          </div>

          <div className="messages-header-status">

            <span className="messages-status-dot" />

            <span>
              Automatizaciones activas
            </span>

          </div>

        </header>

        {/* =================================================
            CONTENT
        ================================================= */}

        <div className="messages-layout">

          {/* =================================================
              AUTOMATIZACIONES
          ================================================= */}

          <section className="messages-automations">

            <div className="messages-section-label">
              MENSAJES AUTOMÁTICOS
            </div>

            <div className="messages-automation-list">

              {AUTOMATIONS.map(
                (automation) => {
                  const active =
                    selectedNumber ===
                    automation.number

                  return (
                    <button
                      key={
                        automation.number
                      }
                      type="button"
                      className={`messages-automation-card ${
                        active
                          ? 'is-active'
                          : ''
                      }`}
                      onClick={() => {
                        setSelectedNumber(
                          automation.number
                        )

                        setInvalidVariables(
                          []
                        )

                        setSaved(false)
                      }}
                    >

                      <div className="messages-automation-icon">
                        {automation.icon}
                      </div>

                      <div className="messages-automation-info">

                        <div className="messages-automation-title">
                          {automation.title}
                        </div>

                        <div className="messages-automation-subtitle">
                          {automation.subtitle}
                        </div>

                      </div>

                      <div className="messages-automation-arrow">
                        →
                      </div>

                    </button>
                  )
                }
              )}

            </div>

            {!loadingBusiness &&
            !addressConfigured ? (
              <div
                className="messages-address-warning"
                role="status"
              >

                <div className="messages-address-warning-icon">
                  ⚠️
                </div>

                <div className="messages-address-warning-content">

                  <div className="messages-address-warning-title">
                    Dirección no configurada
                  </div>

                  <div className="messages-address-warning-text">
                    La variable{' '}
                    {'{{direccion}}'} no está
                    disponible porque la dirección
                    de tu negocio todavía no está
                    configurada.
                  </div>

                </div>

                <button
                  type="button"
                  className="messages-address-warning-button"
                  onClick={
                    openAddressDialog
                  }
                >
                  Configurar dirección
                </button>

              </div>
            ) : (
              <div className="messages-info-card">

                <div className="messages-info-icon">
                  💡
                </div>

                <div>

                  <div className="messages-info-title">
                    Variables dinámicas
                  </div>

                  <div className="messages-info-text">
                    Usa variables para que cada
                    mensaje se personalice
                    automáticamente para cada
                    cliente.
                  </div>

                </div>

              </div>
            )}

          </section>

          {/* =================================================
              EDITOR
          ================================================= */}

          <section className="messages-editor-panel">

            <div className="messages-panel-header">

              <div>

                <div className="messages-panel-kicker">
                  AUTOMATIZACIÓN{' '}
                  {selectedAutomation.number}
                </div>

                <h2 className="messages-panel-title">
                  {selectedAutomation.title}
                </h2>

              </div>

              <div className="messages-active-badge">

                <span />

                Activo

              </div>

            </div>

            <p className="messages-panel-description">
              {selectedAutomation.description}
            </p>

            <div className="messages-editor-wrapper">

              <ProtectedMessageEditor
                ref={messageEditorRef}
                message={currentMessage}
                loading={loadingMessages}
                availableVariables={
                  availableVariables
                }
                onChange={
                  handleMessageChange
                }
                insertVariableRef={
                  editorInsertVariableRef
                }
              />

              <div className="messages-editor-footer">

                <span>
                  Puedes utilizar las variables
                  de abajo para personalizar
                  automáticamente el mensaje.
                </span>

                <span className="messages-counter">
                  {characterCount}{' '}
                  caracteres
                </span>

              </div>

            </div>

            {/* =================================================
                VARIABLES
            ================================================= */}

            <div className="messages-variables-section">

              <div className="messages-variables-header">

                <div>

                  <div className="messages-variables-title">
                    Variables disponibles
                  </div>

                  <div className="messages-variables-description">
                    Haz clic para insertar una
                    variable en el mensaje.
                  </div>

                </div>

              </div>

              <div className="messages-variable-list">

                {availableVariables.map(
                  (variable) => (
                    <button
                      key={
                        variable.key
                      }
                      type="button"
                      className="messages-variable-chip"
                      onMouseDown={(
                        event
                      ) => {
                        event.preventDefault()
                      }}
                      onClick={() =>
                        editorInsertVariableRef.current?.(
                          variable
                        )
                      }
                      disabled={
                        loadingMessages
                      }
                      title={`Insertar ${variable.key}`}
                    >

                      <span>
                        {variable.icon}
                      </span>

                      <span>
                        {variable.label}
                      </span>

                    </button>
                  )
                )}

              </div>

            </div>

            {/* =================================================
                ACTIONS
            ================================================= */}

            <div className="messages-actions">

              <button
                type="button"
                className="messages-reset-button"
                onClick={
                  handleReset
                }
                disabled={
                  loadingMessages
                }
              >
                Restaurar
              </button>

              <button
                type="button"
                className={`messages-save-button ${
                  saved
                    ? 'is-saved'
                    : ''
                }`}
                onClick={
                  handleSave
                }
                disabled={
                  loadingMessages ||
                  !hasChanges ||
                  invalidVariables.length >
                    0
                }
              >

                {saved ? (
                  <>
                    <span>✓</span>
                    Guardado
                  </>
                ) : (
                  <>
                    <span>💾</span>
                    Guardar cambios
                  </>
                )}

              </button>

            </div>

          </section>

          {/* =================================================
              PREVIEW
          ================================================= */}

          <section className="messages-preview-panel">

            <div className="messages-preview-header">

              <div>

                <div className="messages-panel-kicker">
                  VISTA PREVIA
                </div>

                <h2 className="messages-panel-title">
                  WhatsApp
                </h2>

              </div>

              <div className="messages-preview-whatsapp-icon">
                💬
              </div>

            </div>

            <div className="messages-preview-phone">

              <div className="messages-phone-header">

                <div className="messages-phone-avatar">
                  A
                </div>

                <div>

                  <div className="messages-phone-name">
                    {
                      PREVIEW_VALUES[
                        '{{negocio}}'
                      ]
                    }
                  </div>

                  <div className="messages-phone-status">
                    negocio
                  </div>

                </div>

              </div>

              <div className="messages-phone-body">

                <div className="messages-chat-date">
                  HOY
                </div>

                <div className="messages-whatsapp-bubble">

                  <div className="messages-whatsapp-text">

                    {previewMessage
                      .split('\n')
                      .map(
                        (
                          line,
                          index
                        ) => (
                          <React.Fragment
                            key={
                              index
                            }
                          >

                            {line}

                            {index <
                              previewMessage.split(
                                '\n'
                              ).length -
                                1 && (
                              <br />
                            )}

                          </React.Fragment>
                        )
                      )}

                  </div>

                  <div className="messages-whatsapp-time">
                    10:42 ✓✓
                  </div>

                </div>

              </div>

            </div>

            <div className="messages-preview-note">

              <span>👀</span>

              <span>
                Así verá el mensaje tu cliente
                cuando sea enviado por
                WhatsApp.
              </span>

            </div>

          </section>

        </div>

        {/* =================================================
            ADDRESS DIALOG
        ================================================= */}

        {addressDialogOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="messages-address-dialog-title"
            className="messages-address-dialog-overlay"
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                closeAddressDialog()
              }
            }}
          >

            <div
              className="messages-address-dialog"
              onMouseDown={(event) => {
                event.stopPropagation()
              }}
            >

              <div className="messages-address-dialog-header">

                <div>

                  <div className="messages-address-dialog-eyebrow">
                    DATOS DEL NEGOCIO
                  </div>

                  <h2 id="messages-address-dialog-title">
                    Configurar dirección
                  </h2>

                  <p>
                    Configura la dirección que se
                    utilizará con{' '}
                    {'{{direccion}}'} en tus
                    mensajes automáticos.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={
                    closeAddressDialog
                  }
                  disabled={
                    savingAddress
                  }
                  aria-label="Cerrar"
                  className="messages-address-dialog-close"
                >
                  ×
                </button>

              </div>

              <label
                htmlFor="messages-address-input"
                className="messages-address-dialog-label"
              >
                Dirección del negocio
              </label>

              <input
                id="messages-address-input"
                type="text"
                value={
                  addressDraft
                }
                onChange={(event) => {
                  setAddressDraft(
                    event.target.value
                  )

                  setAddressError('')
                }}
                onKeyDown={(event) => {
                  if (
                    event.key ===
                      'Enter' &&
                    !savingAddress
                  ) {
                    event.preventDefault()

                    handleSaveAddress()
                  }
                }}
                autoFocus
                placeholder="Ej. Calle Mayor 123, Madrid"
                disabled={
                  savingAddress
                }
                className="messages-address-dialog-input"
              />

              {addressError && (
                <div className="messages-address-dialog-error">
                  {addressError}
                </div>
              )}

              <div className="messages-address-dialog-actions">

                <button
                  type="button"
                  onClick={
                    closeAddressDialog
                  }
                  disabled={
                    savingAddress
                  }
                  className="messages-address-dialog-cancel"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={
                    handleSaveAddress
                  }
                  disabled={
                    savingAddress
                  }
                  className="messages-address-dialog-save"
                >
                  {savingAddress
                    ? 'Guardando...'
                    : 'Guardar dirección'}
                </button>

              </div>

            </div>

          </div>
        )}

      </div>

    </main>
  )
}