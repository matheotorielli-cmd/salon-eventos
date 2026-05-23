import { useParams } from "react-router-dom"
import { useEffect, useState } from "react"

const inputStyle = {
  width: "100%",
  padding: "10px",
  marginTop: "5px",
  borderRadius: "8px",
  border: "1px solid #d1d5db"
}

export default function EventoDetalle() {

  const { id } = useParams()

  const [evento, setEvento] = useState(null)

  useEffect(() => {

    const eventos =
      JSON.parse(localStorage.getItem("eventos")) || []

    const encontrado = eventos.find(
      (e) => e.id === id
    )

    setEvento(encontrado)

  }, [id])

  function guardarCambios(campo, valor) {

    const actualizado = {
      ...evento,
      [campo]: valor
    }

    setEvento(actualizado)

    const eventos =
      JSON.parse(localStorage.getItem("eventos")) || []

    const nuevosEventos = eventos.map((e) => {

      if (e.id === id) {
        return actualizado
      }

      return e
    })

    localStorage.setItem(
      "eventos",
      JSON.stringify(nuevosEventos)
    )
  }

  if (!evento) {
    return <h1>Evento no encontrado</h1>
  }

  const saldo =
    (evento.total || 0) -
    (evento.cobrado || 0)

  return (
    <div
      style={{
        background: "white",
        padding: "30px",
        borderRadius: "10px"
      }}
    >

      <h1 style={{ marginBottom: "30px" }}>
        Datos del Evento
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px"
        }}
      >

        <div>
          <label>Cliente</label>

          <input
            type="text"
            value={evento.cliente || ""}
            onChange={(e) =>
              guardarCambios(
                "cliente",
                e.target.value
              )
            }
            style={inputStyle}
          />
        </div>

        <div>
          <label>Teléfono</label>

          <input
            type="text"
            value={evento.telefono || ""}
            onChange={(e) =>
              guardarCambios(
                "telefono",
                e.target.value
              )
            }
            style={inputStyle}
          />
        </div>

        <div>
          <label>Dirección</label>

          <input
            type="text"
            value={evento.direccion || ""}
            onChange={(e) =>
              guardarCambios(
                "direccion",
                e.target.value
              )
            }
            style={inputStyle}
          />
        </div>

        <div>
          <label>Tipo de evento</label>

          <input
            type="text"
            value={evento.tipoEvento || ""}
            onChange={(e) =>
              guardarCambios(
                "tipoEvento",
                e.target.value
              )
            }
            style={inputStyle}
          />
        </div>

        <div>
          <label>Estado</label>

          <select
            value={evento.estado || "Pendiente"}
            onChange={(e) =>
              guardarCambios(
                "estado",
                e.target.value
              )
            }
            style={inputStyle}
          >
            <option>Pendiente</option>
            <option>Señado</option>
            <option>Pagado</option>
          </select>
        </div>

        <div>
          <label>Precio total</label>

          <input
            type="number"
            value={evento.total || 0}
            onChange={(e) =>
              guardarCambios(
                "total",
                Number(e.target.value)
              )
            }
            style={inputStyle}
          />
        </div>

        <div>
          <label>Cobrado</label>

          <input
            type="number"
            value={evento.cobrado || 0}
            onChange={(e) =>
              guardarCambios(
                "cobrado",
                Number(e.target.value)
              )
            }
            style={inputStyle}
          />
        </div>

        <div>
          <label>Saldo</label>

          <input
            type="number"
            value={saldo}
            disabled
            style={{
              ...inputStyle,
              background: "#e5e7eb"
            }}
          />
        </div>

      </div>

      <div style={{ marginTop: "30px" }}>

        <label>Notas</label>

        <textarea
          value={evento.notas || ""}
          onChange={(e) =>
            guardarCambios(
              "notas",
              e.target.value
            )
          }
          rows={6}
          style={{
            width: "100%",
            marginTop: "10px",
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #d1d5db"
          }}
        />

      </div>

    </div>
  )
}