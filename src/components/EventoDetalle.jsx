import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { deleteDoc, doc, getDoc, updateDoc } from "firebase/firestore"
import { auth, db } from "../firebase"
import { anularCobro, observarCobrosEvento } from "../services/cobros"
import { useUserRole } from "../hooks/useUserRole"
import { enlaceWhatsApp } from "../utils/whatsapp"
import { crearComprobantePublico } from "../services/comprobantes"

const pesos = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })
const fechaTexto = new Intl.DateTimeFormat("es-AR")

export default function EventoDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { hasPermission, role } = useUserRole(auth.currentUser)
  const [evento, setEvento] = useState(null)
  const [cobros, setCobros] = useState([])
  const [cargando, setCargando] = useState(true)
  const [anulandoId, setAnulandoId] = useState("")
  const [generandoComprobanteId, setGenerandoComprobanteId] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    getDoc(doc(db, "eventos", id)).then((snapshot) => {
      setEvento(snapshot.exists() ? { ...snapshot.data(), id: snapshot.id } : null)
      setCargando(false)
    }).catch(() => { setError("No se pudo cargar el evento."); setCargando(false) })
    return observarCobrosEvento(id, setCobros, (loadError) => {
      console.error(loadError)
      setError("No se pudieron cargar los cobros del evento.")
    })
  }, [id])

  async function cambiarEstado(estado) {
    try {
      await updateDoc(doc(db, "eventos", id), { estado })
      setEvento({ ...evento, estado })
    } catch { setError("No se pudo cambiar el estado.") }
  }

  async function eliminarEvento() {
    if (!confirm("¿Seguro querés eliminar este evento?")) return
    try { await deleteDoc(doc(db, "eventos", id)); navigate("/eventos") }
    catch { setError("No se pudo eliminar el evento.") }
  }

  async function anular(cobro) {
    const motivo = prompt("Ingresá el motivo de la anulación:")?.trim()
    if (!motivo) return
    if (!confirm(`¿Confirmás la anulación del cobro por ${pesos.format(Number(cobro.monto || 0))}?`)) return
    if (!auth.currentUser) return setError("La sesión no está disponible.")
    setAnulandoId(cobro.id)
    setError("")
    try {
      await anularCobro({ cobroId: cobro.id, motivo, userId: auth.currentUser.uid })
      const snapshot = await getDoc(doc(db, "eventos", id))
      if (snapshot.exists()) setEvento({ ...snapshot.data(), id: snapshot.id })
    } catch (annulError) {
      console.error(annulError)
      const mensajes = {
        "cobro-ya-anulado": "El cobro ya estaba anulado.",
        "saldo-cuenta-insuficiente": "La cuenta no tiene saldo suficiente para revertir este cobro.",
        "cuenta-no-disponible": "La cuenta asociada ya no está disponible.",
        "evento-no-disponible": "El evento asociado ya no está disponible."
      }
      setError(mensajes[annulError.message] || "No se pudo anular el cobro.")
    } finally { setAnulandoId("") }
  }

  async function abrirComprobante(cobro) {
    if (!auth.currentUser) return setError("La sesión no está disponible.")
    const nuevaVentana = window.open("", "_blank")
    if (!nuevaVentana) return setError("El navegador bloqueó la nueva ventana. Habilitá las ventanas emergentes e intentá nuevamente.")
    nuevaVentana.document.title = "Generando comprobante..."
    nuevaVentana.document.body.innerHTML = "<p style='font-family:sans-serif;padding:30px'>Generando comprobante...</p>"
    setGenerandoComprobanteId(cobro.id)
    setError("")
    try {
      const comprobanteId = await crearComprobantePublico({ cobro, evento, userId: auth.currentUser.uid })
      nuevaVentana.location.replace(`${window.location.origin}/comprobante/${comprobanteId}`)
    } catch (receiptError) {
      console.error(receiptError)
      nuevaVentana.close()
      setError("No se pudo generar el comprobante.")
    } finally { setGenerandoComprobanteId("") }
  }

  if (cargando) return <div style={mensaje}>Cargando evento...</div>
  if (!evento) return <div style={mensaje}>Evento no encontrado.</div>

  const total = Number(evento.total || 0)
  const cobrado = Number(evento.totalCobrado ?? evento.sena ?? 0)
  const saldo = Number(evento.saldo ?? total - cobrado)
  const porcentaje = total > 0 ? Math.min(100, Math.round((cobrado / total) * 100)) : 0
  const prestadores = evento.prestadores || []

  return (
    <div style={pagina}>
      <div style={cabecera}>
        <div><span style={sobreTitulo}>DETALLE DEL EVENTO</span><h1 style={{ margin: "3px 0 4px" }}>{evento.cliente || evento.title}</h1><span style={{ color: "#e9dcf6" }}>Código {evento.id}</span></div>
        <div style={acciones}>
          {hasPermission("eventosEditar") && <button onClick={() => navigate(`/evento/${id}/editar`)} style={botonClaro}>Editar</button>}
          {hasPermission("cobrosRegistrar") && saldo > 0 && <button onClick={() => navigate(`/evento/${id}/cobro`)} style={botonAmarillo}>Registrar cobro</button>}
          {hasPermission("eventosEditar") && <button onClick={() => cambiarEstado("Confirmado")} style={botonClaro}>Confirmar</button>}
          {hasPermission("eventosCancelar") && <button onClick={() => cambiarEstado("Cancelado")} style={botonPeligro}>Cancelar evento</button>}
          {role === "admin" && <button onClick={eliminarEvento} style={botonPeligro}>Eliminar</button>}
        </div>
      </div>

      {error && <div role="alert" style={errorBox}>{error}</div>}

      <Seccion titulo={`Datos del evento · ${evento.cliente || evento.title}`}>
        <div style={dosColumnas}>
          <div style={panelInterno}>
            <h3 style={subtitulo}>Información básica</h3>
            <Dato label="Cliente" valor={evento.clienteId ? <Link to={`/clientes/${evento.clienteId}`} style={clienteLink}>{evento.cliente || evento.title}</Link> : evento.cliente || evento.title} />
            <Dato label="Teléfono" valor={evento.telefono ? <a href={enlaceWhatsApp(evento.telefono)} target="_blank" rel="noreferrer" style={whatsappLink}>{evento.telefono}</a> : null} />
            <Dato label="Dirección" valor={evento.direccion} />
            <Dato label="Tipo de evento" valor={evento.tipoEventoNombre || evento.tipoEvento} />
            <Dato label="Estado" valor={evento.estado} badge />
            <Dato label="Fecha" valor={evento.fecha} />
            <Dato label="Horario" valor={`${evento.hora || evento.horaInicio || "—"} a ${evento.horaFin || "—"}`} />
            <Dato label="Personas" valor={evento.personas} />
            <Dato label="Niños" valor={evento.cantidadNinos} />
          </div>
          <div style={panelInterno}>
            <h3 style={subtitulo}>Contabilidad</h3>
            <FilaContable label="Moneda" valor="Peso argentino" />
            <FilaContable label="Precio total" valor={pesos.format(total)} />
            <FilaContable label="Cobrado" valor={pesos.format(cobrado)} />
            <FilaContable label="Saldo pendiente" valor={pesos.format(saldo)} destacado={saldo > 0} />
            <FilaContable label="Porcentaje pagado" valor={`${porcentaje}%`} />
            <div style={barra}><div style={{ ...progreso, width: `${porcentaje}%` }} /></div>
          </div>
        </div>
        <div style={{ ...panelInterno, marginTop: 16 }}><h3 style={subtitulo}>Detalle y notas</h3><p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{evento.observaciones || "Sin observaciones"}</p></div>
      </Seccion>

      <Seccion titulo="Servicio contratado">
        <Tabla columnas={["Servicio", "Cantidad", "Precio", "Total"]}>
          <tr><td style={td}><strong>{evento.tipoEventoNombre || evento.tipoEvento || "Servicio del salón"}</strong></td><td style={td}>1</td><td style={td}>{pesos.format(total)}</td><td style={td}>{pesos.format(total)}</td></tr>
        </Tabla>
      </Seccion>

      <Seccion titulo="Prestadores">
        <Tabla columnas={["Nombre", "Actividad", "Costo", "Precio"]}>
          {prestadores.map((prestador, index) => <tr key={prestador.id || index}>
            <td style={td}>{[prestador.nombre, prestador.apellido].filter(Boolean).join(" ") || "—"}</td>
            <td style={td}>{prestador.actividad || "—"}</td>
            <td style={td}>{pesos.format(Number(prestador.costo || 0))}</td>
            <td style={td}>{pesos.format(Number(prestador.precio || prestador.precioAcordado || 0))}</td>
          </tr>)}
          {prestadores.length === 0 && <FilaVacia columnas="4" texto="No hay prestadores asignados" />}
        </Tabla>
      </Seccion>

      <Seccion titulo="Movimientos y cobros">
        <div style={resumenCobros}>
          <MiniResumen label="Precio total" valor={pesos.format(total)} />
          <MiniResumen label="Cobrado" valor={pesos.format(cobrado)} />
          <MiniResumen label="Saldo" valor={pesos.format(saldo)} />
          <MiniResumen label="Pagado" valor={`${porcentaje}%`} />
        </div>
        <Tabla columnas={["Fecha", "Concepto", "Descripción", "Cuenta", "Usuario", "Monto cobrado", "Acciones"]}>
          {cobros.map((cobro) => <tr key={cobro.id} style={cobro.anulado ? { opacity: .62, background: "#fff1f2" } : undefined}>
            <td style={td}><button onClick={() => abrirComprobante(cobro)} disabled={generandoComprobanteId === cobro.id} style={fechaComprobanteBtn}>{generandoComprobanteId === cobro.id ? "Generando..." : cobro.fecha?.toDate ? fechaTexto.format(cobro.fecha.toDate()) : "—"}</button></td>
            <td style={td}>{cobro.concepto || "Cobro de evento"}{cobro.anulado && <div style={anuladoBadge}>ANULADO</div>}</td>
            <td style={td}>{cobro.anulado ? cobro.motivoAnulacion || "Sin motivo" : cobro.descripcion || "—"}</td>
            <td style={td}>{cobro.metodoPago || "—"}</td>
            <td style={td}>{cobro.creadoPorNombre || cobro.creadoPorEmail || cobro.creadoPor?.slice?.(0, 8) || "—"}</td>
            <td style={{ ...td, color: cobro.anulado ? "#b42339" : "#16865c", fontWeight: 700, textDecoration: cobro.anulado ? "line-through" : "none" }}>{pesos.format(Number(cobro.monto || 0))}</td>
            <td style={td}>{role === "admin" && hasPermission("cobrosAnular") && !cobro.anulado ? <button onClick={() => anular(cobro)} disabled={anulandoId === cobro.id} style={anularBtn}>{anulandoId === cobro.id ? "Anulando..." : "Anular"}</button> : "—"}</td>
          </tr>)}
          {cobros.length === 0 && <FilaVacia columnas="7" texto="Todavía no hay cobros registrados en el historial" />}
        </Tabla>
      </Seccion>
    </div>
  )
}

