import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

export default function MisEventos() {

  const navigate = useNavigate()

  const [eventos, setEventos] =
    useState([])

  const [busqueda, setBusqueda] =
    useState("")

  const [fechaDesde, setFechaDesde] =
    useState("")

  const [fechaHasta, setFechaHasta] =
    useState("")

  const [filtroTipo, setFiltroTipo] =
    useState("")

  useEffect(() => {

    const guardados =
      JSON.parse(
        localStorage.getItem("eventos")
      ) || []

    guardados.sort((a, b) =>
      new Date(b.fecha) -
      new Date(a.fecha)
    )

    setEventos(guardados)

  }, [])

  const tiposUnicos = [
    ...new Set(
      eventos.map(ev => ev.tipoEvento)
    )
  ]

  const eventosFiltrados =
    eventos.filter((ev) => {

      const coincideBusqueda =

        ev.cliente
          ?.toLowerCase()
          .includes(
            busqueda.toLowerCase()
          )

      const coincideFecha =

        fechaDesde && fechaHasta

          ? (
              ev.fecha >= fechaDesde &&
              ev.fecha <= fechaHasta
            )

          : true

      const coincideTipo =

        filtroTipo
          ? ev.tipoEvento === filtroTipo
          : true

      return (
        coincideBusqueda &&
        coincideFecha &&
        coincideTipo
      )

    })

  function colorEstado(estado) {

    if (estado === "Pagado") {
      return "#84cc16"
    }

    if (estado === "Confirmado") {
      return "#2563eb"
    }

    if (
      estado === "Presupuestado"
    ) {
      return "#facc15"
    }

    if (estado === "Cancelado") {
      return "#ef4444"
    }

    return "#6b7280"
  }

  return (

    <div>

      <h1
        style={{
          marginTop: 0,
          marginBottom: "25px",
          color: "#1e3a8a",
          textAlign: "center",
          fontSize: "34px"
        }}
      >
        Mis Eventos
      </h1>

      {/* FILTROS */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(220px,1fr))",
          gap: "15px",
          marginBottom: "25px"
        }}
      >

        <input
          type="text"
          placeholder="Buscar cliente..."
          value={busqueda}
          onChange={(e) =>
            setBusqueda(e.target.value)
          }
          style={input}
        />

        <input
          type="date"
          value={fechaDesde}
          onChange={(e) =>
            setFechaDesde(e.target.value)
          }
          style={input}
        />

        <input
          type="date"
          value={fechaHasta}
          onChange={(e) =>
            setFechaHasta(e.target.value)
          }
          style={input}
        />

        <select
          value={filtroTipo}
          onChange={(e) =>
            setFiltroTipo(e.target.value)
          }
          style={input}
        >

          <option value="">
            Todos los tipos
          </option>

          {tiposUnicos.map(
            (tipo, index) => (

              <option
                key={index}
                value={tipo}
              >
                {tipo}
              </option>

            )
          )}

        </select>

      </div>

      {/* LISTA */}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "18px"
        }}
      >

        {eventosFiltrados.length === 0 && (

          <div
            style={{
              background: "white",
              padding: "30px",
              borderRadius: "12px",
              textAlign: "center",
              color: "#6b7280"
            }}
          >
            No se encontraron eventos
          </div>

        )}

        {eventosFiltrados.map((ev) => (

          <div
            key={ev.id}
            onClick={() =>
              navigate(`/evento/${ev.id}`)
            }
            style={{
              background: "white",
              padding: "22px",
              borderRadius: "14px",
              cursor: "pointer",
              border:
                "1px solid #e5e7eb",
              transition: ".2s",
              boxShadow:
                "0 2px 8px rgba(0,0,0,0.04)"
            }}
          >

            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "10px"
              }}
            >

              <div>

                <h2
                  style={{
                    margin: 0,
                    color: "#111827"
                  }}
                >
                  {ev.cliente}
                </h2>

                <div
                  style={{
                    marginTop: "8px",
                    color: "#6b7280",
                    fontSize: "15px"
                  }}
                >
                  {ev.tipoEvento}
                </div>

              </div>

              <div
                style={{
                  background:
                    colorEstado(ev.estado),
                  color: "white",
                  padding:
                    "8px 14px",
                  borderRadius: "999px",
                  fontWeight: "600",
                  fontSize: "14px"
                }}
              >
                {ev.estado}
              </div>

            </div>

            <div
              style={{
                marginTop: "18px",
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit,minmax(220px,1fr))",
                gap: "12px",
                color: "#374151"
              }}
            >

              <div>
                📅 {ev.fecha}
              </div>

              <div>
                🕒 {ev.hora || "--:--"}
              </div>

              <div>
                👥 {ev.personas || 0} personas
              </div>

              <div>
                💲 ${ev.total || 0}
              </div>

              <div>
                📍 {ev.direccion || "-"}
              </div>

            </div>

          </div>

        ))}

      </div>

    </div>
  )
}

const input = {
  width: "100%",
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid #d1d5db",
  fontSize: "15px",
  boxSizing: "border-box",
  background: "white"
}