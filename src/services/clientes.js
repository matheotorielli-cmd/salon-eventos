import { addDoc, collection, doc, onSnapshot, serverTimestamp, updateDoc } from "firebase/firestore"
import { db } from "../firebase"

export function observarClientes(onData, onError) {
  return onSnapshot(collection(db, "clientes"), (snapshot) => {
    const clientes = snapshot.docs
      .map((documento) => ({ id: documento.id, ...documento.data() }))
      .sort((a, b) => nombreCompleto(a).localeCompare(nombreCompleto(b), "es"))
    onData(clientes)
  }, onError)
}

export function nombreCompleto(cliente) {
  if (cliente.esEmpresa) return cliente.nombre || "Empresa sin nombre"
  return [cliente.nombre, cliente.apellido].filter(Boolean).join(" ") || "Cliente sin nombre"
}

export async function crearCliente(datos, userId) {
  const referencia = await addDoc(collection(db, "clientes"), {
    ...datos,
    activo: true,
    creadoPor: userId,
    actualizadoPor: userId,
    creadoEn: serverTimestamp(),
    actualizadoEn: serverTimestamp()
  })
  return referencia.id
}

export function actualizarCliente(id, datos, userId) {
  return updateDoc(doc(db, "clientes", id), {
    ...datos,
    actualizadoPor: userId,
    actualizadoEn: serverTimestamp()
  })
}

export function cambiarEstadoCliente(cliente, userId) {
  return actualizarCliente(cliente.id, { activo: cliente.activo === false }, userId)
}