function Seccion({ titulo, children }) { return <section style={seccion}><div style={seccionTitulo}>{titulo}</div><div style={seccionContenido}>{children}</div></section> }
function Dato({ label, valor, badge }) { return <div style={dato}><strong>{label}:</strong><span style={badge ? estadoBadge : undefined}>{valor || "—"}</span></div> }
function FilaContable({ label, valor, destacado }) { return <div style={filaContable}><span>{label}</span><strong style={destacado ? { color: "#c0394b" } : undefined}>{valor}</strong></div> }
function Tabla({ columnas, children }) { return <div style={{ overflowX: "auto" }}><table style={tabla}><thead><tr>{columnas.map((columna) => <th key={columna} style={th}>{columna}</th>)}</tr></thead><tbody>{children}</tbody></table></div> }
function FilaVacia({ columnas, texto }) { return <tr><td colSpan={columnas} style={mensaje}>{texto}</td></tr> }
function MiniResumen({ label, valor }) { return <div style={miniResumen}><span>{label}</span><strong>{valor}</strong></div> }

const pagina = { maxWidth: 1400, margin: "0 auto" }
const cabecera = { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 18, padding: "22px 25px", borderRadius: 18, color: "white", background: "linear-gradient(100deg,#4e2581,#63349a)", boxShadow: "0 14px 30px rgba(78,37,129,.16)" }
const sobreTitulo = { color: "#bfe8ff", fontSize: 12, fontWeight: 700, letterSpacing: ".12em" }
const acciones = { display: "flex", gap: 8, flexWrap: "wrap" }
const botonBase = { padding: "9px 13px", border: 0, borderRadius: 9, fontWeight: 700, cursor: "pointer" }
const botonClaro = { ...botonBase, background: "rgba(255,255,255,.15)", color: "white", border: "1px solid rgba(255,255,255,.25)" }
const botonAmarillo = { ...botonBase, background: "#f4d00c", color: "#38145f" }
const botonPeligro = { ...botonBase, background: "#fff0f2", color: "#b42339" }
const seccion = { marginTop: 20, overflow: "hidden", borderRadius: 16, background: "white", border: "1px solid #e8e1ee", boxShadow: "0 10px 27px rgba(78,37,129,.06)" }
const seccionTitulo = { padding: "13px 18px", color: "white", background: "linear-gradient(90deg,#4e2581,#63349a)", fontFamily: "Fredoka", fontSize: 17 }
const seccionContenido = { padding: 18 }
const dosColumnas = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(330px,1fr))", gap: 16 }
const panelInterno = { padding: 17, border: "1px solid #e8e1ee", borderRadius: 12, background: "#fcfbfd" }
const subtitulo = { margin: "0 0 15px", color: "#4e2581", fontSize: 18 }
const dato = { display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap", marginBottom: 10, fontSize: 14 }
const estadoBadge = { padding: "4px 8px", borderRadius: 999, color: "#4e2581", background: "#eee7f7", fontSize: 12, fontWeight: 700 }
const filaContable = { display: "flex", justifyContent: "space-between", gap: 15, padding: "12px 10px", borderBottom: "1px solid #e8e1ee", fontSize: 14 }
const barra = { height: 8, marginTop: 17, overflow: "hidden", borderRadius: 999, background: "#eee7f7" }
const progreso = { height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#57b6ee,#4e2581)" }
const tabla = { width: "100%", borderCollapse: "collapse" }
const th = { padding: 12, textAlign: "left", color: "#4b4058", background: "#f7f5fb", border: "1px solid #e8e1ee", fontSize: 13, whiteSpace: "nowrap" }
const td = { padding: 12, border: "1px solid #e8e1ee", fontSize: 13, whiteSpace: "nowrap" }
const resumenCobros = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12, marginBottom: 18 }
const miniResumen = { display: "flex", flexDirection: "column", gap: 5, padding: 14, borderRadius: 11, color: "#4e2581", background: "#f7f5fb", border: "1px solid #e8e1ee" }
const mensaje = { padding: 32, textAlign: "center", color: "#776d83" }
const errorBox = { marginTop: 16, padding: 12, borderRadius: 10, background: "#fff1f2", color: "#be123c" }
const whatsappLink = { color: "#168c52", fontWeight: 700, textDecoration: "none" }
const clienteLink = { color: "#4e2581", fontWeight: 700, textDecoration: "none" }
const anuladoBadge = { display: "inline-block", marginLeft: 7, padding: "2px 6px", borderRadius: 999, background: "#fee2e2", color: "#b42339", fontSize: 10, fontWeight: 800 }
const anularBtn = { padding: "7px 11px", border: 0, borderRadius: 7, background: "#fff0f2", color: "#b42339", fontWeight: 700, cursor: "pointer" }
const fechaComprobanteBtn = { padding: 0, border: 0, background: "transparent", color: "#4e2581", fontWeight: 700, textDecoration: "underline", cursor: "pointer", boxShadow: "none" }
