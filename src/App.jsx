import { useEffect, useRef, useState } from 'react'
import Onboarding from './Onboarding'
import SendWhatsApp from './SendWhatsApp'

const API_URL = 'https://kreandoapp.com/api/index.php'

function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [user, setUser] = useState(null)

  const [currentPage, setCurrentPage] = useState('home')

  const [whatsappConnected, setWhatsappConnected] = useState(false)
  const [whatsappPhone, setWhatsappPhone] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const statusInterval = useRef(null)

  // =====================================================
  // LIMPIAR SESIÓN
  // =====================================================

  const clearSession = () => {
    console.log('🔴 Sesión inválida o vencida. Limpiando...')

    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    localStorage.removeItem('business_id')

    if (statusInterval.current) {
      clearInterval(statusInterval.current)
      statusInterval.current = null
    }

    setUser(null)
    setWhatsappConnected(false)
    setWhatsappPhone('')
    setCurrentPage('home')
  }

  // =====================================================
  // COMPROBAR WHATSAPP
  // =====================================================

  const checkWhatsAppStatus = async () => {
    const token = localStorage.getItem('access_token')

    if (!token) {
      return false
    }

    try {
      const response = await fetch(
        `${API_URL}?action=whatsapp-status`,
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
        clearSession()
        return false
      }

      if (!response.ok) {
        return false
      }

      const data = result.data || result

      const connected =
        data.connected === true ||
        data.whatsapp_connected === true ||
        data.whatsappConnected === true

      const phone =
        data.phone ||
        data.whatsapp_phone ||
        data.whatsappPhone ||
        ''

      if (connected) {
        setWhatsappConnected(true)
        setWhatsappPhone(phone)
        return true
      }

      setWhatsappConnected(false)
      setWhatsappPhone('')

      return false

    } catch (error) {
      console.error(
        '❌ Error consultando WhatsApp:',
        error
      )

      return false
    }
  }

  // =====================================================
  // DETECTOR WHATSAPP
  // =====================================================

  const startWhatsAppDetector = () => {
    if (statusInterval.current) {
      clearInterval(statusInterval.current)
    }

    checkWhatsAppStatus()

    statusInterval.current = setInterval(() => {
      checkWhatsAppStatus()
    }, 5000)
  }

  // =====================================================
  // LOGIN
  // =====================================================

  const login = async () => {
    if (!email || !password) {
      setError('Ingresá email y contraseña.')
      return
    }

    setLoading(true)
    setError('')

    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    localStorage.removeItem('business_id')

    try {
      const response = await fetch(
        `${API_URL}?action=login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      )

      const result = await response.json()

      if (!result.success) {
        setError(
          result.message ||
          'Email o contraseña incorrectos.'
        )

        return
      }

      const data = result.data || {}

      const token =
        data.access_token ||
        data.token ||
        result.access_token ||
        result.token ||
        ''

      const businessId =
        data.business_id ||
        data.businessId ||
        result.business_id ||
        result.businessId ||
        null

      if (!token) {
        setError(
          'El servidor no devolvió el token de sesión.'
        )

        return
      }

      localStorage.setItem(
        'access_token',
        token
      )

      localStorage.setItem(
        'user',
        JSON.stringify(data)
      )

      if (businessId !== null) {
        localStorage.setItem(
          'business_id',
          String(businessId)
        )
      }

      setUser(data)

      const connected =
        await checkWhatsAppStatus()

      if (connected) {
        setCurrentPage('home')
      } else {
        setCurrentPage('onboarding')
      }

      startWhatsAppDetector()

    } catch (error) {
      console.error(
        '❌ Error login:',
        error
      )

      setError(
        'No se pudo conectar con la API.'
      )

    } finally {
      setLoading(false)
    }
  }

  // =====================================================
  // RESTAURAR SESIÓN
  // =====================================================

  useEffect(() => {
    const token =
      localStorage.getItem('access_token')

    const savedUser =
      localStorage.getItem('user')

    if (!token) {
      return
    }

    if (savedUser) {
      try {
        const parsedUser =
          JSON.parse(savedUser)

        setUser(parsedUser)

      } catch (error) {
        console.error(
          '❌ Error leyendo usuario:',
          error
        )

        clearSession()
        return
      }
    }

    checkWhatsAppStatus()
    startWhatsAppDetector()

    return () => {
      if (statusInterval.current) {
        clearInterval(
          statusInterval.current
        )

        statusInterval.current = null
      }
    }
  }, [])

  // =====================================================
  // LOGOUT
  // =====================================================

  const logout = () => {
    clearSession()

    setEmail('')
    setPassword('')
  }

  // =====================================================
  // NAVEGACIÓN
  // =====================================================

  const navigate = (page) => {
    setCurrentPage(page)
    setError('')
  }

  // =====================================================
  // LOGIN
  // =====================================================

  if (!user) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          boxSizing: 'border-box',
          background:
            'linear-gradient(135deg, #080a0f 0%, #10141c 50%, #0b1017 100%)',
          color: '#fff',
          fontFamily:
            'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '420px',
            padding: '42px',
            boxSizing: 'border-box',
            background: 'rgba(22, 25, 32, 0.96)',
            border: '1px solid #2a303a',
            borderRadius: '20px',
            boxShadow:
              '0 25px 80px rgba(0,0,0,0.45)',
          }}
        >
          <div
            style={{
              textAlign: 'center',
              marginBottom: '34px',
            }}
          >
            <div
              style={{
                width: '58px',
                height: '58px',
                margin: '0 auto 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '16px',
                background:
                  'linear-gradient(135deg, #25D366, #16a34a)',
                fontSize: '28px',
                boxShadow:
                  '0 10px 30px rgba(37,211,102,0.2)',
              }}
            >
              📅
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: '27px',
                fontWeight: 750,
              }}
            >
              Agendareminder
            </h1>

            <p
              style={{
                marginTop: '9px',
                marginBottom: 0,
                color: '#8f98a7',
                fontSize: '14px',
              }}
            >
              Gestión inteligente de recordatorios
            </p>
          </div>

          <div
            style={{
              marginBottom: '22px',
            }}
          >
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                color: '#cbd0d8',
                fontSize: '14px',
              }}
            >
              Email
            </label>

            <input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  login()
                }
              }}
              style={{
                width: '100%',
                padding: '14px 15px',
                boxSizing: 'border-box',
                borderRadius: '11px',
                border: '1px solid #343b47',
                background: '#0f1218',
                color: '#fff',
                outline: 'none',
                fontSize: '15px',
              }}
            />
          </div>

          <div
            style={{
              marginBottom: '20px',
            }}
          >
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                color: '#cbd0d8',
                fontSize: '14px',
              }}
            >
              Contraseña
            </label>

            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  login()
                }
              }}
              style={{
                width: '100%',
                padding: '14px 15px',
                boxSizing: 'border-box',
                borderRadius: '11px',
                border: '1px solid #343b47',
                background: '#0f1218',
                color: '#fff',
                outline: 'none',
                fontSize: '15px',
              }}
            />
          </div>

          {error && (
            <div
              style={{
                marginBottom: '18px',
                padding: '13px 14px',
                borderRadius: '10px',
                border: '1px solid #6b2b2b',
                background: '#241416',
                color: '#ff8585',
                fontSize: '14px',
              }}
            >
              ⚠️ {error}
            </div>
          )}

          <button
            onClick={login}
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              border: 'none',
              borderRadius: '11px',
              background: loading
                ? '#3c444e'
                : '#25D366',
              color: '#fff',
              fontSize: '15px',
              fontWeight: 700,
              cursor: loading
                ? 'not-allowed'
                : 'pointer',
              boxShadow: loading
                ? 'none'
                : '0 10px 25px rgba(37,211,102,0.18)',
            }}
          >
            {loading
              ? 'Ingresando...'
              : 'Iniciar sesión'}
          </button>
        </div>
      </div>
    )
  }

  // =====================================================
  // ESTILOS NAVEGACIÓN
  // =====================================================

  const navButtonStyle = (page) => ({
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 13px',
    marginBottom: '5px',
    boxSizing: 'border-box',
    background:
      currentPage === page
        ? '#202630'
        : 'transparent',
    color:
      currentPage === page
        ? '#fff'
        : '#aab1bd',
    border:
      currentPage === page
        ? '1px solid #303844'
        : '1px solid transparent',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight:
      currentPage === page
        ? 650
        : 500,
    textAlign: 'left',
    transition: 'all 0.15s ease',
  })

  // =====================================================
  // APP PRINCIPAL
  // =====================================================

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: '#0c0f14',
        color: '#fff',
        fontFamily:
          'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside
        style={{
          width: '260px',
          minHeight: '100vh',
          padding: '22px 15px',
          boxSizing: 'border-box',
          flexShrink: 0,
          background: '#101319',
          borderRight: '1px solid #242a33',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* LOGO */}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '11px',
            padding: '4px 9px',
            marginBottom: '30px',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '11px',
              background:
                'linear-gradient(135deg, #25D366, #168c46)',
              fontSize: '19px',
            }}
          >
            📅
          </div>

          <div>
            <div
              style={{
                fontSize: '16px',
                fontWeight: 750,
              }}
            >
              Agendareminder
            </div>

            <div
              style={{
                marginTop: '2px',
                color: '#737b88',
                fontSize: '11px',
              }}
            >
              Business platform
            </div>
          </div>
        </div>

        {/* USUARIO */}

        <div
          style={{
            margin: '0 5px 22px',
            padding: '15px',
            borderRadius: '12px',
            background: '#151920',
            border: '1px solid #252b34',
          }}
        >
          <div
            style={{
              marginBottom: '4px',
              fontWeight: 650,
              fontSize: '14px',
            }}
          >
            {user.name || 'Usuario'}
          </div>

          <div
            style={{
              color: '#7f8794',
              fontSize: '12px',
              wordBreak: 'break-word',
            }}
          >
            {user.email}
          </div>
        </div>

        {/* SECCIÓN */}

        <div
          style={{
            padding: '0 9px 9px',
            color: '#606875',
            fontSize: '10px',
            fontWeight: 750,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          Menú principal
        </div>

        {/* INICIO */}

        <button
          onClick={() => navigate('home')}
          style={navButtonStyle('home')}
        >
          <span>🏠</span>
          <span>Inicio</span>
        </button>

        {/* ONBOARDING */}

        <button
          type="button"
          onClick={() => {
            console.log('🚀 Abriendo Onboarding')
            navigate('onboarding')
          }}
          style={navButtonStyle('onboarding')}
        >
          <span>🚀</span>
          <span>Onboarding</span>
        </button>

        {/* WHATSAPP */}

        <button
          onClick={() => navigate('whatsapp')}
          style={navButtonStyle('whatsapp')}
        >
          <span>📱</span>

          <span
            style={{
              flex: 1,
            }}
          >
            WhatsApp
          </span>

          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background:
                whatsappConnected
                  ? '#25D366'
                  : '#ef5350',
              boxShadow:
                whatsappConnected
                  ? '0 0 8px rgba(37,211,102,0.7)'
                  : 'none',
            }}
          />
        </button>

        {/* ENVIAR */}

        <button
          onClick={() => navigate('send')}
          style={navButtonStyle('send')}
        >
          <span>💬</span>
          <span>Enviar mensaje</span>
        </button>

        {/* CONFIGURACIÓN */}

        <button
          onClick={() => navigate('settings')}
          style={navButtonStyle('settings')}
        >
          <span>⚙️</span>
          <span>Configuración</span>
        </button>

        {/* SEPARADOR */}

        <div
          style={{
            flex: 1,
          }}
        />

        {/* ESTADO */}

        <div
          style={{
            margin: '0 5px 12px',
            padding: '13px',
            borderRadius: '11px',
            background: whatsappConnected
              ? 'rgba(37,211,102,0.06)'
              : 'rgba(239,83,80,0.05)',
            border:
              whatsappConnected
                ? '1px solid rgba(37,211,102,0.16)'
                : '1px solid rgba(239,83,80,0.14)',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              color: '#727a87',
              marginBottom: '5px',
            }}
          >
            ESTADO WHATSAPP
          </div>

          <div
            style={{
              fontSize: '13px',
              fontWeight: 650,
              color: whatsappConnected
                ? '#5ee78b'
                : '#ff7777',
            }}
          >
            {whatsappConnected
              ? '● Conectado'
              : '● No conectado'}
          </div>

          {whatsappConnected &&
            whatsappPhone && (
              <div
                style={{
                  marginTop: '4px',
                  color: '#7f8794',
                  fontSize: '11px',
                }}
              >
                +{whatsappPhone}
              </div>
            )}
        </div>

        {/* LOGOUT */}

        <button
          onClick={logout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 13px',
            background: 'transparent',
            color: '#e26d6d',
            border: '1px solid transparent',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '14px',
            textAlign: 'left',
          }}
        >
          <span>🚪</span>
          <span>Cerrar sesión</span>
        </button>
      </aside>

      {/* =================================================
          CONTENIDO
      ================================================= */}

      <main
        style={{
          flex: 1,
          minWidth: 0,
          padding: '42px 48px',
          boxSizing: 'border-box',
          overflow: 'auto',
        }}
      >
        {/* =================================================
            HOME
        ================================================= */}

        {currentPage === 'home' && (
          <div
            style={{
              maxWidth: '1050px',
            }}
          >
            <div
              style={{
                marginBottom: '35px',
              }}
            >
              <div
                style={{
                  color: '#6f7886',
                  fontSize: '12px',
                  marginBottom: '8px',
                }}
              >
                PANEL PRINCIPAL
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize: '32px',
                  letterSpacing: '-0.02em',
                }}
              >
                Hola, {user.name || 'bienvenido'} 👋
              </h1>

              <p
                style={{
                  marginTop: '9px',
                  color: '#7f8794',
                  fontSize: '14px',
                }}
              >
                Gestioná tu negocio y automatizá tus
                comunicaciones.
              </p>
            </div>

            {/* TARJETAS */}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px',
                marginBottom: '22px',
              }}
            >
              <div
                style={{
                  padding: '22px',
                  background: '#14181f',
                  border: '1px solid #272e38',
                  borderRadius: '15px',
                }}
              >
                <div
                  style={{
                    color: '#737c89',
                    fontSize: '12px',
                    marginBottom: '12px',
                  }}
                >
                  WHATSAPP
                </div>

                <div
                  style={{
                    fontSize: '22px',
                    fontWeight: 750,
                    color: whatsappConnected
                      ? '#5ee78b'
                      : '#ff7777',
                  }}
                >
                  {whatsappConnected
                    ? 'Conectado'
                    : 'No conectado'}
                </div>

                {whatsappConnected &&
                  whatsappPhone && (
                    <div
                      style={{
                        marginTop: '6px',
                        color: '#7d8592',
                        fontSize: '12px',
                      }}
                    >
                      +{whatsappPhone}
                    </div>
                  )}
              </div>

              <div
                style={{
                  padding: '22px',
                  background: '#14181f',
                  border: '1px solid #272e38',
                  borderRadius: '15px',
                }}
              >
                <div
                  style={{
                    color: '#737c89',
                    fontSize: '12px',
                    marginBottom: '12px',
                  }}
                >
                  CUENTA
                </div>

                <div
                  style={{
                    fontSize: '18px',
                    fontWeight: 700,
                  }}
                >
                  Activa
                </div>

                <div
                  style={{
                    marginTop: '6px',
                    color: '#7d8592',
                    fontSize: '12px',
                  }}
                >
                  {user.email}
                </div>
              </div>

              <div
                style={{
                  padding: '22px',
                  background: '#14181f',
                  border: '1px solid #272e38',
                  borderRadius: '15px',
                }}
              >
                <div
                  style={{
                    color: '#737c89',
                    fontSize: '12px',
                    marginBottom: '12px',
                  }}
                >
                  AUTOMATIZACIÓN
                </div>

                <div
                  style={{
                    fontSize: '18px',
                    fontWeight: 700,
                  }}
                >
                  Lista para usar
                </div>

                <div
                  style={{
                    marginTop: '6px',
                    color: '#7d8592',
                    fontSize: '12px',
                  }}
                >
                  Recordatorios y mensajes
                </div>
              </div>
            </div>

            {/* WHATSAPP CARD */}

            <div
              style={{
                padding: '28px',
                background:
                  whatsappConnected
                    ? 'linear-gradient(135deg, #141c18, #12181a)'
                    : 'linear-gradient(135deg, #1c1617, #151417)',
                border:
                  whatsappConnected
                    ? '1px solid #254e36'
                    : '1px solid #4a292b',
                borderRadius: '16px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '20px',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '23px',
                      fontWeight: 750,
                      marginBottom: '8px',
                    }}
                  >
                    {whatsappConnected
                      ? '🟢 WhatsApp conectado'
                      : '🔴 WhatsApp no conectado'}
                  </div>

                  <p
                    style={{
                      margin: 0,
                      color: '#89919d',
                      fontSize: '14px',
                      lineHeight: 1.6,
                    }}
                  >
                    {whatsappConnected
                      ? 'Tu cuenta está conectada y lista para trabajar.'
                      : 'Conectá WhatsApp para comenzar a enviar mensajes.'}
                  </p>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        whatsappConnected
                          ? 'send'
                          : 'onboarding'
                      )
                    }
                    style={{
                      padding: '12px 18px',
                      border: 'none',
                      borderRadius: '10px',
                      background:
                        whatsappConnected
                          ? '#25D366'
                          : '#2a3039',
                      color: '#fff',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {whatsappConnected
                      ? '💬 Enviar mensaje'
                      : '🚀 Conectar WhatsApp'}
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('onboarding')}
                    style={{
                      padding: '12px 18px',
                      border: '1px solid #343b46',
                      borderRadius: '10px',
                      background: '#20252d',
                      color: '#fff',
                      fontWeight: 650,
                      cursor: 'pointer',
                    }}
                  >
                    🚀 Abrir Onboarding
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================
            ONBOARDING
        ================================================= */}

        {currentPage === 'onboarding' && (
          <div
            style={{
              maxWidth: '1050px',
            }}
          >
            <div
              style={{
                marginBottom: '25px',
              }}
            >
              <div
                style={{
                  color: '#6f7886',
                  fontSize: '12px',
                  marginBottom: '8px',
                }}
              >
                CONFIGURACIÓN
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize: '30px',
                }}
              >
                🚀 Onboarding
              </h1>

              <p
                style={{
                  marginTop: '9px',
                  color: '#7f8794',
                }}
              >
                Configurá o reconectá tu WhatsApp cuando
                quieras.
              </p>
            </div>

            <Onboarding
              onConnected={async () => {
                await checkWhatsAppStatus()
              }}
            />
          </div>
        )}

        {/* =================================================
            WHATSAPP
        ================================================= */}

        {currentPage === 'whatsapp' && (
          <div
            style={{
              maxWidth: '1050px',
            }}
          >
            <div
              style={{
                marginBottom: '25px',
              }}
            >
              <div
                style={{
                  color: '#6f7886',
                  fontSize: '12px',
                  marginBottom: '8px',
                }}
              >
                CONEXIÓN
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize: '30px',
                }}
              >
                📱 WhatsApp
              </h1>

              <p
                style={{
                  marginTop: '9px',
                  color: '#7f8794',
                }}
              >
                Estado actual de tu conexión.
              </p>
            </div>

            <div
              style={{
                padding: '28px',
                background: '#14181f',
                border: '1px solid #272e38',
                borderRadius: '16px',
              }}
            >
              <div
                style={{
                  fontSize: '22px',
                  fontWeight: 750,
                  marginBottom: '10px',
                }}
              >
                {whatsappConnected
                  ? '🟢 WhatsApp conectado'
                  : '🔴 WhatsApp no conectado'}
              </div>

              {whatsappConnected ? (
                <>
                  <p
                    style={{
                      color: '#89919d',
                    }}
                  >
                    Número conectado:
                  </p>

                  <div
                    style={{
                      display: 'inline-block',
                      padding: '10px 14px',
                      borderRadius: '9px',
                      background: '#1b2220',
                      color: '#5ee78b',
                      fontWeight: 700,
                    }}
                  >
                    +{whatsappPhone}
                  </div>

                  <div
                    style={{
                      marginTop: '22px',
                    }}
                  >
                    <button
                      onClick={() =>
                        navigate('onboarding')
                      }
                      style={{
                        padding: '12px 18px',
                        border: '1px solid #343b46',
                        borderRadius: '10px',
                        background: '#20252d',
                        color: '#fff',
                        cursor: 'pointer',
                        fontWeight: 650,
                      }}
                    >
                      🚀 Abrir Onboarding
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p
                    style={{
                      color: '#89919d',
                    }}
                  >
                    No hay un WhatsApp conectado.
                  </p>

                  <button
                    onClick={() =>
                      navigate('onboarding')
                    }
                    style={{
                      padding: '12px 18px',
                      border: 'none',
                      borderRadius: '10px',
                      background: '#25D366',
                      color: '#fff',
                      cursor: 'pointer',
                      fontWeight: 700,
                    }}
                  >
                    🚀 Abrir Onboarding
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* =================================================
            SEND
        ================================================= */}

        {currentPage === 'send' && (
          <div
            style={{
              maxWidth: '1050px',
            }}
          >
            <div
              style={{
                marginBottom: '25px',
              }}
            >
              <div
                style={{
                  color: '#6f7886',
                  fontSize: '12px',
                  marginBottom: '8px',
                }}
              >
                WHATSAPP
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize: '30px',
                }}
              >
                💬 Enviar mensaje
              </h1>

              <p
                style={{
                  marginTop: '9px',
                  color: '#7f8794',
                }}
              >
                Enviá mensajes desde tu WhatsApp conectado.
              </p>
            </div>

            <SendWhatsApp />
          </div>
        )}

        {/* =================================================
            SETTINGS
        ================================================= */}

        {currentPage === 'settings' && (
          <div
            style={{
              maxWidth: '1050px',
            }}
          >
            <div
              style={{
                marginBottom: '25px',
              }}
            >
              <div
                style={{
                  color: '#6f7886',
                  fontSize: '12px',
                  marginBottom: '8px',
                }}
              >
                SISTEMA
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize: '30px',
                }}
              >
                ⚙️ Configuración
              </h1>

              <p
                style={{
                  marginTop: '9px',
                  color: '#7f8794',
                }}
              >
                Configuración general de tu cuenta.
              </p>
            </div>

            <div
              style={{
                padding: '25px',
                background: '#14181f',
                border: '1px solid #272e38',
                borderRadius: '16px',
              }}
            >
              <div
                style={{
                  color: '#737c89',
                  fontSize: '12px',
                  marginBottom: '8px',
                }}
              >
                CUENTA
              </div>

              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                }}
              >
                {user.name || 'Usuario'}
              </div>

              <div
                style={{
                  marginTop: '5px',
                  color: '#7f8794',
                  fontSize: '13px',
                }}
              >
                {user.email}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App