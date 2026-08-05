import { addDoc, collection, doc, getDoc, getDocs, onSnapshot, serverTimestamp, updateDoc } from "firebase/firestore"
import { db } from "../firebase"
import { esListaVigente } from "../utils/vigenciaPrecios"

const listasRef = collection(db, "listasPrecios")

export function observarListasPrecios(onData, onError) {
  return onSnapshot(listasRef, (snapshot) => onData(snapshot.docs
    .map((item) => ({ id: item.id, ...item.data() }))
    .sort((a, b) => String(b.fechaApertura || "").localeCompare(String(a.fechaApertura || "")))), onError)
}

export async function obtenerListaPrecios(id) {
  const snapshot = await getDoc(doc(db, "listasPrecios", id))
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null
}

export async function obtenerListaAnterior(idExcluir = "") {
  const snapshot = await getDocs(listasRef)
  return snapshot.docs
    .map((item) => ({ id: item.id, ...item.data() }))
    .filter((item) => item.id !== idExcluir)
    .sort((a, b) => String(b.fechaApertura || "").localeCompare(String(a.fechaApertura || "")))[0] || null
}

export async function obtenerListaVigente(fecha) {
  const snapshot = await getDocs(listasRef)
  const vigentes = snapshot.docs.map((item) => ({ id: item.id, ...item.data() })).filter((item) => esListaVigente(item, fecha))
  if (vigentes.length > 1) throw new Error("listas-vigentes-superpuestas")
  if (!vigentes.length) throw new Error("sin-lista-vigente")
  return vigentes[0]
}

export async function buscarSuperposicionLista({ idExcluir = "", fechaApertura, fechaCierre, activa = true }) {
  if (!activa) return null
  const snapshot = await getDocs(listasRef)
  return snapshot.docs
    .map((item) => ({ id: item.id, ...item.data() }))
    .find((item) => item.id !== idExcluir
      && item.activa !== false
      && item.fechaApertura
      && item.fechaCierre
      && fechaApertura <= item.fechaCierre
      && fechaCierre >= item.fechaApertura) || null
}

export function guardarListaPrecios({ id, datos, userId }) {
  const payload = { ...datos, moneda: "ARS", actualizadoPor: userId, actualizadoEn: serverTimestamp() }
  if (id) return updateDoc(doc(db, "listasPrecios", id), payload)
  return addDoc(listasRef, { ...payload, creadoPor: userId, creadoEn: serverTimestamp() })
}

export function cambiarEstadoLista({ id, activa, userId }) {
  return updateDoc(doc(db, "listasPrecios", id), { activa, actualizadoPor: userId, actualizadoEn: serverTimestamp() })
}
