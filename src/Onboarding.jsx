import { useCallback, useEffect, useRef, useState } from 'react'
import QRCode from 'react-qr-code'

// =========================================================
// CONFIGURACIÓN
// =========================================================

const API_URL =
  'https://kreandoapp.com/api/index.php'

const NODE_URL =
  'http://localhost:3000'

// =========================================================
// COMPONENTE
// =========================================================

function Onboarding({ onConnected }) {

  const [qr, setQr] =
    useState('')

  const [connected, setConnected] =
    useState(false)

  const [phone, setPhone] =
    useState('')

  const [businessId, setBusinessId] =
    useState(null)

  const [message, setMessage] =
    useState('')

  const [checking, setChecking] =
    useState(true)

  // ---------------------------------------------------------
  // CONTROL INTERNO
  // ---------------------------------------------------------

  const connectingRef =
    useRef(false)

  const mountedRef =
    useRef(true)

  const pollingRef =
    useRef(null)

  const pollingActiveRef =
    useRef(false)

  // =========================================================
  // TOKEN
  // =========================================================

  const getToken = () => {

    return localStorage.getItem(
      'access_token'
    )

  }

  // =========================================================
  // HEADERS PHP
  // =========================================================

  const getHeaders = () => {

    const token =
      getToken()

    return {

      Authorization:
        `Bearer ${token}`,

      'Content-Type':
        'application/json',

    }

  }

  // =========================================================
  // BUSINESS ID
  // =========================================================

  const getBusinessId =
    useCallback(
      () => {

        const storedId =
          localStorage.getItem(
            'business_id'
          )

        console.log(
          '🏢 Business ID:',
          storedId
        )

        if (
          !storedId ||
          storedId === 'null' ||
          storedId === 'undefined'
        ) {

          console.error(
            '❌ No existe business_id'
          )

          return null

        }

        const numericBusinessId =
          Number(
            storedId
          )

        if (
          !Number.isInteger(
            numericBusinessId
          ) ||
          numericBusinessId <= 0
        ) {

          console.error(
            '❌ business_id inválido:',
            storedId
          )

          return null

        }

        if (
          mountedRef.current
        ) {

          setBusinessId(
            numericBusinessId
          )

        }

        return numericBusinessId

      },
      []
    )

  // =========================================================
  // STOP POLLING
  // =========================================================

  const stopPolling =
    useCallback(
      () => {

        pollingActiveRef.current =
          false

        if (
          pollingRef.current
        ) {

          clearTimeout(
            pollingRef.current
          )

          pollingRef.current =
            null

        }

      },
      []
    )

  // =========================================================
  // APLICAR ESTADO DE NODE
  // =========================================================

  const applyNodeStatus =
    useCallback(
      async (
        status
      ) => {

        if (
          !mountedRef.current ||
          !status
        ) {

          return false

        }

        console.log(
          '🧠 ESTADO REAL NODE:',
          status
        )

        // ===================================================
        // CONECTADO
        // ===================================================

        if (
          status.connected === true &&
          status.socket === true
        ) {

          console.log(
            ''
          )

          console.log(
            '================================='
          )

          console.log(
            '🟢 NODE CONFIRMA WHATSAPP CONECTADO'
          )

          console.log(
            '================================='
          )

          connectingRef.current =
            false

          stopPolling()

          setConnected(
            true
          )

          setQr(
            ''
          )

          setMessage(
            ''
          )

          // -------------------------------------------------
          // TELÉFONO
          // -------------------------------------------------

          if (
            status.phone
          ) {

            const cleanPhone =
              String(
                status.phone
              )
                .split(':')[0]
                .replace(
                  /\D/g,
                  ''
                )

            setPhone(
              cleanPhone
            )

          } else {

            setPhone(
              ''
            )

          }

          // -------------------------------------------------
          // AVISAR AL APP
          // -------------------------------------------------

          if (
            typeof onConnected ===
            'function'
          ) {

            try {

              await onConnected(
                status
              )

            } catch (
              error
            ) {

              console.error(
                '⚠️ Error en onConnected:',
                error
              )

            }

          }

          return true

        }

        // ===================================================
        // NO CONECTADO
        // ===================================================

        setConnected(
          false
        )

        // ---------------------------------------------------
        // MUY IMPORTANTE:
        // Si Node dice que no está conectado,
        // limpiamos el teléfono anterior.
        // ---------------------------------------------------

        setPhone(
          ''
        )

        // ===================================================
        // QR
        // ===================================================

        if (
          status.qr
        ) {

          console.log(
            '📲 QR DISPONIBLE DESDE NODE'
          )

          setQr(
            status.qr
          )

          setMessage(
            'Escaneá el código QR con WhatsApp'
          )

          return true

        }

        // ===================================================
        // SIN QR
        // ===================================================

        setQr(
          ''
        )

        // ---------------------------------------------------
        // Si está conectando no mostramos error.
        // ---------------------------------------------------

        if (
          status.connecting === true
        ) {

          setMessage(
            ''
          )

          return false

        }

        // ---------------------------------------------------
        // DESCONECTADO
        // ---------------------------------------------------

        setMessage(
          ''
        )

        return false

      },
      [
        onConnected,
        stopPolling
      ]
    )

  // =========================================================
  // CONSULTAR STATUS DIRECTAMENTE A NODE
  // =========================================================

  const checkNodeStatus =
    useCallback(
      async () => {

        const currentBusinessId =
          getBusinessId()

        if (
          !currentBusinessId
        ) {

          setConnected(
            false
          )

          setPhone(
            ''
          )

          setQr(
            ''
          )

          setChecking(
            false
          )

          return null

        }

        try {

          console.log(
            ''
          )

          console.log(
            '================================='
          )

          console.log(
            '📡 CONSULTANDO NODE'
          )

          console.log(
            '================================='
          )

          console.log(
            '🏢 Business ID:',
            currentBusinessId
          )

          const response =
            await fetch(
              `${NODE_URL}/whatsapp/status?business_id=${encodeURIComponent(
                currentBusinessId
              )}`,
              {
                method:
                  'GET',

                headers: {
                  Accept:
                    'application/json',
                },

                cache:
                  'no-store',

              }
            )

          const text =
            await response.text()

          let result

          try {

            result =
              JSON.parse(
                text
              )

          } catch {

            result = {

              success:
                false,

              message:
                text,

            }

          }

          console.log(
            '📥 NODE STATUS:',
            result
          )

          if (
            !response.ok ||
            result?.success !== true
          ) {

            console.warn(
              '⚠️ Node no devolvió un estado válido'
            )

            setConnected(
              false
            )

            setPhone(
              ''
            )

            setQr(
              ''
            )

            return null

          }

          await applyNodeStatus(
            result
          )

          return result

        } catch (
          error
        ) {

          console.error(
            '❌ ERROR CONSULTANDO NODE:',
            error
          )

          // -------------------------------------------------
          // Si Node no responde:
          //
          // NO asumimos que WhatsApp está conectado.
          // -------------------------------------------------

          setConnected(
            false
          )

          setPhone(
            ''
          )

          return null

        } finally {

          setChecking(
            false
          )

        }

      },
      [
        getBusinessId,
        applyNodeStatus
      ]
    )

  // =========================================================
  // POLLING NODE
  // =========================================================

  const startPolling =
    useCallback(
      (
        currentBusinessId
      ) => {

        stopPolling()

        pollingActiveRef.current =
          true

        let attempts =
          0

        const maxAttempts =
          120

        const poll =
          async () => {

            if (
              !mountedRef.current ||
              !pollingActiveRef.current ||
              !connectingRef.current
            ) {

              return

            }

            attempts++

            console.log(
              `🔎 NODE estado ${attempts}/${maxAttempts}`
            )

            try {

              const response =
                await fetch(
                  `${NODE_URL}/whatsapp/status?business_id=${currentBusinessId}`,
                  {
                    method:
                      'GET',

                    headers: {
                      Accept:
                        'application/json',
                    },

                    cache:
                      'no-store',
                  }
                )

              const text =
                await response.text()

              let status

              try {

                status =
                  JSON.parse(
                    text
                  )

              } catch {

                status = null

              }

              console.log(
                '📡 NODE POLLING:',
                status
              )

              if (
                response.ok &&
                status?.success === true
              ) {

                // -------------------------------------------
                // CONECTADO
                // -------------------------------------------

                if (
                  status.connected === true &&
                  status.socket === true
                ) {

                  await applyNodeStatus(
                    status
                  )

                  return

                }

                // -------------------------------------------
                // QR
                // -------------------------------------------

                if (
                  status.qr
                ) {

                  if (
                    mountedRef.current
                  ) {

                    setQr(
                      status.qr
                    )

                    setMessage(
                      'Escaneá el código QR con WhatsApp'
                    )

                  }

                }

              }

            } catch (
              error
            ) {

              console.warn(
                '⚠️ Error polling Node:',
                error?.message ||
                error
              )

            }

            // ------------------------------------------------
            // TIMEOUT
            // ------------------------------------------------

            if (
              attempts >= maxAttempts
            ) {

              console.warn(
                '⏱️ Polling finalizado'
              )

              stopPolling()

              connectingRef.current =
                false

              if (
                mountedRef.current
              ) {

                setMessage(
                  'No se pudo conectar con WhatsApp. Intentá nuevamente.'
                )

              }

              return

            }

            // ------------------------------------------------
            // SIGUIENTE
            // ------------------------------------------------

            pollingRef.current =
              setTimeout(
                poll,
                1000
              )

          }

        poll()

      },
      [
        applyNodeStatus,
        stopPolling
      ]
    )

  // =========================================================
  // CONECTAR WHATSAPP
  // =========================================================

  const connectWhatsApp =
    async () => {

      if (
        connectingRef.current
      ) {

        console.log(
          '⏳ Ya existe una conexión en proceso'
        )

        return

      }

      const currentBusinessId =
        getBusinessId()

      if (
        !currentBusinessId
      ) {

        setMessage(
          'No se encontró el negocio asociado a tu cuenta.'
        )

        return

      }

      // -----------------------------------------------------
      // INICIAR
      // -----------------------------------------------------

      connectingRef.current =
        true

      stopPolling()

      setConnected(
        false
      )

      setPhone(
        ''
      )

      setQr(
        ''

      )

      setMessage(
        ''
      )

      console.log(
        ''
      )

      console.log(
        '================================='
      )

      console.log(
        '📲 SOLICITANDO CONEXIÓN A NODE'
      )

      console.log(
        '================================='
      )

      console.log(
        '🏢 Business ID:',
        currentBusinessId
      )

      try {

        // ===================================================
        // NODE CONNECT
        // ===================================================

        const response =
          await fetch(
            `${NODE_URL}/whatsapp/connect`,
            {
              method:
                'POST',

              headers: {
                'Content-Type':
                  'application/json',

                Accept:
                  'application/json',
              },

              body:
                JSON.stringify({

                  business_id:
                    currentBusinessId,

                }),

            }
          )

        const text =
          await response.text()

        let result

        try {

          result =
            JSON.parse(
              text
            )

        } catch {

          result = {

            success:
              false,

            message:
              text,

          }

        }

        console.log(
          '📡 NODE CONNECT:',
          result
        )

        if (
          !response.ok ||
          result?.success !== true
        ) {

          throw new Error(
            result?.message ||
            'No se pudo iniciar WhatsApp.'
          )

        }

        // ===================================================
        // YA CONECTADO
        // ===================================================

        if (
          result.connected === true &&
          result.socket === true
        ) {

          await applyNodeStatus(
            result
          )

          return

        }

        // ===================================================
        // QR DIRECTO
        // ===================================================

        if (
          result.qr
        ) {

          console.log(
            '📲 QR RECIBIDO DIRECTAMENTE'
          )

          setQr(
            result.qr
          )

          setMessage(
            'Escaneá el código QR con WhatsApp'
          )

        }

        // ===================================================
        // POLLING
        // ===================================================

        startPolling(
          currentBusinessId
        )

      } catch (
        error
      ) {

        console.error(
          '❌ ERROR CONECTANDO NODE:',
          error
        )

        connectingRef.current =
          false

        stopPolling()

        setConnected(
          false
        )

        setPhone(
          ''
        )

        setQr(
          ''

        )

        setMessage(
          error?.message ||
          'No se pudo iniciar la conexión con WhatsApp.'
        )

      }

    }

  // =========================================================
  // INICIALIZACIÓN
  // =========================================================

  useEffect(
    () => {

      mountedRef.current =
        true

      const initialize =
        async () => {

          console.log(
            ''
          )

          console.log(
            '================================='
          )

          console.log(
            '🚀 INICIALIZANDO ONBOARDING'
          )

          console.log(
            '================================='
          )

          const id =
            getBusinessId()

          if (
            !id
          ) {

            setMessage(
              'No se encontró el negocio asociado a tu sesión.'
            )

            setChecking(
              false
            )

            return

          }

          // -------------------------------------------------
          // IMPORTANTE:
          //
          // El estado inicial SIEMPRE viene de Node.
          // -------------------------------------------------

          const status =
            await checkNodeStatus()

          if (
            !mountedRef.current
          ) {

            return

          }

          // -------------------------------------------------
          // SI NODE DICE CONECTADO
          // -------------------------------------------------

          if (
            status?.connected === true &&
            status?.socket === true
          ) {

            return

          }

          // -------------------------------------------------
          // SI NODE TIENE QR
          // -------------------------------------------------

          if (
            status?.qr
          ) {

            setQr(
              status.qr
            )

            setMessage(
              'Escaneá el código QR con WhatsApp'
            )

          }

        }

      initialize()

      return () => {

        mountedRef.current =
          false

        connectingRef.current =
          false

        stopPolling()

      }

    },
    [
      getBusinessId,
      checkNodeStatus,
      stopPolling
    ]
  )

  // =========================================================
  // PANTALLA DE COMPROBACIÓN
  // =========================================================

  if (
    checking
  ) {

    return (

      <div
        style={{
          maxWidth:
            '700px',

          margin:
            '0 auto',

          textAlign:
            'center',
        }}
      >

        <h1>
          WhatsApp
        </h1>

        <p
          style={{
            color:
              '#999',

            fontSize:
              '18px',
          }}
        >
          📡 Comprobando conexión...
        </p>

      </div>

    )

  }

  // =========================================================
  // CONECTADO
  // =========================================================

  if (
    connected
  ) {

    return (

      <div
        style={{
          maxWidth:
            '700px',

          margin:
            '0 auto',
        }}
      >

        <h1>
          WhatsApp
        </h1>

        <p
          style={{
            color:
              '#999',

            fontSize:
              '18px',
          }}
        >
          Tu WhatsApp está conectado y listo
          para enviar recordatorios.
        </p>

        <div
          style={{
            marginTop:
              '35px',

            padding:
              '35px',

            background:
              '#162019',

            border:
              '1px solid #1d8f3b',

            borderRadius:
              '18px',

            textAlign:
              'center',
          }}
        >

          <div
            style={{
              fontSize:
                '60px',

              marginBottom:
                '10px',
            }}
          >
            ✅
          </div>

          <h2
            style={{
              fontSize:
                '28px',

              marginBottom:
                '10px',
            }}
          >
            WhatsApp conectado
          </h2>

          <p
            style={{
              color:
                '#aaa',

              fontSize:
                '16px',
            }}
          >
            El sistema puede enviar
            recordatorios automáticamente.
          </p>

          <hr
            style={{
              borderColor:
                '#29342d',

              margin:
                '30px 0',
            }}
          />

          <p
            style={{
              color:
                '#999',

              marginBottom:
                '5px',
            }}
          >
            📱 Número conectado
          </p>

          <h2>
            {phone
              ? `+${phone}`
              : 'Número conectado'}
          </h2>

          <div
            style={{
              marginTop:
                '25px',

              padding:
                '14px',

              background:
                '#202925',

              borderRadius:
                '10px',

              color:
                '#aaa',
            }}
          >
            🟢 WhatsApp listo para funcionar
          </div>

        </div>

      </div>

    )

  }

  // =========================================================
  // QR / ESPERA
  // =========================================================

  return (

    <div
      style={{
        maxWidth:
          '700px',

        margin:
          '0 auto',

        textAlign:
          'center',
      }}
    >

      <h1>
        Conectar WhatsApp
      </h1>

      <p
        style={{
          color:
            '#999',

          fontSize:
            '18px',

          marginBottom:
            '30px',
        }}
      >
        Vinculá tu WhatsApp para comenzar
        a enviar recordatorios automáticamente.
      </p>

      {/* =====================================================
          QR
      ===================================================== */}

      {qr && (

        <div>

          <div
            style={{
              display:
                'inline-block',

              background:
                '#fff',

              padding:
                '25px',

              borderRadius:
                '18px',

              boxShadow:
                '0 10px 40px rgba(0,0,0,0.25)',
            }}
          >

            <p
              style={{
                color:
                  '#111',

                fontWeight:
                  '600',

                marginTop:
                  0,

                marginBottom:
                  '20px',
              }}
            >
              Escaneá el código QR
            </p>

            <QRCode
              value={
                qr
              }

              size={
                300
              }
            />

          </div>

          <p
            style={{
              marginTop:
                '22px',

              color:
                '#aaa',

              lineHeight:
                '1.8',
            }}
          >
            📱 Abrí WhatsApp en tu teléfono
            <br />
            ⚙️ Dispositivos vinculados
            <br />
            📷 Vincular un dispositivo
          </p>

          {message && (

            <p
              style={{
                marginTop:
                  '15px',

                color:
                  '#aaa',
              }}
            >
              {message}
            </p>

          )}

        </div>

      )}

      {/* =====================================================
          ESPERA
      ===================================================== */}

      {!qr &&
        connectingRef.current && (

          <div
            style={{
              marginTop:
                '35px',

              padding:
                '25px',

              background:
                '#202925',

              borderRadius:
                '15px',

              color:
                '#777',
            }}
          >

            <div
              style={{
                fontSize:
                  '30px',

                opacity:
                  0.5,
              }}
            >
              📱
            </div>

          </div>

        )}

      {/* =====================================================
          BOTÓN
      ===================================================== */}

      {!qr &&
        !connectingRef.current && (

          <button
            onClick={
              connectWhatsApp
            }

            style={{
              marginTop:
                '25px',

              padding:
                '14px 30px',

              border:
                'none',

              borderRadius:
                '10px',

              fontSize:
                '16px',

              fontWeight:
                '600',

              cursor:
                'pointer',
            }}
          >

            📱 Conectar WhatsApp

          </button>

        )}

      {/* =====================================================
          ERROR / MENSAJE
      ===================================================== */}

      {message &&
        !qr &&
        !connectingRef.current && (

          <p
            style={{
              marginTop:
                '20px',

              color:
                '#ff7777',
            }}
          >
            {message}
          </p>

        )}

    </div>

  )

}

export default Onboarding