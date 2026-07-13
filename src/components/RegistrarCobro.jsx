import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "../firebase"
import { observarCuentas } from "../services/cuentas"
import { registrarCobro } from "../services/cobros"

const pesos = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })

export default function RegistrarCobro() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [evento, setEvento] = useState(null)
  const [cuentas, setCuentas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({ cuentaId: "", descripcion: "", concepto: "Cobro de evento", fecha: new Date().toISOString().split("T")[0], porcentaje: "", monto: "" })

  useEffect(() => {
    getDoc(doc(db, "eventos", id)).then((snapshot) => {
      setEvento(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null)
      setCargando(false)
    }).catch(() => { setError("No se pudo cargar el evento."); setCargando(false) })
    return observarCuentas(
      (data) => setCuentas(data.filter((cuenta) => cuenta.activa !== false)),
      () => setError("No se pudieron cargar las cuentas disponibles.")
    )
  }, [id])

  const saldo = Number(evento?.saldo ?? (Number(evento?.total || 0) - Number(evento?.totalCobrado ?? evento?.sena ?? 0)))
  const monto = Number(form.monto || 0)

  function cambiarPorcentaje(porcentaje) {
    const montoCalculado = porcentaje
      ? (Number(evento.total || 0) * Number(porcentaje)) / 100
      : ""
    setForm({ ...form, porcentaje, monto: montoCalculado === "" ? "" : String(Math.round(montoCalculado)) })
  }

  async function cobrar(e) {
    e.preventDefault()
    setError("")
    if (!form.cuentaId) return setError("Seleccioná la cuenta que recibirá el dinero.")
    if (!Number.isFinite(monto) || monto <= 0) return setError("Ingresá un monto mayor que cero.")
    if (monto > saldo) return setError("El cobro no puede superar el saldo pendiente.")
    if (!auth.currentUser) return setError("La sesión no está disponible.")

    setGuardando(true)
    try {
      await registrarCobro({ eventoId: id, ...form, monto, userId: auth.currentUser.uid })
      navigate(`/evento/${id}`)
    } catch (saveError) {
      console.error(saveError)
      const mensajes = { "monto-supera-saldo": "El cobro supera el saldo pendiente.", "cuenta-no-disponible": "La cuenta seleccionada ya no está disponible.", "evento-no-disponible": "El evento ya no está disponible." }
      setError(mensajes[saveError.message] || "No se pudo registrar el cobro.")
    } finally { setGuardando(false) }
  }

  if (cargando) return <div style={mensaje}>Cargando evento...</div>
  if (!evento) return <div style={mensaje}>Evento no encontrado.</div>

  return (
    <div style={pagina}>
      <button onClick={() => navigate(`/evento/${id}`)} style={volver}>← Volver al evento</button>
      <header style={cabecera}><div><span style={sobreTitulo}>COBRO DE EVENTO</span><h1 style={{ margin: "3px 0 4px" }}>{evento.cliente || evento.title}</h1><span style={{ color: "#e9dcf6" }}>Evento #{id}</span></div></header>

      <section style={resumen}>
        <Dato label="Total del evento" valor={pesos.format(Number(evento.total || 0))} />
        <Dato label="Cobrado" valor={pesos.format(Number(evento.totalCobrado ?? evento.sena ?? 0))} />
        <Dato label="Saldo pendiente" valor={pesos.format(saldo)} destacado />
      </section>

      <form onSubmit={cobrar} style={tarjeta}>
        <div style={tituloSeccion}><div><h2 style={{ margin: 0 }}>Registrar pago</h2><p style={{ margin: "4px 0 0", color: "#776d83" }}>El saldo de la cuenta elegida se actualizará automáticamente.</p></div></div>
        <div style={grilla}>
          <Campo label="Cuenta que recibe el cobro"><select value={form.cuentaId} onChange={(e) => setForm({ ...form, cuentaId: e.target.value })} required><option value="">Seleccionar cuenta</option>{cuentas.map((cuenta) => <option key={cuenta.id} value={cuenta.id}>{cuenta.nombre}</option>)}</select></Campo>
          <Campo label="Porcentaje"><select value={form.porcentaje} onChange={(e) => cambiarPorcentaje(e.target.value)}><option value="">Seleccionar %</option><option value="25">25%</option><option value="50">50%</option><option value="75">75%</option><option value="100">100%</option></select></Campo>
          <Campo label="Monto"><input type="number" min="1" max={saldo} step="1" value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} placeholder="$ 0" required /></Campo>
          <Campo label="Fecha"><input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} required /></Campo>
          <Campo label="Concepto"><input value={form.concepto} onChange={(e) => setForm({ ...form, concepto: e.target.value })} /></Campo>
          <Campo label="Descripción"><input value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Detalle opcional" /></Campo>
        </div>
        {monto > 0 && monto <= saldo && <div style={preview}>Luego del cobro quedarán pendientes <strong>{pesos.format(saldo - monto)}</strong>.</div>}
        {error && <div role="alert" style={errorBox}>{error}</div>}
        <div style={acciones}><button type="button" onClick={() => navigate(`/evento/${id}`)} style={cancelar}>Cancelar</button><button disabled={guardando || saldo <= 0} style={cobrarBtn}>{guardando ? "Registrando..." : "Confirmar cobro"}</button></div>
      </form>
    </div>
  )
}

