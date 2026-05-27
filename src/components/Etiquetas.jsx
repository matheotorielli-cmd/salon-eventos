import { useEffect, useState } from "react"

export default function Etiquetas() {

  const [escuela, setEscuela] =
    useState("")

  const [escuelas, setEscuelas] =
    useState([])

  useEffect(() => {

    const guardadas =
      JSON.parse(
        localStorage.getItem("escuelas")
      ) || []

    setEscuelas(guardadas)

  }, [])

  function agregarEscuela() {

    if (!escuela.trim()) return

    const nueva = {
      id: Date.now(),
      nombre: escuela
    }

    const nuevas =
      [...escuelas, nueva]

    setEscuelas(nuevas)

    localStorage.setItem(
      "escuelas",
      JSON.stringify(nuevas)
    )

    setEscuela("")
  }

  function eliminarEscuela(id) {

    const nuevas =
      escuelas.filter(
        e => e.id !== id
      )

    setEscuelas(nuevas)

    localStorage.setItem(
      "escuelas",
      JSON.stringify(nuevas)
    )
  }

  return (

    <div
      style={{
        maxWidth: "900px",
        margin: "0 auto"
      }}
    >

      <h1
        style={{
          marginBottom: "25px",
          color: "#1e3a8a"
        }}
      >
        Etiquetas
      </h1>

      {/* AGREGAR */}
      <div
        style={{
          background: "white",
          padding: "25px",
          borderRadius: "12px",
          marginBottom: "25px"
        }}
      >

        <h3>
          Escuelas
        </h3>

        <div
          style={{
            display: "flex",
            gap: "10px",
            marginTop: "15px"
          }}
        >

          <input
            type="text"
            placeholder="Nombre de la escuela"
            value={escuela}
            onChange={(e) =>
              setEscuela(
                e.target.value
              )
            }
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "8px",
              border:
                "1px solid #d1d5db"
            }}
          />

          <button
            onClick={agregarEscuela}
            style={{
              background: "#2563eb",
              color: "white",
              border: "none",
              padding: "12px 20px",
              borderRadius: "8px",
              cursor: "pointer"
            }}
          >
            Agregar
          </button>

        </div>

      </div>

      {/* LISTA */}
      <div
        style={{
          background: "white",
          borderRadius: "12px",
          overflow: "hidden"
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
                Escuela
              </th>

              <th style={th}>
              </th>

            </tr>

          </thead>

          <tbody>

            {escuelas.map(
              (escuela) => (

                <tr
                  key={escuela.id}
                >

                  <td style={td}>
                    {
                      escuela.nombre
                    }
                  </td>

                  <td style={td}>

                    <button
                      onClick={() =>
                        eliminarEscuela(
                          escuela.id
                        )
                      }
                      style={{
                        background:
                          "#dc2626",
                        color: "white",
                        border: "none",
                        width: "34px",
                        height: "34px",
                        borderRadius:
                          "8px",
                        cursor:
                          "pointer"
                      }}
                    >
                      ✕
                    </button>

                  </td>

                </tr>

              )
            )}

          </tbody>

        </table>

      </div>

    </div>
  )
}

const th = {
  textAlign: "left",
  padding: "14px",
  borderBottom:
    "1px solid #e5e7eb"
}

const td = {
  padding: "14px",
  borderBottom:
    "1px solid #f3f4f6"
}