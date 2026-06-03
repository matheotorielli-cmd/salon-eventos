import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

export default function NuevoMovimiento() {

  const navigate = useNavigate()

  const [categoria, setCategoria] =
    useState("")

  const [tipo, setTipo] =
    useState("")

  const [tiposMovimientos, setTiposMovimientos] =
    useState([])

  const [cuentas, setCuentas] =
    useState([])

  const [form, setForm] =
    useState({
      cuenta: "",
      descripcion: "",
      concepto: "",
      monto: "",
      fecha:
        new Date()
          .toISOString()
          .split("T")[0]
    })

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

    const cuentasGuardadas =
      JSON.parse(
        localStorage.getItem("cuentas")
      ) || []

    setCuentas(cuentasGuardadas)

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

  function handleChange(e) {

    setForm({
      ...form,
      [e.target.name]: e.target.value
    })

  }

  function guardarMovimiento(e) {

    e.preventDefault()

    if (!categoria) {
      alert("Seleccioná una categoría")
      return
    }

    if (!tipo) {
      alert("Seleccioná un tipo de movimiento")
      return
    }

    if (!form.cuenta) {
      alert("Seleccioná una cuenta")
      return
    }

    if (!form.monto) {
      alert("Ingresá un monto")
      return
    }

    const movimientos =
      JSON.parse(
        localStorage.getItem("movimientos")
      ) || []

    const nuevoMovimiento = {
      id: Date.now(),
      categoria,
      tipo,
      cuenta: form.cuenta,
      descripcion: form.descripcion,
      concepto: form.concepto,
      monto: Number(form.monto),
      fecha: form.fecha
    }

    movimientos.push(nuevoMovimiento)

    localStorage.setItem(
      "movimientos",
      JSON.stringify(movimientos)
    )

    navigate("/movimientos")
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
          fontWeight: "600",
          fontSize: "18px"
        }}
      >
        Agregar movimiento
      </div>

      <form onSubmit={guardarMovimiento}>

        <div
          style={{
            background: "white",
            padding: "25px",
            borderRadius: "0 0 10px 10px",
            border: "1px solid #e5e7eb"
          }}
        >

          <div style={{ marginBottom: "20px" }}>

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

          <div style={{ marginBottom: "30px" }}>

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

          {categoria && tipo && (

            <div>

              <div
                style={{
                  background: "#f3f4f6",
                  padding: "14px 18px",
                  borderRadius: "10px",
                  marginBottom: "20px",
                  fontWeight: "600",
                  color: "#1f2937"
                }}
              >
                Registrar {tipo}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit,minmax(250px,1fr))",
                  gap: "20px"
                }}
              >

                <div>

                  {tipo === "Transferencia" ? (

  <>

    <div>

      <label style={label}>
        Cuenta de origen
      </label>

      <select
        name="cuentaOrigen"
        value={form.cuentaOrigen || ""}
        onChange={handleChange}
        style={input}
      >

        <option value="">
          Seleccione la cuenta
        </option>

        {cuentas.map((cuenta) => (

          <option
            key={cuenta.id}
            value={cuenta.nombre}
          >
            {cuenta.nombre}
          </option>

        ))}

      </select>

    </div>

    <div>

      <label style={label}>
        Cuenta destino
      </label>

      <select
        name="cuentaDestino"
        value={form.cuentaDestino || ""}
        onChange={handleChange}
        style={input}
      >

        <option value="">
          Seleccione la cuenta
        </option>

        {cuentas.map((cuenta) => (

          <option
            key={cuenta.id}
            value={cuenta.nombre}
          >
            {cuenta.nombre}
          </option>

        ))}

      </select>

    </div>

  </>

) : (

  <div>

    <label style={label}>
      Cuenta
    </label>

    <select
      name="cuenta"
      value={form.cuenta}
      onChange={handleChange}
      style={input}
    >

      <option value="">
        Seleccione la cuenta
      </option>

      {cuentas.map((cuenta) => (

        <option
          key={cuenta.id}
          value={cuenta.nombre}
        >
          {cuenta.nombre}
        </option>

      ))}

    </select>

  </div>

)}

                </div>

                <div>

                  <label style={label}>
                    Descripción
                  </label>

                  <input
                    name="descripcion"
                    value={form.descripcion}
                    onChange={handleChange}
                    placeholder="Ingrese la descripción del movimiento"
                    style={input}
                  />

                </div>

                <div>

                  <label style={label}>
                    Concepto
                  </label>

                  <input
                    name="concepto"
                    value={form.concepto}
                    onChange={handleChange}
                    placeholder="Ingrese el concepto del movimiento"
                    style={input}
                  />

                </div>

                <div>

                  <label style={label}>
                    Monto
                  </label>

                  <input
                    type="number"
                    name="monto"
                    value={form.monto}
                    onChange={handleChange}
                    placeholder="Ingrese el monto"
                    style={input}
                  />

                </div>

                <div>

                  <label style={label}>
                    Fecha
                  </label>

                  <input
                    type="date"
                    name="fecha"
                    value={form.fecha}
                    onChange={handleChange}
                    style={input}
                  />

                </div>

              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: "30px"
                }}
              >

                <button
                  type="submit"
                  style={{
                    background: "#2563eb",
                    color: "white",
                    border: "none",
                    padding: "12px 22px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "15px"
                  }}
                >
                  Agregar movimiento
                </button>

              </div>

            </div>

          )}

        </div>

      </form>

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