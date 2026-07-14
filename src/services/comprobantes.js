import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore"
import { db } from "../firebase"

function fechaISO(valor) {
  if (valor?.toDate) return valor.toDate().toISOString().slice(0, 10)
  return String(valor || "")
}

export async function crearComprobantePublico({ cobro, evento, userId }) {
  const referencia = doc(db, "comprobantesPublicos", cobro.id)
  const existente = await getDoc(referencia)
  if (existente.exists()) return cobro.id

  await setDoc(referencia, {
    cobroId: cobro.id,
    numero: cobro.id.slice(-8).toUpperCase(),
    eventoId: cobro.eventoId,
    eventoNombre: evento.nombreEvento || evento.title || evento.cliente || "Evento",
    clienteNombre: evento.cliente || "Cliente",
    fechaComprobante: fechaISO(cobro.fecha),
    fechaEvento: evento.fecha || "",
    fechaFinEvento: evento.fechaFin || evento.fecha || "",
    horaInicio: evento.hora || evento.horaInicio || "",
    horaFin: evento.horaFin || "",
    concepto: cobro.concepto || "Cobro de evento",
    descripcion: cobro.descripcion || "",
    monto: Number(cobro.monto || 0),
    moneda: "ARS",
    cuentaNombre: cobro.metodoPago || "",
    emitidoPor: "Fun Space",
    anulado: cobro.anulado === true,
    creadoPor: userId,
    creadoEn: serverTimestamp()
  })

  return cobro.id
}

export async function obtenerComprobantePublico(comprobanteId) {
  const snapshot = await getDoc(doc(db, "comprobantesPublicos", comprobanteId))
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null
}
