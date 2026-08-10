import { useEffect, useMemo, useState } from "react"
import { CalendarDays, Download, Plus, X } from "lucide-react"
import { auth } from "../firebase"
import { observarCuentas } from "../services/cuentas"
import { observarMovimientos, registrarMovimiento } from "../services/movimientos"
import { observarCobrosBalance, observarEventosBalance } from "../services/balance"

const dinero = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })
const estados = ["Todos", "Presupuestado", "Confirmado", "Pagado", "Cancelado"]
const tiposEgreso = [
  ["gastos_fijos", "Gastos fijos"],
  ["profesores", "Profesores"],
  ["bebida_adultos", "Bebida adultos"],
  ["bebida_ninos", "Bebida niños"],
  ["comida_ninos", "Comida niños"],
  ["otros", "Otros gastos"],
  ["inversion", "Inversión"]
]
const iso = (fecha) => { const d = new Date(fecha); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10) }
const fechaDato = (dato) => dato?.fecha?.toDate ? iso(dato.fecha.toDate()) : String(dato?.fecha || "").slice(0, 10)
const sumar = (lista) => lista.reduce((total, item) => total + Number(item.monto || 0), 0)
const inicioMes = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), 1)
const finMes = (d = new Date()) => new Date(d.getFullYear(), d.getMonth() + 1, 0)
const escaparXml = (valor) => String(valor ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
const celdaXml = (valor, estilo = "") => `<Cell${estilo ? ` ss:StyleID="${estilo}"` : ""}><Data ss:Type="${typeof valor === "number" ? "Number" : "String"}">${escaparXml(valor)}</Data></Cell>`
const filaXml = (valores, estilo = "") => `<Row${estilo ? ` ss:StyleID="${estilo}"` : ""}>${valores.map((valor) => celdaXml(valor, typeof valor === "number" ? "m" : "")).join("")}</Row>`
const hojaXml = (nombre, filas, anchos) => `<Worksheet ss:Name="${nombre}"><Table>${anchos.map((ancho) => `<Column ss:Width="${ancho}"/>`).join("")}${filas.join("")}</Table><WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><FreezePanes/><FrozenNoSplit/><SplitHorizontal>4</SplitHorizontal><TopRowBottomPane>4</TopRowBottomPane></WorksheetOptions></Worksheet>`

export default function Balance() {
  const [eventos, setEventos] = useState([])
  const [cobros, setCobros] = useState([])
  const [movimientos, setMovimientos] = useState([])
  const [cuentas, setCuentas] = useState([])
  const [error, setError] = useState("")
  const [estado, setEstado] = useState("Todos")
  const [modalEgreso, setModalEgreso] = useState(false)
  const [rango, setRango] = useState({ desde: iso(inicioMes()), hasta: iso(finMes()) })

  useEffect(() => observarEventosBalance(setEventos, () => setError("No se pudieron cargar los eventos.")), [])
  useEffect(() => observarCobrosBalance(setCobros, () => setError("No se pudieron cargar los cobros.")), [])
  useEffect(() => observarMovimientos(setMovimientos, () => setError("No se pudieron cargar los movimientos.")), [])
  useEffect(() => observarCuentas(
    (items) => setCuentas(items.filter((cuenta) => cuenta.activa !== false)),
    () => setError("No se pudieron cargar las cuentas.")
  ), [])

  const reporte = useMemo(() => {
    const porId = new Map(eventos.map((e) => [e.id, e]))
    const dentro = (item) => { const fecha = fechaDato(item); return fecha && fecha >= rango.desde && fecha <= rango.hasta }
    const estadoOk = (id) => estado === "Todos" || String(porId.get(id)?.estado || "").toLowerCase() === estado.toLowerCase()
    const cobrados = cobros.filter((c) => !c.anulado && dentro(c) && estadoOk(c.eventoId))
    const egresos = movimientos.filter((m) => !m.anulado && ["manual", "prestadores"].includes(m.origen) && ["egreso", "inversion"].includes(m.categoria) && dentro(m))
    const gastosEvento = egresos.filter((m) => m.categoria === "egreso" && m.eventoId && estadoOk(m.eventoId))
    const clasificados = (id) => egresos.filter((m) => m.clasificacionBalance === id)
    const fijos = sumar(clasificados("gastos_fijos"))
    const profesores = sumar(egresos.filter((m) => m.origen === "prestadores" || m.clasificacionBalance === "profesores"))
    const bebidaAdultos = sumar(clasificados("bebida_adultos"))
    const bebidaNinos = sumar(clasificados("bebida_ninos"))
    const comidaNinos = sumar(clasificados("comida_ninos"))
    const inversiones = egresos.filter((m) => m.categoria === "inversion")
    const conocidas = new Set(["gastos_fijos", "profesores", "bebida_adultos", "bebida_ninos", "comida_ninos"])
    const otros = egresos.filter((m) => m.categoria === "egreso" && !m.eventoId && m.origen !== "prestadores" && (!conocidas.has(m.clasificacionBalance) || m.clasificacionBalance === "otros"))
    const grupos = new Map()
    const obtener = (id) => {
      const evento = porId.get(id)
      const tipo = evento?.tipoEventoNombre || evento?.tipoEvento || "Sin tipo"
      if (!grupos.has(tipo)) grupos.set(tipo, { tipo, ids: new Set(), ingresos: 0, egresos: 0 })
      return grupos.get(tipo)
    }
    cobrados.forEach((c) => { const grupo = obtener(c.eventoId); grupo.ids.add(c.eventoId); grupo.ingresos += Number(c.monto || 0) })
    gastosEvento.forEach((m) => { obtener(m.eventoId).egresos += Number(m.monto || 0) })
    const filas = [...grupos.values()].map((g) => ({ ...g, cantidad: g.ids.size, ganancia: g.ingresos - g.egresos })).sort((a, b) => a.tipo.localeCompare(b.tipo))
    const ingreso = sumar(cobrados)
    const egreso = sumar(gastosEvento)
    const otrosTotal = sumar(otros)
    const inversion = sumar(inversiones)
    const egresosTotal = sumar(egresos)
    return { filas, cobrados, egresos, ingreso, egreso, fijos, profesores, bebidaAdultos, bebidaNinos, comidaNinos, otros: otrosTotal, inversion, egresosTotal, total: ingreso - egresosTotal }
  }, [eventos, cobros, movimientos, rango, estado])

  function exportarExcel() {
    const xml = crearExcelDetallado({ reporte, cobros, rango })
    const url = URL.createObjectURL(new Blob([xml], { type: "application/vnd.ms-excel" }))
    const enlace = document.createElement("a")
    enlace.href = url
    enlace.download = `balance_${rango.desde}_${rango.hasta}.xls`
    enlace.click()
    URL.revokeObjectURL(url)
  }

  const detalle = [
    ["Gastos fijos", reporte.fijos], ["Profesores", reporte.profesores],
    ["Bebida adultos", reporte.bebidaAdultos], ["Bebida niños", reporte.bebidaNinos],
    ["Comida niños", reporte.comidaNinos], ["Otros gastos", reporte.otros], ["Inversiones", reporte.inversion]
  ]

  return <div className="balance-page">
    <header className="balance-header"><div><small>FINANZAS</small><h1>Balance</h1></div><div className="balance-header-actions"><button onClick={() => setModalEgreso(true)}><Plus size={19}/> Cargar egreso</button><button onClick={exportarExcel}><Download size={19}/> Excel</button></div></header>
    <section className="balance-filters"><RangePicker value={rango} onChange={setRango}/><label><span>Estados</span><select value={estado} onChange={(e) => setEstado(e.target.value)}>{estados.map((item) => <option key={item}>{item}</option>)}</select></label></section>
    <p className="balance-note">El reporte usa la fecha real de cada cobro y movimiento. Los ingresos representan importes efectivamente cobrados.</p>
    {error && <div className="balance-error">{error}</div>}
    <section className="balance-table"><div className="balance-scroll"><table><thead><tr><th>Tipo de evento</th><th>Cantidad</th><th>Ingresos cobrados</th><th>Egresos vinculados</th><th>Ganancia</th></tr></thead><tbody>{reporte.filas.map((fila) => <tr key={fila.tipo}><td>{fila.tipo}</td><td>{fila.cantidad}</td><td>{dinero.format(fila.ingresos)}</td><td>{dinero.format(fila.egresos)}</td><td className={fila.ganancia >= 0 ? "positive" : "negative"}>{dinero.format(fila.ganancia)}</td></tr>)}{!reporte.filas.length && <tr><td colSpan="5" className="empty">No hay cobros ni gastos vinculados en este período.</td></tr>}</tbody><tfoot><tr><td colSpan="4">Total ganancias de eventos</td><td>{dinero.format(reporte.ingreso - reporte.egreso)}</td></tr></tfoot></table></div></section>
    <section className="balance-expenses"><h2>Detalle de egresos</h2><div>{detalle.map(([label, value]) => <article key={label}><span>{label}</span><strong>{dinero.format(value)}</strong></article>)}</div></section>
    <section className="balance-summary"><Kpi label="Ingresos" value={reporte.ingreso}/><Kpi label="Egresos totales" value={-reporte.egresosTotal}/><Kpi label="Gastos fijos" value={-reporte.fijos}/><Kpi label="Profesores" value={-reporte.profesores}/><Kpi label="Balance total" value={reporte.total} main/></section>
    {modalEgreso && <EgresoModal cuentas={cuentas} eventos={eventos} onClose={() => setModalEgreso(false)} onError={setError}/>}</div>
}

function crearExcelDetallado({ reporte, cobros, rango }) {
  const fechas = []
  for (let fecha = new Date(`${rango.desde}T12:00:00`), fin = new Date(`${rango.hasta}T12:00:00`); fecha <= fin; fecha.setDate(fecha.getDate() + 1)) fechas.push(iso(fecha))
  const tituloPeriodo = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(new Date(`${rango.desde}T12:00:00`)).toUpperCase()
  const primerosCobros = new Map()
  cobros.filter((c) => !c.anulado && !c.ventaBebidasId).sort((a, b) => fechaDato(a).localeCompare(fechaDato(b))).forEach((c) => { if (!primerosCobros.has(c.eventoId)) primerosCobros.set(c.eventoId, c.id) })
  const ingresosDia = Object.fromEntries(fechas.map((fecha) => [fecha, Array(8).fill(0)]))
  reporte.cobrados.forEach((cobro) => {
    const fecha = fechaDato(cobro)
    if (!ingresosDia[fecha]) return
    const texto = `${cobro.concepto || ""} ${cobro.descripcion || ""}`.toLowerCase()
    const tipo = cobro.ventaBebidasId ? 3 : /chic|extra/.test(texto) ? 2 : primerosCobros.get(cobro.eventoId) === cobro.id ? 0 : 1
    const destinos = cobro.distribucion?.length ? cobro.distribucion : [{ cuentaNombre: cobro.metodoPago || "", monto: cobro.monto }]
    destinos.forEach((destino) => { const efectivo = /efectivo|caja/i.test(destino.cuentaNombre || ""); ingresosDia[fecha][(efectivo ? 0 : 4) + tipo] += Number(destino.monto || 0) })
  })
  const totalesIngreso = Array(8).fill(0)
  Object.values(ingresosDia).forEach((valores) => valores.forEach((valor, indice) => { totalesIngreso[indice] += valor }))
  const balance = [
    filaXml([`INGRESOS ${tituloPeriodo}`], "t"), filaXml([""]),
    filaXml(["FECHA", "EFECTIVO - RESERVA", "EFECTIVO - SALDO", "EFECTIVO - CHICOS EXTRA", "EFECTIVO - BEBIDA", "TRANSFERENCIA - RESERVA", "TRANSFERENCIA - SALDO", "TRANSFERENCIA - CHICOS EXTRA", "TRANSFERENCIA - BEBIDA"], "h"),
    ...fechas.map((fecha) => filaXml([fecha.split("-").reverse().join("/"), ...ingresosDia[fecha]])),
    filaXml(["TOTAL", ...totalesIngreso], "z")
  ]
  const totalEfectivo = totalesIngreso.slice(0, 4).reduce((a, b) => a + b, 0)
  const totalTransferencia = totalesIngreso.slice(4).reduce((a, b) => a + b, 0)
  balance.push(filaXml(["TOTAL EFECTIVO", totalEfectivo, "", "", "TOTAL TRANSFERENCIAS", totalTransferencia, "", "TOTAL RECAUDADO", reporte.ingreso], "z"), filaXml([""]))
  const resumen = [
    ["Recaudado", reporte.ingreso], ["Gastos fijos", reporte.fijos], ["Profesores", reporte.profesores],
    ["Bebida adultos", reporte.bebidaAdultos], ["Comida + bebida niños", reporte.comidaNinos + reporte.bebidaNinos],
    ["Otros gastos", reporte.otros], ["Inversiones", reporte.inversion], ["EGRESOS TOTALES", reporte.egresosTotal], ["BALANCE", reporte.total]
  ]
  balance.push(filaXml(["RESUMEN", "IMPORTE"], "h"), ...resumen.map(([nombre, valor]) => filaXml([nombre, valor], nombre === "BALANCE" ? "z" : "")))

  const fijos = reporte.egresos.filter((m) => m.clasificacionBalance === "gastos_fijos")
  const filasFijos = [filaXml([`GASTOS FIJOS ${tituloPeriodo}`], "t"), filaXml(["FECHA", "CONCEPTO", "EFECTIVO", "CUENTA", "DESCRIPCIÓN"], "h")]
  fijos.forEach((m) => { const efectivo = /efectivo|caja/i.test(m.cuentaNombre || ""); filasFijos.push(filaXml([fechaDato(m).split("-").reverse().join("/"), m.concepto || m.tipoMovimientoNombre, efectivo ? Number(m.monto || 0) : 0, efectivo ? 0 : Number(m.monto || 0), m.descripcion || ""])) })
  const fijoEfectivo = sumar(fijos.filter((m) => /efectivo|caja/i.test(m.cuentaNombre || "")))
  filasFijos.push(filaXml(["TOTAL", "", fijoEfectivo, reporte.fijos - fijoEfectivo, ""], "z"), filaXml(["TOTAL GASTOS FIJOS", "", "", reporte.fijos, ""], "z"))

  const gastosDia = Object.fromEntries(fechas.map((fecha) => [fecha, { conceptos: [], otros: 0, profesores: 0, adulto: 0, ninos: 0, comida: 0, cuentas: new Set() }]))
  reporte.egresos.forEach((m) => {
    const fecha = fechaDato(m), dia = gastosDia[fecha]
    if (!dia || m.clasificacionBalance === "gastos_fijos" || m.categoria === "inversion") return
    dia.conceptos.push(m.concepto || m.tipoMovimientoNombre || "Egreso")
    dia.cuentas.add(m.cuentaNombre || "")
    if (m.origen === "prestadores" || m.clasificacionBalance === "profesores") dia.profesores += Number(m.monto || 0)
    else if (m.clasificacionBalance === "bebida_adultos") dia.adulto += Number(m.monto || 0)
    else if (m.clasificacionBalance === "bebida_ninos") dia.ninos += Number(m.monto || 0)
    else if (m.clasificacionBalance === "comida_ninos") dia.comida += Number(m.monto || 0)
    else dia.otros += Number(m.monto || 0)
  })
  const filasGastos = [filaXml([`GASTOS ${tituloPeriodo}`], "t"), filaXml(["FECHA", "CONCEPTO", "OTROS", "PROFESORES", "BEBIDA ADULTO", "BEBIDA NIÑOS", "COMIDA NIÑOS", "CUENTA"], "h")]
  fechas.forEach((fecha) => { const dia = gastosDia[fecha]; filasGastos.push(filaXml([fecha.split("-").reverse().join("/"), [...new Set(dia.conceptos)].join("; "), dia.otros, dia.profesores, dia.adulto, dia.ninos, dia.comida, [...dia.cuentas].filter(Boolean).join(" + ")])) })
  filasGastos.push(filaXml(["TOTAL", "", reporte.otros, reporte.profesores, reporte.bebidaAdultos, reporte.bebidaNinos, reporte.comidaNinos, ""], "z"), filaXml(["SUMA TOTAL", "", reporte.otros + reporte.profesores + reporte.bebidaAdultos + reporte.bebidaNinos + reporte.comidaNinos, "", "", "", "", ""], "z"))

  const estilos = `<Styles><Style ss:ID="Default" ss:Name="Normal"><Font ss:FontName="Calibri" ss:Size="11"/></Style><Style ss:ID="t"><Font ss:Bold="1" ss:Size="16" ss:Color="#4E2581"/></Style><Style ss:ID="h"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#4E2581" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/></Style><Style ss:ID="m"><NumberFormat ss:Format="Currency"/></Style><Style ss:ID="z"><Font ss:Bold="1"/><Interior ss:Color="#F4D00C" ss:Pattern="Solid"/></Style></Styles>`
  return `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">${estilos}${hojaXml("BALANCE", balance, [75, 100, 100, 105, 95, 110, 110, 115, 105])}${hojaXml("FIJOS", filasFijos, [75, 150, 90, 90, 220])}${hojaXml("GASTOS EFECTIVO", filasGastos, [75, 190, 85, 90, 100, 100, 100, 130])}</Workbook>`
}

function Kpi({ label, value, main }) { return <article className={main ? "main" : ""}><span>{label}</span><strong>{dinero.format(value)}</strong></article> }

function EgresoModal({ cuentas, eventos, onClose, onError }) {
  const [guardando, setGuardando] = useState(false)
  const [form, setForm] = useState({ clasificacionBalance: "gastos_fijos", cuentaId: "", eventoId: "", monto: "", fecha: iso(new Date()), concepto: "", descripcion: "" })
  const cambiar = (campo, valor) => setForm((actual) => ({ ...actual, [campo]: valor }))
  async function guardar(e) {
    e.preventDefault()
    const monto = Number(form.monto)
    const tipo = tiposEgreso.find(([id]) => id === form.clasificacionBalance)?.[1] || "Otros gastos"
    if (!form.cuentaId || !Number.isFinite(monto) || monto <= 0) return onError("Seleccioná una cuenta e ingresá un monto mayor que cero.")
    if (!auth.currentUser) return onError("La sesión no está disponible.")
    setGuardando(true)
    try {
      await registrarMovimiento({ ...form, categoria: form.clasificacionBalance === "inversion" ? "inversion" : "egreso", tipo, monto, userId: auth.currentUser.uid })
      onError("")
      onClose()
    } catch (saveError) {
      console.error(saveError)
      onError(saveError.message === "saldo-insuficiente" ? "La cuenta elegida no tiene saldo suficiente." : "No se pudo registrar el egreso.")
    } finally { setGuardando(false) }
  }
  return <div className="balance-modal-backdrop" onClick={onClose}><form className="balance-modal" onClick={(e) => e.stopPropagation()} onSubmit={guardar}><header><div><small>EGRESO MANUAL</small><h2>Cargar egreso</h2></div><button type="button" onClick={onClose}><X size={20}/></button></header><div className="balance-modal-grid"><label><span>Clasificación</span><select value={form.clasificacionBalance} onChange={(e) => cambiar("clasificacionBalance", e.target.value)}>{tiposEgreso.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label><label><span>Cuenta que paga</span><select value={form.cuentaId} onChange={(e) => cambiar("cuentaId", e.target.value)} required><option value="">Seleccionar cuenta</option>{cuentas.map((cuenta) => <option key={cuenta.id} value={cuenta.id}>{cuenta.nombre} · {dinero.format(Number(cuenta.saldoActual || 0))}</option>)}</select></label><label><span>Monto</span><input type="number" min="1" step="1" value={form.monto} onChange={(e) => cambiar("monto", e.target.value)} required/></label><label><span>Fecha</span><input type="date" value={form.fecha} onChange={(e) => cambiar("fecha", e.target.value)} required/></label><label><span>Concepto</span><input value={form.concepto} onChange={(e) => cambiar("concepto", e.target.value)} placeholder="Ej.: Alquiler" required/></label><label><span>Evento (opcional)</span><select value={form.eventoId} onChange={(e) => cambiar("eventoId", e.target.value)}><option value="">Sin vincular</option>{eventos.map((evento) => <option key={evento.id} value={evento.id}>{evento.nombreEvento || evento.nombre || evento.clienteNombre || evento.id}</option>)}</select></label><label className="wide"><span>Descripción</span><textarea value={form.descripcion} onChange={(e) => cambiar("descripcion", e.target.value)} placeholder="Detalle opcional"/></label></div><footer><button type="button" onClick={onClose}>Cancelar</button><button className="save" disabled={guardando}>{guardando ? "Guardando..." : "Registrar egreso"}</button></footer></form></div>
}

function RangePicker({ value, onChange }) {
  const [open, setOpen] = useState(false), [draft, setDraft] = useState(value)
  const elegir = (tipo) => { const hoy = new Date(); let desde = hoy, hasta = hoy; if (tipo === "ayer") desde = hasta = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 1); if (tipo === "7") desde = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 6); if (tipo === "30") desde = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 29); if (tipo === "mes") { desde = inicioMes(hoy); hasta = finMes(hoy) } if (tipo === "anterior") { desde = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1); hasta = new Date(hoy.getFullYear(), hoy.getMonth(), 0) } if (tipo === "proximo") { desde = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1); hasta = new Date(hoy.getFullYear(), hoy.getMonth() + 2, 0) } setDraft({ desde: iso(desde), hasta: iso(hasta) }) }
  return <div className="range-wrap"><span>Fecha</span><button className="range-trigger" onClick={() => { setDraft(value); setOpen(!open) }}><CalendarDays size={17}/>{value.desde.split("-").reverse().join("/")} - {value.hasta.split("-").reverse().join("/")}</button>{open && <div className="range-pop"><button className="range-close" onClick={() => setOpen(false)}><X size={17}/></button><div className="presets">{[["hoy", "Hoy"], ["ayer", "Ayer"], ["7", "Últimos 7 días"], ["30", "Últimos 30 días"], ["mes", "Este mes"], ["anterior", "Mes pasado"], ["proximo", "Próximo mes"]].map(([id, label]) => <button key={id} onClick={() => elegir(id)}>{label}</button>)}</div><div className="range-dates"><label>Desde<input type="date" value={draft.desde} onChange={(e) => setDraft({ ...draft, desde: e.target.value })}/></label><label>Hasta<input type="date" value={draft.hasta} onChange={(e) => setDraft({ ...draft, hasta: e.target.value })}/></label><div className="range-actions"><button onClick={() => { setDraft(value); setOpen(false) }}>Cancelar</button><button className="apply" onClick={() => { if (draft.desde && draft.hasta && draft.desde <= draft.hasta) onChange(draft); setOpen(false) }}>Aplicar</button></div></div></div>}</div>
}
