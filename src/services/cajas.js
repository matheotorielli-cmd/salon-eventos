import { collection, doc, getDoc, onSnapshot, query, runTransaction, serverTimestamp, Timestamp, where } from "firebase/firestore"
import { db } from "../firebase"

const cajasRef = collection(db, "cajas")

export function observarCajasCuenta(cuentaId, onData, onError) {
  return onSnapshot(query(cajasRef, where("cuentaId", "==", cuentaId)), (snapshot) => {
    const cajas = snapshot.docs.map((item) => ({ id: item.id, ...item.data() })).sort((a, b) => (b.fechaApertura?.toMillis?.() || 0) - (a.fechaApertura?.toMillis?.() || 0))
    onData(cajas)
  }, onError)
}

export async function obtenerCaja(cajaId) {
  const snapshot = await getDoc(doc(db, "cajas", cajaId))
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null
}

export function abrirCaja({ cuentaId, fechaApertura, montoApertura, userId }) {
  const cuentaRef = doc(db, "cuentas", cuentaId)
  const cajaRef = doc(cajasRef)
  return runTransaction(db, async (transaction) => {
    const [cuentaSnapshot, usuarioSnapshot] = await Promise.all([transaction.get(cuentaRef), transaction.get(doc(db, "usuarios", userId))])
    if (!cuentaSnapshot.exists()) throw new Error("cuenta-no-disponible")
    const cuenta = cuentaSnapshot.data()
    if (cuenta.cajaActivaId) throw new Error("caja-ya-abierta")
    const usuario = usuarioSnapshot.exists() ? usuarioSnapshot.data() : {}
    const usuarioNombre = [usuario.nombre, usuario.apellido].filter(Boolean).join(" ") || usuario.email || "Usuario"
    transaction.set(cajaRef, {
      cuentaId,
      cuentaNombre: cuenta.nombre,
      fechaApertura: Timestamp.fromDate(new Date(fechaApertura)),
      montoApertura: Number(montoApertura),
      fechaCierre: null,
      montoCierre: 0,
      resultado: 0,
      estado: "Abierta",
      abiertoPor: userId,
      abiertoPorNombre: usuarioNombre,
      cerradoPor: null,
      cerradoPorNombre: "",
      creadoEn: serverTimestamp(),
      actualizadoEn: serverTimestamp()
    })
    transaction.update(cuentaRef, { cajaActivaId: cajaRef.id, actualizadoPor: userId, actualizadoEn: serverTimestamp() })
    return cajaRef.id
  })
}

export function cerrarCaja({ cuentaId, cajaId, fechaCierre, montoCierre, movimientoIds, userId }) {
  const cuentaRef = doc(db, "cuentas", cuentaId)
  const cajaRef = doc(db, "cajas", cajaId)
  return runTransaction(db, async (transaction) => {
    const [cuentaSnapshot, cajaSnapshot, usuarioSnapshot] = await Promise.all([transaction.get(cuentaRef), transaction.get(cajaRef), transaction.get(doc(db, "usuarios", userId))])
    if (!cuentaSnapshot.exists() || !cajaSnapshot.exists()) throw new Error("caja-no-disponible")
    const caja = cajaSnapshot.data()
    if (caja.estado !== "Abierta" || cuentaSnapshot.data().cajaActivaId !== cajaId) throw new Error("caja-ya-cerrada")
    const cierre = new Date(fechaCierre)
    if (cierre <= caja.fechaApertura.toDate()) throw new Error("fecha-cierre-invalida")
    const usuario = usuarioSnapshot.exists() ? usuarioSnapshot.data() : {}
    const usuarioNombre = [usuario.nombre, usuario.apellido].filter(Boolean).join(" ") || usuario.email || "Usuario"
    transaction.update(cajaRef, {
      fechaCierre: Timestamp.fromDate(cierre),
      montoCierre: Number(montoCierre),
      resultado: Number(montoCierre) - Number(caja.montoApertura || 0),
      movimientoIds: movimientoIds || [],
      estado: "Cerrada",
      cerradoPor: userId,
      cerradoPorNombre: usuarioNombre,
      actualizadoEn: serverTimestamp()
    })
    transaction.update(cuentaRef, { cajaActivaId: "", ultimaCajaCerradaId: cajaId, actualizadoPor: userId, actualizadoEn: serverTimestamp() })
  })
}

export function movimientosDeCaja(movimientos, cuentaId, caja, hasta = new Date()) {
  const desdeMs = caja.fechaApertura?.toMillis?.() || 0
  const hastaMs = caja.fechaCierre?.toMillis?.() ? caja.fechaCierre.toMillis() + 59999 : hasta.getTime()
  return movimientos.filter((movimiento) => {
    const creadoMs = movimiento.creadoEn?.toMillis?.() || movimiento.fecha?.toMillis?.() || 0
    const pertenece = movimiento.cuentaId === cuentaId || movimiento.cuentaOrigenId === cuentaId || movimiento.cuentaDestinoId === cuentaId
    return pertenece && movimiento.anulado !== true && creadoMs >= desdeMs && creadoMs <= hastaMs
  })
}

export function tipoMovimientoCaja(movimiento, cuentaId) {
  if (movimiento.categoria === "transferencia") return movimiento.cuentaDestinoId === cuentaId ? "ingreso" : "egreso"
  return movimiento.categoria === "ingreso" ? "ingreso" : "egreso"
}

export function calcularMontoCierre(caja, movimientos, cuentaId) {
  return movimientos.reduce((total, movimiento) => total + (tipoMovimientoCaja(movimiento, cuentaId) === "ingreso" ? Number(movimiento.monto || 0) : -Number(movimiento.monto || 0)), Number(caja.montoApertura || 0))
}
