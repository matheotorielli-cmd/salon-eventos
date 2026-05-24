import { useEffect, useState } from "react"

export default function TiposEventos() {

  const [tipos, setTipos] = useState([])

  const [nuevoNombre, setNuevoNombre] =
    useState("")

  const [nuevoPrecio, setNuevoPrecio] =
    useState("")

  useEffect(() => {

    try {

      const guardados = JSON.parse(
        localStorage.getItem("tiposEventos")
      )

      if (
        guardados &&
        Array.isArray(guardados)
      ) {

        setTipos(guardados)

      } else {

        const iniciales = [

          {
            nombre: "Cumpleaños",
            precio: 300000
          },

          {
            nombre: "Casamiento",
            precio: 1200000
          },

          {
            nombre: "15 años",
            precio: 900000
          }

        ]

        setTipos(iniciales)

        localStorage.setItem(
          "tiposEventos",
          JSON.stringify(iniciales)
        )

      }

    } catch {

      localStorage.removeItem(
        "tiposEventos"
      )

    }

  }, [])

  function guardar(lista) {

    setTipos(lista)

    localStorage.setItem(
      "tiposEventos",
      JSON.stringify(lista)
    )

  }

  function agregarTipo() {

    if (!nuevoNombre.trim()) return

    const nuevos = [

      ...tipos,

      {
        nombre: nuevoNombre,
        precio: Number(nuevoPrecio || 0)
      }

    ]

    guardar(nuevos)

    setNuevoNombre("")
    setNuevoPrecio("")
  }

  function editarNombre(index, valor) {

    const copia = [...tipos]

    copia[index].nombre = valor

    guardar(copia)
  }

  function editarPrecio(index, valor) {

    const copia = [...tipos]

    copia[index].precio =
      Number(valor || 0)

    guardar(copia)
  }

  function eliminar(index) {

    const nuevos =
      tipos.filter((_, i) => i !== index)

    guardar(nuevos)
  }

  return (

    <div
      style={{
        maxWidth: "1000px",
        margin: "0 auto"
      }}
    >

      <h1
        style={{
          color: "#1e3a8a",
          marginBottom: "25px"
        }}
      >
        Tipos de eventos
      </h1>

      {/* NUEVO */}
      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "25px",
          display: "grid",
          gridTemplateColumns:
            "2fr 1fr auto",
          gap: "15px"
        }}
      >

        <input
          placeholder="Nombre"
          value={nuevoNombre}
          onChange={(e) =>
            setNuevoNombre(
              e.target.value
            )
          }
          style={input}
        />

        <input
          type="number"
          placeholder="Precio"
          value={nuevoPrecio}
          onChange={(e) =>
            setNuevoPrecio(
              e.target.value
            )
          }
          style={input}
        />

        <button
          onClick={agregarTipo}
          style={botonAzul}
        >
          Agregar
        </button>

      </div>

      {/* LISTA */}
      <div
        style={{
          background: "white",
          borderRadius: "12px",
          overflow: "hidden"
        }}
      >

        {tipos.map((tipo, index) => (

          <div
            key={index}
            style={{
              display: "grid",
              gridTemplateColumns:
                "2fr 1fr auto",
              gap: "15px",
              padding: "15px",
              borderBottom:
                "1px solid #eee"
            }}
          >

            <input
              value={tipo.nombre}
              onChange={(e) =>
                editarNombre(
                  index,
                  e.target.value
                )
              }
              style={input}
            />

            <input
              type="number"
              value={tipo.precio}
              onChange={(e) =>
                editarPrecio(
                  index,
                  e.target.value
                )
              }
              style={input}
            />

            <button
              onClick={() =>
                eliminar(index)
              }
              style={botonRojo}
            >
              Eliminar
            </button>

          </div>

        ))}

      </div>

    </div>
  )
}

const input = {
  width: "100%",
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
  boxSizing: "border-box"
}

const botonAzul = {
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "8px",
  padding: "12px 18px",
  cursor: "pointer"
}

const botonRojo = {
  background: "#dc2626",
  color: "white",
  border: "none",
  borderRadius: "8px",
  padding: "12px 18px",
  cursor: "pointer"
}