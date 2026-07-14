import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { auth } from "../firebase"
import { observarCuentas } from "../services/cuentas"
import { registrarMovimiento } from "../services/movimientos"
import { observarTiposMovimientos } from "../services/configuracion"
import { observarEventosBalance } from "../services/balance"

const categorias = [
  { id: "ingreso", label: "Ingreso" },
  { id: "egreso", label: "Egreso" },
  { id: "inversion", label: "Inversión" },
  { id: "transferencia", label: "Transferencia" }
]

export default function NuevoMovimiento() {
  const navigate = useNavigate()
  const [cuentas, setCuentas] = useState([])
  const [tipos, setTipos] = useState([])
  const [eventos, setEventos] = useState([])
  const [error, setError] = useState("")
  const [guardando, setGuardando] = useState(false)
  const [form, setForm] = useState({ categoria: "", tipo: "", cuentaId: "", cuentaOrigenId: "", cuentaDestinoId: "", eventoId: "", descripcion: "", concepto: "", monto: "", fecha: new Date().toISOString().split("T")[0] })

  useEffect(() => observarCuentas(
    (data) => setCuentas(data.filter((cuenta) => cuenta.activa !== false)),
    () => setError("No se pudieron cargar las cuentas.")
  ), [])
  useEffect(() => observarEventosBalance(setEventos, () => setError("No se pudieron cargar los eventos.")), [])

  useEffect(() => observarTiposMovimientos(
    (data) => setTipos(data.filter((item) => item.activo !== false)),
    () => setError("No se pudieron cargar los tipos de movimientos.")
  ), [])

  const tiposFiltrados = tipos.filter((item) => !form.categoria || String(item.categoria).toLowerCase() === form.categoria)
  const tiposDisponibles = form.categoria === "inversion" && tiposFiltrados.length === 0 ? [{ id: "inversion", nombre: "Inversión" }] : tiposFiltrados
  function cambiar(name, value) { setForm((actual) => ({ ...actual, [name]: value })) }

  async function guardar(e) {
    e.preventDefault()
    setError("")
    const monto = Number(form.monto)
    if (!form.categoria || !form.tipo) return setError("Seleccioná la categoría y el tipo de movimiento.")
    if (form.categoria === "transferencia" ? (!form.cuentaOrigenId || !form.cuentaDestinoId) : !form.cuentaId) return setError("Seleccioná la cuenta correspondiente.")
    if (!Number.isFinite(monto) || monto <= 0) return setError("El monto debe ser mayor que cero.")
    if (!auth.currentUser) return setError("La sesión no está disponible.")

    setGuardando(true)
    try {
      await registrarMovimiento({ ...form, monto, userId: auth.currentUser.uid })
      navigate("/movimientos")
    } catch (saveError) {
      console.error(saveError)
      const mensajes = {
        "saldo-insuficiente": "La cuenta de origen no tiene saldo suficiente.",
        "cuentas-iguales": "La cuenta de origen y destino deben ser diferentes.",
        "cuenta-no-disponible": "La cuenta seleccionada no está disponible.",
        "cuenta-destino-no-disponible": "La cuenta de destino no está disponible."
      }
      setError(mensajes[saveError.message] || "No se pudo registrar el movimiento.")
    } finally { setGuardando(false) }
  }

  return (
    <div style={pagina}>
      <div style={cabecera}><div><span style={sobreTitulo}>FINANZAS</span><h1 style={{ margin: "3px 0 0" }}>Nuevo movimiento</h1></div></div>
      <form onSubmit={guardar} style={tarjeta}>
        <div style={grillaCategorias}>
          {categorias.map((categoria) => <button key={categoria.id} type="button" onClick={() => setForm({ ...form, categoria: categoria.id, tipo: "" })} style={form.categoria === categoria.id ? categoriaActiva : categoriaBoton}>{categoria.label}</button>)}
        </div>

        <div style={grilla}>
          <Campo label="Tipo de movimiento"><select value={form.tipo} onChange={(e) => cambiar("tipo", e.target.value)} required><option value="">Seleccionar tipo</option>{tiposDisponibles.map((tipo) => <option key={tipo.id} value={tipo.nombre}>{tipo.nombre}</option>)}</select></Campo>
          {form.categoria === "transferencia" ? <>
            <CuentaSelect label="Cuenta de origen" name="cuentaOrigenId" value={form.cuentaOrigenId} cuentas={cuentas} cambiar={cambiar} />
            <CuentaSelect label="Cuenta de destino" name="cuentaDestinoId" value={form.cuentaDestinoId} cuentas={cuentas} cambiar={cambiar} />
          </> : <CuentaSelect label="Cuenta" name="cuentaId" value={form.cuentaId} cuentas={cuentas} cambiar={cambiar} />}
          {form.categoria === "egreso" && <Campo label="Vincular a evento (opcional)"><select value={form.eventoId} onChange={(e) => cambiar("eventoId", e.target.value)}><option value="">Sin vincular</option>{eventos.map((evento) => <option key={evento.id} value={evento.id}>{evento.nombreEvento || evento.nombre || evento.clienteNombre || evento.id} · {evento.tipoEventoNombre || evento.tipoEvento || "Evento"}</option>)}</select></Campo>}
          <Campo label="Monto"><input type="number" min="1" step="1" value={form.monto} onChange={(e) => cambiar("monto", e.target.value)} placeholder="$ 0" required /></Campo>
          <Campo label="Fecha"><input type="date" value={form.fecha} onChange={(e) => cambiar("fecha", e.target.value)} required /></Campo>
          <Campo label="Concepto"><input value={form.concepto} onChange={(e) => cambiar("concepto", e.target.value)} placeholder="Ej.: Pago de servicio" /></Campo>
          <Campo label="Descripción"><input value={form.descripcion} onChange={(e) => cambiar("descripcion", e.target.value)} placeholder="Detalle opcional" /></Campo>
        </div>

        {error && <div role="alert" style={errorBox}>{error}</div>}
        <div style={acciones}><button type="button" onClick={() => navigate("/movimientos")} style={cancelar}>Cancelar</button><button disabled={guardando} style={guardarBtn}>{guardando ? "Guardando..." : "Registrar movimiento"}</button></div>
      </form>
    </div>
  )
}

