import { collection, doc, onSnapshot, query, runTransaction, serverTimestamp, Timestamp, where } from "firebase/firestore"
import { db } from "../firebase"
import { calcularFinanzasEvento } from "../utils/finanzasEvento"

export async function registrarCobro({
  eventoId,
  cuentaId,
  destinos,
  monto,
  montoAplicado,
  descuento,
  porcentajeDescuento,
  tipoCobroId,
  tipoCobroNombre,
  aplicacionesCobro,
  fecha,
  concepto,
  descripcion,
  ventaBebidasId,
  userId
}) {
  const eventoRef = doc(db, "eventos", eventoId)
  const usuarioRef = doc(db, "usuarios", userId)
  const cobroRef = doc(collection(db, "cobros"))
  const fechaTimestamp = Timestamp.fromDate(new Date(`${fecha}T12:00:00`))
  const montoRecibido = Number(monto)
  const montoCancelado = Number(montoAplicado ?? montoRecibido)
  const montoDescuento = Number(descuento || 0)
  const porcentajeBonificacion = Number(porcentajeDescuento || 0)
  const aplicaciones = (aplicacionesCobro || []).map((item) => ({
    cuentaId: item.cuentaId || "",
    tipoCobroId: item.tipoCobroId || "",
    tipoCobroNombre: item.tipoCobroNombre || "",
    porcentajeDescuento: Number(item.porcentajeDescuento || 0),
    montoAplicado: Number(item.montoAplicado || 0),
    descuento: Number(item.descuento || 0),
    monto: Number(item.monto || 0)
  }))
  const distribucion = (destinos?.length ? destinos : [{ cuentaId, monto }]).filter((item) => item.cuentaId && Number(item.monto) > 0).map((item) => ({ cuentaId: item.cuentaId, monto: Number(item.monto) }))
  if (distribucion.length > 5) throw new Error("demasiadas-cuentas")
  const movimientosRefs = distribucion.map(() => doc(collection(db, "movimientos")))

  return runTransaction(db, async (transaction) => {
    const eventoSnap = await transaction.get(eventoRef)
    const cuentasRefs = distribucion.map((item) => doc(db, "cuentas", item.cuentaId))
    const cuentasSnaps = await Promise.all(cuentasRefs.map((ref) => transaction.get(ref)))
    const usuarioSnap = await transaction.get(usuarioRef)
    if (!eventoSnap.exists()) throw new Error("evento-no-disponible")
    if (!distribucion.length || distribucion.reduce((total, item) => total + item.monto, 0) !== montoRecibido) throw new Error("distribucion-invalida")
    if (!Number.isFinite(montoCancelado) || montoCancelado <= 0 || !Number.isFinite(montoDescuento) || montoDescuento < 0 || montoRecibido + montoDescuento !== montoCancelado) throw new Error("descuento-invalido")
    if (!ventaBebidasId && (!aplicaciones.length || aplicaciones.reduce((total, item) => total + item.montoAplicado, 0) !== montoCancelado || aplicaciones.reduce((total, item) => total + item.descuento, 0) !== montoDescuento || aplicaciones.reduce((total, item) => total + item.monto, 0) !== montoRecibido)) throw new Error("descuento-invalido")
    if (ventaBebidasId && montoDescuento > 0) throw new Error("descuento-bebidas-no-permitido")
    if (new Set(distribucion.map((item) => item.cuentaId)).size !== distribucion.length) throw new Error("cuentas-repetidas")
    if (cuentasSnaps.some((snap) => !snap.exists() || snap.data().activa === false)) throw new Error("cuenta-no-disponible")

    const evento = eventoSnap.data()
    const cuentas = cuentasSnaps.map((snap) => snap.data())
    const usuario = usuarioSnap.exists() ? usuarioSnap.data() : {}
    const usuarioNombre = [usuario.nombre, usuario.apellido].filter(Boolean).join(" ") || usuario.email || "Usuario"
    const finanzas = calcularFinanzasEvento(evento)
    const saldo = finanzas.saldoGeneral

    const totalCobradoAnterior = Number(evento.totalCobrado ?? evento.sena ?? 0)
    const totalDescuentosAnterior = Number(evento.totalDescuentosCobros || 0)
    const nuevoTotalCobrado = totalCobradoAnterior + montoRecibido
    const nuevoTotalDescuentos = totalDescuentosAnterior + montoDescuento
    const nuevoSaldo = saldo - montoCancelado
    const estadoPagado = String(evento.estado || "").toLowerCase() === "pagado" ? evento.estado : "Pagado"

    const venta = ventaBebidasId ? (evento.ventasBebidas || []).find((item) => item.id === ventaBebidasId) : null
    if (ventaBebidasId && !venta) throw new Error("venta-bebidas-no-disponible")
    if (venta && montoCancelado > Number(venta.saldo ?? venta.total ?? 0)) throw new Error("monto-supera-bebidas")
    if (!venta && montoCancelado > finanzas.saldoServicio) throw new Error("monto-supera-saldo")

    transaction.set(cobroRef, {
      eventoId,
      cuentaId: distribucion[0].cuentaId,
      movimientoId: movimientosRefs[0].id,
      movimientoIds: movimientosRefs.map((ref) => ref.id),
      distribucion: distribucion.map((item, index) => ({ ...item, cuentaNombre: cuentas[index].nombre, movimientoId: movimientosRefs[index].id })),
      ventaBebidasId: ventaBebidasId || null,
      monto: montoRecibido,
      montoAplicado: montoCancelado,
      descuento: montoDescuento,
      porcentajeDescuento: porcentajeBonificacion,
      tipoCobroId: tipoCobroId || "",
      tipoCobroNombre: tipoCobroNombre || "",
      aplicacionesCobro: aplicaciones,
      moneda: "ARS",
      fecha: fechaTimestamp,
      concepto: concepto.trim() || "Cobro de evento",
      descripcion: descripcion.trim(),
      metodoPago: cuentas.map((cuenta) => cuenta.nombre).join(" + "),
      anulado: false,
      creadoPor: userId,
      creadoPorNombre: usuarioNombre,
      creadoPorEmail: usuario.email || "",
      creadoEn: serverTimestamp(),
      anuladoPor: null,
      anuladoEn: null
    })

    distribucion.forEach((destino, index) => transaction.set(movimientosRefs[index], {
      categoria: "ingreso",
      tipoMovimientoNombre: venta ? "Cobro de bebidas" : "Cobro de evento",
      cuentaId: destino.cuentaId,
      cuentaNombre: cuentas[index].nombre,
      cuentaOrigenId: null,
      cuentaOrigenNombre: "",
      cuentaDestinoId: null,
      cuentaDestinoNombre: "",
      monto: destino.monto,
      moneda: "ARS",
      fecha: fechaTimestamp,
      concepto: concepto.trim() || (venta ? `Cobro de bebidas ${eventoId}` : `Cobro evento ${eventoId}`),
      descripcion: descripcion.trim(),
      origen: "cobro",
      referenciaId: cobroRef.id,
      anulado: false,
      creadoPor: userId,
      creadoPorNombre: usuarioNombre,
      creadoPorEmail: usuario.email || "",
      creadoEn: serverTimestamp()
    }))

    const ventasActualizadas = venta ? (evento.ventasBebidas || []).map((item) => item.id === venta.id ? { ...item, cobrado: Number(item.cobrado || 0) + montoRecibido, saldo: Number(item.saldo ?? item.total) - montoRecibido, estado: Number(item.saldo ?? item.total) - montoRecibido === 0 ? "Pagado" : "Parcial" } : item) : null

    transaction.update(eventoRef, {
      sena: nuevoTotalCobrado,
      totalCobrado: nuevoTotalCobrado,
      totalDescuentosCobros: nuevoTotalDescuentos,
      saldo: nuevoSaldo,
      estado: !venta && finanzas.saldoServicio - montoCancelado === 0 ? estadoPagado : evento.estado,
      ultimoCobroId: cobroRef.id,
      actualizadoPor: userId,
      actualizadoEn: serverTimestamp()
      ,...(ventasActualizadas ? { ventasBebidas: ventasActualizadas } : {})
    })

    distribucion.forEach((destino, index) => transaction.update(cuentasRefs[index], {
      saldoActual: Number(cuentas[index].saldoActual || 0) + destino.monto,
      ultimaOperacionId: movimientosRefs[index].id,
      actualizadoPor: userId,
      actualizadoEn: serverTimestamp()
    }))

    return cobroRef.id
  })
}

