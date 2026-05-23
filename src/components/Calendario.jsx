import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"

import esLocale from "@fullcalendar/core/locales/es"

export default function Calendario() {

  const navigate = useNavigate()

  const [eventos, setEventos] = useState([])

  useEffect(() => {

    const guardados =
      JSON.parse(localStorage.getItem("eventos")) || []

    setEventos(guardados)

  }, [])

  function abrirEvento(info) {
    navigate(`/evento/${info.event.id}`)
  }

  return (

    <div className="calendar-wrapper">

      <FullCalendar

        plugins={[
          dayGridPlugin,
          timeGridPlugin,
          interactionPlugin
        ]}

        locales={[esLocale]}
        locale="es"

        initialView="timeGridWeek"

        height="700px"

        slotMinTime="10:00:00"
        slotMaxTime="18:00:00"

        allDaySlot={true}

        headerToolbar={{
          left: "today prev,next",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek"
        }}

        buttonText={{
          today: "Hoy",
          month: "Mes",
          week: "Semana",
          day: "Día",
          list: "Lista"
        }}

        events={eventos}

        eventClick={abrirEvento}

      />

    </div>

  )
}