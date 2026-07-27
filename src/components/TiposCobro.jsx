import { useEffect, useState } from "react"
import { auth } from "../firebase"
import {
  actualizarConfiguracion,
  crearConfiguracion,
  eliminarConfiguracion,
  observarTiposCobro
} from "../services/configuracion"

export default function TiposCobro() {
  const [tipos, setTipos] = useState([])
  const [nombre, setNombre] = useState("")
  const [descuento, setDescuento] = useState("0")
  const [error, setError] = useState("")
  const [guardando, setGuardando] = useState(false)

  useEffect(() => observarTiposCobro(
    setTipos,
    () => setError("No se pudieron cargar los tipos de cobro.")
  ), [])

  function validar(nombreTipo, porcentaje) {
    if (!String(nombreTipo || "").trim()) return "Ingresá un nombre."
    if (!Number.isFinite(porcentaje) || porcentaje < 0 || porcentaje > 100) return "El descuento debe estar entre 0% y 100%."
    return ""
  }

  async function agregar() {
    const porcentajeDescuento = Number(descuento || 0)
    const mensaje = validar(nombre, porcentajeDescuento)
    if (mensaje) return setError(mensaje)
    if (!auth.currentUser) return setError("La sesión no está disponible.")

    setGuardando(true)
    setError("")
    try {
      await crearConfiguracion("tiposCobro", {
        nombre: nombre.trim(),
        porcentajeDescuento,
        activo: true
      }, auth.currentUser.uid)
      setNombre("")
      setDescuento("0")
    } catch (saveError) {
      console.error(saveError)
      setError("No se pudo crear el tipo de cobro.")
    } finally {
      setGuardando(false)
    }
  }

  async function guardar(tipo) {
    if (!auth.currentUser) return setError("La sesión no está disponible.")
    const porcentajeDescuento = Number(tipo.porcentajeDescuento || 0)
    const mensaje = validar(tipo.nombre, porcentajeDescuento)
    if (mensaje) return setError(mensaje)

    setError("")
    try {
      await actualizarConfiguracion("tiposCobro", tipo.id, {
        nombre: tipo.nombre.trim(),
        porcentajeDescuento,
        activo: tipo.activo !== false
      }, auth.currentUser.uid)
    } catch (saveError) {
      console.error(saveError)
      setError("No se pudo actualizar el tipo de cobro.")
    }
  }

  async function eliminar(tipo) {
    if (!confirm(`¿Eliminar el tipo de cobro "${tipo.nombre}"?`)) return
    try {
      await eliminarConfiguracion("tiposCobro", tipo.id)
    } catch (deleteError) {
      console.error(deleteError)
      setError("No se pudo eliminar el tipo de cobro.")
    }
  }

  function cambiar(id, campo, valor) {
    setTipos((actuales) => actuales.map((tipo) => tipo.id === id ? { ...tipo, [campo]: valor } : tipo))
  }

  return <div style={pagina}>
    <header style={cabecera}>
      <div><span style={sobreTitulo}>CONFIGURACIÓN</span><h1 style={titulo}>Tipos de cobro</h1></div>
      <p style={descripcion}>Definí los medios de pago y el descuento que se aplicará al registrar cobros de eventos.</p>
    </header>
    {error && <div role="alert" style={errorBox}>{error}</div>}
    <section style={nuevo}>
      <label><span style={label}>Nombre</span><input placeholder="Ej.: Efectivo" value={nombre} onChange={(e) => setNombre(e.target.value)} /></label>
      <label><span style={label}>Descuento</span><div style={porcentajeInput}><input type="number" min="0" max="100" step="0.01" value={descuento} onChange={(e) => setDescuento(e.target.value)} /><span>%</span></div></label>
      <button onClick={agregar} disabled={guardando} style={botonPrincipal}>{guardando ? "Guardando..." : "Agregar tipo"}</button>
    </section>
    <section style={lista}>
      <div style={encabezadoFila}><span>Tipo de cobro</span><span>Descuento</span><span>Acciones</span></div>
      {tipos.map((tipo) => <div key={tipo.id} style={{ ...fila, ...(tipo.activo === false ? filaInactiva : {}) }}>
        <input value={tipo.nombre || ""} onChange={(e) => cambiar(tipo.id, "nombre", e.target.value)} />
        <div style={porcentajeInput}><input type="number" min="0" max="100" step="0.01" value={tipo.porcentajeDescuento ?? 0} onChange={(e) => cambiar(tipo.id, "porcentajeDescuento", e.target.value)} /><span>%</span></div>
        <div style={acciones}>
          <button onClick={() => guardar(tipo)} style={botonPrincipal}>Guardar</button>
          <button onClick={() => guardar({ ...tipo, activo: tipo.activo === false })} style={tipo.activo === false ? botonHabilitar : botonDeshabilitar}>{tipo.activo === false ? "Habilitar" : "Deshabilitar"}</button>
          <button onClick={() => eliminar(tipo)} style={botonEliminar}>Eliminar</button>
        </div>
      </div>)}
      {!tipos.length && <div style={vacio}>Todavía no hay tipos de cobro. Podés crear Efectivo y Transferencia desde arriba.</div>}
    </section>
  </div>
}

const pagina = { maxWidth: 1100, margin: "0 auto" }
const cabecera = { display: "flex", justifyContent: "space-between", gap: 25, alignItems: "end", marginBottom: 22 }
const sobreTitulo = { color: "#57b6ee", fontSize: 12, fontWeight: 800, letterSpacing: ".12em" }
const titulo = { color: "#4e2581", margin: "4px 0 0" }
const descripcion = { maxWidth: 480, margin: 0, color: "#776d83" }
const nuevo = { display: "grid", gridTemplateColumns: "2fr 1fr auto", alignItems: "end", gap: 15, padding: 20, marginBottom: 25, background: "white", borderRadius: 14, border: "1px solid #e8e1ee" }
const label = { display: "block", marginBottom: 7, color: "#4b4058", fontSize: 13, fontWeight: 700 }
const porcentajeInput = { display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 8 }
const lista = { overflow: "hidden", background: "white", borderRadius: 14, border: "1px solid #e8e1ee" }
const encabezadoFila = { display: "grid", gridTemplateColumns: "2fr 1fr 2.2fr", gap: 12, padding: "12px 15px", color: "#4e2581", background: "#f5f0f9", fontSize: 13, fontWeight: 800 }
const fila = { display: "grid", gridTemplateColumns: "2fr 1fr 2.2fr", gap: 12, padding: 15, borderTop: "1px solid #eee", alignItems: "center" }
const filaInactiva = { opacity: .62, background: "#fafafa" }
const acciones = { display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }
const botonPrincipal = { border: 0, borderRadius: 8, padding: "11px 16px", background: "#4e2581", color: "white", fontWeight: 700, cursor: "pointer" }
const botonHabilitar = { ...botonPrincipal, background: "#16865c" }
const botonDeshabilitar = { ...botonPrincipal, background: "#f4d00c", color: "#38145f" }
const botonEliminar = { ...botonPrincipal, background: "#b42339" }
const errorBox = { marginBottom: 16, padding: 12, borderRadius: 10, background: "#fff1f2", color: "#be123c" }
const vacio = { padding: 28, textAlign: "center", color: "#776d83" }
