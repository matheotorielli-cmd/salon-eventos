import { calcularFinanzasEvento } from "./finanzasEvento.js"

const normalizar = (valor) => String(valor || "").trim().toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g, "")

export function fechaLocalISO(fecha = new Date()) {
  const local = new Date(fecha)
  local.setMinutes(local.getMinutes() - local.getTimezoneOffset())
  return local.toISOString().slice(0, 10)
}

export function estadoVigenciaLista(lista, fecha = fechaLocalISO()) {
  if (lista.activa === false) return "Inactiva"
  if (lista.fechaApertura && fecha < lista.fechaApertura) return "Próxima"
  if (lista.fechaCierre && fecha > lista.fechaCierre) return "Vencida"
  return "Activa"
}

export function esListaVigente(lista, fecha = fechaLocalISO()) {
  return estadoVigenciaLista(lista, fecha) === "Activa"
}

function buscarServicio(lista, evento) {
  const servicios = (lista.servicios || []).filter((item) => item.activo !== false)
  return servicios.find((item) => item.id === evento.servicioListaId)
    || servicios.find((item) => normalizar(item.nombre) === normalizar(evento.servicioListaNombre || evento.tipoEventoNombre || evento.tipoEvento))
}

function buscarBebida(lista, itemVenta) {
  const bebidas = (lista.bebidas || []).filter((item) => item.activo !== false)
  const nombre = normalizar(itemVenta.nombre)
  const presentacion = normalizar(itemVenta.presentacion)
  return bebidas.find((item) => normalizar(item.nombre) === nombre && normalizar(item.presentacion) === presentacion)
    || bebidas.find((item) => normalizar(item.nombre) === nombre)
}

export function recalcularEventoConLista(evento, lista) {
  const finanzas = calcularFinanzasEvento(evento)
  const servicioPendiente = finanzas.saldoServicio > 0
  const servicio = servicioPendiente ? buscarServicio(lista, evento) : null
  if (servicioPendiente && !servicio) throw new Error("servicio-sin-precio-vigente")

  const servicioListaPrecio = servicioPendiente ? Number(servicio.precio || 0) : finanzas.totalServicio
  if (!Number.isFinite(servicioListaPrecio) || servicioListaPrecio <= 0) throw new Error("servicio-sin-precio-vigente")

  const ventasBebidas = (evento.ventasBebidas || []).map((venta) => {
    const cobrado = Number(venta.cobrado || 0)
    const saldoAnterior = Number(venta.saldo ?? (Number(venta.total || 0) - cobrado))
    if (saldoAnterior <= 0) return venta

    const items = (venta.items || []).map((item) => {
      const bebida = buscarBebida(lista, item)
      if (!bebida) throw new Error(`bebida-sin-precio-vigente:${item.nombre || "Bebida"}`)
      const precioUnitario = Number(bebida.precio || 0)
      if (!Number.isFinite(precioUnitario) || precioUnitario <= 0) throw new Error(`bebida-sin-precio-vigente:${item.nombre || "Bebida"}`)
      return { ...item, precioUnitario, subtotal: Number(item.cantidad || 0) * precioUnitario }
    })
    const total = items.reduce((suma, item) => suma + Number(item.subtotal || 0), 0)
    const saldo = total - cobrado
    if (saldo < 0) throw new Error("precio-vigente-menor-a-lo-cobrado")
    return { ...venta, listaPreciosId: lista.id, listaPreciosNombre: lista.nombre || "", items, total, saldo, estado: saldo === 0 ? "Pagado" : cobrado > 0 ? "Parcial" : "Pendiente" }
  })

  const totalBebidas = ventasBebidas.reduce((suma, venta) => suma + Number(venta.total || 0), 0)
  const total = servicioListaPrecio + totalBebidas
  const saldo = total - finanzas.cobradoGeneral - finanzas.descuentosCobros
  if (saldo < 0) throw new Error("precio-vigente-menor-a-lo-cobrado")

  return {
    ...evento,
    listaPreciosId: lista.id,
    listaPreciosNombre: lista.nombre || "",
    servicioListaId: servicio?.id || evento.servicioListaId || "",
    servicioListaNombre: servicio?.nombre || evento.servicioListaNombre || "",
    servicioListaPrecio,
    ventasBebidas,
    total,
    saldo
  }
}
