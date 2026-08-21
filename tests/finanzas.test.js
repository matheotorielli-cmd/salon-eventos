import test from "node:test"
import assert from "node:assert/strict"

import { calcularFinanzasEvento, estadoVentaBebidas } from "../src/utils/finanzasEvento.js"
import { esListaVigente, estadoVigenciaLista, recalcularEventoConLista } from "../src/utils/vigenciaPrecios.js"
import { stockIdBebida } from "../src/utils/stockBebidas.js"

test("separa correctamente servicio, bebidas, cobros y descuentos", () => {
  const resultado = calcularFinanzasEvento({
    total: 150_000,
    servicioListaPrecio: 100_000,
    totalCobrado: 75_000,
    totalDescuentosCobros: 5_000,
    saldo: 70_000,
    ventasBebidas: [{ total: 50_000, cobrado: 20_000, saldo: 30_000 }]
  })

  assert.deepEqual(resultado, {
    totalGeneral: 150_000,
    cobradoGeneral: 75_000,
    descuentosCobros: 5_000,
    saldoGeneral: 70_000,
    totalBebidas: 50_000,
    cobradoBebidas: 20_000,
    saldoBebidas: 30_000,
    totalServicio: 100_000,
    cobradoServicio: 55_000,
    descuentoServicio: 5_000,
    canceladoServicio: 60_000,
    saldoServicio: 40_000,
    porcentajeServicio: 60
  })
})

test("calcula el saldo cuando el evento no lo guarda explícitamente", () => {
  const resultado = calcularFinanzasEvento({ total: 100_000, sena: 25_000, totalDescuentosCobros: 5_000 })
  assert.equal(resultado.saldoGeneral, 70_000)
  assert.equal(resultado.saldoServicio, 70_000)
})

test("clasifica correctamente la vigencia de una lista", () => {
  const lista = { activa: true, fechaApertura: "2026-08-01", fechaCierre: "2026-08-31" }
  assert.equal(estadoVigenciaLista(lista, "2026-07-31"), "Próxima")
  assert.equal(estadoVigenciaLista(lista, "2026-08-01"), "Activa")
  assert.equal(estadoVigenciaLista(lista, "2026-08-31"), "Activa")
  assert.equal(estadoVigenciaLista(lista, "2026-09-01"), "Vencida")
  assert.equal(esListaVigente({ ...lista, activa: false }, "2026-08-15"), false)
})

test("recalcula únicamente los conceptos pendientes con la lista vigente", () => {
  const evento = {
    servicioListaId: "cumple",
    servicioListaPrecio: 100_000,
    total: 120_000,
    totalCobrado: 20_000,
    totalDescuentosCobros: 0,
    saldo: 100_000,
    ventasBebidas: [{
      id: "venta-1",
      total: 20_000,
      cobrado: 20_000,
      saldo: 0,
      items: [{ nombre: "Gaseosa", presentacion: "1,5 L", cantidad: 2, precioUnitario: 10_000, subtotal: 20_000 }]
    }]
  }
  const lista = {
    id: "agosto",
    nombre: "Agosto 2026",
    servicios: [{ id: "cumple", nombre: "Cumple", precio: 120_000 }],
    bebidas: [{ id: "gaseosa", nombre: "Gaseosa", presentacion: "1,5 L", precio: 15_000 }]
  }

  const resultado = recalcularEventoConLista(evento, lista)
  assert.equal(resultado.servicioListaPrecio, 120_000)
  assert.equal(resultado.ventasBebidas[0].total, 20_000)
  assert.equal(resultado.total, 140_000)
  assert.equal(resultado.saldo, 120_000)
})

test("rechaza una lista que no contiene el servicio pendiente", () => {
  assert.throws(
    () => recalcularEventoConLista({ total: 100, saldo: 100, servicioListaId: "faltante" }, { id: "lista", servicios: [], bebidas: [] }),
    /servicio-sin-precio-vigente/
  )
})

test("el identificador de stock es estable e ignora mayúsculas y acentos", () => {
  assert.equal(stockIdBebida("Coca Colá", "1,5 L"), stockIdBebida("coca cola", "1,5 l"))
  assert.notEqual(stockIdBebida("Coca Cola", "1,5 L"), stockIdBebida("Coca Cola", "2 L"))
})

test("conserva el estado parcial al anular solo una parte de una venta de bebidas", () => {
  assert.equal(estadoVentaBebidas(20_000, 30_000), "Parcial")
  assert.equal(estadoVentaBebidas(0, 50_000), "Pendiente")
  assert.equal(estadoVentaBebidas(50_000, 0), "Pagado")
})
