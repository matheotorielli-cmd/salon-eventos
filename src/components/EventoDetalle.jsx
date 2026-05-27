import { useNavigate, useParams } from "react-router-dom"
import { useEffect, useState } from "react"

export default function EventoDetalle() {

  const { id } = useParams()

  const navigate = useNavigate()

  const [evento, setEvento] = useState(null)

  useEffect(() => {

    const eventos =
      JSON.parse(localStorage.getItem("eventos")) || []

    const encontrado = eventos.find(
      e => String(e.id) === id
    )

    setEvento(encontrado)

  }, [id])

  if (!evento) {
    return <h2>Evento no encontrado</h2>
  }

  function cambiarEstado(nuevoEstado) {

    const eventos =
      JSON.parse(localStorage.getItem("eventos")) || []

    const actualizados = eventos.map(e => {

      if (String(e.id) === id) {

        return {
          ...e,
          estado: nuevoEstado
        }

      }

      return e
    })

    localStorage.setItem(
      "eventos",
      JSON.stringify(actualizados)
    )

    setEvento({
      ...evento,
      estado: nuevoEstado
    })
  }

  function eliminarEvento() {

    const confirmar =
      confirm("¿Seguro querés eliminar este evento?")

    if (!confirmar) return

    const eventos =
      JSON.parse(localStorage.getItem("eventos")) || []

    const filtrados =
      eventos.filter(
        e => String(e.id) !== id
      )

    localStorage.setItem(
      "eventos",
      JSON.stringify(filtrados)
    )

    navigate("/eventos")
  }

  const estadoColor = {
    Presupuestado: "#f59e0b",
    Confirmado: "#2563eb",
    Pagado: "#16a34a",
    Cancelado: "#dc2626"
  }

  return (

    <div
      style={{
        maxWidth: "1100px",
        margin: "0 auto",
        background: "white",
        borderRadius: "12px",
        padding: "30px"
      }}
    >

      {/* CABECERA */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "15px",
          marginBottom: "30px"
        }}
      >

        <div>

          <h1
            style={{
              margin: 0,
              color: "#1e3a8a"
            }}
          >
            Evento #{evento.id}
          </h1>

          <div
            style={{
              marginTop: "10px",
              display: "inline-block",
              background:
                estadoColor[evento.estado],
              color: "white",
              padding: "6px 14px",
              borderRadius: "999px",
              fontSize: "13px",
              fontWeight: "600"
            }}
          >
            {evento.estado}
          </div>

        </div>

        {/* BOTONES */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap"
          }}
        >

          <button
            onClick={() =>
              navigate(`/evento/${id}/editar`)
            }
            style={botonAzul}
          >
            Editar
          </button>

          <button
            onClick={() =>
              cambiarEstado("Confirmado")
            }
            style={botonAzul}
          >
            Confirmar
          </button>

          <button
            onClick={() =>
              cambiarEstado("Pagado")
            }
            style={botonVerde}
          >
            Marcar pagado
          </button>

          <button
            onClick={() =>
              cambiarEstado("Cancelado")
            }
            style={botonRojo}
          >
            Cancelar
          </button>

          <button
            onClick={() =>
              navigate(`/evento/${id}/cobro`)
            }
            style={botonGris}
          >
            Registrar pago
          </button>

          <button
            onClick={eliminarEvento}
            style={botonRojo}
          >
            Eliminar
          </button>

        </div>

      </div>

      {/* INFORMACION */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(250px,1fr))",
          gap: "20px"
        }}
      >

        <Card
          titulo="Cliente"
          valor={evento.cliente}
        />

        <Card
          titulo="Teléfono"
          valor={evento.telefono}
        />

        <Card
          titulo="Dirección"
          valor={evento.direccion}
        />

        <Card
          titulo="Tipo de evento"
          valor={evento.tipoEvento}
        />

        <Card
          titulo="Fecha"
          valor={evento.fecha}
        />

        <Card
          titulo="Hora inicio"
          valor={evento.hora}
        />

        <Card
          titulo="Hora finalización"
          valor={evento.horaFin}
        />

        <Card
          titulo="Cantidad personas"
          valor={evento.personas}
        />

        <Card
          titulo="Cantidad niños"
          valor={evento.cantidadNinos}
        />

        <Card
          titulo="Escuela"
          valor={evento.escuela}
        />

        <Card
          titulo="Monto total"
          valor={`$${evento.total}`}
        />

        <Card
          titulo="Seña"
          valor={`$${evento.sena}`}
        />

        <Card
          titulo="Saldo"
          valor={`$${evento.saldo}`}
        />

      </div>

      {/* PRESTADORES */}
      {evento.prestadores?.length > 0 && (

        <div
          style={{
            marginTop: "35px"
          }}
        >

          <h2
            style={{
              marginBottom: "20px",
              color: "#111827"
            }}
          >
            Prestadores
          </h2>

          <div
            style={{
              overflowX: "auto"
            }}
          >

            <table
              style={{
                width: "100%",
                borderCollapse: "collapse"
              }}
            >

              <thead>

                <tr
                  style={{
                    background: "#f3f4f6"
                  }}
                >

                  <th style={th}>
                    Nombre
                  </th>

                  <th style={th}>
                    Apellido
                  </th>

                  <th style={th}>
                    Actividad
                  </th>

                  <th style={th}>
                    Costo
                  </th>

                  <th style={th}>
                    Precio
                  </th>

                </tr>

              </thead>

              <tbody>

                {evento.prestadores.map(
                  (p, index) => (

                    <tr key={index}>

                      <td style={td}>
                        {p.nombre}
                      </td>

                      <td style={td}>
                        {p.apellido}
                      </td>

                      <td style={td}>
                        {p.actividad}
                      </td>

                      <td style={td}>
                        ${p.costo}
                      </td>

                      <td style={td}>
                        ${p.precio}
                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        </div>

      )}

      {/* OBSERVACIONES */}
      <div
        style={{
          marginTop: "35px"
        }}
      >

        <h2
          style={{
            color: "#111827"
          }}
        >
          Observaciones
        </h2>

        <div
          style={{
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: "10px",
            padding: "20px",
            marginTop: "15px",
            color: "#374151",
            lineHeight: "1.6"
          }}
        >
          {evento.observaciones ||
            "Sin observaciones"}
        </div>

      </div>

    </div>
  )
}

function Card({
  titulo,
  valor
}) {

  return (

    <div
      style={{
        background: "#f9fafb",
        border: "1px solid #e5e7eb",
        borderRadius: "10px",
        padding: "18px"
      }}
    >

      <div
        style={{
          fontSize: "13px",
          color: "#6b7280",
          marginBottom: "8px"
        }}
      >
        {titulo}
      </div>

      <div
        style={{
          fontSize: "17px",
          fontWeight: "600",
          color: "#111827"
        }}
      >
        {valor || "-"}
      </div>

    </div>
  )
}

const th = {
  textAlign: "left",
  padding: "14px",
  borderBottom: "1px solid #e5e7eb",
  fontSize: "14px",
  color: "#374151"
}

const td = {
  padding: "14px",
  borderBottom: "1px solid #f3f4f6"
}

const botonAzul = {
  background: "#2563eb",
  color: "white",
  border: "none",
  padding: "10px 16px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600"
}

const botonVerde = {
  background: "#16a34a",
  color: "white",
  border: "none",
  padding: "10px 16px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600"
}

const botonRojo = {
  background: "#dc2626",
  color: "white",
  border: "none",
  padding: "10px 16px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600"
}

const botonGris = {
  background: "#4b5563",
  color: "white",
  border: "none",
  padding: "10px 16px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600"
}