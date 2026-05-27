import { useEffect, useState } from "react"

export default function NuevoMovimiento() {

  const [categoria, setCategoria] =
    useState("")

  const [tipo, setTipo] =
    useState("")

  const [tiposMovimientos, setTiposMovimientos] =
    useState([])

  useEffect(() => {

    const guardados =
      JSON.parse(
        localStorage.getItem("tiposMovimientos")
      ) || []

    const activos =
      guardados.filter(
        (tipo) => tipo.activo !== false
      )

    setTiposMovimientos(activos)

  }, [])

  const categorias =
    [
      ...new Set(
        tiposMovimientos.map(
          (tipo) => tipo.categoria
        )
      )
    ].filter(Boolean)

  const tiposFiltrados =
    categoria
      ? tiposMovimientos.filter(
          (tipo) =>
            tipo.categoria === categoria
        )
      : tiposMovimientos

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
          fontWeight: "600",
          fontSize: "18px"
        }}
      >
        Agregar movimiento
      </div>

      <div
        style={{
          background: "white",
          padding: "25px",
          borderRadius: "0 0 10px 10px",
          border: "1px solid #e5e7eb"
        }}
      >

        {/* CATEGORIA */}
        <div
          style={{
            marginBottom: "20px"
          }}
        >

          <label style={label}>
            Categoría
          </label>

          <select
            value={categoria}
            onChange={(e) => {
              setCategoria(e.target.value)
              setTipo("")
            }}
            style={input}
          >

            <option value="">
              Seleccione la categoría
            </option>

            {categorias.map((cat) => (

              <option
                key={cat}
                value={cat}
              >
                {cat}
              </option>

            ))}

          </select>

        </div>

        {/* TIPO */}
        <div>

          <label style={label}>
            Tipo de movimiento
          </label>

          <select
            value={tipo}
            onChange={(e) =>
              setTipo(
                e.target.value
              )
            }
            style={input}
          >

            <option value="">
              Seleccione el tipo
            </option>

            {tiposFiltrados.map((item) => (

              <option
                key={item.id}
                value={item.nombre}
              >
                {item.nombre}
              </option>

            ))}

          </select>

        </div>

      </div>

    </div>
  )
}

const label = {
  display: "block",
  marginBottom: "8px",
  fontWeight: "600",
  color: "#374151"
}

const input = {
  width: "100%",
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
  fontSize: "15px",
  boxSizing: "border-box"
}