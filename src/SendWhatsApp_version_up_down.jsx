import { useCallback, useEffect, useState } from "react";

// =====================================================
// CONFIGURACIÓN
// =====================================================

const API_URL =
  "https://kreandoapp.com/api/index.php";

const NODE_URL =
  "http://localhost:3000";

// =====================================================
// TOKEN
// =====================================================

function getToken() {

  return (
    localStorage.getItem(
      "access_token"
    ) || null
  );

}

// =====================================================
// BUSINESS ID
// =====================================================

function getBusinessId() {

  const value =
    localStorage.getItem(
      "business_id"
    );

  if (
    !value ||
    value === "null" ||
    value === "undefined"
  ) {

    return null;

  }

  const id =
    Number(value);

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {

    return null;

  }

  return id;

}

// =====================================================
// HEADERS
// =====================================================

function getHeaders() {

  const token =
    getToken();

  return {

    "Content-Type":
      "application/json",

    Accept:
      "application/json",

    ...(token
      ? {
          Authorization:
            `Bearer ${token}`,
        }
      : {}),

  };

}

// =====================================================
// LLAMAR NODE
// =====================================================

async function nodeRequest(
  endpoint,
  options = {}
) {

  console.log(
    "🌐 NODE:",
    `${NODE_URL}${endpoint}`
  );

  const response =
    await fetch(
      `${NODE_URL}${endpoint}`,
      {
        ...options,

        headers: {
          Accept:
            "application/json",

          "Content-Type":
            "application/json",

          ...(options.headers || {}),
        },

      }
    );

  const text =
    await response.text();

  let result;

  try {

    result =
      JSON.parse(text);

  } catch {

    result = {

      success:
        false,

      message:
        text,

    };

  }

  console.log(
    "📥 NODE RESPUESTA:",
    result
  );

  if (
    !response.ok
  ) {

    throw new Error(
      result?.message ||
      `Node respondió HTTP ${response.status}`
    );

  }

  if (
    result?.success === false
  ) {

    throw new Error(
      result?.message ||
      "Node devolvió un error."
    );

  }

  return result;

}

// =====================================================
// COMPONENTE
// =====================================================

