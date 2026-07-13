import { useEffect, useRef, useState } from "react"
import { auth } from "../firebase"
import {
  actualizarConfiguracion,
  crearConfiguracion,
  eliminarConfiguracion,
  migrarConfiguracionLocal,
  observarPrestadores
} from "../services/configuracion"

const inicial = { nombre: "", apellido: "", telefono: "", actividad: "" }

export default function Prestadores() {
  const [prestadores, setPrestadores] = useState([])
  const [form, setForm] = useState(inicial)
  const [error, setError] = useState("")
  const [guardando, setGuardando] = useState(false)
  const migracionIntentada = useRef(false)

  useEffect(() => observarPrestadores((datos) => {
    setPrestadores(datos)
    if (datos.length === 0 && !migracionIntentada.current && auth.currentUser) {
      migracionIntentada.current = true
      migrarConfiguracionLocal("prestadores", "prestadores", (prestador) => ({
        nombre: prestador.nombre || "", apellido: prestador.apellido || "", telefono: prestador.telefono || "", actividad: prestador.actividad || "", activo: prestador.activo !== false
      }), auth.currentUser.uid).catch((migrationError) => { console.error(migrationError); setError("No se pudieron importar los prestadores guardados anteriormente.") })
    }
  }, () => setError("No se pudieron cargar los prestadores.")), [])

  function handleChange(e) { setForm((actual) => ({ ...actual, [e.target.name]: e.target.value })) }

  async function guardarPrestador(e) {
    e.preventDefault()
    if (!form.nombre.trim() || !form.apellido.trim()) return setError("Ingresá nombre y apellido.")
    if (!auth.currentUser) return setError("La sesión no está disponible.")
    setGuardando(true)
    setError("")
    try {
      await crearConfiguracion("prestadores", { ...form, nombre: form.nombre.trim(), apellido: form.apellido.trim(), activo: true }, auth.currentUser.uid)
      setForm(inicial)
    } catch (saveError) {
      console.error(saveError)
      setError("No se pudo guardar el prestador.")
    } finally { setGuardando(false) }
  }

  async function cambiarEstado(prestador) {
    if (!auth.currentUser) return
    try { await actualizarConfiguracion("prestadores", prestador.id, { activo: prestador.activo === false }, auth.currentUser.uid) }
    catch (saveError) { console.error(saveError); setError("No se pudo cambiar el estado del prestador.") }
  }

  async function eliminar(prestador) {
    if (!confirm(`¿Eliminar a ${prestador.nombre} ${prestador.apellido}?`)) return
    try { await eliminarConfiguracion("prestadores", prestador.id) }
    catch (deleteError) { console.error(deleteError); setError("No se pudo eliminar el prestador.") }
  }

  return <div style={pagina}>
    <h1 style={titulo}>Prestadores</h1>
    {error && <div role="alert" style={errorBox}>{error}</div>}
    <form onSubmit={guardarPrestador} style={tarjeta}>
      <div style={grilla}>
        <Input label="Nombre" name="nombre" value={form.nombre} onChange={handleChange} />
        <Input label="Apellido" name="apellido" value={form.apellido} onChange={handleChange} />
        <Input label="Teléfono" name="telefono" value={form.telefono} onChange={handleChange} />
        <Input label="Actividad" name="actividad" value={form.actividad} onChange={handleChange} />
      </div>
      <button disabled={guardando} style={botonPrincipal}>{guardando ? "Guardando..." : "Agregar prestador"}</button>
    </form>
    <div style={{ display: "grid", gap: 15 }}>
      {prestadores.map((prestador) => <div key={prestador.id} style={{ ...tarjeta, marginBottom: 0, opacity: prestador.activo === false ? .65 : 1 }}>
        <div><strong style={{ fontSize: 18 }}>{prestador.nombre} {prestador.apellido}</strong><div style={detalle}>{prestador.actividad || "Sin actividad"} · {prestador.telefono || "Sin teléfono"}</div></div>
        <div style={acciones}>
          <button onClick={() => cambiarEstado(prestador)} style={prestador.activo === false ? botonHabilitar : botonDeshabilitar}>{prestador.activo === false ? "Habilitar" : "Deshabilitar"}</button>
          <button onClick={() => eliminar(prestador)} style={botonEliminar}>Eliminar</button>
        </div>
      </div>)}
      {prestadores.length === 0 && <div style={vacio}>No hay prestadores cargados en Firestore.</div>}
    </div>
  </div>
}

function Input({ label, ...props }) { return <label><span style={labelStyle}>{label}</span><input {...props} /></label> }

const pagina = { maxWidth: 1100, margin: "0 auto" }
const titulo = { color: "#4e2581", marginBottom: 25 }
const tarjeta = { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 18, padding: 24, marginBottom: 25, background: "white", border: "1px solid #e8e1ee", borderRadius: 14 }
const grilla = { flex: 1, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 15 }
const labelStyle = { display: "block", marginBottom: 8, color: "#4b4058", fontSize: 14, fontWeight: 600 }
const acciones = { display: "flex", gap: 10, flexWrap: "wrap" }
const botonPrincipal = { border: 0, borderRadius: 8, padding: "11px 17px", background: "#4e2581", color: "white", fontWeight: 700, cursor: "pointer" }
const botonHabilitar = { ...botonPrincipal, background: "#16865c" }
const botonDeshabilitar = { ...botonPrincipal, background: "#f59e0b", color: "#38145f" }
const botonEliminar = { ...botonPrincipal, background: "#b42339" }
const detalle = { marginTop: 7, color: "#776d83" }
const errorBox = { marginBottom: 16, padding: 12, borderRadius: 10, background: "#fff1f2", color: "#be123c" }
const vacio = { padding: 28, textAlign: "center", color: "#776d83", background: "white", borderRadius: 12 }
