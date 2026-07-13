import { collection, doc, onSnapshot, query, runTransaction, serverTimestamp, Timestamp, where } from "firebase/firestore"
import { db } from "../firebase"

export async function registrarCobro({ eventoId, cuentaId, monto, fecha, concepto, descripcion, userId }) {
  const eventoRef = doc(db, "eventos", eventoId)
  const cuentaRef = doc(db, "cuentas", cuentaId)
  const usuarioRef = doc(db, "usuarios", userId)
  const cobroRef = doc(collection(db, "cobros"))
  const movimientoRef = doc(collection(db, "movimientos"))
  const fechaTimestamp = Timestamp.fromDate(new Date(`${fecha}T12:00:00`))

  return runTransaction(db, async (transaction) => {
    const eventoSnap = await transaction.get(eventoRef)
    const cuentaSnap = await transaction.get(cuentaRef)
    const usuarioSnap = await transaction.get(usuarioRef)
    if (!eventoSnap.exists()) throw new Error("evento-no-disponible")
    if (!cuentaSnap.exists() || cuentaSnap.data().activa === false) throw new Error("cuenta-no-disponible")

    const evento = eventoSnap.data()
    const cuenta = cuentaSnap.data()
    const usuario = usuarioSnap.exists() ? usuarioSnap.data() : {}
    const usuarioNombre = [usuario.nombre, usuario.apellido].filter(Boolean).join(" ") || usuario.email || "Usuario"
    const saldo = Number(evento.saldo ?? (Number(evento.total || 0) - Number(evento.totalCobrado ?? evento.sena ?? 0)))
    if (monto > saldo) throw new Error("monto-supera-saldo")

    const totalCobradoAnterior = Number(evento.totalCobrado ?? evento.sena ?? 0)
    const nuevoTotalCobrado = totalCobradoAnterior + monto
    const nuevoSaldo = saldo - monto
    const estadoPagado = String(evento.estado || "").toLowerCase() === "pagado" ? evento.estado : "Pagado"

    transaction.set(cobroRef, {
      eventoId,
      cuentaId,
      movimientoId: movimientoRef.id,
      monto,
      moneda: "ARS",
      fecha: fechaTimestamp,
      concepto: concepto.trim() || "Cobro de evento",
      descripcion: descripcion.trim(),
      metodoPago: cuenta.nombre,
      anulado: false,
      creadoPor: userId,
      creadoPorNombre: usuarioNombre,
      creadoPorEmail: usuario.email || "",
      creadoEn: serverTimestamp(),
      anuladoPor: null,
      anuladoEn: null
    })

    transaction.set(movimientoRef, {
      categoria: "ingreso",
      tipoMovimientoNombre: "Cobro de evento",
      cuentaId,
      cuentaNombre: cuenta.nombre,
      cuentaOrigenId: null,
      cuentaOrigenNombre: "",
      cuentaDestinoId: null,
      cuentaDestinoNombre: "",
      monto,
      moneda: "ARS",
      fecha: fechaTimestamp,
      concepto: concepto.trim() || `Cobro evento ${eventoId}`,
      descripcion: descripcion.trim(),
      origen: "cobro",
      referenciaId: cobroRef.id,
      anulado: false,
      creadoPor: userId,
      creadoPorNombre: usuarioNombre,
      creadoPorEmail: usuario.email || "",
      creadoEn: serverTimestamp()
    })

    transaction.update(eventoRef, {
      sena: nuevoTotalCobrado,
      totalCobrado: nuevoTotalCobrado,
      saldo: nuevoSaldo,
      estado: nuevoSaldo === 0 ? estadoPagado : evento.estado,
      ultimoCobroId: cobroRef.id,
      actualizadoPor: userId,
      actualizadoEn: serverTimestamp()
    })

    transaction.update(cuentaRef, {
      saldoActual: Number(cuenta.saldoActual || 0) + monto,
      ultimaOperacionId: movimientoRef.id,
      actualizadoPor: userId,
      actualizadoEn: serverTimestamp()
    })

    return cobroRef.id
  })
}

export function observarCobrosEvento(eventoId, onData, onError) {
  const consulta = query(collection(db, "cobros"), where("eventoId", "==", eventoId))
  return onSnapshot(consulta, (snapshot) => {
    const cobros = snapshot.docs
      .map((item) => ({ id: item.id, ...item.data() }))
      .sort((a, b) => (b.fecha?.toMillis?.() || 0) - (a.fecha?.toMillis?.() || 0))
    onData(cobros)
  }, onError)
}
