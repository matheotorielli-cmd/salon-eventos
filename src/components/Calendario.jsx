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
    <div
      style={{
        background: "white",
        padding: "20px",
        borderRadius: "8px",
        height: "calc(100vh - 140px)", // 👈 CLAVE
        display: "flex",
        flexDirection: "column"
      }}
    >

      <div style={{ flex: 1 }}>
        <FullCalendar

          plugins={[
            dayGridPlugin,
            timeGridPlugin,
            interactionPlugin
          ]}

          locales={[esLocale]}
          locale="es"

          initialView="dayGridMonth"

          height="100%" // 👈 IMPORTANTE

          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay"
          }}

          buttonText={{
            today: "Hoy",
            month: "Mes",
            week: "Semana",
            day: "Día"
          }}

          events={eventos}

          eventClick={abrirEvento}

        />
      </div>

    </div>
  )
}