export async function anularCobro({ cobroId, motivo, userId }) {
  const cobroRef = doc(db, "cobros", cobroId)
  const usuarioRef = doc(db, "usuarios", userId)

  return runTransaction(db, async (transaction) => {
    const cobroSnap = await transaction.get(cobroRef)
    if (!cobroSnap.exists()) throw new Error("cobro-no-disponible")
    const cobro = cobroSnap.data()
    if (cobro.anulado === true) throw new Error("cobro-ya-anulado")

    const eventoRef = doc(db, "eventos", cobro.eventoId)
    const distribucion = cobro.distribucion?.length ? cobro.distribucion : [{ cuentaId: cobro.cuentaId, cuentaNombre: cobro.metodoPago || "", monto: Number(cobro.monto), movimientoId: cobro.movimientoId }]
    const cuentaRefs = distribucion.map((item) => doc(db, "cuentas", item.cuentaId))
    const movimientoOriginalRefs = distribucion.map((item) => doc(db, "movimientos", item.movimientoId))
    const movimientoAnulacionRefs = distribucion.map(() => doc(collection(db, "movimientos")))
    const comprobantePublicoRef = doc(db, "comprobantesPublicos", cobroId)
    const [eventoSnap, usuarioSnap, comprobanteSnap, cuentasSnaps, movimientosSnaps] = await Promise.all([
      transaction.get(eventoRef),
      transaction.get(usuarioRef),
      transaction.get(comprobantePublicoRef),
      Promise.all(cuentaRefs.map((ref) => transaction.get(ref))),
      Promise.all(movimientoOriginalRefs.map((ref) => transaction.get(ref)))
    ])

    if (!eventoSnap.exists()) throw new Error("evento-no-disponible")
    if (cuentasSnaps.some((snap) => !snap.exists())) throw new Error("cuenta-no-disponible")
    if (movimientosSnaps.some((snap) => !snap.exists())) throw new Error("movimiento-no-disponible")

    const evento = eventoSnap.data()
    const cuentas = cuentasSnaps.map((snap) => snap.data())
    const usuario = usuarioSnap.exists() ? usuarioSnap.data() : {}
    const usuarioNombre = [usuario.nombre, usuario.apellido].filter(Boolean).join(" ") || usuario.email || "Usuario"
    const monto = Number(cobro.monto || 0)
    const montoAplicado = Number(cobro.montoAplicado ?? monto)
    const descuento = Number(cobro.descuento || 0)
    if (!Number.isFinite(monto) || monto <= 0) throw new Error("monto-invalido")
    if (cuentas.some((cuenta, index) => Number(cuenta.saldoActual || 0) < Number(distribucion[index].monto))) throw new Error("saldo-cuenta-insuficiente")

    const totalCobrado = Number(evento.totalCobrado ?? evento.sena ?? 0)
    const nuevoTotalCobrado = Math.max(0, totalCobrado - monto)
    const totalDescuentos = Number(evento.totalDescuentosCobros || 0)
    const nuevoTotalDescuentos = Math.max(0, totalDescuentos - descuento)
    const nuevoSaldo = Number(evento.saldo ?? (Number(evento.total || 0) - totalCobrado - totalDescuentos)) + montoAplicado
    const estadoActual = String(evento.estado || "")
    const nuevoEstado = !cobro.ventaBebidasId && estadoActual.toLowerCase() === "pagado" ? "Confirmado" : estadoActual

    distribucion.forEach((destino, index) => transaction.set(movimientoAnulacionRefs[index], {
      categoria: "egreso",
      tipoMovimientoNombre: "Anulación de cobro",
      cuentaId: destino.cuentaId,
      cuentaNombre: cuentas[index].nombre,
      cuentaOrigenId: null,
      cuentaOrigenNombre: "",
      cuentaDestinoId: null,
      cuentaDestinoNombre: "",
      monto: Number(destino.monto),
      moneda: "ARS",
      fecha: Timestamp.now(),
      concepto: `Anulación: ${cobro.concepto || "Cobro de evento"}`,
      descripcion: motivo.trim(),
      origen: "anulacion",
      referenciaId: cobroId,
      movimientoOriginalId: destino.movimientoId,
      anulado: false,
      creadoPor: userId,
      creadoPorNombre: usuarioNombre,
      creadoPorEmail: usuario.email || "",
      creadoEn: serverTimestamp()
    }))

    movimientoOriginalRefs.forEach((ref, index) => transaction.update(ref, {
      anulado: true,
      anuladoPor: userId,
      anuladoEn: serverTimestamp(),
      movimientoAnulacionId: movimientoAnulacionRefs[index].id
    }))

    transaction.update(cobroRef, {
      anulado: true,
      motivoAnulacion: motivo.trim(),
      anuladoPor: userId,
      anuladoPorNombre: usuarioNombre,
      anuladoPorEmail: usuario.email || "",
      anuladoEn: serverTimestamp(),
      movimientoAnulacionId: movimientoAnulacionRefs[0].id,
      movimientoAnulacionIds: movimientoAnulacionRefs.map((ref) => ref.id)
    })

    if (comprobanteSnap.exists()) {
      transaction.update(comprobantePublicoRef, { anulado: true, anuladoEn: serverTimestamp() })
    }

    const ventasActualizadas = cobro.ventaBebidasId ? (evento.ventasBebidas || []).map((venta) => venta.id === cobro.ventaBebidasId ? { ...venta, cobrado: Math.max(0, Number(venta.cobrado || 0) - monto), saldo: Number(venta.saldo || 0) + monto, estado: "Pendiente" } : venta) : null
    transaction.update(eventoRef, {
      sena: nuevoTotalCobrado,
      totalCobrado: nuevoTotalCobrado,
      totalDescuentosCobros: nuevoTotalDescuentos,
      saldo: nuevoSaldo,
      estado: nuevoEstado,
      ultimaAnulacionCobroId: cobroId,
      actualizadoPor: userId,
      actualizadoEn: serverTimestamp(),
      ...(ventasActualizadas ? { ventasBebidas: ventasActualizadas } : {})
    })

    cuentaRefs.forEach((ref, index) => transaction.update(ref, {
      saldoActual: Number(cuentas[index].saldoActual || 0) - Number(distribucion[index].monto),
      ultimaOperacionId: movimientoAnulacionRefs[index].id,
      actualizadoPor: userId,
      actualizadoEn: serverTimestamp()
    }))

    return movimientoAnulacionRefs[0].id
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
