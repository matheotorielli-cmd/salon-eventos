import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
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

export function actualizarNombreCuenta({ cuentaId, nombre, userId }) {
  return updateDoc(doc(db, "cuentas", cuentaId), {
    nombre: nombre.trim(),
    actualizadoPor: userId,
    actualizadoEn: serverTimestamp()
  })
}
