import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { collection, doc, getDoc, getDocs, onSnapshot, query, where } from "firebase/firestore"
import { db } from "../firebase"
import { nombreCompleto } from "../services/clientes"
import { enlaceWhatsApp } from "../utils/whatsapp"

const pesos = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })
const fecha = new Intl.DateTimeFormat("es-AR")

export default function ClienteDetalle() {
  const { id } = useParams()
  const [cliente, setCliente] = useState(null)
  const [eventos, setEventos] = useState([])
  const [cobros, setCobros] = useState([])
  const [movimientos, setMovimientos] = useState([])
  const [pestana, setPestana] = useState("eventos")
  const [busqueda, setBusqueda] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    let activo = true
    getDoc(doc(db, "clientes", id)).then((snapshot) => {
      if (!activo) return
      if (snapshot.exists()) setCliente({ id: snapshot.id, ...snapshot.data() })
      else setError("No se encontró el cliente.")
    }).catch(() => setError("No se pudo cargar el cliente."))
    const cancelarEventos = onSnapshot(query(collection(db, "eventos"), where("clienteId", "==", id)), async (snapshot) => {
      const eventosCliente = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
      if (!activo) return
      setEventos(eventosCliente)
      try {
        const cobrosSnapshots = await Promise.all(eventosCliente.map((evento) => getDocs(query(collection(db, "cobros"), where("eventoId", "==", evento.id)))))
        const cobrosCliente = cobrosSnapshots.flatMap((resultado) => resultado.docs.map((item) => ({ id: item.id, ...item.data() })))
        const movimientosSnapshots = await Promise.all(cobrosCliente.map((cobro) => getDocs(query(collection(db, "movimientos"), where("referenciaId", "==", cobro.id)))))
        if (!activo) return
        setCobros(cobrosCliente)
        setMovimientos(movimientosSnapshots.flatMap((resultado) => resultado.docs.map((item) => ({ id: item.id, ...item.data() }))))
      } catch { if (activo) setError("No se pudo cargar el historial financiero del cliente.") }
    }, () => setError("No se pudieron cargar los eventos."))
    return () => { activo = false; cancelarEventos() }
  }, [id])

  const eventosPorId = useMemo(() => Object.fromEntries(eventos.map((evento) => [evento.id, evento])), [eventos])
  const cobrosCliente = useMemo(() => cobros.filter((cobro) => eventosPorId[cobro.eventoId]), [cobros, eventosPorId])
  const cobrosPorId = useMemo(() => Object.fromEntries(cobrosCliente.map((cobro) => [cobro.id, cobro])), [cobrosCliente])
  const movimientosCliente = useMemo(() => movimientos.filter((movimiento) => movimiento.origen === "cobro" && cobrosPorId[movimiento.referenciaId]), [movimientos, cobrosPorId])
  const texto = busqueda.toLowerCase().trim()
  const eventosFiltrados = eventos.filter((evento) => [evento.nombreEvento, evento.tipoEvento, evento.estado].some((valor) => String(valor || "").toLowerCase().includes(texto)))
  const movimientosFiltrados = movimientosCliente.filter((movimiento) => {
    const evento = eventosPorId[cobrosPorId[movimiento.referenciaId]?.eventoId]
    return [movimiento.tipoMovimientoNombre, movimiento.concepto, evento?.nombreEvento].some((valor) => String(valor || "").toLowerCase().includes(texto))
  })
  const totalEventos = eventos.reduce((suma, evento) => suma + Number(evento.total || 0), 0)
  const totalMovimientos = movimientosCliente.reduce((suma, movimiento) => suma + Number(movimiento.monto || 0), 0)

  if (!cliente && !error) return <div style={cargando}>Cargando cliente...</div>

  return <div className="client-detail-page" style={pagina}>
    {error && <div style={errorBox}>{error}</div>}
    {cliente && <>
      <aside className="client-profile-card" style={perfil}>
        <h2 style={nombre}>{nombreCompleto(cliente)}</h2>
        <Dato label={cliente.esEmpresa ? "CUIT" : "DNI"} valor={cliente.dni || "—"} />
        <Dato label="Teléfono" valor={cliente.telefono ? <a href={enlaceWhatsApp(cliente.telefono)} target="_blank" rel="noreferrer" style={whatsapp}>{cliente.telefono}</a> : "—"} />
        <Dato label="Correo" valor={cliente.email || "—"} />
        <Dato label="Dirección" valor={cliente.direccion || "—"} />
      </aside>
      <main className="client-history-card" style={historial}>
        <div style={pestanas}><button onClick={() => { setPestana("movimientos"); setBusqueda("") }} style={pestana === "movimientos" ? pestanaActiva : pestanaBtn}>Movimientos</button><button onClick={() => { setPestana("eventos"); setBusqueda("") }} style={pestana === "eventos" ? pestanaActiva : pestanaBtn}>Eventos</button></div>
        <div style={contenido}>
          <div style={resumen}><strong>{pestana === "eventos" ? `Total eventos: ${pesos.format(totalEventos)}` : `Total movimientos: ${pesos.format(totalMovimientos)}`}</strong><input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar" style={buscar} /></div>
          <div style={{ overflowX: "auto" }}>{pestana === "eventos" ? <TablaEventos eventos={eventosFiltrados} /> : <TablaMovimientos movimientos={movimientosFiltrados} cobros={cobrosPorId} eventos={eventosPorId} />}</div>
        </div>
      </main>
    </>}
  </div>
}

