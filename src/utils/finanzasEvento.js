export function calcularFinanzasEvento(evento = {}) {
  const ventasBebidas = evento.ventasBebidas || []
  const totalGeneral = Number(evento.total || 0)
  const cobradoGeneral = Number(evento.totalCobrado ?? evento.sena ?? 0)
  const descuentosCobros = Number(evento.totalDescuentosCobros || 0)
  const saldoGeneral = Number(evento.saldo ?? (totalGeneral - cobradoGeneral - descuentosCobros))
  const totalBebidas = ventasBebidas.reduce((suma, venta) => suma + Number(venta.total || 0), 0)
  const cobradoBebidas = ventasBebidas.reduce((suma, venta) => suma + Number(venta.cobrado || 0), 0)
  const saldoBebidas = ventasBebidas.reduce(
    (suma, venta) => suma + Number(venta.saldo ?? (Number(venta.total || 0) - Number(venta.cobrado || 0))),
    0
  )
  const totalServicio = Number(evento.servicioListaPrecio ?? Math.max(0, totalGeneral - totalBebidas))
  const cobradoServicio = Math.max(0, cobradoGeneral - cobradoBebidas)
  const descuentoServicio = Math.min(descuentosCobros, Math.max(0, totalServicio - cobradoServicio))
  const canceladoServicio = cobradoServicio + descuentoServicio
  const saldoServicio = Math.max(0, totalServicio - canceladoServicio)
  const porcentajeServicio = totalServicio > 0
    ? Math.min(100, Math.round((canceladoServicio / totalServicio) * 100))
    : 0

  return {
    totalGeneral,
    cobradoGeneral,
    descuentosCobros,
    saldoGeneral,
    totalBebidas,
    cobradoBebidas,
    saldoBebidas,
    totalServicio,
    cobradoServicio,
    descuentoServicio,
    canceladoServicio,
    saldoServicio,
    porcentajeServicio
  }
}
