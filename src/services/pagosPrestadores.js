import { collection, doc, onSnapshot, runTransaction, serverTimestamp, Timestamp } from "firebase/firestore"
import { db } from "../firebase"

export function observarPagosPrestadores(onData, onError) {
  return onSnapshot(collection(db, "pagosPrestadores"), (snapshot) => {
    onData(Object.fromEntries(snapshot.docs.map((item) => [item.id, { id: item.id, ...item.data() }])))
  }, onError)
}

export async function registrarPagosPrestadores({ items, cuentaId, userId }) {
  const pagos = items.filter((item) => Number(item.monto) > 0)
  if (!pagos.length) throw new Error("sin-pagos")
  const cuentaRef = doc(db, "cuentas", cuentaId)
  const usuarioRef = doc(db, "usuarios", userId)
  const pagoRefs = pagos.map((item) => doc(db, "pagosPrestadores", item.pagoId))
  const movimientoRef = doc(collection(db, "movimientos"))

  return runTransaction(db, async (transaction) => {
    const [cuentaSnap, usuarioSnap, pagosSnaps] = await Promise.all([
      transaction.get(cuentaRef),
      transaction.get(usuarioRef),
      Promise.all(pagoRefs.map((ref) => transaction.get(ref)))
    ])
    if (!cuentaSnap.exists() || cuentaSnap.data().activa === false) throw new Error("cuenta-no-disponible")
    if (pagosSnaps.some((snap) => snap.exists() && snap.data().anulado !== true)) throw new Error("pago-ya-registrado")

    const cuenta = cuentaSnap.data()
    const total = pagos.reduce((suma, item) => suma + Number(item.monto), 0)
    if (total > Number(cuenta.saldoActual || 0)) throw new Error("saldo-insuficiente")
    const usuario = usuarioSnap.exists() ? usuarioSnap.data() : {}
    const usuarioNombre = [usuario.nombre, usuario.apellido].filter(Boolean).join(" ") || usuario.email || "Usuario"
    const fecha = Timestamp.now()

    transaction.set(movimientoRef, {
      categoria: "egreso",
      tipoMovimientoNombre: "Pago a prestadores",
      cuentaId,
      cuentaNombre: cuenta.nombre,
      cuentaOrigenId: null,
      cuentaOrigenNombre: "",
      cuentaDestinoId: null,
      cuentaDestinoNombre: "",
      monto: total,
      moneda: "ARS",
      fecha,
      concepto: pagos.length === 1 ? `Pago a ${pagos[0].prestadorNombre}` : `Pago a ${pagos.length} prestadores`,
      descripcion: pagos.map((item) => `${item.prestadorNombre} · ${item.eventoNombre}`).join("; "),
      origen: "prestadores",
      referenciaId: movimientoRef.id,
      anulado: false,
      creadoPor: userId,
      creadoPorNombre: usuarioNombre,
      creadoPorEmail: usuario.email || "",
      creadoEn: serverTimestamp()
    })

    pagos.forEach((item, index) => transaction.set(pagoRefs[index], {
      eventoId: item.eventoId,
      eventoNombre: item.eventoNombre,
      prestadorId: item.prestadorId,
      prestadorNombre: item.prestadorNombre,
      actividad: item.actividad || "",
      monto: Number(item.monto),
      moneda: "ARS",
      cuentaId,
      cuentaNombre: cuenta.nombre,
      movimientoId: movimientoRef.id,
      fechaEvento: item.fechaEvento,
      fechaPago: fecha,
      creadoPor: userId,
      creadoPorNombre: usuarioNombre,
      creadoPorEmail: usuario.email || "",
      creadoEn: serverTimestamp(),
      anulado: false
    }))

    transaction.update(cuentaRef, {
      saldoActual: Number(cuenta.saldoActual || 0) - total,
      ultimaOperacionId: movimientoRef.id,
      actualizadoPor: userId,
      actualizadoEn: serverTimestamp()
    })
  })
}

