import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/react/daygrid'
import timeGridPlugin from '@fullcalendar/react/timegrid'
import interactionPlugin from '@fullcalendar/react/interaction'

import esLocale from '@fullcalendar/core/locales/es'

import './AgendaCalendar.css?v=2'

import {
  mapAppointmentsToEvents,
} from '../utils/agendaUtils'

function AgendaCalendar({
  appointments,
  onAppointmentClick,
}) {
  const events = mapAppointmentsToEvents(
    appointments
  )

  return (
    <div className="agenda-calendar">

      <FullCalendar

        plugins={[
          dayGridPlugin,
          timeGridPlugin,
          interactionPlugin,
        ]}

        initialView="timeGridDay"

        locales={[esLocale]}
        locale="es"

        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'timeGridDay,timeGridWeek,dayGridMonth',
        }}

        events={events}

        eventClick={(info) => {
          info.jsEvent.preventDefault()

          const appointment =
            info.event.extendedProps.appointment

          if (appointment) {
            onAppointmentClick(appointment)
          }
        }}

        allDaySlot={false}

        /*
         * ==========================================
         * 30 MINUTE INTERVALS
         * ==========================================
         */

        slotDuration="00:30:00"

        slotLabelInterval="00:30:00"

        slotLabelFormat={{
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }}

        slotMinTime="08:00:00"

        slotMaxTime="22:00:00"

        scrollTime="08:00:00"

        nowIndicator={true}

        firstDay={1}

        expandRows={false}

        height="680px"

        eventDisplay="block"

        eventTimeFormat={{
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }}

      />

    </div>
  )
}

export default AgendaCalendar