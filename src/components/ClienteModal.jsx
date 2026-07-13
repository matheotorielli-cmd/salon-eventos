import { useState } from "react"
import { auth } from "../firebase"
import { crearCliente } from "../services/clientes"

const inicial = { esEmpresa: false, nombre: "", apellido: "", fechaNacimiento: "", dni: "", telefono: "", email: "", direccion: "", nota: "" }

export default function ClienteModal({ onClose, onCreado }) {
  const [form, setForm] = useState(inicial)
  const [error, setError] = useState("")
  const [guardando, setGuardando] = useState(false)

  function cambiar(e) {
    const { name, value, type, checked } = e.target
    setForm((actual) => ({ ...actual, [name]: type === "checkbox" ? checked : value }))
  }

  async function guardar(e) {
    e.preventDefault()
    if (!form.nombre.trim()) return setError("Ingresá el nombre del cliente.")
    if (!form.esEmpresa && !form.apellido.trim()) return setError("Ingresá el apellido del cliente.")
    if (!form.telefono.trim()) return setError("Ingresá el teléfono del cliente.")
    if (!auth.currentUser) return setError("La sesión no está disponible.")

    setGuardando(true)
    setError("")
    try {
      const datos = { ...form, nombre: form.nombre.trim(), apellido: form.esEmpresa ? "" : form.apellido.trim() }
      const id = await crearCliente(datos, auth.currentUser.uid)
      onCreado({ id, ...datos, activo: true })
    } catch (saveError) {
      console.error(saveError)
      setError("No se pudo guardar el cliente.")
    } finally {
      setGuardando(false)
    }
  }

  return <div style={fondo} onMouseDown={onClose}>
    <form style={modal} onSubmit={guardar} onMouseDown={(e) => e.stopPropagation()}>
      <div style={cabecera}><h2 style={{ margin: 0 }}>Agregar cliente</h2><button type="button" onClick={onClose} style={cerrar}>×</button></div>
      <div style={contenido}>
        <label style={empresa}><span>El cliente es una empresa</span><input type="checkbox" name="esEmpresa" checked={form.esEmpresa} onChange={cambiar} /></label>
        <div style={grilla}>
          <Campo label={form.esEmpresa ? "Nombre de la empresa *" : "Nombre *"}><input name="nombre" value={form.nombre} onChange={cambiar} placeholder="Ingrese el nombre del cliente" style={input} /></Campo>
          {!form.esEmpresa && <Campo label="Apellido *"><input name="apellido" value={form.apellido} onChange={cambiar} placeholder="Ingrese el apellido del cliente" style={input} /></Campo>}
          <Campo label="Fecha de nacimiento"><input type="date" name="fechaNacimiento" value={form.fechaNacimiento} onChange={cambiar} style={input} /></Campo>
          <Campo label="DNI"><input name="dni" value={form.dni} onChange={cambiar} placeholder="Ingrese el DNI del cliente" style={input} /></Campo>
          <Campo label="Teléfono *"><input type="tel" name="telefono" value={form.telefono} onChange={cambiar} placeholder="Ingrese el teléfono del cliente" style={input} required /></Campo>
          <Campo label="Correo electrónico"><input type="email" name="email" value={form.email} onChange={cambiar} placeholder="Ingrese el email del cliente" style={input} /></Campo>
          <div style={{ gridColumn: "1 / -1" }}><Campo label="Dirección del cliente"><input name="direccion" value={form.direccion} onChange={cambiar} placeholder="Ingrese la dirección del cliente" style={input} /></Campo></div>
          <div style={{ gridColumn: "1 / -1" }}><Campo label="Nota del cliente"><textarea name="nota" value={form.nota} onChange={cambiar} maxLength={500} rows="3" placeholder="Ingrese una nota del cliente" style={{ ...input, resize: "vertical" }} /><small>{form.nota.length}/500</small></Campo></div>
        </div>
        {error && <div style={errorBox}>{error}</div>}
      </div>
      <div style={pie}><button type="button" onClick={onClose} style={cancelar}>Cancelar</button><button disabled={guardando} style={guardarBtn}>{guardando ? "Guardando..." : "Agregar cliente"}</button></div>
    </form>
  </div>
}

function Campo({ label, children }) { return <label style={{ display: "block" }}><span style={labelStyle}>{label}</span>{children}</label> }
const fondo = { position: "fixed", inset: 0, zIndex: 2000, display: "grid", placeItems: "center", padding: 18, background: "rgba(28,17,40,.5)" }
const modal = { width: "min(760px,100%)", maxHeight: "92vh", overflowY: "auto", background: "white", borderRadius: 18, boxShadow: "0 24px 70px rgba(40,20,64,.3)" }
const cabecera = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px", color: "white", background: "linear-gradient(100deg,#4e2581,#63349a)" }
const cerrar = { border: 0, background: "transparent", color: "white", fontSize: 26, cursor: "pointer" }
const contenido = { padding: 22 }
const empresa = { display: "flex", gap: 8, alignItems: "center", marginBottom: 18, fontWeight: 600 }
const grilla = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }
const labelStyle = { display: "block", marginBottom: 7, fontSize: 13, fontWeight: 700, color: "#4b4058" }
const input = { width: "100%", boxSizing: "border-box", padding: "11px 12px", border: "1px solid #d8d0df", borderRadius: 9, font: "inherit" }
const errorBox = { marginTop: 16, padding: 12, borderRadius: 9, background: "#fff1f2", color: "#be123c" }
const pie = { display: "flex", justifyContent: "flex-end", gap: 10, padding: "16px 22px", borderTop: "1px solid #eee8f2" }
const cancelar = { padding: "11px 17px", border: 0, borderRadius: 9, color: "#665b71", background: "#eee9f1", cursor: "pointer" }
const guardarBtn = { padding: "11px 18px", border: 0, borderRadius: 9, color: "white", background: "#4e2581", fontWeight: 700, cursor: "pointer" }
