function AppointmentCard({
  appointment,
}) {
  const customerName =
    appointment.customer_name ||
    appointment.full_name ||
    appointment.customer_full_name ||
    'Cliente'

  return (
    <div className="appointment-card">

      <div className="appointment-card-name">
        {customerName}
      </div>

      <div className="appointment-card-info">
        📅 Cita
      </div>

    </div>
  )
}

export default AppointmentCard