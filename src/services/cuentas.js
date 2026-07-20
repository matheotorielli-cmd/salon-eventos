import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  Timestamp,
  updateDoc
} from "firebase/firestore"
import { db } from "../firebase"

const cuentasRef = collection(db, "cuentas")

export function observarCuentas(onData, onError) {
  return onSnapshot(cuentasRef, (snapshot) => {
    const cuentas = snapshot.docs
      .map((cuentaDoc) => ({ id: cuentaDoc.id, ...cuentaDoc.data() }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))

    onData(cuentas)
  }, onError)
}

export function observarCuenta(cuentaId, onData, onError) {
  return onSnapshot(doc(db, "cuentas", cuentaId), (snapshot) => {
    onData(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null)
  }, onError)
}

export function crearCuenta({ nombre, descripcion, saldoInicial, userId }) {
  return addDoc(cuentasRef, {
    nombre: nombre.trim(),
    descripcion: descripcion.trim(),
    moneda: "ARS",
    saldoInicial,
    saldoActual: saldoInicial,
    activa: true,
    creadoPor: userId,
    actualizadoPor: userId,
    creadoEn: serverTimestamp(),
    actualizadoEn: serverTimestamp()
  })
}

export function actualizarEstadoCuenta({ cuentaId, activa, userId }) {
  return updateDoc(doc(db, "cuentas", cuentaId), {
    activa,
    actualizadoPor: userId,
    actualizadoEn: serverTimestamp()
  })
}

export function editarCuenta({ cuentaId, nombre, descripcion, saldoInicial, saldoActual, activa, motivoAjuste, userId }) {
  const cuentaRef = doc(db, "cuentas", cuentaId)
  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(cuentaRef)
    if (!snapshot.exists()) throw new Error("cuenta-no-disponible")
    const cuenta = snapshot.data()
    const saldoAnterior = Number(cuenta.saldoActual || 0)
    const nuevoSaldo = Number(saldoActual)
    const diferencia = nuevoSaldo - saldoAnterior
    const datosCuenta = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      saldoInicial: Number(saldoInicial),
      saldoActual: nuevoSaldo,
      activa: Boolean(activa),
      actualizadoPor: userId,
      actualizadoEn: serverTimestamp()
    }

    if (diferencia !== 0) {
      const movimientoRef = doc(collection(db, "movimientos"))
      transaction.set(movimientoRef, {
        categoria: diferencia > 0 ? "ingreso" : "egreso",
        tipoMovimientoNombre: "Ajuste de saldo",
        cuentaId,
        cuentaNombre: nombre.trim(),
        cuentaOrigenId: null,
        cuentaOrigenNombre: "",
        cuentaDestinoId: null,
        cuentaDestinoNombre: "",
        monto: Math.abs(diferencia),
        moneda: "ARS",
        fecha: Timestamp.now(),
        concepto: "Ajuste de saldo de cuenta",
        descripcion: motivoAjuste.trim(),
        origen: "ajuste",
        referenciaId: cuentaId,
        anulado: false,
        creadoPor: userId,
        creadoEn: serverTimestamp()
      })
      datosCuenta.ultimaOperacionId = movimientoRef.id
    }

    transaction.update(cuentaRef, datosCuenta)
  })
}