function Campo({ label, children }) { return <label style={campo}><span style={labelStyle}>{label}</span>{children}</label> }
function CuentaSelect({ label, name, value, cuentas, cambiar }) { return <Campo label={label}><select value={value} onChange={(e) => cambiar(name, e.target.value)} required><option value="">Seleccionar cuenta</option>{cuentas.map((cuenta) => <option key={cuenta.id} value={cuenta.id}>{cuenta.nombre}</option>)}</select></Campo> }

const pagina = { maxWidth: 1050, margin: "0 auto" }
const cabecera = { padding: "22px 25px", borderRadius: "18px 18px 0 0", color: "white", background: "linear-gradient(100deg,#4e2581,#63349a)", boxShadow: "0 12px 28px rgba(78,37,129,.15)" }
const sobreTitulo = { color: "#bfe8ff", fontSize: 12, fontWeight: 700, letterSpacing: ".12em" }
const tarjeta = { padding: 26, background: "white", border: "1px solid #e8e1ee", borderRadius: "0 0 18px 18px", boxShadow: "0 14px 35px rgba(78,37,129,.08)" }
const grillaCategorias = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 25 }
const categoriaBoton = { padding: 14, border: "1px solid #e8e1ee", borderRadius: 12, background: "#f7f5fb", color: "#665b71", fontWeight: 700, cursor: "pointer" }
const categoriaActiva = { ...categoriaBoton, color: "white", borderColor: "#4e2581", background: "#4e2581" }
const grilla = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 20 }
const campo = { display: "block" }
const labelStyle = { display: "block", marginBottom: 8, fontSize: 14, fontWeight: 600, color: "#4b4058" }
const errorBox = { marginTop: 20, padding: 12, borderRadius: 10, background: "#fff1f2", color: "#be123c" }
const acciones = { display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 26 }
const cancelar = { padding: "11px 18px", border: 0, borderRadius: 10, color: "#665b71", background: "#eee9f1", cursor: "pointer" }
const guardarBtn = { padding: "11px 20px", border: 0, borderRadius: 10, color: "white", background: "#4e2581", fontWeight: 700, cursor: "pointer" }
