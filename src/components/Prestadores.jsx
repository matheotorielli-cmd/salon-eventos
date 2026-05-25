import { useEffect, useState } from "react"

export default function Prestadores() {

  const [prestadores, setPrestadores] = useState([])

  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    telefono: ""
  })

  useEffect(() => {

    const guardados =
      JSON.parse(localStorage.getItem("prestadores")) || []

    setPrestadores(guardados)

  }, [])

  function handleChange(e) {

    setForm({
      ...form,
      [e.target.name]: e.target.value
    })

  }

  function guardarPrestador(e) {

    e.preventDefault()

    if (!form.nombre.trim()) return
    if (!form.apellido.trim()) return

    const nuevoPrestador = {
      id: Date.now(),
      ...form
    }

    const nuevosPrestadores = [
      ...prestadores,
      nuevoPrestador
    ]

    setPrestadores(nuevosPrestadores)

    localStorage.setItem(
      "prestadores",
      JSON.stringify(nuevosPrestadores)
    )

    setForm({
      nombre: "",
      apellido: "",
      telefono: ""
    })

  }

  function eliminarPrestador(id) {

    const confirmar = confirm(
      "¿Eliminar prestador?"
    )

    if (!confirmar) return

    const filtrados = prestadores.filter(
      p => p.id !== id
    )

    setPrestadores(filtrados)

    localStorage.setItem(
      "prestadores",
      JSON.stringify(filtrados)
    )

  }

  return (

    <div
      style={{
        maxWidth: "1100px",
        margin: "0 auto"
      }}
    >

      <h1
        style={{
          color: "#1e3a8a",
          marginBottom: "25px"
        }}
      >
        Prestadores
      </h1>

      {/* FORMULARIO */}
      <form
        onSubmit={guardarPrestador}
        style={{
          background: "white",
          padding: "25px",
          borderRadius: "12px",
          marginBottom: "25px",
          border: "1px solid #e5e7eb"
        }}
      >

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(220px,1fr))",
            gap: "15px"
          }}
        >

          <Input
            label="Nombre"
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
          />

          <Input
            label="Apellido"
            name="apellido"
            value={form.apellido}
            onChange={handleChange}
          />

          <Input
            label="Teléfono"
            name="telefono"
            value={form.telefono}
            onChange={handleChange}
          />

        </div>

        <button
          type="submit"
          style={{
            marginTop: "20px",
            background: "#2563eb",
            color: "white",
            border: "none",
            padding: "12px 20px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600"
          }}
        >
          Agregar prestador
        </button>

      </form>

      {/* LISTA */}
      <div
        style={{
          display: "grid",
          gap: "15px"
        }}
      >

        {prestadores.length === 0 && (
          <div
            style={{
              background: "white",
              padding: "25px",
              borderRadius: "12px",
              textAlign: "center",
              color: "#6b7280"
            }}
          >
            No hay prestadores cargados
          </div>
        )}

        {prestadores.map((p) => (

          <div
            key={p.id}
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "15px"
            }}
          >

            <div>

              <div
                style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  color: "#111827"
                }}
              >
                {p.nombre} {p.apellido}
              </div>

              <div
                style={{
                  marginTop: "6px",
                  color: "#6b7280"
                }}
              >
                📞 {p.telefono || "Sin teléfono"}
              </div>

            </div>

            <button
              onClick={() => eliminarPrestador(p.id)}
              style={{
                background: "#dc2626",
                color: "white",
                border: "none",
                padding: "10px 16px",
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

function Input({
  label,
  ...props
}) {

  return (

    <div>

      <label
        style={{
          display: "block",
          marginBottom: "8px",
          fontWeight: "600",
          fontSize: "14px"
        }}
      >
        {label}
      </label>

      <input
        {...props}
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: "8px",
          border: "1px solid #d1d5db",
          boxSizing: "border-box"
        }}
      />

    </div>
  )
}