import { collection, doc, onSnapshot, orderBy, query, runTransaction, serverTimestamp, Timestamp } from "firebase/firestore"
import { db } from "../firebase"

const movimientosRef = collection(db, "movimientos")

export function observarMovimientos(onData, onError) {
  const consulta = query(movimientosRef, orderBy("fecha", "desc"))
  return onSnapshot(consulta, (snapshot) => {
    onData(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })))
  }, onError)
}

export async function registrarMovimiento({ categoria, tipo, clasificacionBalance = "", cuentaId, cuentaOrigenId, cuentaDestinoId, eventoId, monto, fecha, concepto, descripcion, userId }) {
  const movimientoRef = doc(movimientosRef)
  const fechaTimestamp = Timestamp.fromDate(new Date(`${fecha}T12:00:00`))

  return runTransaction(db, async (transaction) => {
    const esTransferencia = categoria === "transferencia"
    const origenRef = doc(db, "cuentas", esTransferencia ? cuentaOrigenId : cuentaId)
    const origenSnap = await transaction.get(origenRef)
    if (!origenSnap.exists() || origenSnap.data().activa === false) throw new Error("cuenta-no-disponible")

    const origen = origenSnap.data()
    const saldoOrigen = Number(origen.saldoActual || 0)
    let destinoRef = null
    let destino = null
    const usuarioRef = doc(db, "usuarios", userId)
    let evento = null
    if (categoria === "egreso" && eventoId) {
      const eventoSnap = await transaction.get(doc(db, "eventos", eventoId))
      if (!eventoSnap.exists()) throw new Error("evento-no-disponible")
      evento = eventoSnap.data()
    }

    if (esTransferencia) {
      if (!cuentaDestinoId || cuentaOrigenId === cuentaDestinoId) throw new Error("cuentas-iguales")
      destinoRef = doc(db, "cuentas", cuentaDestinoId)
      const destinoSnap = await transaction.get(destinoRef)
      if (!destinoSnap.exists() || destinoSnap.data().activa === false) throw new Error("cuenta-destino-no-disponible")
      destino = destinoSnap.data()
    }

    const usuarioSnap = await transaction.get(usuarioRef)
    const usuario = usuarioSnap.exists() ? usuarioSnap.data() : {}
    const usuarioNombre = [usuario.nombre, usuario.apellido].filter(Boolean).join(" ") || usuario.email || "Usuario"

    if ((categoria === "egreso" || categoria === "inversion" || esTransferencia) && monto > saldoOrigen) throw new Error("saldo-insuficiente")

    const cuentaNombre = esTransferencia ? origen.nombre : origen.nombre
    transaction.set(movimientoRef, {
      categoria,
      tipoMovimientoNombre: tipo,
      clasificacionBalance,
      cuentaId: esTransferencia ? null : cuentaId,
      cuentaNombre: esTransferencia ? "" : cuentaNombre,
      cuentaOrigenId: esTransferencia ? cuentaOrigenId : null,
      cuentaOrigenNombre: esTransferencia ? origen.nombre : "",
      cuentaDestinoId: esTransferencia ? cuentaDestinoId : null,
      cuentaDestinoNombre: esTransferencia ? destino.nombre : "",
      monto,
      moneda: "ARS",
      fecha: fechaTimestamp,
      concepto: concepto.trim(),
      descripcion: descripcion.trim(),
      origen: "manual",
      referenciaId: null,
      eventoId: evento ? eventoId : null,
      eventoNombre: evento?.nombreEvento || evento?.nombre || "",
      tipoEventoNombre: evento ? (evento.tipoEventoNombre || evento.tipoEvento || "Sin tipo") : "",
      anulado: false,
      creadoPor: userId,
      creadoPorNombre: usuarioNombre,
      creadoPorEmail: usuario.email || "",
      creadoEn: serverTimestamp()
    })

    const actualizacionBase = { ultimaOperacionId: movimientoRef.id, actualizadoPor: userId, actualizadoEn: serverTimestamp() }
    transaction.update(origenRef, {
      ...actualizacionBase,
      saldoActual: categoria === "ingreso" ? saldoOrigen + monto : saldoOrigen - monto
    })

    if (esTransferencia) {
      transaction.update(destinoRef, {
        ...actualizacionBase,
        saldoActual: Number(destino.saldoActual || 0) + monto
      })
    }

    return movimientoRef.id
  })
}

export async function vincularMovimientoEvento({ movimientoId, eventoId, userId }) {
  return runTransaction(db, async (transaction) => {
    const movimientoRef = doc(db, "movimientos", movimientoId), eventoRef = doc(db, "eventos", eventoId)
    const movimientoSnap = await transaction.get(movimientoRef), eventoSnap = await transaction.get(eventoRef)
    if (!movimientoSnap.exists() || movimientoSnap.data().categoria !== "egreso" || movimientoSnap.data().origen !== "manual") throw new Error("movimiento-no-vinculable")
    if (!eventoSnap.exists()) throw new Error("evento-no-disponible")
    const evento = eventoSnap.data()
    transaction.update(movimientoRef, { eventoId, eventoNombre: evento.nombreEvento || evento.nombre || "Evento", tipoEventoNombre: evento.tipoEventoNombre || evento.tipoEvento || "Sin tipo", vinculadoPor: userId, vinculadoEn: serverTimestamp() })
  })
}