function TablaEventos({ eventos }) { return <table style={tabla}><thead><tr><th style={th}>Nombre del evento</th><th style={th}>Fecha</th><th style={th}>Moneda</th><th style={th}>Monto</th><th style={th}>Saldo</th><th style={th}>Estado</th></tr></thead><tbody>{eventos.map((evento) => <tr key={evento.id}><td style={td}><Link to={`/evento/${evento.id}`} style={link}>{evento.nombreEvento || evento.title || "Evento"}</Link></td><td style={td}>{formatearFechaEvento(evento)}</td><td style={td}>ARS</td><td style={td}>{pesos.format(Number(evento.total || 0))}</td><td style={td}>{pesos.format(Number(evento.saldo || 0))}</td><td style={td}>{evento.estado || "—"}</td></tr>)}{!eventos.length && <FilaVacia columnas={6} />}</tbody></table> }
function TablaMovimientos({ movimientos, cobros, eventos }) { return <table style={tabla}><thead><tr><th style={th}>Fecha</th><th style={th}>Tipo</th><th style={th}>Concepto</th><th style={th}>Descripción</th><th style={th}>Moneda</th><th style={th}>Monto</th><th style={th}>Referencia</th></tr></thead><tbody>{movimientos.map((movimiento) => { const evento = eventos[cobros[movimiento.referenciaId]?.eventoId]; return <tr key={movimiento.id}><td style={td}>{movimiento.fecha?.toDate ? fecha.format(movimiento.fecha.toDate()) : "—"}</td><td style={td}><span style={tipoBadge}>{movimiento.tipoMovimientoNombre || "Movimiento"}</span></td><td style={td}>{movimiento.concepto || "—"}</td><td style={td}>{movimiento.descripcion || "—"}</td><td style={td}>ARS</td><td style={td}>{pesos.format(Number(movimiento.monto || 0))}</td><td style={td}>{evento ? <Link to={`/evento/${evento.id}`} style={link}>{evento.nombreEvento || evento.title || "Evento"}</Link> : "—"}</td></tr> })}{!movimientos.length && <FilaVacia columnas={7} />}</tbody></table> }
function formatearFechaEvento(evento) { const valor = evento.fecha ? new Date(`${evento.fecha}T12:00:00`) : null; return valor && !Number.isNaN(valor.getTime()) ? fecha.format(valor) : "—" }
function Dato({ label, valor }) { return <div style={dato}><strong>{label}</strong><span>{valor}</span></div> }
function FilaVacia({ columnas }) { return <tr><td colSpan={columnas} style={vacio}>No hay registros para mostrar.</td></tr> }

const pagina = { maxWidth: 1250, margin: "0 auto", display: "grid", gridTemplateColumns: "minmax(220px,280px) minmax(0,1fr)", gap: 18, alignItems: "start" }
const perfil = { padding: 20, borderTop: "4px solid #57b6ee", borderRadius: 14, background: "white", boxShadow: "0 10px 28px rgba(78,37,129,.08)" }
const nombre = { margin: "0 0 16px", paddingBottom: 14, textAlign: "center", color: "#4e2581", borderBottom: "1px solid #e8e1ee" }
const dato = { display: "flex", justifyContent: "space-between", gap: 12, padding: "11px 0", borderBottom: "1px solid #eee9f1", fontSize: 13 }
const historial = { overflow: "hidden", borderRadius: 14, background: "white", boxShadow: "0 10px 28px rgba(78,37,129,.08)" }
const pestanas = { display: "flex", gap: 6, padding: 10, borderBottom: "1px solid #e8e1ee" }
const pestanaBtn = { padding: "9px 14px", border: 0, borderRadius: 7, color: "#665b71", background: "transparent", cursor: "pointer" }
const pestanaActiva = { ...pestanaBtn, color: "white", background: "#4e2581", fontWeight: 700 }
const contenido = { padding: 18 }
const resumen = { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14, marginBottom: 15, color: "#33283d" }
const buscar = { padding: "9px 11px", border: "1px solid #d8d0df", borderRadius: 8 }
const tabla = { width: "100%", borderCollapse: "collapse" }
const th = { padding: 11, textAlign: "left", borderBottom: "2px solid #ded6e6", color: "#4b4058", fontSize: 13 }
const td = { padding: 11, borderBottom: "1px solid #eee9f1", fontSize: 13, whiteSpace: "nowrap" }
const link = { color: "#2563eb", fontWeight: 600, textDecoration: "none" }
const whatsapp = { color: "#168c52", fontWeight: 700, textDecoration: "none" }
const tipoBadge = { padding: "4px 7px", borderRadius: 6, color: "white", background: "#22a447", fontSize: 12, fontWeight: 700 }
const vacio = { padding: 28, textAlign: "center", color: "#776d83" }
const cargando = { padding: 30, color: "#4e2581", fontWeight: 700 }
const errorBox = { gridColumn: "1 / -1", padding: 12, borderRadius: 9, background: "#fff1f2", color: "#be123c" }
