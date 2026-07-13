import { addDoc, collection, deleteDoc, doc, onSnapshot, serverTimestamp, updateDoc } from "firebase/firestore"
import { db } from "../firebase"

export function observarEscuelas(onData, onError) {
  return onSnapshot(collection(db, "escuelas"), (snapshot) => {
    const escuelas = snapshot.docs
      .map((documento) => ({ id: documento.id, ...documento.data() }))
      .sort((a, b) => String(a.nombre || "").localeCompare(String(b.nombre || ""), "es"))
    onData(escuelas)
  }, onError)
}

export function crearEscuela(nombre, userId) {
  return addDoc(collection(db, "escuelas"), {
    nombre: nombre.trim(),
    activa: true,
    creadoPor: userId,
    actualizadoPor: userId,
    creadoEn: serverTimestamp(),
    actualizadoEn: serverTimestamp()
  })
}

export function cambiarEstadoEscuela(escuela, userId) {
  return updateDoc(doc(db, "escuelas", escuela.id), {
    activa: escuela.activa === false,
    actualizadoPor: userId,
    actualizadoEn: serverTimestamp()
  })
}

export function editarEscuela(id, nombre, userId) {
  return updateDoc(doc(db, "escuelas", id), {
    nombre: nombre.trim(),
    actualizadoPor: userId,
    actualizadoEn: serverTimestamp()
  })
}

export function eliminarEscuela(id) {
  return deleteDoc(doc(db, "escuelas", id))
}

export function observarEventosParaEscuelas(onData, onError) {
  return onSnapshot(collection(db, "eventos"), (snapshot) => {
    onData(snapshot.docs.map((documento) => ({ id: documento.id, ...documento.data() })))
  }, onError)
}
