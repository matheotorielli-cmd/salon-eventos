import { useEffect, useMemo, useState } from "react"
import { auth } from "../firebase"
import { cambiarEstadoEscuela, crearEscuela, editarEscuela, eliminarEscuela, observarEscuelas, observarEventosParaEscuelas } from "../services/escuelas"

export default function Escuelas() {
  const [nombre, setNombre] = useState("")
  const [escuelas, setEscuelas] = useState([])
  const [eventos, setEventos] = useState([])
  const [editandoId, setEditandoId] = useState(null)
  const [error, setError] = useState("")
  const [guardando, setGuardando] = useState(false)
  const [busqueda, setBusqueda] = useState("")
  const [estado, setEstado] = useState("todas")

  useEffect(() => observarEscuelas(setEscuelas, () => setError("No se pudieron cargar las escuelas.")), [])
  useEffect(() => observarEventosParaEscuelas(setEventos, () => setError("No se pudo calcular el uso de las escuelas.")), [])

  async function agregarEscuela(e) {
    e.preventDefault()
    const valor = nombre.trim()
    if (!valor) return setError("Ingresá el nombre de la escuela.")
    if (escuelas.some((escuela) => escuela.id !== editandoId && escuela.nombre.toLowerCase() === valor.toLowerCase())) return setError("Esa escuela ya está cargada.")
    if (!auth.currentUser) return setError("La sesión no está disponible.")

    setGuardando(true)
    setError("")
    try {
      if (editandoId) await editarEscuela(editandoId, valor, auth.currentUser.uid)
      else await crearEscuela(valor, auth.currentUser.uid)
      setNombre("")
      setEditandoId(null)
    }
    catch (saveError) { console.error(saveError); setError("No se pudo guardar la escuela.") }
    finally { setGuardando(false) }
  }

  async function cambiarEstado(escuela) {
    if (!auth.currentUser) return
    try { await cambiarEstadoEscuela(escuela, auth.currentUser.uid) }
    catch (stateError) { console.error(stateError); setError("No se pudo cambiar el estado de la escuela.") }
  }

  function comenzarEdicion(escuela) {
    setEditandoId(escuela.id)
    setNombre(escuela.nombre)
    setError("")
  }

  function cancelarEdicion() {
    setEditandoId(null)
    setNombre("")
  }

  async function eliminar(escuela) {
    const cantidad = cantidadUsos(escuela)
    const detalle = cantidad ? ` Está asociada a ${cantidad} evento(s); los eventos conservarán el nombre histórico.` : ""
    if (!window.confirm(`¿Seguro que querés eliminar ${escuela.nombre}?${detalle}`)) return
    try { await eliminarEscuela(escuela.id) }
    catch (deleteError) { console.error(deleteError); setError("No se pudo eliminar la escuela. Solo un administrador puede hacerlo.") }
  }

  function cantidadUsos(escuela) {
    return eventos.filter((evento) => evento.escuelaId === escuela.id || (!evento.escuelaId && evento.escuela === escuela.nombre)).length
  }

  const escuelasFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLocaleLowerCase("es")
    return escuelas.filter((escuela) => {
      const coincideNombre = !texto || escuela.nombre.toLocaleLowerCase("es").includes(texto)
      const coincideEstado = estado === "todas"
        || (estado === "activas" && escuela.activa !== false)
        || (estado === "inactivas" && escuela.activa === false)
      return coincideNombre && coincideEstado
    })
  }, [busqueda, escuelas, estado])

  return <div className="schools-page" style={pagina}>
    <div style={cabecera}><span style={sobreTitulo}>CONFIGURACIÓN</span><h1 style={{ margin: "3px 0 0" }}>Escuelas</h1></div>
    <form onSubmit={agregarEscuela} style={formulario}>
      <label style={label}>Nombre de la escuela</label>
      <div style={fila}><input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Escribí el nombre de la escuela" style={input} /><button disabled={guardando} style={agregarBtn}>{guardando ? "Guardando..." : editandoId ? "Guardar cambios" : "Agregar escuela"}</button>{editandoId && <button type="button" onClick={cancelarEdicion} style={cancelarBtn}>Cancelar</button>}</div>
      {error && <div style={errorBox}>{error}</div>}
    </form>
    <div style={filtros}>
      <label style={filtroCampo}><span style={label}>Buscar escuela</span><input type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por nombre" style={inputFiltro} /></label>
      <label style={filtroCampo}><span style={label}>Estado</span><select value={estado} onChange={(e) => setEstado(e.target.value)} style={inputFiltro}><option value="todas">Todas</option><option value="activas">Activas</option><option value="inactivas">Inactivas</option></select></label>
      {(busqueda || estado !== "todas") && <button type="button" onClick={() => { setBusqueda(""); setEstado("todas") }} style={limpiarBtn}>Limpiar filtros</button>}
    </div>
    <div style={lista}>
      {escuelasFiltradas.map((escuela) => <div key={escuela.id} style={item}>
        <div><strong>{escuela.nombre}</strong><span style={escuela.activa === false ? inactiva : activa}>{escuela.activa === false ? "Inactiva" : "Activa"}</span><span style={contador}>{cantidadUsos(escuela)} evento(s)</span></div>
        <div style={acciones}><button onClick={() => comenzarEdicion(escuela)} style={editarBtn}>Editar</button><button onClick={() => cambiarEstado(escuela)} style={escuela.activa === false ? habilitarBtn : deshabilitarBtn}>{escuela.activa === false ? "Habilitar" : "Deshabilitar"}</button><button onClick={() => eliminar(escuela)} style={eliminarBtn}>Eliminar</button></div>
      </div>)}
      {!escuelas.length && <div style={vacio}>Todavía no hay escuelas cargadas.</div>}
      {!!escuelas.length && !escuelasFiltradas.length && <div style={vacio}>No hay escuelas que coincidan con los filtros.</div>}
    </div>
  </div>
}

