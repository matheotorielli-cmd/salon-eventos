import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { auth } from "../firebase"
import { crearCuenta } from "../services/cuentas"

export default function NuevaCuenta() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    saldoInicial: ""
  })
  const [error, setError] = useState("")
  const [guardando, setGuardando] = useState(false)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function guardarCuenta(e) {
    e.preventDefault()
    setError("")

    const nombre = form.nombre.trim()
    const saldoInicial = Number(form.saldoInicial || 0)

    if (!nombre) {
      setError("Ingresá un nombre para la cuenta.")
      return
    }

    if (!Number.isFinite(saldoInicial) || saldoInicial < 0) {
      setError("El saldo inicial debe ser un número mayor o igual a cero.")
      return
    }

    if (!auth.currentUser) {
      setError("La sesión no está disponible. Volvé a iniciar sesión.")
      return
    }

    setGuardando(true)

    try {
      await crearCuenta({
        nombre,
        descripcion: form.descripcion,
        saldoInicial,
        userId: auth.currentUser.uid
      })
      navigate("/cuentas")
    } catch (saveError) {
      console.error(saveError)
      setError("No se pudo guardar la cuenta. Intentá nuevamente.")
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", background: "white", padding: "30px", borderRadius: "12px" }}>
      <h1 style={{ color: "#4e2581", marginBottom: "25px" }}>Nueva cuenta</h1>

      <form onSubmit={guardarCuenta}>
        <div style={grupo}>
          <label htmlFor="nombre">Nombre</label>
          <input
            id="nombre"
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            placeholder="Ej.: Efectivo o Banco"
            autoFocus
          />
        </div>

        <div style={grupo}>
          <label htmlFor="descripcion">Descripción</label>
          <input
            id="descripcion"
            name="descripcion"
            value={form.descripcion}
            onChange={handleChange}
            placeholder="Descripción opcional"
          />
        </div>

        <div style={grupo}>
          <label>Moneda</label>
          <input value="Pesos argentinos (ARS)" disabled />
        </div>

        <div style={grupo}>
          <label htmlFor="saldoInicial">Saldo inicial</label>
          <input
            id="saldoInicial"
            type="number"
            min="0"
            step="1"
            name="saldoInicial"
            value={form.saldoInicial}
            onChange={handleChange}
            placeholder="0"
          />
        </div>

        {error && <p role="alert" style={errorStyle}>{error}</p>}

        <div style={{ display: "flex", gap: "12px" }}>
          <button type="button" onClick={() => navigate("/cuentas")} style={botonSecundario} disabled={guardando}>
            Cancelar
          </button>
          <button type="submit" style={botonPrimario} disabled={guardando}>
            {guardando ? "Guardando..." : "Guardar cuenta"}
          </button>
        </div>
      </form>
    </div>
  )
}

const grupo = { marginBottom: "20px", display: "flex", flexDirection: "column", gap: "8px" }
const errorStyle = { color: "#b91c1c", background: "#fef2f2", border: "1px solid #fecaca", padding: "12px", borderRadius: "8px" }
const botonPrimario = { background: "#4e2581", color: "white", border: "none", padding: "14px 22px", borderRadius: "10px", cursor: "pointer", fontWeight: "700" }
const botonSecundario = { background: "#e5e7eb", color: "#374151", border: "none", padding: "14px 22px", borderRadius: "8px", cursor: "pointer" }
