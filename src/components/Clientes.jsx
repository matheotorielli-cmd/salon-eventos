import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { auth } from "../firebase"
import ClienteModal from "./ClienteModal"
import { cambiarEstadoCliente, nombreCompleto, observarClientes } from "../services/clientes"
import { enlaceWhatsApp } from "../utils/whatsapp"

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [busqueda, setBusqueda] = useState("")
  const [mostrarModal, setMostrarModal] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => observarClientes(setClientes, () => setError("No se pudieron cargar los clientes.")), [])

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    if (!texto) return clientes
    return clientes.filter((cliente) => [nombreCompleto(cliente), cliente.dni, cliente.telefono, cliente.email]
      .some((valor) => String(valor || "").toLowerCase().includes(texto)))
  }, [busqueda, clientes])

  async function cambiarEstado(cliente) {
    if (!auth.currentUser) return
    try { await cambiarEstadoCliente(cliente, auth.currentUser.uid) }
    catch (stateError) { console.error(stateError); setError("No se pudo cambiar el estado del cliente.") }
  }

  return <div className="clients-page" style={pagina}>
    <div className="responsive-header" style={cabecera}>
      <div><span style={sobreTitulo}>CONFIGURACIÓN</span><h1 style={{ margin: "3px 0 0" }}>Clientes</h1></div>
      <button onClick={() => setMostrarModal(true)} style={nuevoBtn}>Agregar cliente</button>
    </div>
    <div style={tarjeta}>
      <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por nombre, DNI, teléfono o correo" style={buscar} />
      {error && <div style={errorBox}>{error}</div>}
      <div style={{ overflowX: "auto" }}><table style={tabla}>
        <thead><tr><th style={th}>Cliente</th><th style={th}>DNI</th><th style={th}>Teléfono</th><th style={th}>Correo</th><th style={th}>Estado</th><th style={th}>Acciones</th></tr></thead>
        <tbody>{filtrados.map((cliente) => <tr key={cliente.id}>
          <td style={td}><Link to={`/clientes/${cliente.id}`} style={clienteLink}>{nombreCompleto(cliente)}</Link>{cliente.esEmpresa && <small style={empresa}>Empresa</small>}</td>
          <td style={td}>{cliente.dni || "—"}</td><td style={td}>{cliente.telefono ? <a href={enlaceWhatsApp(cliente.telefono)} target="_blank" rel="noreferrer" style={whatsappLink}>{cliente.telefono}</a> : "—"}</td><td style={td}>{cliente.email || "—"}</td>
          <td style={td}><span style={cliente.activo === false ? inactivo : activo}>{cliente.activo === false ? "Inactivo" : "Activo"}</span></td>
          <td style={td}><button onClick={() => cambiarEstado(cliente)} style={cliente.activo === false ? habilitar : deshabilitar}>{cliente.activo === false ? "Habilitar" : "Deshabilitar"}</button></td>
        </tr>)}</tbody>
      </table></div>
      {!filtrados.length && <div style={vacio}>No hay clientes para mostrar.</div>}
    </div>
    {mostrarModal && <ClienteModal onClose={() => setMostrarModal(false)} onCreado={() => setMostrarModal(false)} />}
  </div>
}

const pagina = { maxWidth: 1250, margin: "0 auto" }
const cabecera = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: "20px 24px", borderRadius: "18px 18px 0 0", color: "white", background: "linear-gradient(100deg,#4e2581,#63349a)" }
const sobreTitulo = { color: "#bfe8ff", fontSize: 12, fontWeight: 700, letterSpacing: ".12em" }
const nuevoBtn = { padding: "11px 18px", border: 0, borderRadius: 999, color: "#4e2581", background: "white", fontWeight: 700, cursor: "pointer" }
const tarjeta = { padding: 22, background: "white", borderRadius: "0 0 18px 18px", boxShadow: "0 14px 35px rgba(78,37,129,.08)" }
const buscar = { width: "min(520px,100%)", boxSizing: "border-box", padding: "12px 14px", marginBottom: 20, border: "1px solid #d8d0df", borderRadius: 10, font: "inherit" }
const tabla = { width: "100%", borderCollapse: "collapse" }
const th = { padding: 12, textAlign: "left", color: "#4b4058", background: "#f7f5fb", borderBottom: "1px solid #e8e1ee" }
const td = { padding: 12, borderBottom: "1px solid #eee9f1" }
const empresa = { display: "block", color: "#7a6c86" }
const activo = { padding: "5px 9px", borderRadius: 999, color: "#166534", background: "#dcfce7", fontWeight: 700, fontSize: 12 }
const inactivo = { ...activo, color: "#991b1b", background: "#fee2e2" }
const deshabilitar = { padding: "8px 11px", border: 0, borderRadius: 8, color: "white", background: "#ef4444", cursor: "pointer" }
const habilitar = { ...deshabilitar, background: "#22c55e" }
const errorBox = { marginBottom: 16, padding: 12, borderRadius: 9, background: "#fff1f2", color: "#be123c" }
const vacio = { padding: 28, textAlign: "center", color: "#7a6c86" }
const whatsappLink = { color: "#168c52", fontWeight: 700, textDecoration: "none" }
const clienteLink = { color: "#4e2581", fontWeight: 700, textDecoration: "none" }
