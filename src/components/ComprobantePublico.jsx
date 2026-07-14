import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { Check, Link2, MessageCircle, Printer } from "lucide-react"
import { obtenerComprobantePublico } from "../services/comprobantes"

const pesos = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })
const fecha = new Intl.DateTimeFormat("es-AR")

function fechaTexto(valor) {
  if (!valor) return "—"
  const date = new Date(`${valor}T12:00:00`)
  return Number.isNaN(date.getTime()) ? valor : fecha.format(date)
}

export default function ComprobantePublico() {
  const { id } = useParams()
  const [comprobante, setComprobante] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState("")
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    obtenerComprobantePublico(id)
      .then((data) => data ? setComprobante(data) : setError("El comprobante no existe."))
      .catch((loadError) => { console.error(loadError); setError("No se pudo cargar el comprobante.") })
      .finally(() => setCargando(false))
  }, [id])

  async function copiarEnlace() {
    await navigator.clipboard.writeText(window.location.href)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 1800)
  }

  function compartirWhatsApp() {
    const texto = `Fun Space · Comprobante de cobro\nEvento: ${comprobante.eventoNombre}\nConcepto: ${comprobante.concepto}\nMonto: ${pesos.format(comprobante.monto)}\n${window.location.href}`
    const destino = comprobante.clienteTelefono ? `/${comprobante.clienteTelefono}` : ""
    window.open(`https://wa.me${destino}?text=${encodeURIComponent(texto)}`, "_blank", "noopener,noreferrer")
  }

  if (cargando) return <div style={mensaje}>Cargando comprobante...</div>
  if (error || !comprobante) return <div style={mensaje}>{error || "Comprobante no disponible."}</div>

  return <div className="receipt-page">
    <div className="receipt-actions" aria-label="Acciones del comprobante">
      <button onClick={() => window.print()} title="Imprimir comprobante" aria-label="Imprimir comprobante"><Printer size={20} /></button>
      <button onClick={copiarEnlace} title="Copiar enlace" aria-label="Copiar enlace">{copiado ? <Check size={20} /> : <Link2 size={20} />}</button>
      <button onClick={compartirWhatsApp} title="Compartir por WhatsApp" aria-label="Compartir por WhatsApp"><MessageCircle size={20} /></button>
    </div>
    <main className="receipt-sheet">
      <Comprobante datos={comprobante} copia="Cliente" />
      <div className="receipt-cut" />
      <Comprobante datos={comprobante} copia="Comercio" />
    </main>
    {copiado && <div className="receipt-toast">Enlace copiado</div>}
  </div>
}

function Comprobante({ datos, copia }) {
  const inicio = `${fechaTexto(datos.fechaEvento)}${datos.horaInicio ? ` ${datos.horaInicio}` : ""}`
  const fin = `${fechaTexto(datos.fechaFinEvento)}${datos.horaFin ? ` ${datos.horaFin}` : ""}`
  return <section className="receipt-copy">
    <header className="receipt-header">
      <Marca />
      <div className="receipt-heading"><span>FUN SPACE</span><h1>Comprobante de cobro</h1><small>Copia {copia}</small></div>
    </header>
    <div className="receipt-accent" />
    <div className="receipt-meta">
      <span>Nro. <strong>{datos.numero}</strong></span>
      <span>Evento: <strong>{datos.eventoNombre}</strong></span>
      <span>Fecha: <strong>{fechaTexto(datos.fechaComprobante)}</strong></span>
    </div>
    {datos.anulado && <div className="receipt-annulled">COMPROBANTE ANULADO</div>}
    <div className="receipt-info-grid">
      <div><h2>Destinatario</h2><p><strong>Nombre:</strong> {datos.clienteNombre}</p><p><strong>Teléfono:</strong> {datos.clienteTelefono || "—"}</p><p><strong>Evento:</strong> {datos.eventoNombre}</p></div>
      <div><h2>Detalle del pago</h2><p><strong>Emitido por:</strong> {datos.emitidoPor}</p><p><strong>Fecha de cobro:</strong> {fechaTexto(datos.fechaComprobante)}</p><p><strong>Inicio:</strong> {inicio} · <strong>Fin:</strong> {fin}</p></div>
    </div>
    <div className="receipt-details">
      <h2>Detalles</h2>
      <div className="receipt-detail-head"><span>Descripción</span><span>Concepto</span><span>Monto</span></div>
      <div className="receipt-detail-row"><span>{datos.descripcion || "—"}</span><span>{datos.concepto}</span><strong>{pesos.format(Number(datos.monto || 0))}</strong></div>
    </div>
    <footer><span>Fun Space · Diversión asegurada</span><span>{datos.cuentaNombre ? `Cuenta: ${datos.cuentaNombre}` : ""}</span></footer>
  </section>
}

function Marca() { return <div className="receipt-brand" aria-label="Fun Space"><span>FUN</span><strong>SPACE</strong><i /></div> }

const mensaje = { minHeight: "100vh", display: "grid", placeItems: "center", padding: 30, color: "#776d83", background: "#f7f5fb" }
