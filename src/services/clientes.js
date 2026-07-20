import { addDoc, collection, doc, getDocs, onSnapshot, query, serverTimestamp, updateDoc, where, writeBatch } from "firebase/firestore"
import { db } from "../firebase"
import { numeroWhatsApp } from "../utils/whatsapp"

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

function grupos(items, cantidad) {
  return Array.from({ length: Math.ceil(items.length / cantidad) }, (_, indice) => items.slice(indice * cantidad, (indice + 1) * cantidad))
}

const MAXIMO_ESCRITURAS_LOTE = 500

export async function actualizarClienteYSincronizar(cliente, datos, userId) {
  const nombreAnterior = nombreCompleto(cliente)
  const clienteActualizado = { ...cliente, ...datos }
  const nombreActualizado = nombreCompleto(clienteActualizado)
  const telefonoActualizado = String(datos.telefono || "").trim()
  const eventosSnapshot = await getDocs(query(collection(db, "eventos"), where("clienteId", "==", cliente.id)))
  const eventos = eventosSnapshot.docs
  const comprobantes = []

  for (const loteIds of grupos(eventos.map((evento) => evento.id), 30)) {
    if (!loteIds.length) continue
    const snapshot = await getDocs(query(collection(db, "comprobantesPublicos"), where("eventoId", "in", loteIds)))
    comprobantes.push(...snapshot.docs)
  }

  const operaciones = [
    { referencia: doc(db, "clientes", cliente.id), datos: { ...datos, actualizadoPor: userId, actualizadoEn: serverTimestamp() } },
    ...eventos.map((evento) => ({ referencia: evento.ref, datos: { cliente: nombreActualizado, telefono: telefonoActualizado, actualizadoPor: userId, actualizadoEn: serverTimestamp() } })),
    ...comprobantes.map((comprobante) => ({ referencia: comprobante.ref, datos: { clienteNombre: nombreActualizado, clienteTelefono: numeroWhatsApp(telefonoActualizado), actualizadoEn: serverTimestamp() } }))
  ]

  if (operaciones.length > MAXIMO_ESCRITURAS_LOTE) throw new Error("demasiados-registros-vinculados")

  const batch = writeBatch(db)
  operaciones.forEach((operacion) => batch.update(operacion.referencia, operacion.datos))
  await batch.commit()

  return { cliente: clienteActualizado, nombreAnterior, nombreActualizado, eventosActualizados: eventos.length, comprobantesActualizados: comprobantes.length }
}

export function cambiarEstadoCliente(cliente, userId) {
  return actualizarCliente(cliente.id, { activo: cliente.activo === false }, userId)
}
