import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

export default function MisEventos() {

  const navigate = useNavigate()

  const [eventos, setEventos] = useState([])

  const [busqueda, setBusqueda] =
    useState("")

  useEffect(() => {

    const guardados =
      JSON.parse(localStorage.getItem("eventos")) || []

    setEventos(guardados)

  }, [])

  const filtrados = eventos.filter(e =>
    e.cliente
      ?.toLowerCase()
      .includes(busqueda.toLowerCase())
  )

  const estadoColor = {
    Presupuestado: "#f59e0b",
    Confirmado: "#2563eb",
    Pagado: "#16a34a",
    Cancelado: "#dc2626"
  }

  return (

    <div
      style={{
        background: "white",
        padding: "25px",
        borderRadius: "10px"
      }}
    >

      {/* CABECERA */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "15px"
        }}
      >

        <h2
          style={{
            margin: 0
          }}
        >
          Mis eventos
        </h2>

        <input
          type="text"
          placeholder="Buscar cliente..."
          value={busqueda}
          onChange={(e) =>
            setBusqueda(e.target.value)
          }
          style={{
            padding: "10px",
            width: "260px"
          }}
        />

      </div>

      {/* TABLA */}
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
                Cliente
              </th>

              <th style={th}>
                Fecha
              </th>

              <th style={th}>
                Tipo
              </th>

              <th style={th}>
                Estado
              </th>

              <th style={th}>
                Saldo
              </th>

              <th style={th}>
                Acción
              </th>

            </tr>

          </thead>

          <tbody>

            {filtrados.map(evento => (

              <tr
                key={evento.id}
                style={{
                  borderBottom:
                    "1px solid #eee"
                }}
              >

                <td style={td}>
                  {evento.cliente}
                </td>

                <td style={td}>
                  {evento.fecha}
                </td>

                <td style={td}>
                  {evento.tipoEvento}
                </td>

                <td style={td}>

                  <span
                    style={{
                      background:
                        estadoColor[evento.estado],
                      color: "white",
                      padding: "6px 10px",
                      borderRadius: "20px",
                      fontSize: "12px"
                    }}
                  >
                    {evento.estado}
                  </span>

                </td>

                <td style={td}>
                  ${evento.saldo}
                </td>

                <td style={td}>

                  <button
                    onClick={() =>
                      navigate(`/evento/${evento.id}`)
                    }
                    style={{
                      background: "#2563eb",
                      color: "white",
                      border: "none",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      cursor: "pointer"
                    }}
                  >
                    Abrir
                  </button>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  )
}

const th = {
  textAlign: "left",
  padding: "14px",
  fontSize: "14px"
}

const td = {
  padding: "14px",
  fontSize: "14px"
}