export async function anularPagoPrestadores({ pagos, motivo, userId }) {
  if (!pagos.length || !motivo.trim()) throw new Error("anulacion-invalida")
  const movimientoId = pagos[0].movimientoId
  if (!movimientoId || pagos.some((pago) => pago.movimientoId !== movimientoId || pago.anulado === true)) throw new Error("grupo-pago-invalido")

  const movimientoRef = doc(db, "movimientos", movimientoId)
  const cuentaRef = doc(db, "cuentas", pagos[0].cuentaId)
  const usuarioRef = doc(db, "usuarios", userId)
  const pagoRefs = pagos.map((pago) => doc(db, "pagosPrestadores", pago.id))
  const reversionRef = doc(collection(db, "movimientos"))

  return runTransaction(db, async (transaction) => {
    const [movimientoSnap, cuentaSnap, usuarioSnap, pagoSnaps] = await Promise.all([
      transaction.get(movimientoRef), transaction.get(cuentaRef), transaction.get(usuarioRef),
      Promise.all(pagoRefs.map((ref) => transaction.get(ref)))
    ])
    if (!movimientoSnap.exists() || movimientoSnap.data().origen !== "prestadores" || movimientoSnap.data().anulado === true) throw new Error("movimiento-no-disponible")
    if (!cuentaSnap.exists()) throw new Error("cuenta-no-disponible")
    if (pagoSnaps.some((snap) => !snap.exists() || snap.data().anulado === true || snap.data().movimientoId !== movimientoId)) throw new Error("pago-no-disponible")

    const movimiento = movimientoSnap.data()
    const cuenta = cuentaSnap.data()
    const usuario = usuarioSnap.exists() ? usuarioSnap.data() : {}
    const usuarioNombre = [usuario.nombre, usuario.apellido].filter(Boolean).join(" ") || usuario.email || "Usuario"
    const total = Number(movimiento.monto || 0)
    if (!Number.isFinite(total) || total <= 0) throw new Error("monto-invalido")
    const totalPagos = pagoSnaps.reduce((suma, snap) => suma + Number(snap.data().monto || 0), 0)
    if (totalPagos !== total || pagoSnaps.some((snap) => snap.data().cuentaId !== pagos[0].cuentaId)) throw new Error("grupo-pago-incompleto")

    transaction.set(reversionRef, {
      categoria: "ingreso", tipoMovimientoNombre: "Anulación de pago a prestadores",
      cuentaId: pagos[0].cuentaId, cuentaNombre: cuenta.nombre,
      cuentaOrigenId: null, cuentaOrigenNombre: "", cuentaDestinoId: null, cuentaDestinoNombre: "",
      monto: total, moneda: "ARS", fecha: Timestamp.now(),
      concepto: `Anulación: ${movimiento.concepto || "Pago a prestadores"}`,
      descripcion: motivo.trim(), origen: "anulacion-prestadores", referenciaId: movimientoId,
      anulado: false, creadoPor: userId, creadoPorNombre: usuarioNombre,
      creadoPorEmail: usuario.email || "", creadoEn: serverTimestamp()
    })
    transaction.update(movimientoRef, { anulado: true, anuladoPor: userId, anuladoPorNombre: usuarioNombre, anuladoEn: serverTimestamp(), movimientoAnulacionId: reversionRef.id, motivoAnulacion: motivo.trim() })
    pagoRefs.forEach((ref) => transaction.update(ref, { anulado: true, anuladoPor: userId, anuladoPorNombre: usuarioNombre, anuladoEn: serverTimestamp(), motivoAnulacion: motivo.trim(), movimientoAnulacionId: reversionRef.id }))
    transaction.update(cuentaRef, { saldoActual: Number(cuenta.saldoActual || 0) + total, ultimaOperacionId: reversionRef.id, actualizadoPor: userId, actualizadoEn: serverTimestamp() })
  })
}