export default function SendWhatsApp() {

  // ===================================================
  // ESTADOS
  // ===================================================

  const [phone, setPhone] =
    useState(
      "34647387062"
    );

  const [message, setMessage] =
    useState("");

  const [connected, setConnected] =
    useState(false);

  const [connectedPhone, setConnectedPhone] =
    useState("");

  const [businessId, setBusinessId] =
    useState(null);

  const [loadingStatus, setLoadingStatus] =
    useState(true);

  const [sending, setSending] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // ===================================================
  // CARGAR BUSINESS
  // ===================================================

  const loadBusinessId =
    useCallback(
      () => {

        const id =
          getBusinessId();

        console.log(
          "🏢 Business ID:",
          id
        );

        setBusinessId(
          id
        );

        return id;

      },
      []
    );

  // ===================================================
  // ESTADO WHATSAPP
  // ===================================================

  const checkWhatsAppStatus =
    useCallback(
      async () => {

        const id =
          getBusinessId();

        setBusinessId(
          id
        );

        if (!id) {

          setConnected(
            false
          );

          setConnectedPhone(
            ""
          );

          setLoadingStatus(
            false
          );

          return;

        }

        try {

          console.log("");
          console.log(
            "================================="
          );
          console.log(
            "📡 COMPROBANDO ESTADO"
          );
          console.log(
            "================================="
          );

          const response =
            await fetch(
              `${NODE_URL}/whatsapp/status?business_id=${encodeURIComponent(
                id
              )}`,
              {
                method:
                  "GET",

                headers: {
                  Accept:
                    "application/json",
                },

                cache:
                  "no-store",

              }
            );

          const text =
            await response.text();

          let result;

          try {

            result =
              JSON.parse(text);

          } catch {

            result = {};

          }

          console.log(
            "📥 STATUS:",
            result
          );

          if (
            result?.connected === true
          ) {

            setConnected(
              true
            );

            setConnectedPhone(
              result?.phone ||
              ""
            );

          } else {

            setConnected(
              false
            );

            setConnectedPhone(
              ""
            );

          }

        } catch (
          error
        ) {

          console.error(
            "❌ Error status:",
            error
          );

          setConnected(
            false
          );

          setConnectedPhone(
            ""
          );

        } finally {

          setLoadingStatus(
            false
          );

        }

      },
      []
    );

  // ===================================================
  // INICIALIZAR
  // ===================================================

  useEffect(
    () => {

      loadBusinessId();

      checkWhatsAppStatus();

      return undefined;

    },
    [
      loadBusinessId,
      checkWhatsAppStatus
    ]
  );

  // ===================================================
  // CONECTAR BAILEYS
  // ===================================================

  const connectWhatsApp =
    async () => {

      const id =
        getBusinessId();

      if (!id) {

        throw new Error(
          "No existe Business ID."
        );

      }

      console.log("");
      console.log(
        "================================="
      );
      console.log(
        "1️⃣ INICIANDO BAILEYS"
      );
      console.log(
        "================================="
      );

      console.log(
        "🏢 Business:",
        id
      );

      const result =
        await nodeRequest(
          "/whatsapp/connect",
          {
            method:
              "POST",

            body:
              JSON.stringify({

                business_id:
                  id,

              }),

          }
        );

      console.log(
        "🟢 CONNECT RESULT:",
        result
      );

      if (
        result?.connected === true
      ) {

        setConnected(
          true
        );

        setConnectedPhone(
          result?.phone ||
          ""
        );

        return result;

      }

      throw new Error(
        "Node no confirmó que WhatsApp esté conectado."
      );

    };

  // ===================================================
  // ESPERAR HASTA ESTAR CONECTADO
  // ===================================================

  const waitUntilConnected =
    async () => {

      const id =
        getBusinessId();

      const maxAttempts =
        30;

      for (
        let attempt = 1;
        attempt <= maxAttempts;
        attempt++
      ) {

        console.log(
          `⏳ Esperando conexión ${attempt}/${maxAttempts}`
        );

        const response =
          await fetch(
            `${NODE_URL}/whatsapp/status?business_id=${encodeURIComponent(
              id
            )}`,
            {
              method:
                "GET",

              headers: {
                Accept:
                  "application/json",
              },

              cache:
                "no-store",
            }
          );

        const text =
          await response.text();

        let result;

        try {

          result =
            JSON.parse(text);

        } catch {

          result = {};

        }

        console.log(
          "📡 STATUS:",
          result
        );

        if (
          result?.connected === true
        ) {

          console.log(
            "🟢 BAILEYS CONECTADO"
          );

          setConnected(
            true
          );

          setConnectedPhone(
            result?.phone ||
            ""
          );

          return result;

        }

        await new Promise(
          resolve =>
            setTimeout(
              resolve,
              1000
            )
        );

      }

      throw new Error(
        "Baileys no consiguió conectarse dentro del tiempo esperado."
      );

    };

  // ===================================================
  // ENVIAR MENSAJE
  // ===================================================

  const sendMessage =
    async () => {

      const id =
        getBusinessId();

      const token =
        getToken();

      if (!id) {

        throw new Error(
          "No existe Business ID."
        );

      }

      if (!token) {

        throw new Error(
          "Tu sesión no está iniciada."
        );

      }

      const cleanPhone =
        String(
          phone
        )
          .replace(
            /\D/g,
            ""
          )
          .trim();

      const cleanMessage =
        String(
          message
        )
          .trim();

      if (!cleanPhone) {

        throw new Error(
          "Ingresá el número destinatario."
        );

      }

      if (!cleanMessage) {

        throw new Error(
          "Ingresá un mensaje."
        );

      }

      console.log("");
      console.log(
        "================================="
      );
      console.log(
        "2️⃣ ENVIANDO MENSAJE"
      );
      console.log(
        "================================="
      );

      console.log(
        "🏢 Business:",
        id
      );

      console.log(
        "📥 Destinatario:",
        cleanPhone
      );

      const response =
        await fetch(
          `${API_URL}?action=whatsapp-send`,
          {
            method:
              "POST",

            headers:
              getHeaders(),

            body:
              JSON.stringify({

                business_id:
                  id,

                phone:
                  cleanPhone,

                message:
                  cleanMessage,

              }),

          }
        );

      console.log(
        "📡 HTTP:",
        response.status
      );

      const text =
        await response.text();

      let result;

      try {

        result =
          JSON.parse(text);

      } catch {

        result = {

          success:
            false,

          message:
            text,

        };

      }

      console.log(
        "📥 RESPUESTA ENVÍO:",
        result
      );

      if (
        response.status === 401
      ) {

        throw new Error(
          "Tu sesión expiró."
        );

      }

      if (
        !response.ok
      ) {

        throw new Error(
          result?.message ||
          `Error HTTP ${response.status}`
        );

      }

      if (
        result?.success === false
      ) {

        throw new Error(
          result?.message ||
          "El servidor no pudo enviar el mensaje."
        );

      }

      console.log("");
      console.log(
        "✅ MENSAJE CONFIRMADO"
      );

      console.log(
        "🆔 ID:",
        result?.id ||
        null
      );

      return result;

    };

  // ===================================================
  // DESCONECTAR BAILEYS
  // ===================================================

  const disconnectWhatsApp =
    async () => {

      const id =
        getBusinessId();

      if (!id) {

        return;

      }

      console.log("");
      console.log(
        "================================="
      );
      console.log(
        "3️⃣ APAGANDO BAILEYS"
      );
      console.log(
        "================================="
      );

      console.log(
        "🏢 Business:",
        id
      );

      const result =
        await nodeRequest(
          "/whatsapp/disconnect-test",
          {
            method:
              "POST",

            body:
              JSON.stringify({

                business_id:
                  id,

              }),

          }
        );

      console.log(
        "🔴 DESCONEXIÓN:",
        result
      );

      setConnected(
        false
      );

      setConnectedPhone(
        ""
      );

      return result;

    };

  // ===================================================
  // FLUJO COMPLETO
  // ===================================================

  const sendWhatsApp =
    async (
      event
    ) => {

      event.preventDefault();

      if (
        sending
      ) {

        return;

      }

      setError(
        ""
      );

      setSuccess(
        ""
      );

      setSending(
        true
      );

      let messageConfirmed =
        false;

      try {

        // =============================================
        // 1️⃣ CONECTAR
        // =============================================

        await connectWhatsApp();

        // =============================================
        // ESPERAR CONFIRMACIÓN REAL
        // =============================================

        await waitUntilConnected();

        // =============================================
        // 2️⃣ ENVIAR
        // =============================================

        await sendMessage();

        messageConfirmed =
          true;

        setSuccess(
          "✅ Mensaje enviado correctamente."
        );

        setMessage(
          ""
        );

      } catch (
        error
      ) {

        console.error(
          "❌ ERROR DEL FLUJO:",
          error
        );

        setError(
          error?.message ||
          "No se pudo completar el envío."
        );

      } finally {

        // =============================================
        // 3️⃣ CERRAR SOLO SI EL MENSAJE FUE CONFIRMADO
        // =============================================

        if (
          messageConfirmed
        ) {

          try {

            await disconnectWhatsApp();

          } catch (
            disconnectError
          ) {

            console.error(
              "❌ Error desconectando:",
              disconnectError
            );

            setError(
              "El mensaje fue enviado, pero no se pudo apagar Baileys."
            );

          }

        }

        setSending(
          false
        );

        await checkWhatsAppStatus();

      }

    };

  // ===================================================
  // RENDER
  // ===================================================

  return (

    <div
      style={{
        minHeight:
          "100%",

        padding:
          "25px 20px",

        color:
          "#fff",

        boxSizing:
          "border-box",
      }}
    >

      <div
        style={{
          maxWidth:
            "700px",

          margin:
            "0 auto",
        }}
      >

        <div
          style={{
            textAlign:
              "center",

            marginBottom:
              "22px",
          }}
        >

          <h1
            style={{
              fontSize:
                "34px",

              margin:
                "0 0 8px",

              fontWeight:
                "700",
            }}
          >
            💬 Prueba WhatsApp
          </h1>

          <div
            style={{
              color:
                "#8d8d8d",

              fontSize:
                "14px",
            }}
          >

            🏢 Business ID:{" "}

            <strong
              style={{
                color:
                  "#25D366",
              }}
            >
              {businessId || "—"}
            </strong>

          </div>

        </div>

        {/* =============================================
            ESTADO
        ============================================= */}

        <div
          style={{
            marginBottom:
              "20px",

            padding:
              "11px 15px",

            borderRadius:
              "9px",

            textAlign:
              "center",

            fontSize:
              "14px",

            background:
              loadingStatus
                ? "#202124"
                : connected
                ? "#123c20"
                : "#351b1b",

            color:
              loadingStatus
                ? "#aaa"
                : connected
                ? "#4ade80"
                : "#ff7777",
          }}
        >

          {loadingStatus ? (

            "📡 Comprobando conexión..."

          ) : connected ? (

            <>
              🟢 WhatsApp conectado

              {connectedPhone
                ? ` · ${connectedPhone}`
                : ""}
            </>

          ) : (

            "🔴 Baileys apagado"

          )}

        </div>

        {/* =============================================
            FORMULARIO
        ============================================= */}

        <form
          onSubmit={
            sendWhatsApp
          }

          style={{
            background:
              "#181a1f",

            border:
              "1px solid #2d3037",

            borderRadius:
              "14px",

            padding:
              "22px",
          }}
        >

          <div
            style={{
              marginBottom:
                "17px",
            }}
          >

            <label
              style={{
                display:
                  "block",

                fontSize:
                  "14px",

                fontWeight:
                  "600",

                marginBottom:
                  "7px",

                color:
                  "#ddd",
              }}
            >
              📥 Número destinatario
            </label>

            <input
              type="tel"

              value={
                phone
              }

              onChange={
                e =>
                  setPhone(
                    e.target.value
                  )
              }

              disabled={
                sending
              }

              placeholder=
                "34647387062"

              style={{
                width:
                  "100%",

                boxSizing:
                  "border-box",

                padding:
                  "12px",

                background:
                  "#101216",

                border:
                  "1px solid #343840",

                borderRadius:
                  "8px",

                color:
                  "#fff",

                fontSize:
                  "15px",

                outline:
                  "none",
              }}
            />

          </div>

          <div
            style={{
              marginBottom:
                "17px",
            }}
          >

            <label
              style={{
                display:
                  "block",

                fontSize:
                  "14px",

                fontWeight:
                  "600",

                marginBottom:
                  "7px",

                color:
                  "#ddd",
              }}
            >
              💬 Mensaje
            </label>

            <textarea
              value={
                message
              }

              onChange={
                e =>
                  setMessage(
                    e.target.value
                  )
              }

              disabled={
                sending
              }

              placeholder=
                "Escribí el mensaje..."

              rows={
                5
              }

              style={{
                width:
                  "100%",

                boxSizing:
                  "border-box",

                padding:
                  "12px",

                background:
                  "#101216",

                border:
                  "1px solid #343840",

                borderRadius:
                  "8px",

                color:
                  "#fff",

                fontSize:
                  "15px",

                resize:
                  "vertical",

                outline:
                  "none",

                fontFamily:
                  "inherit",
              }}
            />

          </div>

          <div
            style={{
              marginBottom:
                "17px",

              padding:
                "12px 14px",

              background:
                "#101216",

              border:
                "1px solid #2d3037",

              borderRadius:
                "8px",

              fontSize:
                "13px",

              lineHeight:
                "1.7",

              color:
                "#aaa",
            }}
          >

            <div>
              🏢 Business:{" "}
              <strong>
                {businessId || "—"}
              </strong>
            </div>

            <div>
              📥 Destinatario:{" "}
              <strong>
                {phone || "—"}
              </strong>
            </div>

            <div>
              🔄 Flujo:{" "}
              <strong>
                Conectar → Enviar → Desconectar
              </strong>
            </div>

          </div>

          <button
            type="submit"

            disabled={
              sending ||
              !businessId
            }

            style={{
              width:
                "100%",

              padding:
                "13px",

              border:
                "none",

              borderRadius:
                "8px",

              background:
                sending ||
                !businessId
                  ? "#555"
                  : "#25D366",

              color:
                "#fff",

              fontSize:
                "15px",

              fontWeight:
                "700",

              cursor:
                sending ||
                !businessId
                  ? "not-allowed"
                  : "pointer",
            }}
          >

            {sending
              ? "🔄 Conectando → Enviando → Cerrando..."
              : "🚀 Probar envío"}

          </button>

          {error && (

            <div
              style={{
                marginTop:
                  "14px",

                padding:
                  "12px 14px",

                borderRadius:
                  "8px",

                background:
                  "#351b1b",

                border:
                  "1px solid #8f3030",

                color:
                  "#ff7777",

                fontSize:
                  "14px",

                textAlign:
                  "center",
              }}
            >
              ❌ {error}
            </div>

          )}

          {success && (

            <div
              style={{
                marginTop:
                  "14px",

                padding:
                  "12px 14px",

                borderRadius:
                  "8px",

                background:
                  "#123c20",

                border:
                  "1px solid #1d8f3b",

                color:
                  "#4ade80",

                fontSize:
                  "14px",

                textAlign:
                  "center",
              }}
            >
              {success}
            </div>

          )}

        </form>

      </div>

    </div>

  );

}