const pagina = { maxWidth: 950, margin: "0 auto" }
const cabecera = { padding: "20px 24px", borderRadius: "18px 18px 0 0", color: "white", background: "linear-gradient(100deg,#4e2581,#63349a)" }
const sobreTitulo = { color: "#bfe8ff", fontSize: 12, fontWeight: 700, letterSpacing: ".12em" }
const formulario = { padding: 24, background: "white", borderBottom: "1px solid #eee8f2" }
const label = { display: "block", marginBottom: 8, color: "#4b4058", fontWeight: 700 }
const fila = { display: "flex", flexWrap: "wrap", gap: 12 }
const input = { flex: "1 1 320px", padding: "12px 14px", border: "1px solid #d8d0df", borderRadius: 10, font: "inherit" }
const agregarBtn = { padding: "12px 19px", border: 0, borderRadius: 10, color: "white", background: "#4e2581", fontWeight: 700, cursor: "pointer" }
const cancelarBtn = { ...agregarBtn, color: "#665b71", background: "#eee9f1" }
const errorBox = { marginTop: 14, padding: 11, borderRadius: 9, background: "#fff1f2", color: "#be123c" }
const filtros = { display: "flex", flexWrap: "wrap", alignItems: "end", gap: 12, padding: "18px 24px", background: "#f8f5fb", borderBottom: "1px solid #eee8f2" }
const filtroCampo = { flex: "1 1 240px" }
const inputFiltro = { width: "100%", padding: "11px 13px", border: "1px solid #d8d0df", borderRadius: 10, background: "white", font: "inherit", boxSizing: "border-box" }
const limpiarBtn = { padding: "11px 16px", border: 0, borderRadius: 10, color: "#4e2581", background: "#e9e1f0", fontWeight: 700, cursor: "pointer" }
const lista = { overflow: "hidden", background: "white", borderRadius: "0 0 18px 18px", boxShadow: "0 14px 35px rgba(78,37,129,.08)" }
const item = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 15, padding: "16px 24px", borderBottom: "1px solid #eee9f1" }
const activa = { marginLeft: 10, padding: "4px 8px", borderRadius: 999, color: "#166534", background: "#dcfce7", fontSize: 12, fontWeight: 700 }
const inactiva = { ...activa, color: "#991b1b", background: "#fee2e2" }
const contador = { marginLeft: 10, color: "#4e2581", fontSize: 13, fontWeight: 700 }
const acciones = { display: "flex", flexWrap: "wrap", justifyContent: "flex-end", gap: 8 }
const editarBtn = { padding: "9px 13px", border: 0, borderRadius: 8, color: "white", background: "#57b6ee", cursor: "pointer" }
const deshabilitarBtn = { padding: "9px 13px", border: 0, borderRadius: 8, color: "white", background: "#ef4444", cursor: "pointer" }
const habilitarBtn = { ...deshabilitarBtn, background: "#22c55e" }
const eliminarBtn = { ...deshabilitarBtn, background: "#991b1b" }
const vacio = { padding: 28, textAlign: "center", color: "#7a6c86" }
