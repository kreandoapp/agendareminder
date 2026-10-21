import { useCallback, useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

const API_URL = "https://kreandoapp.com/api/index.php";

const QR_DURATION = 20;

// Node sano:
// comprobamos rápidamente para detectar QR/conexión.
const POLL_INTERVAL = 1500;

// Node caído:
// NO hacemos cientos de peticiones por minuto.
const SERVER_RETRY_INTERVAL = 10000;

// Evita llamar /connect repetidamente.
const AUTO_CONNECT_COOLDOWN = 10000;

const REQUEST_TIMEOUT = 6000;

const STATUS = {
  CHECKING: "checking",
  SERVER_ERROR: "server_error",
  PREPARING: "preparing",
  QR: "qr",
  CONNECTING: "connecting",
  EXPIRED: "expired",
  CONNECTED: "connected",
  ERROR: "error",
};

function getBusinessId() {
  const value = localStorage.getItem("business_id");

  if (!value || value === "null" || value === "undefined") {
    return null;
  }

  const id = Number(value);

  return Number.isInteger(id) && id > 0 ? id : null;
}

export default function Onboarding({ onConnected }) {
  const [businessId, setBusinessId] = useState(null);
  const [status, setStatus] = useState(STATUS.CHECKING);
  const [qr, setQr] = useState(null);
  const [seconds, setSeconds] = useState(QR_DURATION);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [retrying, setRetrying] = useState(false);

  const qrStartedAt = useRef(null);
  const currentQr = useRef(null);

  const timerRef = useRef(null);
  const pollTimerRef = useRef(null);

  const connectRunning = useRef(false);
  const mounted = useRef(true);

  /*
   * Evita llamar onConnected() repetidamente
   * mientras el polling detecta connected=true.
   */
  const connectedNotified = useRef(false);

  /*
   * Controla cuándo fue el último intento automático
   * de /connect.
   */
  const lastAutoConnectAt = useRef(0);

  /*
   * Estado del servidor para no llenar la consola
   * con el mismo error una y otra vez.
   *
   * null    = todavía no sabemos
   * true    = servidor disponible
   * false   = servidor caído
   */
  const serverAvailableRef = useRef(null);

  /*
   * =====================================================
   * MOUNT / UNMOUNT
   * =====================================================
   */

  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, []);

  /*
   * =====================================================
   * BUSINESS ID
   * =====================================================
   */

  useEffect(() => {
    setBusinessId(getBusinessId());
  }, []);

  /*
   * =====================================================
   * REQUEST
   *
   * Todas las peticiones tienen:
   *
   * - timeout
   * - cache desactivada
   * - AbortController
   * =====================================================
   */

  const request = useCallback(async (url, options = {}) => {
    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, REQUEST_TIMEOUT);

    try {
      const token = localStorage.getItem("access_token");

      return await fetch(url, {
        ...options,
        signal: controller.signal,
        cache: "no-store",
        headers: {
          ...(options.headers || {}),
          Authorization: `Bearer ${token}`,
        },
      });
    } finally {
      clearTimeout(timeout);
    }
  }, []);

  /*
   * =====================================================
   * QR
   * =====================================================
   */

  const clearQr = useCallback(() => {
    currentQr.current = null;
    qrStartedAt.current = null;

    setQr(null);
    setSeconds(QR_DURATION);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const processQr = useCallback((newQr) => {
    if (!newQr) {
      return;
    }

    /*
     * Si Baileys vuelve a mandar exactamente el mismo QR,
     * no reiniciamos el contador.
     */
    if (currentQr.current === newQr) {
      return;
    }

    console.log("📱 QR RECIBIDO");

    currentQr.current = newQr;
    qrStartedAt.current = Date.now();

    setQr(newQr);
    setSeconds(QR_DURATION);
    setError("");
    setStatus(STATUS.QR);
  }, []);

  /*
   * =====================================================
   * SERVER STATE
   * =====================================================
   */

  const markServerAvailable = useCallback(() => {
    const wasUnavailable = serverAvailableRef.current === false;

    serverAvailableRef.current = true;

    /*
     * Solo mostramos este mensaje cuando realmente
     * hubo una recuperación.
     */
    if (wasUnavailable) {
      console.log("🟢 NODE DISPONIBLE NUEVAMENTE");
    }
  }, []);

  const markServerUnavailable = useCallback(
    (message) => {
      const alreadyUnavailable =
        serverAvailableRef.current === false;

      serverAvailableRef.current = false;

      /*
       * No llenamos la consola con el mismo error
       * cada 10 segundos.
       */
      if (!alreadyUnavailable) {
        console.warn(
          "🔴 NODE NO DISPONIBLE:",
          message
        );
      }

      clearQr();

      setPhone("");

      setError(
        message ||
          "No se pudo conectar con el servidor de WhatsApp."
      );

      setStatus(STATUS.SERVER_ERROR);
    },
    [clearQr]
  );

  /*
   * =====================================================
   * NOTIFICAR CONEXIÓN
   * =====================================================
   */

  const notifyConnected = useCallback(
    (result) => {
      if (connectedNotified.current) {
        return;
      }

      connectedNotified.current = true;

      if (onConnected) {
        onConnected(result);
      }
    },
    [onConnected]
  );

  /*
   * =====================================================
   * CHECK STATUS
   *
   * Esta función es el corazón del frontend.
   *
   * Puede descubrir:
   *
   * - Node caído
   * - Node disponible
   * - WhatsApp conectado
   * - QR
   * - conexión en curso
   * - Node disponible pero sin conexión
   *
   * Y además puede iniciar automáticamente /connect.
   * =====================================================
   */

  const checkStatus = useCallback(
    async ({ allowAutoConnect = false } = {}) => {
      const id = getBusinessId();

      if (!id) {
        setStatus(STATUS.ERROR);
        setError(
          "No encontramos un Business ID válido."
        );

        return {
          data: null,
          serverAvailable: false,
        };
      }

      try {
        const response = await request(
          `${API_URL}?action=whatsapp-status&business_id=${encodeURIComponent(
            id
          )}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
          }
        );

        const text = await response.text();

        let result = {};

        try {
          result = JSON.parse(text);
        } catch {
          result = {};
        }

        /*
         * ==================================================
         * HTTP ERROR
         * ==================================================
         */

        if (!response.ok) {
          markServerUnavailable(
            result?.error ||
              result?.message ||
              `El servidor respondió con error ${response.status}.`
          );

          return {
            data: null,
            serverAvailable: false,
          };
        }

        /*
         * Node respondió correctamente.
         */
        markServerAvailable();

        /*
         * ==================================================
         * WHATSAPP CONECTADO
         * ==================================================
         */

        if (result?.connected === true) {
          clearQr();

          setPhone(result?.phone || "");
          setError("");
          setStatus(STATUS.CONNECTED);

          notifyConnected(result);

          return {
            data: result,
            serverAvailable: true,
          };
        }

        /*
         * ==================================================
         * QR
         * ==================================================
         */

        if (result?.qr) {
          processQr(result.qr);

          return {
            data: result,
            serverAvailable: true,
          };
        }

        /*
         * ==================================================
         * CONECTANDO
         * ==================================================
         */

        if (result?.connecting === true) {
          setStatus(STATUS.CONNECTING);

          return {
            data: result,
            serverAvailable: true,
          };
        }

        /*
         * ==================================================
         * NODE VIVO, PERO WHATSAPP NO ESTÁ CONECTADO
         * ==================================================
         *
         * IMPORTANTE:
         * Si ya mostramos un QR, el polling de /status
         * NO debe tocarlo. PHP /whatsapp-status no devuelve
         * el QR, por lo que connected:false NO significa
         * que debamos borrar el QR actual.
         *
         * El QR solamente se reemplaza cuando:
         * - WhatsApp se conecta, o
         * - el contador llega a 0.
         * ==================================================
         */

        if (currentQr.current) {
          return {
            data: result,
            serverAvailable: true,
          };
        }

        setError("");
        setStatus(STATUS.PREPARING);

        /*
         * ==================================================
         * CONEXIÓN AUTOMÁTICA
         *
         * Si Node acaba de volver y WhatsApp no está
         * conectado, solicitamos /connect.
         *
         * Si la sesión ya estaba vinculada y el Gateway
         * la restaura automáticamente, este bloque NO
         * se ejecutará porque status.connected será true.
         *
         * Por lo tanto:
         *
         * VPS reinicia
         *      ↓
         * Gateway restaura sesión
         *      ↓
         * frontend detecta connected=true
         *      ↓
         * ¡Conectado!
         *
         * Y si realmente necesita iniciar conexión:
         *
         * Node vivo
         *      ↓
         * /connect
         *      ↓
         * QR o connecting
         * ==================================================
         */

        if (
          allowAutoConnect &&
          !connectRunning.current &&
          Date.now() - lastAutoConnectAt.current >=
            AUTO_CONNECT_COOLDOWN
        ) {
          lastAutoConnectAt.current = Date.now();

          console.log(
            "🔄 NODE DISPONIBLE → conexión automática"
          );

          /*
           * No esperamos aquí.
           *
           * El polling continúa independientemente
           * y observará QR / connecting / connected.
           */
          void connectWhatsApp({
            automatic: true,
          });
        }

        return {
          data: result,
          serverAvailable: true,
        };
      } catch (err) {
        /*
         * AbortError = timeout.
         * Cualquier otro error aquí normalmente significa
         * que no pudimos comunicarnos con Node.
         */

        if (err?.name === "AbortError") {
          markServerUnavailable(
            "El servidor de WhatsApp tardó demasiado en responder."
          );
        } else {
          markServerUnavailable(
            "No se pudo conectar con el servidor de WhatsApp."
          );
        }

        return {
          data: null,
          serverAvailable: false,
        };
      }
    },
    [
      clearQr,
      markServerAvailable,
      markServerUnavailable,
      notifyConnected,
      processQr,
      request,
    ]
  );

  /*
   * =====================================================
   * CONNECT WHATSAPP
   * =====================================================
   */

  const connectWhatsApp = useCallback(
    async ({ automatic = false } = {}) => {
      const id = getBusinessId();

      if (!id) {
        setStatus(STATUS.ERROR);
        setError(
          "No encontramos un Business ID válido."
        );

        return null;
      }

      /*
       * Nunca permitimos dos /connect simultáneos.
       */
      if (connectRunning.current) {
        return null;
      }

      connectRunning.current = true;

      try {
        setStatus(STATUS.PREPARING);
        setError("");

        if (automatic) {
          console.log(
            "🤖 CONEXIÓN AUTOMÁTICA:",
            id
          );
        } else {
          console.log(
            "🚀 INICIANDO WHATSAPP:",
            id
          );
        }

        const response = await request(
          `${API_URL}?action=whatsapp-connect`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              business_id: id,
            }),
          }
        );

        const text = await response.text();

        let result = {};

        try {
          result = JSON.parse(text);
        } catch {
          result = {};
        }

        /*
         * ==================================================
         * NODE RESPONDIÓ
         * ==================================================
         */

        if (!response.ok) {
          markServerUnavailable(
            result?.error ||
              result?.message ||
              `No se pudo iniciar WhatsApp (${response.status}).`
          );

          return null;
        }

        markServerAvailable();

        /*
         * ==================================================
         * YA ESTABA CONECTADO
         * ==================================================
         */

        if (result?.connected === true) {
          clearQr();

          setPhone(result?.phone || "");
          setError("");
          setStatus(STATUS.CONNECTED);

          notifyConnected(result);

          return result;
        }

        /*
         * ==================================================
         * QR
         * ==================================================
         */

        if (result?.qr) {
          processQr(result.qr);
        } else {
          /*
           * El Gateway puede estar creando el socket
           * y todavía no tener QR disponible.
           */
          setStatus(STATUS.CONNECTING);
        }

        return result;
      } catch (err) {
        if (err?.name === "AbortError") {
          markServerUnavailable(
            "El servidor de WhatsApp tardó demasiado en responder."
          );
        } else {
          markServerUnavailable(
            "No se pudo conectar con el servidor de WhatsApp."
          );
        }

        return null;
      } finally {
        connectRunning.current = false;
      }
    },
    [
      clearQr,
      markServerAvailable,
      markServerUnavailable,
      notifyConnected,
      processQr,
      request,
    ]
  );

  /*
   * =====================================================
   * POLLING INTELIGENTE
   *
   * Antes:
   *
   * setInterval(..., 1500)
   *
   * Eso significa que aunque Node estuviera apagado:
   *
   * 1 request
   * 1 request
   * 1 request
   * 1 request
   * ...
   *
   * Ahora:
   *
   * Node OK  → cada 1.5 s
   * Node OFF → cada 10 s
   *
   * =====================================================
   */

  const scheduleNextPoll = useCallback(
    (delay) => {
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
      }

      pollTimerRef.current = setTimeout(() => {
        pollTimerRef.current = null;

        if (!mounted.current) {
          return;
        }

        void runPoll();
      }, delay);
    },
    []
  );

  const runPoll = useCallback(async () => {
    if (!mounted.current) {
      return;
    }

    const result = await checkStatus({
      allowAutoConnect: true,
    });

    if (!mounted.current) {
      return;
    }

    /*
     * Node disponible:
     * polling rápido.
     *
     * Node caído:
     * polling lento.
     */
    const delay = result?.serverAvailable
      ? POLL_INTERVAL
      : SERVER_RETRY_INTERVAL;

    scheduleNextPoll(delay);
  }, [checkStatus, scheduleNextPoll]);

  /*
   * =====================================================
   * INICIO
   * =====================================================
   */

  useEffect(() => {
    if (!businessId) {
      return;
    }

    /*
     * Al entrar en Onboarding empezamos desde cero.
     */
    connectedNotified.current = false;
    lastAutoConnectAt.current = 0;
    serverAvailableRef.current = null;

    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }

    /*
     * Primer chequeo inmediato.
     */
    void runPoll();

    return () => {
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [businessId, runPoll]);

  /*
   * =====================================================
   * REINTENTAR MANUALMENTE
   * =====================================================
   */

  const retry = async () => {
    if (retrying) {
      return;
    }

    setRetrying(true);
    setStatus(STATUS.CHECKING);
    setError("");

    /*
     * El botón fuerza un intento inmediato.
     */
    lastAutoConnectAt.current = 0;

    const result = await checkStatus({
      allowAutoConnect: true,
    });

    if (!mounted.current) {
      return;
    }

    setRetrying(false);

    if (!result?.serverAvailable) {
      scheduleNextPoll(SERVER_RETRY_INTERVAL);
      return;
    }

    scheduleNextPoll(POLL_INTERVAL);
  };

  /*
   * =====================================================
   * CONTADOR QR
   * =====================================================
   */

  useEffect(() => {
    if (status !== STATUS.QR || !qr) {
      return;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      if (!qrStartedAt.current) {
        return;
      }

      const elapsed = Math.floor(
        (Date.now() - qrStartedAt.current) / 1000
      );

      const remaining = Math.max(
        0,
        QR_DURATION - elapsed
      );

      setSeconds(remaining);

      if (remaining <= 0) {
        clearInterval(timerRef.current);
        timerRef.current = null;

        /*
         * El QR terminó realmente sus 20 segundos.
         * Ahora sí liberamos el QR para que el polling
         * pueda solicitar uno nuevo.
         */
        currentQr.current = null;
        qrStartedAt.current = null;

        setQr(null);
        setStatus(STATUS.EXPIRED);
      }
    }, 250);

    return () => {
      clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [qr, status]);

  const progress = Math.max(
    0,
    Math.min(
      100,
      (seconds / QR_DURATION) * 100
    )
  );

  const critical =
    seconds <= 5 && seconds > 0;

  /*
   * =====================================================
   * RENDER
   * =====================================================
   */

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #18251d 0%, #0b0d10 42%, #08090b 100%)",
        color: "#fff",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "30px 20px",
        boxSizing: "border-box",
        fontFamily:
          "Inter, system-ui, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          textAlign: "center",
        }}
      >
        <div style={{ marginBottom: "24px" }}>
          <div
            style={{
              fontSize: "48px",
              marginBottom: "8px",
            }}
          >
            📱
          </div>

          <h1
            style={{
              margin: "0 0 8px",
              fontSize: "31px",
              fontWeight: "800",
            }}
          >
            Conectá tu WhatsApp
          </h1>

          <p
            style={{
              margin: 0,
              color: "#9ca3af",
              fontSize: "15px",
            }}
          >
            Escaneá el código QR con tu teléfono
          </p>

          <div
            style={{
              marginTop: "10px",
              fontSize: "13px",
              color: "#666",
            }}
          >
            🏢 Business ID:{" "}
            <strong
              style={{
                color: "#25D366",
              }}
            >
              {businessId || "—"}
            </strong>
          </div>
        </div>

        <div
          style={{
            background:
              "rgba(20,23,27,0.96)",
            border:
              "1px solid #2b3036",
            borderRadius: "24px",
            padding: "28px",
            boxShadow:
              "0 25px 80px rgba(0,0,0,0.5)",
          }}
        >
          {/* ==========================================
              SERVIDOR CAÍDO
          ========================================== */}

          {status === STATUS.SERVER_ERROR && (
            <div
              style={{
                padding: "25px 10px 15px",
              }}
            >
              <div
                style={{
                  width: "100px",
                  height: "100px",
                  margin:
                    "0 auto 20px",
                  borderRadius: "50%",
                  background:
                    "rgba(239,68,68,0.08)",
                  border:
                    "1px solid rgba(239,68,68,0.30)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "48px",
                }}
              >
                📡
              </div>

              <h2
                style={{
                  margin:
                    "0 0 12px",
                  color: "#f87171",
                  fontSize: "25px",
                  fontWeight: "800",
                }}
              >
                Servidor no disponible
              </h2>

              <p
                style={{
                  margin:
                    "0 auto 10px",
                  maxWidth: "390px",
                  color: "#d1d5db",
                  fontSize: "15px",
                  lineHeight: 1.6,
                }}
              >
                No pudimos comunicarnos
                con el servidor de
                WhatsApp.
              </p>

              <p
                style={{
                  margin: "0 auto",
                  maxWidth: "380px",
                  color: "#777",
                  fontSize: "13px",
                  lineHeight: 1.6,
                }}
              >
                Tu cuenta no fue
                modificada. Cuando el
                servicio vuelva a estar
                disponible, intentaremos
                recuperar la conexión
                automáticamente.
              </p>

              <div
                style={{
                  margin:
                    "22px auto 0",
                  maxWidth: "360px",
                  padding:
                    "13px 15px",
                  borderRadius: "12px",
                  background:
                    "rgba(239,68,68,0.06)",
                  border:
                    "1px solid rgba(239,68,68,0.20)",
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems: "center",
                  fontSize: "13px",
                }}
              >
                <span
                  style={{
                    color: "#999",
                  }}
                >
                  📡 Servicio
                </span>

                <strong
                  style={{
                    color: "#f87171",
                  }}
                >
                  ● Sin conexión
                </strong>
              </div>

              <button
                type="button"
                onClick={retry}
                disabled={retrying}
                style={{
                  marginTop:
                    "22px",
                  width: "100%",
                  maxWidth: "300px",
                  padding:
                    "14px 20px",
                  border: "none",
                  borderRadius: "13px",
                  background:
                    retrying
                      ? "#1d6338"
                      : "#25D366",
                  color: "#06140b",
                  fontSize: "14px",
                  fontWeight: "800",
                  cursor:
                    retrying
                      ? "wait"
                      : "pointer",
                  boxShadow:
                    "0 8px 25px rgba(37,211,102,0.18)",
                }}
              >
                {retrying
                  ? "🔄 Comprobando servidor..."
                  : "🔄 Reintentar conexión"}
              </button>

              <div
                style={{
                  marginTop: "15px",
                  color: "#555",
                  fontSize: "11px",
                }}
              >
                {error}
              </div>

              <div
                style={{
                  marginTop: "10px",
                  color: "#444",
                  fontSize: "11px",
                }}
              >
                🔄 Reintento automático cada
                10 segundos.
              </div>
            </div>
          )}

          {/* ==========================================
              CHECKING
          ========================================== */}

          {status === STATUS.CHECKING && (
            <Loading
              icon="📡"
              title="Verificando servidor"
              text="Comprobando disponibilidad del servicio..."
            />
          )}

          {/* ==========================================
              PREPARING
          ========================================== */}

          {status === STATUS.PREPARING && (
            <Loading
              icon="📱"
              title="Preparando WhatsApp"
              text="Estamos preparando la conexión segura..."
            />
          )}

          {/* ==========================================
              CONNECTING
          ========================================== */}

          {status === STATUS.CONNECTING && (
            <Loading
              icon="🔄"
              title="Conectando con WhatsApp"
              text="Esperando respuesta de WhatsApp..."
            />
          )}

          {/* ==========================================
              QR
          ========================================== */}

          {status === STATUS.QR &&
            qr && (
              <div>
                <div
                  style={{
                    display:
                      "inline-block",
                    marginBottom:
                      "18px",
                    padding:
                      "8px 15px",
                    borderRadius:
                      "999px",
                    background:
                      "rgba(37,211,102,0.10)",
                    border:
                      "1px solid rgba(37,211,102,0.25)",
                    color:
                      "#4ade80",
                    fontWeight:
                      "700",
                    fontSize:
                      "13px",
                  }}
                >
                  🟢 Código QR activo
                </div>

                <div
                  style={{
                    width: "270px",
                    height: "270px",
                    margin:
                      "0 auto",
                    padding: "14px",
                    boxSizing:
                      "border-box",
                    background:
                      "#fff",
                    borderRadius:
                      "20px",
                    boxShadow:
                      "0 15px 50px rgba(0,0,0,0.4)",
                  }}
                >
                  <QRCodeCanvas
                    value={qr}
                    size={242}
                    level="M"
                    includeMargin
                    style={{
                      width:
                        "100%",
                      height:
                        "100%",
                      display:
                        "block",
                    }}
                  />
                </div>

                <div
                  style={{
                    marginTop:
                      "22px",
                  }}
                >
                  <div
                    style={{
                      color:
                        "#888",
                      fontSize:
                        "13px",
                      marginBottom:
                        "5px",
                    }}
                  >
                    Este código cambia en
                  </div>

                  <div
                    style={{
                      fontSize:
                        "38px",
                      fontWeight:
                        "800",
                      color:
                        critical
                          ? "#fbbf24"
                          : "#fff",
                    }}
                  >
                    {seconds}

                    <span
                      style={{
                        fontSize:
                          "15px",
                        marginLeft:
                          "5px",
                        color:
                          "#777",
                        fontWeight:
                          "500",
                      }}
                    >
                      segundos
                    </span>
                  </div>

                  <div
                    style={{
                      marginTop:
                        "14px",
                      height:
                        "7px",
                      background:
                        "#292e34",
                      borderRadius:
                        "999px",
                      overflow:
                        "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${progress}%`,
                        height:
                          "100%",
                        background:
                          critical
                            ? "#f59e0b"
                            : "#25D366",
                        transition:
                          "width 0.25s linear",
                      }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    marginTop:
                      "24px",
                    padding:
                      "16px",
                    borderRadius:
                      "14px",
                    background:
                      "#101216",
                    border:
                      "1px solid #292e35",
                    textAlign:
                      "left",
                  }}
                >
                  <strong
                    style={{
                      display:
                        "block",
                      marginBottom:
                        "11px",
                    }}
                  >
                    📲 Cómo conectar
                  </strong>

                  <div
                    style={
                      instruction
                    }
                  >
                    1️⃣ Abrí WhatsApp en
                    tu teléfono.
                  </div>

                  <div
                    style={
                      instruction
                    }
                  >
                    2️⃣ Entrá en
                    Dispositivos vinculados.
                  </div>

                  <div
                    style={
                      instruction
                    }
                  >
                    3️⃣ Tocá “Vincular un
                    dispositivo” y
                    escaneá el código.
                  </div>
                </div>
              </div>
            )}

          {/* ==========================================
              EXPIRADO
          ========================================== */}

          {status === STATUS.EXPIRED && (
            <div
              style={{
                padding:
                  "35px 10px",
              }}
            >
              <div
                style={{
                  fontSize: "52px",
                }}
              >
                ⏰
              </div>

              <h2
                style={{
                  color:
                    "#fbbf24",
                }}
              >
                Código expirado
              </h2>

              <p
                style={{
                  color: "#999",
                }}
              >
                Esperando que WhatsApp
                genere un nuevo código...
              </p>
            </div>
          )}

          {/* ==========================================
              CONECTADO
          ========================================== */}

          {status === STATUS.CONNECTED && (
            <div
              style={{
                padding:
                  "35px 10px",
              }}
            >
              <div
                style={{
                  width: "105px",
                  height: "105px",
                  margin:
                    "0 auto 20px",
                  borderRadius:
                    "50%",
                  background:
                    "rgba(37,211,102,0.12)",
                  border:
                    "2px solid rgba(37,211,102,0.4)",
                  display: "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  fontSize: "52px",
                }}
              >
                ✅
              </div>

              <h2
                style={{
                  color:
                    "#4ade80",
                  fontSize:
                    "25px",
                }}
              >
                ¡WhatsApp conectado!
              </h2>

              <p
                style={{
                  color: "#aaa",
                }}
              >
                Todo listo. Tu WhatsApp
                está conectado.
              </p>

              {phone && (
                <div
                  style={{
                    display:
                      "inline-block",
                    padding:
                      "9px 16px",
                    borderRadius:
                      "999px",
                    background:
                      "#123c20",
                    border:
                      "1px solid #1d8f3b",
                    color:
                      "#4ade80",
                    fontWeight:
                      "700",
                  }}
                >
                  🟢 {phone}
                </div>
              )}
            </div>
          )}

          {/* ==========================================
              ERROR GENERAL
          ========================================== */}

          {status === STATUS.ERROR && (
            <div
              style={{
                padding:
                  "35px 10px",
              }}
            >
              <div
                style={{
                  fontSize: "52px",
                }}
              >
                ⚠️
              </div>

              <h2
                style={{
                  color:
                    "#f87171",
                }}
              >
                Algo salió mal
              </h2>

              <p
                style={{
                  color: "#aaa",
                }}
              >
                {error}
              </p>

              <button
                type="button"
                onClick={retry}
                style={{
                  marginTop:
                    "20px",
                  padding:
                    "13px 25px",
                  border: "none",
                  borderRadius:
                    "12px",
                  background:
                    "#25D366",
                  color:
                    "#06140b",
                  fontWeight:
                    "800",
                  cursor:
                    "pointer",
                }}
              >
                🔄 Intentar nuevamente
              </button>
            </div>
          )}
        </div>

        <div
          style={{
            marginTop:
              "18px",
            color: "#555",
            fontSize:
              "12px",
          }}
        >
          🔐 Conexión segura · WP WhatsApp Reminder
        </div>
      </div>

      <style>
        {`
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
              transform: scale(1);
            }

            50% {
              opacity: 0.55;
              transform: scale(1.05);
            }
          }
        `}
      </style>
    </div>
  );
}


/*
 * =====================================================
 * LOADING
 * =====================================================
 */

function Loading({
  icon,
  title,
  text,
}) {
  return (
    <div
      style={{
        padding:
          "45px 10px",
      }}
    >
      <div
        style={{
          width: "88px",
          height: "88px",
          margin:
            "0 auto 20px",
          borderRadius:
            "50%",
          background:
            "rgba(59,130,246,0.08)",
          border:
            "1px solid rgba(59,130,246,0.20)",
          display: "flex",
          alignItems:
            "center",
          justifyContent:
            "center",
          fontSize: "40px",
          animation:
            "pulse 1.5s infinite",
        }}
      >
        {icon}
      </div>

      <h2
        style={{
          margin:
            "0 0 10px",
          fontSize:
            "23px",
        }}
      >
        {title}
      </h2>

      <p
        style={{
          margin: 0,
          color: "#888",
          fontSize:
            "14px",
        }}
      >
        {text}
      </p>
    </div>
  );
}


/*
 * =====================================================
 * INSTRUCCIONES
 * =====================================================
 */

const instruction = {
  marginBottom:
    "8px",
  color: "#aaa",
  fontSize:
    "13px",
};