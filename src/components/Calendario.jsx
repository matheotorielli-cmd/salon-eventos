import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import multiMonthPlugin from "@fullcalendar/multimonth"

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
    <div
      style={{
        background: "white",
        padding: "20px",
        borderRadius: "10px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        height: "100%"
      }}
    >
      <h2 style={{ marginBottom: "20px" }}>
        Calendario
      </h2>

      <FullCalendar
        plugins={[
          dayGridPlugin,
          timeGridPlugin,
          interactionPlugin,
          multiMonthPlugin
        ]}
        locales={[esLocale]}
        locale="es"
        initialView="timeGridWeek"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "multiMonthYear,dayGridMonth,timeGridWeek,timeGridDay"
        }}
        buttonText={{
          today: "Hoy",
          month: "Mes",
          week: "Semana",
          day: "Día",
          multiMonthYear: "Año"
        }}
        editable={true}
        selectable={true}
        eventClick={abrirEvento}
        slotMinTime="08:00:00"
        slotMaxTime="24:00:00"
        height="100vh"
        events={eventos}
      />
    </div>
  )
}