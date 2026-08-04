import { collection, doc, getDoc, runTransaction, serverTimestamp, setDoc } from "firebase/firestore"
import { db } from "../firebase"
import { stockIdBebida } from "../utils/stockBebidas"

const detalleVenta = (items) => items.filter((item) => Number(item.cantidad) > 0).map((item) => ({ bebidaId: item.id, stockId: stockIdBebida(item.nombre, item.presentacion), nombre: item.nombre, presentacion: item.presentacion || "", cantidad: Number(item.cantidad), precioUnitario: Number(item.precio), subtotal: Number(item.cantidad) * Number(item.precio) }))

export async function registrarVentaBebidas({ eventoId, items, userId }) {
  const eventoRef = doc(db, "eventos", eventoId)
  const detalle = detalleVenta(items)
  const stockRefs = detalle.map((item) => doc(db, "stockBebidas", item.stockId))
  const movimientoRefs = detalle.map(() => doc(collection(db, "movimientosStock")))
  return runTransaction(db, async (transaction) => {
    const [snapshot, stockSnaps] = await Promise.all([transaction.get(eventoRef), Promise.all(stockRefs.map((ref) => transaction.get(ref)))])
    if (!snapshot.exists()) throw new Error("evento-no-disponible")
    const evento = snapshot.data()
    const totalVenta = detalle.reduce((total, item) => total + item.subtotal, 0)
    if (!detalle.length || totalVenta <= 0) throw new Error("venta-vacia")
    detalle.forEach((item, index) => {
      const disponible = stockSnaps[index].exists() ? Number(stockSnaps[index].data().cantidad || 0) : 0
      if (item.cantidad > disponible) throw new Error(`stock-insuficiente:${item.nombre}`)
    })
    const venta = { id: crypto.randomUUID(), listaPreciosId: evento.listaPreciosId || "", listaPreciosNombre: evento.listaPreciosNombre || "", items: detalle, total: totalVenta, cobrado: 0, saldo: totalVenta, estado: "Pendiente", creadoPor: userId, creadoEnTexto: new Date().toISOString() }
    detalle.forEach((item, index) => {
      const anterior = Number(stockSnaps[index].data().cantidad || 0), nueva = anterior - item.cantidad
      transaction.update(stockRefs[index], { cantidad: nueva, actualizadoPor: userId, actualizadoEn: serverTimestamp() })
      transaction.set(movimientoRefs[index], { stockId:item.stockId,nombre:item.nombre,presentacion:item.presentacion,tipo:"salida",cantidad:-item.cantidad,cantidadAnterior:anterior,cantidadNueva:nueva,motivo:`Venta · ${evento.nombreEvento||evento.title||eventoId}`,origen:"venta",eventoId,ventaId:venta.id,creadoPor:userId,creadoEn:serverTimestamp() })
    })
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

export async function eliminarVentaBebidas({ eventoId, ventaId, userId }) {
  const eventoRef = doc(db, "eventos", eventoId)
  const devoluciones = await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(eventoRef)
    if (!snapshot.exists()) throw new Error("evento-no-disponible")
    const evento = snapshot.data()
    const ventas = evento.ventasBebidas || []
    const venta = ventas.find((item) => item.id === ventaId)
    if (!venta) throw new Error("venta-no-disponible")
    if (Number(venta.cobrado || 0) > 0 || Number(venta.saldo ?? venta.total) !== Number(venta.total)) throw new Error("venta-con-cobros")

    const totalVenta = Number(venta.total || 0)
    const itemsVenta = venta.items || []
    const stockRefs = itemsVenta.map((item) => doc(db, "stockBebidas", item.stockId || stockIdBebida(item.nombre, item.presentacion)))
    const stockSnaps = await Promise.all(stockRefs.map((ref) => transaction.get(ref)))
    const movimientos = itemsVenta.map(() => doc(collection(db, "movimientosStock")))
    const resultadoDevoluciones = itemsVenta.map((item,index)=>{const anterior=stockSnaps[index].exists()?Number(stockSnaps[index].data().cantidad||0):0,nueva=anterior+Number(item.cantidad||0);const datos={nombre:item.nombre,presentacion:item.presentacion||"",cantidad:nueva,actualizadoPor:userId,actualizadoEn:serverTimestamp()};if(stockSnaps[index].exists())transaction.update(stockRefs[index],datos);else transaction.set(stockRefs[index],{...datos,stockMinimo:0,costoCompra:0,creadoPor:userId,creadoEn:serverTimestamp()});transaction.set(movimientos[index],{stockId:stockRefs[index].id,nombre:item.nombre,presentacion:item.presentacion||"",tipo:"devolucion",cantidad:Number(item.cantidad||0),cantidadAnterior:anterior,cantidadNueva:nueva,motivo:"Venta eliminada",origen:"venta",eventoId,ventaId,creadoPor:userId,creadoEn:serverTimestamp()});return {stockId:stockRefs[index].id,nombre:item.nombre,presentacion:item.presentacion||"",cantidad:Number(item.cantidad||0),anterior,esperada:nueva}})
    transaction.update(eventoRef, {
      ventasBebidas: ventas.filter((item) => item.id !== ventaId),
      total: Number(evento.total || 0) - totalVenta,
      saldo: Number(evento.saldo ?? (Number(evento.total || 0) - Number(evento.totalCobrado || 0))) - totalVenta,
      ultimaVentaBebidasEliminada: venta,
      actualizadoPor: userId,
      actualizadoEn: serverTimestamp()
    })
    return resultadoDevoluciones
  })

  await Promise.all(devoluciones.map(async (devolucion) => {
    const stockRef = doc(db, "stockBebidas", devolucion.stockId)
    const snapshot = await getDoc(stockRef)
    if (snapshot.exists() && Number(snapshot.data().cantidad || 0) === devolucion.esperada) return

    const reparacionRef = doc(db, "movimientosStock", `devolucion_${ventaId}_${devolucion.stockId}`)
    await runTransaction(db, async (transaction) => {
      const [stockActual, reparacion] = await Promise.all([transaction.get(stockRef), transaction.get(reparacionRef)])
      if (reparacion.exists()) return
      const cantidadActual = stockActual.exists() ? Number(stockActual.data().cantidad || 0) : 0
      if (cantidadActual !== devolucion.anterior) throw new Error("stock-cambio-durante-devolucion")
      const cantidadNueva = cantidadActual + devolucion.cantidad
      const datos = { nombre:devolucion.nombre,presentacion:devolucion.presentacion,cantidad:cantidadNueva,actualizadoPor:userId,actualizadoEn:serverTimestamp() }
      if (stockActual.exists()) transaction.update(stockRef, datos)
      else transaction.set(stockRef, { ...datos, stockMinimo:0, costoCompra:0, creadoPor:userId, creadoEn:serverTimestamp() })
      transaction.set(reparacionRef, { stockId:devolucion.stockId,nombre:devolucion.nombre,presentacion:devolucion.presentacion,tipo:"devolucion",cantidad:devolucion.cantidad,cantidadAnterior:cantidadActual,cantidadNueva,motivo:"Venta eliminada · devolución verificada",origen:"venta",eventoId,ventaId,creadoPor:userId,creadoEn:serverTimestamp() })
    })
  }))
}

export async function editarVentaBebidas({ eventoId, ventaId, items, userId }) {
  const eventoRef = doc(db, "eventos", eventoId)
  const cambiosStock = await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(eventoRef)
    if (!snapshot.exists()) throw new Error("evento-no-disponible")
    const evento = snapshot.data()
    const ventas = evento.ventasBebidas || []
    const ventaAnterior = ventas.find((item) => item.id === ventaId)
    if (!ventaAnterior) throw new Error("venta-no-disponible")
    if (Number(ventaAnterior.cobrado || 0) > 0 || Number(ventaAnterior.saldo ?? ventaAnterior.total) !== Number(ventaAnterior.total)) throw new Error("venta-con-cobros")

    const detalle = detalleVenta(items)
    const totalVenta = detalle.reduce((total, item) => total + item.subtotal, 0)
    if (!detalle.length || totalVenta <= 0) throw new Error("venta-vacia")

    const cantidadesAnteriores = Object.fromEntries((ventaAnterior.items || []).map((item) => [item.stockId || stockIdBebida(item.nombre, item.presentacion), Number(item.cantidad || 0)]))
    const cantidadesNuevas = Object.fromEntries(detalle.map((item) => [item.stockId, Number(item.cantidad || 0)]))
    const stockIds = [...new Set([...Object.keys(cantidadesAnteriores), ...Object.keys(cantidadesNuevas)])]
    const stockRefs = stockIds.map((stockId) => doc(db, "stockBebidas", stockId))
    const stockSnaps = await Promise.all(stockRefs.map((ref) => transaction.get(ref)))
    const cambios = []
    stockIds.forEach((stockId,index)=>{
      const diferencia=(cantidadesNuevas[stockId]||0)-(cantidadesAnteriores[stockId]||0)
      if(!diferencia)return
      const anterior=stockSnaps[index].exists()?Number(stockSnaps[index].data().cantidad||0):0
      if(diferencia>anterior)throw new Error(`stock-insuficiente:${detalle.find(item=>item.stockId===stockId)?.nombre||"bebida"}`)
      const nueva=anterior-diferencia
      const referencia=detalle.find(item=>item.stockId===stockId)||(ventaAnterior.items||[]).find(item=>(item.stockId||stockIdBebida(item.nombre,item.presentacion))===stockId)
      const datos={nombre:referencia.nombre,presentacion:referencia.presentacion||"",cantidad:nueva,actualizadoPor:userId,actualizadoEn:serverTimestamp()}
      if(stockSnaps[index].exists())transaction.update(stockRefs[index],datos)
      else transaction.set(stockRefs[index],{...datos,stockMinimo:0,costoCompra:0,creadoPor:userId,creadoEn:serverTimestamp()})
      cambios.push({stockId,nombre:referencia.nombre,presentacion:referencia.presentacion||"",tipo:"ajuste-venta",cantidad:-diferencia,cantidadAnterior:anterior,cantidadNueva:nueva,motivo:"Venta editada",origen:"venta",eventoId,ventaId,creadoPor:userId})
    })

    const ventaEditada = { ...ventaAnterior, items: detalle, total: totalVenta, cobrado: 0, saldo: totalVenta, estado: "Pendiente", editadoPor: userId, editadoEnTexto: new Date().toISOString() }
    const diferencia = totalVenta - Number(ventaAnterior.total || 0)
    transaction.update(eventoRef, {
      ventasBebidas: ventas.map((item) => item.id === ventaId ? ventaEditada : item),
      total: Number(evento.total || 0) + diferencia,
      saldo: Number(evento.saldo ?? (Number(evento.total || 0) - Number(evento.totalCobrado || 0))) + diferencia,
      ultimaVentaBebidasAnterior: ventaAnterior,
      ultimaVentaBebidasEditada: ventaEditada,
      actualizadoPor: userId,
      actualizadoEn: serverTimestamp()
    })
    return cambios
  })

  const resultados = await Promise.allSettled(cambiosStock.map((cambio) => setDoc(doc(collection(db, "movimientosStock")), { ...cambio, creadoEn:serverTimestamp() })))
  resultados.filter((resultado) => resultado.status === "rejected").forEach((resultado) => console.error("No se pudo guardar la trazabilidad del ajuste de stock", resultado.reason))
}
