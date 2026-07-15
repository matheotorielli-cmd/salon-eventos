import { doc, getDoc, runTransaction, serverTimestamp } from "firebase/firestore"
import { db } from "../firebase"
import { numeroWhatsApp } from "../utils/whatsapp"

function fechaISO(valor) {
  if (valor?.toDate) return valor.toDate().toISOString().slice(0, 10)
  return String(valor || "")
}

export async function crearComprobantePublico({ cobro, evento, userId }) {
  const referencia = doc(db, "comprobantesPublicos", cobro.id)
  const clienteTelefono = numeroWhatsApp(evento.telefono)
  const ventaBebidas = cobro.ventaBebidasId ? (evento.ventasBebidas || []).find((venta) => venta.id === cobro.ventaBebidasId) : null
  const detalleBebidas = ventaBebidas?.items || []
  const distribucion = cobro.distribucion || (cobro.cuentaId ? [{ cuentaId: cobro.cuentaId, cuentaNombre: cobro.metodoPago || "", monto: Number(cobro.monto || 0), movimientoId: cobro.movimientoId || "" }] : [])
  const fechaComprobante = fechaISO(cobro.fecha)
  const anio = /^\d{4}/.test(fechaComprobante) ? fechaComprobante.slice(0, 4) : String(new Date().getFullYear())
  const contadorRef = doc(db, "contadores", `comprobantes-${anio}`)
  const datosBase = {
    cobroId: cobro.id,
    eventoId: cobro.eventoId,
    eventoNombre: evento.nombreEvento || evento.title || evento.cliente || "Evento",
    clienteNombre: evento.cliente || "Cliente",
    clienteTelefono,
    fechaComprobante,
    fechaEvento: evento.fecha || "",
    fechaFinEvento: evento.fechaFin || evento.fecha || "",
    horaInicio: evento.hora || evento.horaInicio || "",
    horaFin: evento.horaFin || "",
    concepto: cobro.concepto || "Cobro de evento",
    descripcion: cobro.descripcion || "",
    monto: Number(cobro.monto || 0),
    moneda: "ARS",
    cuentaNombre: cobro.metodoPago || "",
    detalleBebidas,
    distribucion,
    registradoPor: cobro.creadoPorNombre || cobro.creadoPorEmail || "Usuario",
    emitidoPor: "Fun Space",
    anulado: cobro.anulado === true,
    creadoPor: userId,
    creadoEn: serverTimestamp()
  }

  await runTransaction(db, async (transaction) => {
    const existente = await transaction.get(referencia)
    const numeroActual = existente.exists() ? String(existente.data().numero || "") : ""
    const necesitaNumero = !/^\d{4}-\d{6}$/.test(numeroActual)
    let numero = numeroActual

    if (necesitaNumero) {
      const contador = await transaction.get(contadorRef)
      const siguiente = Number(contador.data()?.ultimo || 0) + 1
      numero = `${anio}-${String(siguiente).padStart(6, "0")}`
      transaction.set(contadorRef, { ultimo: siguiente, anio: Number(anio), actualizadoPor: userId, actualizadoEn: serverTimestamp() }, { merge: true })
    }

    if (existente.exists()) {
      transaction.update(referencia, {
        numero,
        ...(clienteTelefono ? { clienteTelefono } : {}),
        ...(detalleBebidas.length ? { detalleBebidas } : {}),
        ...(distribucion.length ? { distribucion } : {}),
        registradoPor: cobro.creadoPorNombre || cobro.creadoPorEmail || existente.data().registradoPor || "Usuario",
        actualizadoEn: serverTimestamp()
      })
    } else {
      transaction.set(referencia, { ...datosBase, numero })
    }
  })

  return cobro.id
}

export async function obtenerComprobantePublico(comprobanteId) {
  const snapshot = await getDoc(doc(db, "comprobantesPublicos", comprobanteId))
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null
}

export async function crearComprobanteDesdeMovimiento({ movimiento, userId }) {
  if (!['cobro', 'anulacion'].includes(movimiento.origen) || !movimiento.referenciaId) {
    throw new Error("movimiento-sin-comprobante")
  }

  const cobroSnapshot = await getDoc(doc(db, "cobros", movimiento.referenciaId))
  if (!cobroSnapshot.exists()) throw new Error("cobro-no-disponible")
  const cobro = { ...cobroSnapshot.data(), id: cobroSnapshot.id }
  const eventoSnapshot = await getDoc(doc(db, "eventos", cobro.eventoId))
  if (!eventoSnapshot.exists()) throw new Error("evento-no-disponible")
  const evento = { ...eventoSnapshot.data(), id: eventoSnapshot.id }

  return crearComprobantePublico({ cobro, evento, userId })
}
