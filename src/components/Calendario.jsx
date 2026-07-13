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
  const [esMovil, setEsMovil] = useState(() => window.innerWidth <= 760)

  useEffect(() => {
    const actualizar = () => setEsMovil(window.innerWidth <= 760)
    window.addEventListener("resize", actualizar)
    return () => window.removeEventListener("resize", actualizar)
  }, [])

  useEffect(() => {

    const unsubscribe = onSnapshot(
      collection(db, "eventos"),
      (snapshot) => {

        const eventosFormateados =
          snapshot.docs.map((doc) => {

            const ev = {
  ...doc.data(),
  id: doc.id
}

            const total = Number(ev.total || 0)
            const cobrado = Number(ev.totalCobrado ?? ev.sena ?? 0)
            const porcentajePagado = total > 0 ? Math.round((cobrado / total) * 100) : 0
            const cancelado = String(ev.estado || "").toLowerCase() === "cancelado"
            const color = cancelado ? COLORES_PAGO.cancelado : (COLORES_PAGO[porcentajePagado] || COLORES_PAGO[0])
            const colorTexto = porcentajePagado === 50 && !cancelado ? "#443900" : "#ffffff"

            const horaInicio =
              ev.hora || "12:00"

            const horaFin =
              ev.horaFin || "18:00"

            return {

              ...ev,

              title:
                ev.nombreEvento || ev.title || ev.cliente || "Evento",

              start:
                ev.fecha
                  ? `${ev.fecha}T${horaInicio}`
                  : ev.start,

              end:
                ev.fechaFin || ev.fecha
                  ? `${ev.fechaFin || ev.fecha}T${horaFin}`
                  : ev.end,

              backgroundColor: color,
              borderColor: color,
              textColor: colorTexto,
              porcentajePagado
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

  function aplicarColorEvento(info) {
    const color = info.event.backgroundColor
    const colorTexto = info.event.textColor || "#ffffff"
    info.el.style.setProperty("background-color", color, "important")
    info.el.style.setProperty("border-color", color, "important")
    info.el.style.setProperty("color", colorTexto, "important")
    info.el.style.setProperty("--fc-event-bg-color", color)
    info.el.style.setProperty("--fc-event-border-color", color)
    info.el.style.setProperty("--fc-event-text-color", colorTexto)

    const interior = info.el.querySelector(".fc-event-main")
    if (interior) {
      interior.style.setProperty("background-color", color, "important")
      interior.style.setProperty("color", colorTexto, "important")
      interior.style.setProperty("border-radius", "8px", "important")
    }
  }

  return (

    <div
      className="calendar-page"
      translate="no"
      style={{
        maxWidth: "1250px",
        margin: "0 auto",
        background: "white",
        padding: "24px",
        borderRadius: "18px",
        height: "calc(100vh - 120px)",
        display: "flex",
        flexDirection: "column",
        boxShadow:
          "0 12px 32px rgba(78,37,129,.10)",
        border: "1px solid #e8e1ee"
      }}
    >

      <style>{`

        .fc {
          height: 100%;
          font-family: "Poppins", sans-serif;
        }

        .fc-toolbar-title {
          font-size: 28px !important;
          font-weight: 700;
          color: #4e2581;
        }

        .fc-button {
          background: #4e2581 !important;
          border: none !important;
          padding: 8px 14px !important;
          font-weight: 600 !important;
          border-radius: 8px !important;
        }

        .fc-button:hover {
          background: #38145f !important;
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
            rgba(78,37,129,0.06)
            !important;
        }

      `}</style>

      <h1
        style={{
          marginTop: 0,
          marginBottom: "35px",
          color: "#4e2581",
          fontSize: "36px",
          fontWeight: "700",
          textAlign: "center",
          letterSpacing: "1px"
        }}
      >
        Calendario
      </h1>

      <div className="calendar-wrapper" style={{ flex: 1 }}>

        <FullCalendar
          key={esMovil ? "movil" : "escritorio"}

          plugins={[
            dayGridPlugin,
            timeGridPlugin,
            interactionPlugin,
            listPlugin,
            multiMonthPlugin
          ]}

          locales={[esLocale]}
          locale="es"

          initialView={esMovil ? "dayGridMonth" : "timeGridWeek"}

          height={esMovil ? "auto" : "100%"}

          slotMinTime="09:00:00"
          slotMaxTime="23:00:00"

          allDaySlot={false}

          fixedWeekCount={false}

          dayHeaderFormat={esMovil ? { weekday: "narrow" } : undefined}

          nowIndicator={true}

          editable={false}

          eventClick={abrirEvento}

          eventDidMount={aplicarColorEvento}

          events={eventos}

          headerToolbar={esMovil ? {
            left: "prev,next",
            center: "title",
            right: "today,multiMonthYear,dayGridMonth,timeGridWeek,timeGridDay,listWeek"
          } : {
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
        className="calendar-legend"
        style={{
          display: "flex",
          gap: "18px",
          marginTop: "15px",
          flexWrap: "wrap",
          fontSize: "14px"
        }}
      >

        <Leyenda color={COLORES_PAGO[0]} texto="0% · Sin pago" />
        <Leyenda color={COLORES_PAGO[25]} texto="25% · Seña" />
        <Leyenda color={COLORES_PAGO[50]} texto="50% · Mitad pagada" />
        <Leyenda color={COLORES_PAGO[75]} texto="75% · Pago avanzado" />
        <Leyenda color={COLORES_PAGO[100]} texto="100% · Pagado" />
        <Leyenda color={COLORES_PAGO.cancelado} texto="Cancelado" />

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

const COLORES_PAGO = {
  0: "#6b7280",
  25: "#f97316",
  50: "#f4d00c",
  75: "#57b6ee",
  100: "#22c55e",
  cancelado: "#dc2626"
}
