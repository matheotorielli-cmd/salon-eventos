import { useEffect, useRef, useState } from "react"
import { auth } from "../firebase"
import {
  actualizarConfiguracion,
  crearConfiguracion,
  eliminarConfiguracion,
  migrarConfiguracionLocal,
  observarTiposEventos
} from "../services/configuracion"

export default function TiposEventos() {
  const [tipos, setTipos] = useState([])
  const [nuevoNombre, setNuevoNombre] = useState("")
  const [nuevoPrecio, setNuevoPrecio] = useState("")
  const [error, setError] = useState("")
  const [guardando, setGuardando] = useState(false)
  const migracionIntentada = useRef(false)

  useEffect(() => observarTiposEventos((datos) => {
    setTipos(datos)
    if (datos.length === 0 && !migracionIntentada.current && auth.currentUser) {
      migracionIntentada.current = true
      migrarConfiguracionLocal("tiposEventos", "tiposEventos", (tipo) => {
        const precioBase = Number(tipo.precioBase ?? tipo.precio ?? 0)
        return { nombre: tipo.nombre || "", precioBase, precio: precioBase, moneda: "ARS", activo: tipo.activo !== false }
      }, auth.currentUser.uid).catch((migrationError) => { console.error(migrationError); setError("No se pudieron importar los tipos guardados anteriormente.") })
    }
  }, () => setError("No se pudieron cargar los tipos de eventos.")), [])

  async function agregarTipo() {
    const nombre = nuevoNombre.trim()
    const precioBase = Number(nuevoPrecio || 0)
    if (!nombre) return setError("Ingresá un nombre.")
    if (!Number.isFinite(precioBase) || precioBase < 0) return setError("El precio no es válido.")
    if (!auth.currentUser) return setError("La sesión no está disponible.")
    setGuardando(true)
    setError("")
    try {
      await crearConfiguracion("tiposEventos", { nombre, precioBase, precio: precioBase, moneda: "ARS", activo: true }, auth.currentUser.uid)
      setNuevoNombre("")
      setNuevoPrecio("")
    } catch (saveError) {
      console.error(saveError)
      setError("No se pudo crear el tipo de evento.")
    } finally { setGuardando(false) }
  }

  async function guardarTipo(tipo) {
    if (!auth.currentUser) return
    const precioBase = Number(tipo.precioBase ?? tipo.precio ?? 0)
    try {
      await actualizarConfiguracion("tiposEventos", tipo.id, {
        nombre: String(tipo.nombre || "").trim(),
        precioBase,
        precio: precioBase,
        moneda: "ARS",
        activo: tipo.activo !== false
      }, auth.currentUser.uid)
    } catch (saveError) {
      console.error(saveError)
      setError("No se pudo actualizar el tipo de evento.")
    }
  }

  async function eliminar(tipo) {
    if (!confirm(`¿Eliminar el tipo de evento "${tipo.nombre}"?`)) return
    try { await eliminarConfiguracion("tiposEventos", tipo.id) }
    catch (deleteError) { console.error(deleteError); setError("No se pudo eliminar el tipo de evento.") }
  }

  function cambiar(id, campo, valor) {
    setTipos((actuales) => actuales.map((tipo) => tipo.id === id ? { ...tipo, [campo]: valor } : tipo))
  }

  return <div style={pagina}>
    <h1 style={titulo}>Tipos de eventos</h1>
    {error && <div role="alert" style={errorBox}>{error}</div>}
    <div style={nuevo}>
      <input placeholder="Nombre" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} />
      <input type="number" min="0" step="1" placeholder="Precio base" value={nuevoPrecio} onChange={(e) => setNuevoPrecio(e.target.value)} />
      <button onClick={agregarTipo} disabled={guardando} style={botonPrincipal}>{guardando ? "Guardando..." : "Agregar"}</button>
    </div>
    <div style={lista}>
      {tipos.map((tipo) => <div key={tipo.id} style={fila}>
        <input value={tipo.nombre || ""} onChange={(e) => cambiar(tipo.id, "nombre", e.target.value)} />
        <input type="number" min="0" step="1" value={tipo.precioBase ?? tipo.precio ?? 0} onChange={(e) => cambiar(tipo.id, "precioBase", e.target.value)} />
        <button onClick={() => guardarTipo(tipo)} style={botonPrincipal}>Guardar</button>
        <button onClick={() => guardarTipo({ ...tipo, activo: tipo.activo === false })} style={tipo.activo === false ? botonHabilitar : botonDeshabilitar}>{tipo.activo === false ? "Habilitar" : "Deshabilitar"}</button>
        <button onClick={() => eliminar(tipo)} style={botonEliminar}>Eliminar</button>
      </div>)}
      {tipos.length === 0 && <div style={vacio}>No hay tipos de eventos cargados en Firestore.</div>}
    </div>
  </div>
}

const pagina = { maxWidth: 1100, margin: "0 auto" }
const titulo = { color: "#4e2581", marginBottom: 25 }
const nuevo = { display: "grid", gridTemplateColumns: "2fr 1fr auto", gap: 15, padding: 20, marginBottom: 25, background: "white", borderRadius: 12 }
const lista = { overflow: "hidden", background: "white", borderRadius: 12 }
const fila = { display: "grid", gridTemplateColumns: "2fr 1fr repeat(3,auto)", gap: 12, padding: 15, borderBottom: "1px solid #eee", alignItems: "center" }
const botonPrincipal = { border: 0, borderRadius: 8, padding: "11px 16px", background: "#4e2581", color: "white", fontWeight: 700, cursor: "pointer" }
const botonHabilitar = { ...botonPrincipal, background: "#16865c" }
const botonDeshabilitar = { ...botonPrincipal, background: "#f59e0b", color: "#38145f" }
const botonEliminar = { ...botonPrincipal, background: "#b42339" }
const errorBox = { marginBottom: 16, padding: 12, borderRadius: 10, background: "#fff1f2", color: "#be123c" }
const vacio = { padding: 28, textAlign: "center", color: "#776d83" }
