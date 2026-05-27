import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

export default function TiposMovimientos() {

  const navigate = useNavigate()

  const [tipos, setTipos] = useState([])

  useEffect(() => {
    const guardados =
      JSON.parse(localStorage.getItem("tiposMovimientos")) || [
        { id: 1, nombre: "Pago prestador", categoria: "Egreso", descripcion: "", activo: true },
        { id: 2, nombre: "Pago proveedor", categoria: "Egreso", descripcion: "", activo: true },
        { id: 3, nombre: "Cobro cliente", categoria: "Ingreso", descripcion: "", activo: true },
        { id: 4, nombre: "Impuestos", categoria: "Egreso", descripcion: "", activo: true },
        { id: 5, nombre: "Transferencia", categoria: "Transferencia", descripcion: "", activo: true },
        { id: 6, nombre: "Arqueo", categoria: "Arqueo", descripcion: "", activo: true },
        { id: 202, nombre: "Retiro Efectivo", categoria: "Retiros", descripcion: "", activo: true },
        { id: 203, nombre: "Mantenimiento", categoria: "Egreso", descripcion: "Ferretería-Pinturería-otros", activo: true }
      ]

    setTipos(guardados)

    localStorage.setItem(
      "tiposMovimientos",
      JSON.stringify(guardados)
    )
  }, [])

  function cambiarEstado(id) {
    const nuevos = tipos.map((tipo) => {
      if (tipo.id === id) {
        return {
          ...tipo,
          activo: !tipo.activo
        }
      }

      return tipo
    })

    setTipos(nuevos)

    localStorage.setItem(
      "tiposMovimientos",
      JSON.stringify(nuevos)
    )
  }

  return (
    <div style={{ maxWidth: "1250px", margin: "0 auto" }}>

      <div
        style={{
          background: "#2563eb",
          color: "white",
          padding: "16px 20px",
          borderRadius: "10px 10px 0 0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <h2 style={{ margin: 0 }}>
          Tipos de movimiento
        </h2>

        <button
          onClick={() =>
            navigate("/nuevo-tipo-movimiento")
          }
          style={{
            background: "white",
            color: "#2563eb",
            border: "none",
            padding: "10px 18px",
            borderRadius: "20px",
            cursor: "pointer",
            fontWeight: "600"
          }}
        >
          Nuevo tipo de movimiento
        </button>
      </div>

      <div style={{ background: "white", overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse"
          }}
        >
          <thead>
            <tr style={{ background: "#f3f4f6" }}>
              <th style={th}>Id</th>
              <th style={th}>Nombre</th>
              <th style={th}>Categoría</th>
              <th style={th}>Descripción</th>
              <th style={th}>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {tipos.map((tipo) => (
              <tr key={tipo.id}>
                <td style={td}>{tipo.id}</td>
                <td style={td}>{tipo.nombre}</td>
                <td style={td}>{tipo.categoria}</td>
                <td style={td}>{tipo.descripcion}</td>

                <td style={td}>
                  {tipo.id >= 200 && (
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button style={botonAzul}>
                        Editar
                      </button>

                      <button
                        onClick={() => cambiarEstado(tipo.id)}
                        style={
                          tipo.activo
                            ? botonRojo
                            : botonVerde
                        }
                      >
                        {tipo.activo
                          ? "Deshabilitar"
                          : "Habilitar"}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        style={{
          background: "white",
          textAlign: "center",
          padding: "20px",
          borderRadius: "0 0 10px 10px",
          color: "#60a5fa"
        }}
      >
        « Anterior &nbsp;&nbsp; Siguiente »
      </div>

    </div>
  )
}

const th = {
  padding: "14px",
  textAlign: "left",
  borderBottom: "1px solid #e5e7eb",
  color: "#374151"
}

const td = {
  padding: "14px",
  borderBottom: "1px solid #f3f4f6"
}

const botonAzul = {
  background: "#0ea5e9",
  color: "white",
  border: "none",
  padding: "10px 16px",
  borderRadius: "6px",
  cursor: "pointer"
}

const botonRojo = {
  background: "#ef4444",
  color: "white",
  border: "none",
  padding: "10px 16px",
  borderRadius: "6px",
  cursor: "pointer"
}

const botonVerde = {
  background: "#22c55e",
  color: "white",
  border: "none",
  padding: "10px 16px",
  borderRadius: "6px",
  cursor: "pointer"
}