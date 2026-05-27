import { useState } from "react"
import { useNavigate } from "react-router-dom"

export default function NuevaCuenta() {

  const navigate = useNavigate()

  const [form, setForm] =
    useState({
      nombre: "",
      descripcion: "",
      divisa: "Peso",
      monto: ""
    })

  function handleChange(e) {

    setForm({
      ...form,
      [e.target.name]:
        e.target.value
    })

  }

  function guardarCuenta(e) {

    e.preventDefault()

    const cuentas =
      JSON.parse(
        localStorage.getItem("cuentas")
      ) || []

    cuentas.push({
      id: Date.now(),
      ...form,
      activa: true
    })

    localStorage.setItem(
      "cuentas",
      JSON.stringify(cuentas)
    )

    navigate("/cuentas")
  }

  return (

    <div
      style={{
        maxWidth: "700px",
        margin: "0 auto",
        background: "white",
        padding: "30px",
        borderRadius: "12px"
      }}
    >

      <h1
        style={{
          color: "#2563eb",
          marginBottom: "25px"
        }}
      >
        Nueva cuenta
      </h1>

      <form onSubmit={guardarCuenta}>

        <div style={grupo}>
          <label>Nombre</label>

          <input
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            style={input}
          />
        </div>

        <div style={grupo}>
          <label>Descripción</label>

          <input
            name="descripcion"
            value={form.descripcion}
            onChange={handleChange}
            style={input}
          />
        </div>

        <div style={grupo}>
          <label>Divisa</label>

          <select
            name="divisa"
            value={form.divisa}
            onChange={handleChange}
            style={input}
          >
            <option>
              Peso
            </option>

            <option>
              Dólar
            </option>
          </select>
        </div>

        <div style={grupo}>
          <label>Monto inicial</label>

          <input
            type="number"
            name="monto"
            value={form.monto}
            onChange={handleChange}
            style={input}
          />
        </div>

        <button
          type="submit"
          style={{
            background: "#2563eb",
            color: "white",
            border: "none",
            padding: "14px 22px",
            borderRadius: "8px",
            cursor: "pointer"
          }}
        >
          Guardar cuenta
        </button>

      </form>

    </div>
  )
}

const grupo = {
  marginBottom: "20px",
  display: "flex",
  flexDirection: "column",
  gap: "8px"
}

const input = {
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid #d1d5db"
}