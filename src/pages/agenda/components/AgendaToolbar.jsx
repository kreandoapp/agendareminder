import './AgendaToolbar.css?v=2'

function AgendaToolbar() {
  return (
    <div className="agenda-toolbar">

      <div className="agenda-toolbar-placeholder">
        <span className="agenda-status-dot" />
        Agenda
      </div>

      <div className="agenda-toolbar-info">
        Selecciona una cita para ver sus detalles
      </div>

    </div>
  )
}

export default AgendaToolbar