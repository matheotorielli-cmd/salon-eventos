import { collection, onSnapshot, orderBy, query } from "firebase/firestore"
import { db } from "../firebase"

function observarColeccion(nombre, onData, onError, ordenar = false) {
  const ref = collection(db, nombre)
  const consulta = ordenar ? query(ref, orderBy("fecha", "desc")) : ref
  return onSnapshot(consulta, (snapshot) => onData(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))), onError)
}

export const observarCobrosBalance = (onData, onError) => observarColeccion("cobros", onData, onError, true)
export const observarEventosBalance = (onData, onError) => observarColeccion("eventos", onData, onError)
