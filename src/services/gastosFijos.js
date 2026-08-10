import { collection, doc, getDocs, onSnapshot, serverTimestamp, writeBatch } from "firebase/firestore"
import { db } from "../firebase"

const ref = collection(db, "gastosFijos")
const iniciales = [
  ["alquiler", "Alquiler", 1270000, 1], ["luz", "Luz", 813150.19, 5],
  ["internet", "Internet", 0, 10], ["sos-emergencias", "SOS Emergencias", 49700, 10],
  ["sistema", "Sistema", 80600, 10], ["seguro-profes", "Seguro PROFES", 75363, 1],
  ["seguro-responsabilidad", "Seguro Responsabilidad", 269700, 10], ["fumigacion", "Fumigación", 70000, 10],
  ["limpieza", "Servicio de limpieza", 260000, 10], ["redes", "Redes", 410000, 10],
  ["sueldo-florencia", "Sueldo Florencia", 1260000, 5], ["sueldo-nahuel", "Sueldo Nahuel", 2326500, 5],
  ["mutual-amera", "Mutual AMERA", 7656, 10], ["sutep", "SUTEP", 26797, 10],
  ["formulario-931", "931 (Jub.-OS-ART)", 395670.24, 10], ["contador", "Contador", 0, 10],
  ["monotributo", "Monotributo", 283225.89, 20], ["municipal", "Municipal", 0, 10]
]

export function observarGastosFijos(onData, onError) {
  return onSnapshot(ref, (snapshot) => onData(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })).filter((item) => item.activo !== false).sort((a, b) => Number(a.diaVencimiento || 99) - Number(b.diaVencimiento || 99) || a.nombre.localeCompare(b.nombre, "es"))), onError)
}

export async function inicializarGastosFijos(userId) {
  const snapshot = await getDocs(ref)
  if (!snapshot.empty) return
  const batch = writeBatch(db)
  iniciales.forEach(([id, nombre, montoEstimado, diaVencimiento]) => batch.set(doc(db, "gastosFijos", id), {
    nombre, montoEstimado, diaVencimiento, diasAviso: 3, activo: true,
    creadoPor: userId, actualizadoPor: userId, creadoEn: serverTimestamp(), actualizadoEn: serverTimestamp()
  }))
  await batch.commit()
}
