import { useEffect, useMemo, useState } from "react"
import { collection, onSnapshot } from "firebase/firestore"
import { Link } from "react-router-dom"
import { auth, db } from "../firebase"
import { observarCuentas } from "../services/cuentas"
import { observarPagosPrestadores, registrarPagosPrestadores } from "../services/pagosPrestadores"

const pesos = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })
const hoy = new Date().toISOString().split("T")[0]

export default function PagoPrestadores() {
  const [eventos, setEventos] = useState([])
  const [pagos, setPagos] = useState({})
  const [cuentas, setCuentas] = useState([])
  const [desde, setDesde] = useState(hoy)
  const [hasta, setHasta] = useState(hoy)
  const [prestadorId, setPrestadorId] = useState("")
  const [busqueda, setBusqueda] = useState("")
  const [seleccion, setSeleccion] = useState([])
  const [cuentaId, setCuentaId] = useState("")
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const cancelarEventos = onSnapshot(collection(db, "eventos"), (snapshot) => setEventos(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))), () => setError("No se pudieron cargar los eventos."))
    const cancelarPagos = observarPagosPrestadores(setPagos, () => setError("No se pudieron cargar los pagos."))
    const cancelarCuentas = observarCuentas((datos) => setCuentas(datos.filter((cuenta) => cuenta.activa !== false)), () => setError("No se pudieron cargar las cuentas."))
    return () => { cancelarEventos(); cancelarPagos(); cancelarCuentas() }
  }, [])

  const filas = useMemo(() => eventos.flatMap((evento) => (evento.prestadores || []).map((prestador, index) => {
    const identidad = prestador.id || `${index}`
    const pagoId = `${evento.id}__${identidad}`
    return {
      pagoId,
      eventoId: evento.id,
      eventoNombre: evento.nombreEvento || evento.title || evento.cliente || "Evento",
      fechaEvento: evento.fecha || "",
      hora: evento.hora || evento.horaInicio || "",
      prestadorId: identidad,
      prestadorNombre: [prestador.nombre, prestador.apellido].filter(Boolean).join(" ") || "Prestador",
      actividad: prestador.actividad || "",
      monto: Number(prestador.costo || 0),
      pago: pagos[pagoId]
    }
  })), [eventos, pagos])

  const prestadores = useMemo(() => Array.from(new Map(filas.map((fila) => [fila.prestadorId, fila.prestadorNombre])).entries()).sort((a, b) => a[1].localeCompare(b[1])), [filas])
  const filtradas = filas.filter((fila) => (!desde || fila.fechaEvento >= desde) && (!hasta || fila.fechaEvento <= hasta) && (!prestadorId || fila.prestadorId === prestadorId) && (!busqueda || `${fila.prestadorNombre} ${fila.eventoNombre} ${fila.actividad}`.toLowerCase().includes(busqueda.toLowerCase())))
  const pendientes = filtradas.filter((fila) => !fila.pago && fila.monto > 0)
  const totalPendiente = pendientes.reduce((suma, fila) => suma + fila.monto, 0)

  async function confirmarPago() {
    if (!cuentaId || !auth.currentUser) return setError("Seleccioná la cuenta de origen.")
    setGuardando(true); setError("")
    try {
      await registrarPagosPrestadores({ items: seleccion, cuentaId, userId: auth.currentUser.uid })
      setSeleccion([]); setCuentaId("")
    } catch (e) {
      const mensajes = { "saldo-insuficiente": "La cuenta no tiene saldo suficiente.", "pago-ya-registrado": "Uno de estos pagos ya fue registrado.", "cuenta-no-disponible": "La cuenta ya no está disponible." }
      setError(mensajes[e.message] || "No se pudo registrar el pago.")
    } finally { setGuardando(false) }
  }

  return <div style={pagina}>
    <header style={cabecera}><span style={sobreTitulo}>MOVIMIENTOS</span><h1 style={{ margin: "4px 0" }}>Pago a prestadores</h1><p style={{ margin: 0 }}>Pagos pendientes según los prestadores asignados a cada evento.</p></header>
    <section style={filtros}>
      <Campo label="Desde"><input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} /></Campo>
      <Campo label="Hasta"><input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} /></Campo>
      <Campo label="Prestador"><select value={prestadorId} onChange={(e) => setPrestadorId(e.target.value)}><option value="">Todos</option>{prestadores.map(([id, nombre]) => <option key={id} value={id}>{nombre}</option>)}</select></Campo>
      <Campo label="Buscar"><input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Prestador o evento" /></Campo>
    </section>
    {error && <div style={errorBox}>{error}</div>}
    <section style={tarjeta}>
      <div style={tituloTabla}><strong>Pagos a prestadores</strong><span>{filtradas.length} registros</span></div>
      <div style={{ overflowX: "auto" }}><table style={tabla}><thead><tr>{["Nombre", "Evento", "Fecha", "Actividad", "Monto", "Estado", "Acción"].map((item) => <th key={item} style={th}>{item}</th>)}</tr></thead>
        <tbody>{filtradas.map((fila) => <tr key={fila.pagoId}>
          <td style={td}><strong>{fila.prestadorNombre}</strong></td>
          <td style={td}><Link to={`/evento/${fila.eventoId}`} style={link}>{fila.eventoNombre}</Link></td>
          <td style={td}>{fila.fechaEvento || "—"} {fila.hora}</td><td style={td}>{fila.actividad || "—"}</td>
          <td style={td}><strong>{pesos.format(fila.monto)}</strong></td>
          <td style={td}><span style={fila.pago ? pagado : pendiente}>{fila.pago ? "Pagado" : "No pagado"}</span></td>
          <td style={td}>{fila.pago ? <span>{fila.pago.fechaPago?.toDate?.().toLocaleDateString("es-AR")} · {fila.pago.cuentaNombre}</span> : fila.monto > 0 ? <button style={boton} onClick={() => setSeleccion([fila])}>Pagar</button> : <span>Sin costo</span>}</td>
        </tr>)}{!filtradas.length && <tr><td colSpan="7" style={vacio}>No hay prestadores para los filtros seleccionados.</td></tr>}</tbody>
      </table></div>
      <footer style={pie}><button disabled={!pendientes.length} style={boton} onClick={() => setSeleccion(pendientes)}>Pagar todos</button><strong>Total pendiente: {pesos.format(totalPendiente)}</strong></footer>
    </section>
    {!!seleccion.length && <div style={overlay} onClick={() => !guardando && setSeleccion([])}><div style={modal} onClick={(e) => e.stopPropagation()}><h2 style={{ marginTop: 0 }}>{seleccion.length === 1 ? "Pagar al prestador" : `Pagar a ${seleccion.length} prestadores`}</h2><p>Total: <strong>{pesos.format(seleccion.reduce((s, i) => s + i.monto, 0))}</strong></p><Campo label="Cuenta"><select value={cuentaId} onChange={(e) => setCuentaId(e.target.value)}><option value="">Seleccione la cuenta</option>{cuentas.map((cuenta) => <option key={cuenta.id} value={cuenta.id}>{cuenta.nombre}</option>)}</select></Campo><div style={acciones}><button style={cancelar} onClick={() => setSeleccion([])}>Cancelar</button><button disabled={guardando || !cuentaId} style={boton} onClick={confirmarPago}>{guardando ? "Registrando..." : "Registrar pago"}</button></div></div></div>}
  </div>
}

