import { doc, runTransaction, serverTimestamp } from "firebase/firestore"
import { db } from "../firebase"

export async function registrarVentaBebidas({ eventoId, items, userId }) {
  const eventoRef = doc(db, "eventos", eventoId)
  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(eventoRef)
    if (!snapshot.exists()) throw new Error("evento-no-disponible")
    const evento = snapshot.data()
    const detalle = items.filter((item) => Number(item.cantidad) > 0).map((item) => ({ bebidaId: item.id, nombre: item.nombre, presentacion: item.presentacion || "", cantidad: Number(item.cantidad), precioUnitario: Number(item.precio), subtotal: Number(item.cantidad) * Number(item.precio) }))
    const totalVenta = detalle.reduce((total, item) => total + item.subtotal, 0)
    if (!detalle.length || totalVenta <= 0) throw new Error("venta-vacia")
    const venta = { id: crypto.randomUUID(), listaPreciosId: evento.listaPreciosId || "", listaPreciosNombre: evento.listaPreciosNombre || "", items: detalle, total: totalVenta, cobrado: 0, saldo: totalVenta, estado: "Pendiente", creadoPor: userId, creadoEnTexto: new Date().toISOString() }
    transaction.update(eventoRef, {
      ventasBebidas: [...(evento.ventasBebidas || []), venta],
      total: Number(evento.total || 0) + totalVenta,
      saldo: Number(evento.saldo ?? (Number(evento.total || 0) - Number(evento.totalCobrado || 0))) + totalVenta,
      ultimaVentaBebidasId: venta.id,
      actualizadoPor: userId,
      actualizadoEn: serverTimestamp()
    })
    return venta.id
  })
}
