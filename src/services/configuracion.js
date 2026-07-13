import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  writeBatch
} from "firebase/firestore"
import { db } from "../firebase"

function referencia(nombreColeccion) {
  return collection(db, nombreColeccion)
}

export function observarConfiguracion(nombreColeccion, onData, onError) {
  return onSnapshot(referencia(nombreColeccion), (snapshot) => {
    const items = snapshot.docs
      .map((item) => ({ id: item.id, ...item.data() }))
      .sort((a, b) => String(a.nombre || "").localeCompare(String(b.nombre || ""), "es"))
    onData(items)
  }, onError)
}

export function crearConfiguracion(nombreColeccion, datos, userId) {
  return addDoc(referencia(nombreColeccion), {
    ...datos,
    creadoPor: userId,
    actualizadoPor: userId,
    creadoEn: serverTimestamp(),
    actualizadoEn: serverTimestamp()
  })
}

export function actualizarConfiguracion(nombreColeccion, itemId, datos, userId) {
  return updateDoc(doc(db, nombreColeccion, itemId), {
    ...datos,
    actualizadoPor: userId,
    actualizadoEn: serverTimestamp()
  })
}

export function eliminarConfiguracion(nombreColeccion, itemId) {
  return deleteDoc(doc(db, nombreColeccion, itemId))
}

export const observarTiposEventos = (onData, onError) =>
  observarConfiguracion("tiposEventos", onData, onError)

export const observarPrestadores = (onData, onError) =>
  observarConfiguracion("prestadores", onData, onError)

export const observarTiposMovimientos = (onData, onError) =>
  observarConfiguracion("tiposMovimientos", onData, onError)

export async function migrarConfiguracionLocal(nombreColeccion, claveLocal, transformar, userId) {
  const claveMigracion = `${claveLocal}:migrando-firestore`
  if (localStorage.getItem(claveMigracion) === "si") return false

  let items
  try { items = JSON.parse(localStorage.getItem(claveLocal) || "[]") }
  catch { items = [] }
  if (!Array.isArray(items) || items.length === 0) return false

  localStorage.setItem(claveMigracion, "si")
  try {
    const batch = writeBatch(db)
    items.forEach((item) => {
      const itemRef = doc(referencia(nombreColeccion))
      batch.set(itemRef, {
        ...transformar(item),
        creadoPor: userId,
        actualizadoPor: userId,
        creadoEn: serverTimestamp(),
        actualizadoEn: serverTimestamp()
      })
    })
    await batch.commit()
    localStorage.removeItem(claveLocal)
    localStorage.removeItem(claveMigracion)
    return true
  } catch (error) {
    localStorage.removeItem(claveMigracion)
    throw error
  }
}
