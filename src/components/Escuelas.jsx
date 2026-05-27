import { useState } from "react"

export default function Escuelas() {

  const [nombre, setNombre] =
    useState("")

  const [escuelas, setEscuelas] =
    useState(
      JSON.parse(
        localStorage.getItem("escuelas")
      ) || []
    )

  function agregarEscuela(e) {

    e.preventDefault()

    if (!nombre.trim()) return

    const nueva = {
      id: Date.now(),
      nombre
    }

    const actualizadas = [
      ...escuelas,
      nueva
    ]

    setEscuelas(actualizadas)

    localStorage.setItem(
      "escuelas",
      JSON.stringify(actualizadas)
    )

    setNombre("")
  }

  function eliminar(id) {

    const filtradas =
      escuelas.filter(
        e => e.id !== id
      )

    setEscuelas(filtradas)

    localStorage.setItem(
      "escuelas",
      JSON.stringify(filtradas)
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
        Escuelas
      </h1>

      <form
        onSubmit={agregarEscuela}
        style={{
          background: "white",
          padding: "25px",
          borderRadius: "12px",
          marginBottom: "25px"
        }}
      >

        <input
          value={nombre}
          onChange={(e) =>
            setNombre(e.target.value)
          }
          placeholder="Nombre de la escuela"
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "8px",
            border:
              "1px solid #d1d5db",
            marginBottom: "15px",
            boxSizing:
              "border-box"
          }}
        />

        <button
          type="submit"
          style={{
            background: "#2563eb",
            color: "white",
            border: "none",
            padding: "12px 22px",
            borderRadius: "8px",
            cursor: "pointer"
          }}
        >
          Agregar escuela
        </button>

      </form>

      <div
        style={{
          background: "white",
          borderRadius: "12px",
          overflow: "hidden"
        }}
      >

        {escuelas.map((escuela) => (

          <div
            key={escuela.id}
            style={{
              padding: "18px",
              borderBottom:
                "1px solid #e5e7eb",
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center"
            }}
          >

            <div>
              {escuela.nombre}
            </div>

            <button
              onClick={() =>
                eliminar(escuela.id)
              }
              style={{
                background: "#dc2626",
                color: "white",
                border: "none",
                padding: "8px 14px",
                borderRadius: "8px",
                cursor: "pointer"
              }}
            >
              Eliminar
            </button>

          </div>

        ))}

      </div>

    </div>
  )
}