function Dato({ label, valor, destacado }) { return <div style={{ ...dato, ...(destacado ? datoDestacado : {}) }}><span style={datoLabel}>{label}</span><strong style={{ fontSize: 23 }}>{valor}</strong></div> }
function Campo({ label, children }) { return <label><span style={labelStyle}>{label}</span>{children}</label> }

const pagina = { maxWidth: 1050, margin: "0 auto" }
const volver = { marginBottom: 12, padding: 0, border: 0, background: "transparent", color: "#4e2581", fontWeight: 700, cursor: "pointer", boxShadow: "none" }
const cabecera = { padding: "23px 26px", borderRadius: 18, color: "white", background: "linear-gradient(100deg,#4e2581,#63349a)", boxShadow: "0 14px 30px rgba(78,37,129,.16)" }
const sobreTitulo = { color: "#bfe8ff", fontSize: 12, fontWeight: 700, letterSpacing: ".12em" }
const resumen = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14, margin: "18px 0" }
const dato = { display: "flex", flexDirection: "column", gap: 6, padding: 17, borderRadius: 14, background: "white", border: "1px solid #e8e1ee", color: "#4e2581" }
const datoDestacado = { background: "#fffbea", borderColor: "#f4d00c", color: "#5c4e00" }
const datoLabel = { color: "#776d83", fontSize: 13, fontWeight: 600 }
const tarjeta = { padding: 25, borderRadius: 17, background: "white", border: "1px solid #e8e1ee", boxShadow: "0 12px 30px rgba(78,37,129,.07)" }
const tituloSeccion = { marginBottom: 22, paddingBottom: 17, borderBottom: "1px solid #eee7f4" }
const grilla = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 20 }
const labelStyle = { display: "block", marginBottom: 8, color: "#4b4058", fontSize: 14, fontWeight: 600 }
const preview = { marginTop: 20, padding: 13, borderRadius: 10, color: "#4e2581", background: "#eee7f7" }
const errorBox = { marginTop: 18, padding: 12, borderRadius: 10, background: "#fff1f2", color: "#be123c" }
const acciones = { display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }
const cancelar = { padding: "11px 18px", border: 0, borderRadius: 10, color: "#665b71", background: "#eee9f1", cursor: "pointer" }
const cobrarBtn = { padding: "11px 20px", border: 0, borderRadius: 10, color: "white", background: "#4e2581", fontWeight: 700, cursor: "pointer" }
const mensaje = { padding: 35, textAlign: "center", color: "#776d83" }
