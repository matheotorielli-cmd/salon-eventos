import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import { collection, onSnapshot } from "firebase/firestore"
import { db } from "../firebase"

import FullCalendar from "@fullcalendar/react"

import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import listPlugin from "@fullcalendar/list"
import multiMonthPlugin from "@fullcalendar/multimonth"

import esLocale from "@fullcalendar/core/locales/es"

export default function Calendario() {

  const navigate = useNavigate()

  const [eventos, setEventos] =
    useState([])

  useEffect(() => {

    const unsubscribe = onSnapshot(
      collection(db, "eventos"),
      (snapshot) => {

        const eventosFormateados =
          snapshot.docs.map((doc) => {

            const ev = {
              id: doc.id,
              ...doc.data()
            }

            let color = "#3b82f6"

            if (ev.estado === "Pagado") {
              color = "#84cc16"
            }

            if (ev.estado === "Confirmado") {
              color = "#2563eb"
            }

            if (
              ev.estado === "Presupuestado"
            ) {
              color = "#facc15"
            }

            if (ev.estado === "Cancelado") {
              color = "#ef4444"
            }

            const horaInicio =
              ev.hora || "12:00"

            const horaFin =
              ev.horaFin || "18:00"

            return {

              ...ev,

              title:
                ev.cliente || "Evento",

              start:
                ev.start ||
                `${ev.fecha}T${horaInicio}`,

              end:
                ev.end ||
                `${ev.fecha}T${horaFin}`,

              backgroundColor: color,
              borderColor: color,
              textColor: "#ffffff"
            }

          })

        setEventos(eventosFormateados)
      }
    )

    return () => unsubscribe()

  }, [])

  function abrirEvento(info) {

    navigate(
      `/evento/${info.event.id}`
    )

  }

  return (

    <div
      style={{
        background: "white",
        padding: "20px",
        borderRadius: "14px",
        height: "calc(100vh - 120px)",
        display: "flex",
        flexDirection: "column",
        boxShadow:
          "0 2px 10px rgba(0,0,0,0.05)"
      }}
    >

      <style>{`

        .fc {
          height: 100%;
          font-family: Arial;
        }

        .fc-toolbar-title {
          font-size: 28px !important;
          font-weight: 700;
          color: #374151;
        }

        .fc-button {
          background: #2563eb !important;
          border: none !important;
          padding: 8px 14px !important;
          font-weight: 600 !important;
          border-radius: 8px !important;
        }

        .fc-button:hover {
          background: #1d4ed8 !important;
        }

        .fc-event {
          border-radius: 8px !important;
          border: none !important;
          padding: 3px !important;
          font-size: 13px !important;
          font-weight: 600;
        }

        .fc-timegrid-slot {
          height: 22px !important;
        }

        .fc-col-header-cell {
          background: #f9fafb;
          padding: 10px 0;
        }

        .fc-day-today {
          background:
            rgba(37,99,235,0.06)
            !important;
        }

      `}</style>

      <h1
        style={{
          marginTop: 0,
          marginBottom: "35px",
          color: "#1e3a8a",
          fontSize: "36px",
          fontWeight: "700",
          textAlign: "center",
          letterSpacing: "1px"
        }}
      >
        Calendario
      </h1>

      <div style={{ flex: 1 }}>

        <FullCalendar

          plugins={[
            dayGridPlugin,
            timeGridPlugin,
            interactionPlugin,
            listPlugin,
            multiMonthPlugin
          ]}

          locales={[esLocale]}
          locale="es"

          initialView="timeGridWeek"

          height="100%"

          slotMinTime="09:00:00"
          slotMaxTime="23:00:00"

          allDaySlot={false}

          nowIndicator={true}

          editable={false}

          eventClick={abrirEvento}

          events={eventos}

          headerToolbar={{
            left:
              "prev,next today",

            center:
              "title",

            right:
              "multiMonthYear,dayGridMonth,timeGridWeek,timeGridDay,listWeek"
          }}

          buttonText={{
            today: "Hoy",
            month: "Mes",
            week: "Semana",
            day: "Día",
            list: "Lista",
            multiMonthYear: "Año"
          }}

          slotLabelFormat={{
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
          }}

          eventTimeFormat={{
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
          }}

        />

      </div>

      <div
        style={{
          display: "flex",
          gap: "18px",
          marginTop: "15px",
          flexWrap: "wrap",
          fontSize: "14px"
        }}
      >

        <Leyenda
          color="#84cc16"
          texto="Pagado"
        />

        <Leyenda
          color="#2563eb"
          texto="Confirmado"
        />

        <Leyenda
          color="#facc15"
          texto="Presupuestado"
        />

        <Leyenda
          color="#ef4444"
          texto="Cancelado"
        />

      </div>

    </div>
  )
}

function Leyenda({
  color,
  texto
}) {

  return (

    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px"
      }}
    >

      <div
        style={{
          width: "14px",
          height: "14px",
          borderRadius: "4px",
          background: color
        }}
      />

      <span>{texto}</span>

    </div>
  )
}