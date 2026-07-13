import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { auth } from "../firebase"
import { actualizarConfiguracion, crearConfiguracion, observarTiposMovimientos } from "../services/configuracion"

const inicial = { nombre: "", descripcion: "", categoria: "", deshabilitado: false }

export default function NuevoTipoMovimiento() {
  const navigate = useNavigate()
  const { id } = useParams()
  const editando = Boolean(id)
  const [form, setForm] = useState(inicial)
  const [cargando, setCargando] = useState(editando)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!editando) return undefined
    return observarTiposMovimientos((tipos) => {
      const tipo = tipos.find((item) => item.id === id)
      if (tipo) setForm({ nombre: tipo.nombre || "", descripcion: tipo.descripcion || "", categoria: tipo.categoria || "", deshabilitado: tipo.activo === false })
      else setError("No se encontró el tipo de movimiento.")
      setCargando(false)
    }, () => { setError("No se pudo cargar el tipo de movimiento."); setCargando(false) })
  }, [editando, id])

  function handleChange(e) { const { name, value, type, checked } = e.target; setForm((actual) => ({ ...actual, [name]: type === "checkbox" ? checked : value })) }

  async function guardar(e) {
    e.preventDefault()
    if (!form.nombre.trim() || !form.categoria) return setError("Ingresá el nombre y la categoría.")
    if (!auth.currentUser) return setError("La sesión no está disponible.")
    setGuardando(true)
    setError("")
    const datos = { nombre: form.nombre.trim(), descripcion: form.descripcion.trim(), categoria: form.categoria, activo: !form.deshabilitado }
    try {
      if (editando) await actualizarConfiguracion("tiposMovimientos", id, datos, auth.currentUser.uid)
      else await crearConfiguracion("tiposMovimientos", datos, auth.currentUser.uid)
      navigate("/tipos-movimientos")
    } catch (saveError) { console.error(saveError); setError("No se pudo guardar el tipo de movimiento.") }
    finally { setGuardando(false) }
  }

  if (cargando) return <div style={mensaje}>Cargando...</div>
  return <div style={pagina}>
    <div style={cabecera}><h2 style={{ margin: 0 }}>{editando ? "Editar tipo de movimiento" : "Nuevo tipo de movimiento"}</h2></div>
    <form onSubmit={guardar} style={tarjeta}>
      <Campo label="Nombre"><input name="nombre" value={form.nombre} onChange={handleChange} /></Campo>
      <Campo label="Descripción"><input name="descripcion" value={form.descripcion} onChange={handleChange} /></Campo>
      <Campo label="Categoría"><select name="categoria" value={form.categoria} onChange={handleChange}><option value="">Seleccionar</option><option value="Ingreso">Ingreso</option><option value="Egreso">Egreso</option><option value="Transferencia">Transferencia</option></select></Campo>
      <label style={check}><input type="checkbox" name="deshabilitado" checked={form.deshabilitado} onChange={handleChange} /> Deshabilitado</label>
      {error && <div role="alert" style={errorBox}>{error}</div>}
      <div style={acciones}><button type="button" onClick={() => navigate("/tipos-movimientos")} style={cancelar}>Cancelar</button><button disabled={guardando} style={guardarBtn}>{guardando ? "Guardando..." : "Guardar"}</button></div>
    </form>
  </div>
}

function Campo({ label, children }) { return <label><span style={labelStyle}>{label}</span>{children}</label> }
const pagina = { maxWidth: 1100, margin: "0 auto" }
const cabecera = { padding: "17px 21px", borderRadius: "12px 12px 0 0", background: "#4e2581", color: "white" }
const tarjeta = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 18, padding: 24, background: "white", border: "1px solid #e8e1ee", borderRadius: "0 0 12px 12px" }
const labelStyle = { display: "block", marginBottom: 8, color: "#4b4058", fontWeight: 600 }
const check = { display: "flex", alignItems: "center", gap: 8, marginTop: 28 }
const acciones = { gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: 10 }
const cancelar = { border: 0, borderRadius: 8, padding: "11px 17px", background: "#eee9f1", color: "#665b71", cursor: "pointer" }
const guardarBtn = { ...cancelar, background: "#4e2581", color: "white", fontWeight: 700 }
const errorBox = { gridColumn: "1 / -1", padding: 12, borderRadius: 10, background: "#fff1f2", color: "#be123c" }
const mensaje = { padding: 35, textAlign: "center", color: "#776d83" }
