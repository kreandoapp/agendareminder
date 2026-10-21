export function mapAppointmentsToEvents(appointments = []) {
  return appointments
    .filter((appointment) => {
      return (
        appointment &&
        appointment.appointment_date &&
        appointment.appointment_time
      )
    })
    .map((appointment) => {

      const date =
        appointment.appointment_date

      const time =
        String(appointment.appointment_time)
          .slice(0, 5)

      const customerName =
        appointment.customer_name ||
        appointment.full_name ||
        appointment.customer_full_name ||
        'Cliente'

      return {
        id: String(
          appointment.id ||
          appointment.appointment_id
        ),

        title: customerName,

        start: `${date}T${time}:00`,

        end: calculateEndTime(
          date,
          time
        ),

        extendedProps: {
          appointment,
        },
      }
    })
}

function calculateEndTime(date, time) {
  const [hours, minutes] =
    time.split(':').map(Number)

  let endMinutes =
    hours * 60 +
    minutes +
    30

  let endHours =
    Math.floor(endMinutes / 60)

  endMinutes =
    endMinutes % 60

  if (endHours >= 24) {
    endHours = 23
    endMinutes = 59
  }

  const formattedHours =
    String(endHours).padStart(2, '0')

  const formattedMinutes =
    String(endMinutes).padStart(2, '0')

  return `${date}T${formattedHours}:${formattedMinutes}:00`
}