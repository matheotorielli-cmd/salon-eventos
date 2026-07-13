import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { auth } from "../firebase"
import { actualizarConfiguracion, eliminarConfiguracion, migrarConfiguracionLocal, observarTiposMovimientos } from "../services/configuracion"

export default function TiposMovimientos() {
  const navigate = useNavigate()
  const [tipos, setTipos] = useState([])
  const [error, setError] = useState("")
  const migracionIntentada = useRef(false)

  useEffect(() => observarTiposMovimientos((datos) => {
    setTipos(datos)
    if (datos.length === 0 && !migracionIntentada.current && auth.currentUser) {
      migracionIntentada.current = true
      migrarConfiguracionLocal("tiposMovimientos", "tiposMovimientos", (tipo) => ({
        nombre: tipo.nombre || "", categoria: tipo.categoria || "", descripcion: tipo.descripcion || "", activo: tipo.activo !== false
      }), auth.currentUser.uid).catch((migrationError) => { console.error(migrationError); setError("No se pudieron importar los tipos guardados anteriormente.") })
    }
  }, () => setError("No se pudieron cargar los tipos de movimientos.")), [])

  async function cambiarEstado(tipo) {
    if (!auth.currentUser) return setError("La sesión no está disponible.")
    try { await actualizarConfiguracion("tiposMovimientos", tipo.id, { activo: tipo.activo === false }, auth.currentUser.uid) }
    catch (saveError) { console.error(saveError); setError("No se pudo cambiar el estado.") }
  }

  async function borrarTipo(tipo) {
    if (!confirm(`¿Eliminar el tipo de movimiento "${tipo.nombre}"?`)) return
    try { await eliminarConfiguracion("tiposMovimientos", tipo.id) }
    catch (deleteError) { console.error(deleteError); setError("No se pudo eliminar el tipo de movimiento.") }
  }

  return <div style={pagina}>
    <div style={cabecera}><h2 style={{ margin: 0 }}>Tipos de movimiento</h2><button onClick={() => navigate("/nuevo-tipo-movimiento")} style={botonNuevo}>Nuevo tipo</button></div>
    {error && <div role="alert" style={errorBox}>{error}</div>}
    <div style={{ background: "white", overflowX: "auto" }}><table style={tabla}>
      <thead><tr style={{ background: "#f7f5fb" }}><th style={th}>Nombre</th><th style={th}>Categoría</th><th style={th}>Descripción</th><th style={th}>Estado</th><th style={th}>Acciones</th></tr></thead>
      <tbody>
        {tipos.map((tipo) => <tr key={tipo.id}>
          <td style={td}>{tipo.nombre}</td><td style={td}>{tipo.categoria}</td><td style={td}>{tipo.descripcion || "—"}</td><td style={td}>{tipo.activo === false ? "Deshabilitado" : "Activo"}</td>
          <td style={td}><div style={acciones}>
            <button onClick={() => navigate(`/tipo-movimiento/${tipo.id}/editar`)} style={botonEditar}>Editar</button>
            <button onClick={() => cambiarEstado(tipo)} style={tipo.activo === false ? botonHabilitar : botonDeshabilitar}>{tipo.activo === false ? "Habilitar" : "Deshabilitar"}</button>
            <button onClick={() => borrarTipo(tipo)} style={botonBorrar}>Eliminar</button>
          </div></td>
        </tr>)}
        {tipos.length === 0 && <tr><td colSpan="5" style={vacio}>No hay tipos de movimientos cargados en Firestore.</td></tr>}
      </tbody>
    </table></div>
  </div>
}

const pagina = { maxWidth: 1250, margin: "0 auto" }
const cabecera = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 15, padding: "16px 20px", borderRadius: "12px 12px 0 0", background: "#4e2581", color: "white" }
const tabla = { width: "100%", borderCollapse: "collapse" }
const th = { padding: 14, textAlign: "left", borderBottom: "1px solid #e8e1ee", color: "#4b4058", whiteSpace: "nowrap" }
const td = { padding: 14, borderBottom: "1px solid #eee7f4" }
const acciones = { display: "flex", gap: 8, flexWrap: "wrap" }
const botonBase = { border: 0, borderRadius: 7, padding: "9px 13px", color: "white", fontWeight: 700, cursor: "pointer" }
const botonNuevo = { ...botonBase, background: "white", color: "#4e2581" }
const botonEditar = { ...botonBase, background: "#57b6ee" }
const botonHabilitar = { ...botonBase, background: "#16865c" }
const botonDeshabilitar = { ...botonBase, background: "#f59e0b", color: "#38145f" }
const botonBorrar = { ...botonBase, background: "#b42339" }
const errorBox = { padding: 12, background: "#fff1f2", color: "#be123c" }
const vacio = { padding: 30, textAlign: "center", color: "#776d83" }
