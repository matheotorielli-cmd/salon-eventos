import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

export default function NuevoTipoMovimiento() {

  const navigate = useNavigate()
  const { id } = useParams()
  const editando = Boolean(id)

  const [form, setForm] = useState(() => {
    if (!editando) return { nombre: "", descripcion: "", categoria: "", deshabilitado: false }

    const guardados = JSON.parse(localStorage.getItem("tiposMovimientos")) || []
    const tipo = guardados.find((item) => String(item.id) === String(id))

    return tipo
      ? { nombre: tipo.nombre || "", descripcion: tipo.descripcion || "", categoria: tipo.categoria || "", deshabilitado: tipo.activo === false }
      : { nombre: "", descripcion: "", categoria: "", deshabilitado: false }
  })

  function handleChange(e) {

    const {
      name,
      value,
      type,
      checked
    } = e.target

    setForm({
      ...form,
      [name]:
        type === "checkbox"
          ? checked
          : value
    })

  }

  function guardar() {

    if (!form.nombre.trim())
      return

    const guardados =
      JSON.parse(
        localStorage.getItem(
          "tiposMovimientos"
        )
      ) || []

    const datos = {
      ...form,
      activo: !form.deshabilitado
    }

    const nuevos = editando
      ? guardados.map((tipo) => String(tipo.id) === String(id) ? { ...tipo, ...datos } : tipo)
      : [...guardados, { id: Date.now(), ...datos }]

    localStorage.setItem(
      "tiposMovimientos",
      JSON.stringify(nuevos)
    )

    navigate(
      "/tipos-movimientos"
    )

  }

  return (

    <div
      style={{
        maxWidth: "1300px",
        margin: "0 auto"
      }}
    >

      {/* CABECERA */}
      <div
        style={{
          background: "#4e2581",
          color: "white",
          padding: "16px 20px",
          borderRadius:
            "10px 10px 0 0"
        }}
      >

        <h2
          style={{
            margin: 0
          }}
        >
          {editando ? "Editar tipo de movimiento" : "Nuevo tipo de movimiento"}
        </h2>

      </div>

      {/* FORM */}
      <div
        style={{
          background: "white",
          padding: "20px",
          border:
            "1px solid #e5e7eb",
          borderTop: "none",
          display: "grid",
          gridTemplateColumns:
            "2fr 2fr 2fr auto",
          gap: "15px",
          alignItems: "center"
        }}
      >

        <div>

          <label style={label}>
            Nombre
          </label>

          <input
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            placeholder="Ingrese el nombre"
            style={input}
          />

        </div>

        <div>

          <label style={label}>
            Descripción
          </label>

          <input
            name="descripcion"
            value={form.descripcion}
            onChange={handleChange}
            placeholder="Puede agregar una descripción"
            style={input}
          />

        </div>

        <div>

          <label style={label}>
            Categoría de movimiento
          </label>

          <select
            name="categoria"
            value={form.categoria}
            onChange={handleChange}
            style={input}
          >

            <option value="">
              Seleccione la categoría
            </option>

            <option>
              Ingreso
            </option>

            <option>
              Egreso
            </option>

            <option>
              Transferencia
            </option>

            <option>
              Arqueo
            </option>

          </select>

        </div>

        <div
          style={{
            marginTop: "28px"
          }}
        >

          <label
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center"
            }}
          >

            <input
              type="checkbox"
              name="deshabilitado"
              checked={
                form.deshabilitado
              }
              onChange={handleChange}
            />

            Deshabilitarlo

          </label>

        </div>

      </div>

      {/* BOTON */}
      <div
        style={{
          background: "white",
          border:
            "1px solid #e5e7eb",
          borderTop: "none",
          padding: "20px",
          display: "flex",
          justifyContent: "flex-end",
          borderRadius:
            "0 0 10px 10px"
        }}
      >

        <button
          onClick={guardar}
          style={{
            background: "#4e2581",
            color: "white",
            border: "none",
            padding: "12px 24px",
            borderRadius: "6px",
            cursor: "pointer"
          }}
        >
          {editando ? "Guardar cambios" : "Crear"}
        </button>

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
  borderRadius: "6px",
  border: "1px solid #d1d5db",
  boxSizing: "border-box"
}
