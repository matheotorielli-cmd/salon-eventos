import { addDoc, collection, doc, getDoc, getDocs, onSnapshot, serverTimestamp, updateDoc } from "firebase/firestore"
import { db } from "../firebase"

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

export function guardarListaPrecios({ id, datos, userId }) {
  const payload = { ...datos, moneda: "ARS", actualizadoPor: userId, actualizadoEn: serverTimestamp() }
  if (id) return updateDoc(doc(db, "listasPrecios", id), payload)
  return addDoc(listasRef, { ...payload, creadoPor: userId, creadoEn: serverTimestamp() })
}

export function cambiarEstadoLista({ id, activa, userId }) {
  return updateDoc(doc(db, "listasPrecios", id), { activa, actualizadoPor: userId, actualizadoEn: serverTimestamp() })
}
