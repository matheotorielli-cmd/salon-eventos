import { collection, doc, onSnapshot, runTransaction, serverTimestamp } from "firebase/firestore"
import { db } from "../firebase"

export function observarStockBebidas(onData, onError) {
  return onSnapshot(collection(db, "stockBebidas"), (snapshot) => onData(Object.fromEntries(snapshot.docs.map((item) => [item.id, { id: item.id, ...item.data() }]))), onError)
}

export function observarMovimientosStock(onData, onError) {
  return onSnapshot(collection(db, "movimientosStock"), (snapshot) => onData(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })).sort((a,b)=>(b.creadoEn?.toMillis?.()||0)-(a.creadoEn?.toMillis?.()||0))), onError)
}

export function ajustarStockBebida({ producto, cantidad, tipo, motivo, userId }) {
  const stockRef = doc(db, "stockBebidas", producto.id)
  const movimientoRef = doc(collection(db, "movimientosStock"))
  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(stockRef)
    const actual = snapshot.exists() ? Number(snapshot.data().cantidad || 0) : 0
    const nuevaCantidad = tipo === "ingreso" ? actual + Number(cantidad) : Number(cantidad)
    if (!Number.isFinite(nuevaCantidad) || nuevaCantidad < 0) throw new Error("stock-invalido")
    const datos = { nombre: producto.nombre, presentacion: producto.presentacion || "", cantidad: nuevaCantidad, stockMinimo: Number(producto.stockMinimo || 0), costoCompra: Number(producto.costoCompra || 0), actualizadoPor: userId, actualizadoEn: serverTimestamp() }
    if (snapshot.exists()) transaction.update(stockRef, datos)
    else transaction.set(stockRef, { ...datos, creadoPor: userId, creadoEn: serverTimestamp() })
    transaction.set(movimientoRef, { stockId: producto.id, nombre: producto.nombre, presentacion: producto.presentacion || "", tipo, cantidad: tipo === "ingreso" ? Number(cantidad) : nuevaCantidad - actual, cantidadAnterior: actual, cantidadNueva: nuevaCantidad, motivo: motivo.trim(), origen: "manual", creadoPor: userId, creadoEn: serverTimestamp() })
  })
}
