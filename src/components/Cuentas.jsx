import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

export default function Cuentas() {

  const navigate = useNavigate()

  const [cuentas, setCuentas] =
    useState([])

  useEffect(() => {

    const guardadas =
      JSON.parse(
        localStorage.getItem("cuentas")
      ) || []

    setCuentas(guardadas)

  }, [])

  function cambiarEstado(id) {

    const nuevas =
      cuentas.map((cuenta) => {

        if (cuenta.id === id) {

          return {
            ...cuenta,
            activa: !cuenta.activa
          }

        }

        return cuenta

      })

    setCuentas(nuevas)

    localStorage.setItem(
      "cuentas",
      JSON.stringify(nuevas)
    )

  }

  return (

    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto"
      }}
    >

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

        <h2
          style={{
            margin: 0
          }}
        >
          Cuentas
        </h2>

        <button
          onClick={() =>
            navigate("/nueva-cuenta")
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
          Nueva cuenta
        </button>

      </div>

      <div
        style={{
          background: "white",
          borderRadius: "0 0 10px 10px",
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
                Descripción
              </th>

              <th style={th}>
                Divisa
              </th>

              <th style={th}>
                Monto
              </th>

              <th style={th}>
                Acciones
              </th>

            </tr>

          </thead>

          <tbody>

            {cuentas.length === 0 && (

              <tr>

                <td
                  colSpan="5"
                  style={{
                    padding: "25px",
                    textAlign: "center",
                    color: "#6b7280"
                  }}
                >
                  No hay cuentas cargadas
                </td>

              </tr>

            )}

            {cuentas.map((cuenta) => (

              <tr key={cuenta.id}>

                <td style={td}>
                  {cuenta.nombre}
                </td>

                <td style={td}>
                  {cuenta.descripcion}
                </td>

                <td style={td}>
                  {cuenta.divisa}
                </td>

                <td style={td}>
                  $
                  {Number(
                    cuenta.monto || 0
                  ).toLocaleString(
                    "es-AR"
                  )}
                </td>

                <td style={td}>

                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      flexWrap: "wrap"
                    }}
                  >

                    <button
                      style={botonAzul}
                    >
                      Caja
                    </button>

                    <button
                      style={botonCeleste}
                    >
                      Editar
                    </button>

                    <button
                      onClick={() =>
                        cambiarEstado(
                          cuenta.id
                        )
                      }
                      style={
                        cuenta.activa === false
                          ? botonVerde
                          : botonRojo
                      }
                    >
                      {cuenta.activa === false
                        ? "Habilitar"
                        : "Deshabilitar"}
                    </button>

                  </div>

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
  padding: "14px",
  textAlign: "left",
  borderBottom: "1px solid #e5e7eb",
  color: "#374151",
  fontSize: "14px"
}

const td = {
  padding: "14px",
  borderBottom: "1px solid #f3f4f6"
}

const botonAzul = {
  background: "#2563eb",
  color: "white",
  border: "none",
  padding: "9px 14px",
  borderRadius: "6px",
  cursor: "pointer"
}

const botonCeleste = {
  background: "#0ea5e9",
  color: "white",
  border: "none",
  padding: "9px 14px",
  borderRadius: "6px",
  cursor: "pointer"
}

const botonRojo = {
  background: "#ef4444",
  color: "white",
  border: "none",
  padding: "9px 14px",
  borderRadius: "6px",
  cursor: "pointer"
}

const botonVerde = {
  background: "#22c55e",
  color: "white",
  border: "none",
  padding: "9px 14px",
  borderRadius: "6px",
  cursor: "pointer"
}