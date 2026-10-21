function Sidebar({ currentPage, setCurrentPage }) {
  return (
    <aside
      style={{
        width: '240px',
        minHeight: '100vh',
        background: '#0d0f13',
        borderRight: '1px solid #252830',
        padding: '25px 15px',
        boxSizing: 'border-box',
        color: '#fff',
      }}
    >
      <h2
        style={{
          fontSize: '20px',
          marginBottom: '35px',
          paddingLeft: '10px',
        }}
      >
        📅 AgendaReminder
      </h2>

      <button
        onClick={() => setCurrentPage('home')}
        style={menuButton(currentPage === 'home')}
      >
        🏠 Inicio
      </button>

      <button
        onClick={() => setCurrentPage('whatsapp')}
        style={menuButton(currentPage === 'whatsapp')}
      >
        📱 WhatsApp
      </button>

      <button
        onClick={() => setCurrentPage('send')}
        style={menuButton(currentPage === 'send')}
      >
        💬 Enviar mensaje
      </button>

      <button
        onClick={() => setCurrentPage('settings')}
        style={menuButton(currentPage === 'settings')}
      >
        ⚙️ Configuración
      </button>

      <div style={{ marginTop: '40px' }}>
        <button
          onClick={() => window.history.back()}
          style={menuButton(false)}
        >
          ← Volver
        </button>
      </div>
    </aside>
  )
}

const menuButton = (active) => ({
  display: 'block',
  width: '100%',
  padding: '12px 14px',
  marginBottom: '8px',

  border: 'none',
  borderRadius: '8px',

  background: active
    ? '#252a31'
    : 'transparent',

  color: active
    ? '#fff'
    : '#999',

  textAlign: 'left',
  fontSize: '15px',

  cursor: 'pointer',
})

export default Sidebar