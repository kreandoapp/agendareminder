import React, { useRef, useState } from 'react'

import './VerifyResetCode.css'

import { useLanguage } from '../../context/LanguageContext'

export default function VerifyResetCode({
  email,
  onBack,
  onSubmit,
}) {

  const [code, setCode] = useState([
    '',
    '',
    '',
    '',
  ])

  const inputRefs = useRef([])

  const { t } = useLanguage()

  // =====================================================
  // CAMBIAR DÍGITO
  // =====================================================

  const handleChange = (
    index,
    value
  ) => {

    const digit =
      value
        .replace(/\D/g, '')
        .slice(-1)

    const newCode = [...code]

    newCode[index] = digit

    setCode(newCode)

    if (
      digit &&
      index < 3
    ) {

      inputRefs.current[
        index + 1
      ]?.focus()

    }

  }


  // =====================================================
  // TECLA ATRÁS
  // =====================================================

  const handleKeyDown = (
    index,
    e
  ) => {

    if (
      e.key === 'Backspace' &&
      !code[index] &&
      index > 0
    ) {

      inputRefs.current[
        index - 1
      ]?.focus()

    }

  }


  // =====================================================
  // PEGAR CÓDIGO
  // =====================================================

  const handlePaste = (e) => {

    e.preventDefault()

    const pasted =
      e.clipboardData
        .getData('text')
        .replace(/\D/g, '')
        .slice(0, 4)

    if (!pasted) {
      return
    }

    const newCode = [
      '',
      '',
      '',
      '',
    ]

    pasted
      .split('')
      .forEach(
        (digit, index) => {

          newCode[index] = digit

        }
      )

    setCode(newCode)

    const nextIndex =
      Math.min(
        pasted.length,
        3
      )

    inputRefs.current[
      nextIndex
    ]?.focus()

  }


  // =====================================================
  // ENVIAR
  // =====================================================

  const handleSubmit = (e) => {

    e.preventDefault()

    const completeCode =
      code.join('')

    if (
      completeCode.length !== 4
    ) {
      return
    }

    if (onSubmit) {
      onSubmit(completeCode)
    }

  }


  const isComplete =
    code.join('').length === 4


  return (

    <div className="verify-reset-page">

      <div className="verify-reset-card">


        {/* ============================================
            VOLVER
        ============================================ */}

        <button
          type="button"
          onClick={onBack}
          className="verify-reset-back"
        >
          ← {t(
            'auth.verifyResetCode.back',
            'Volver'
          )}
        </button>


        {/* ============================================
            CABECERA
        ============================================ */}

        <div className="verify-reset-header">

          <div className="verify-reset-icon">
            🔐
          </div>

          <h1>
            {t(
              'auth.verifyResetCode.title',
              'Ingresá el código'
            )}
          </h1>

          <p>
            {t(
              'auth.verifyResetCode.description',
              'Te enviamos un código de 4 dígitos a tu email.'
            )}
          </p>

          {email && (

            <p className="verify-reset-email">
              {email}
            </p>

          )}

        </div>


        {/* ============================================
            CÓDIGO
        ============================================ */}

        <form onSubmit={handleSubmit}>

          <div
            className="verify-reset-code"
            onPaste={handlePaste}
          >

            {code.map(
              (digit, index) => (

                <input
                  key={index}
                  ref={(element) => {
                    inputRefs.current[
                      index
                    ] = element
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => {
                    handleChange(
                      index,
                      e.target.value
                    )
                  }}
                  onKeyDown={(e) => {
                    handleKeyDown(
                      index,
                      e
                    )
                  }}
                  autoComplete={
                    index === 0
                      ? 'one-time-code'
                      : 'off'
                  }
                  className="verify-reset-code-input"
                />

              )
            )}

          </div>


          {/* =========================================
              INFORMACIÓN
          ========================================= */}

          <div className="verify-reset-info">

            {t(
              'auth.verifyResetCode.codeValidity',
              'El código es válido durante 10 minutos.'
            )}

          </div>


          {/* =========================================
              BOTÓN
          ========================================= */}

          <button
            type="submit"
            disabled={!isComplete}
            className={`verify-reset-submit ${
              !isComplete
                ? 'disabled'
                : ''
            }`}
          >

            {t(
              'auth.verifyResetCode.submit',
              'Verificar código'
            )}

          </button>

        </form>

      </div>

    </div>

  )

}