import './AgendaHeader.css?v=2'

function AgendaHeader({
  onNewAppointment,
  onRefresh,
}) {
  return (
    <header className="agenda-header">

      <div className="agenda-header-content">

        <div className="agenda-title-row">

          <h1>
            Agenda
          </h1>

          <span className="agenda-title-count">
            Citas
          </span>

        </div>

        <p>
          Manage your appointments and schedule.
        </p>

      </div>

      <div className="agenda-header-actions">

        <button
          type="button"
          className="agenda-refresh-button"
          onClick={onRefresh}
          title="Refresh"
        >
          ↻
        </button>

        <button
          type="button"
          className="agenda-new-button"
          onClick={onNewAppointment}
        >
          <span>+</span>
          New appointment
        </button>

      </div>

    </header>
  )
}

export default AgendaHeader