function Campo({ label, children }) { return <label><span style={labelStyle}>{label}</span>{children}</label> }
const pagina={maxWidth:1250,margin:"0 auto"},cabecera={padding:24,borderRadius:18,color:"white",background:"linear-gradient(100deg,#4e2581,#63349a)"},sobreTitulo={color:"#bfe8ff",fontSize:12,fontWeight:700,letterSpacing:".12em"},filtros={display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:14,margin:"18px 0",padding:18,background:"white",border:"1px solid #e8e1ee",borderRadius:15},labelStyle={display:"block",marginBottom:7,fontWeight:700,color:"#4b4058"},tarjeta={background:"white",border:"1px solid #e8e1ee",borderRadius:15,overflow:"hidden"},tituloTabla={display:"flex",justifyContent:"space-between",padding:17,color:"#4e2581",fontSize:18},tabla={width:"100%",borderCollapse:"collapse"},th={padding:12,textAlign:"left",background:"#f5f0fa",color:"#4e2581",fontSize:13},td={padding:12,borderTop:"1px solid #eee7f4",fontSize:14},link={color:"#4e2581",fontWeight:700},pagado={padding:"4px 8px",borderRadius:6,background:"#dcfce7",color:"#16865c",fontWeight:700,fontSize:12},pendiente={...pagado,background:"#fff4bf",color:"#8a6500"},boton={padding:"9px 15px",border:0,borderRadius:8,background:"#4e2581",color:"white",fontWeight:700,cursor:"pointer"},pie={display:"flex",justifyContent:"space-between",alignItems:"center",padding:16,background:"#faf8fc",color:"#b42339"},vacio={padding:30,textAlign:"center",color:"#776d83"},overlay={position:"fixed",inset:0,zIndex:1000,display:"grid",placeItems:"center",padding:18,background:"rgba(28,17,40,.5)"},modal={width:"min(460px,100%)",padding:24,borderRadius:16,background:"white",boxShadow:"0 24px 60px rgba(0,0,0,.25)"},acciones={display:"flex",justifyContent:"flex-end",gap:10,marginTop:22},cancelar={...boton,background:"#eee9f1",color:"#665b71"},errorBox={marginBottom:15,padding:12,borderRadius:10,background:"#fff1f2",color:"#be123c"}
