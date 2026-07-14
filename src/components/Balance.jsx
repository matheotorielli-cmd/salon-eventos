import { useEffect, useMemo, useState } from "react"
import { Download, CalendarDays, X } from "lucide-react"
import { observarMovimientos } from "../services/movimientos"
import { observarCobrosBalance, observarEventosBalance } from "../services/balance"

const dinero = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })
const estados = ["Todos", "Presupuestado", "Confirmado", "Pagado", "Cancelado"]
const iso = (fecha) => { const d = new Date(fecha); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10) }
const fechaDato = (dato) => dato?.fecha?.toDate ? iso(dato.fecha.toDate()) : String(dato?.fecha || "").slice(0, 10)
const sumar = (lista) => lista.reduce((total, item) => total + Number(item.monto || 0), 0)
const inicioMes = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), 1)
const finMes = (d = new Date()) => new Date(d.getFullYear(), d.getMonth() + 1, 0)

export default function Balance() {
  const [eventos, setEventos] = useState([]), [cobros, setCobros] = useState([]), [movimientos, setMovimientos] = useState([])
  const [error, setError] = useState(""), [estado, setEstado] = useState("Todos")
  const [rango, setRango] = useState({ desde: iso(inicioMes()), hasta: iso(finMes()) })
  useEffect(() => observarEventosBalance(setEventos, () => setError("No se pudieron cargar los eventos.")), [])
  useEffect(() => observarCobrosBalance(setCobros, () => setError("No se pudieron cargar los cobros.")), [])
  useEffect(() => observarMovimientos(setMovimientos, () => setError("No se pudieron cargar los movimientos.")), [])

  const reporte = useMemo(() => {
    const porId = new Map(eventos.map((e) => [e.id, e]))
    const dentro = (x) => { const f = fechaDato(x); return f && f >= rango.desde && f <= rango.hasta }
    const estadoOk = (id) => estado === "Todos" || String(porId.get(id)?.estado || "").toLowerCase() === estado.toLowerCase()
    const cobrados = cobros.filter((c) => !c.anulado && dentro(c) && estadoOk(c.eventoId))
    const manuales = movimientos.filter((m) => !m.anulado && m.origen === "manual" && dentro(m))
    const gastosEvento = manuales.filter((m) => m.categoria === "egreso" && m.eventoId && estadoOk(m.eventoId))
    const otros = manuales.filter((m) => m.categoria === "egreso" && !m.eventoId)
    const inversiones = manuales.filter((m) => m.categoria === "inversion")
    const grupos = new Map(), obtener = (id) => { const e = porId.get(id); const tipo = e?.tipoEventoNombre || e?.tipoEvento || "Sin tipo"; if (!grupos.has(tipo)) grupos.set(tipo, { tipo, ids: new Set(), ingresos: 0, egresos: 0 }); return grupos.get(tipo) }
    cobrados.forEach((c) => { const g = obtener(c.eventoId); g.ids.add(c.eventoId); g.ingresos += Number(c.monto || 0) })
    gastosEvento.forEach((m) => { obtener(m.eventoId).egresos += Number(m.monto || 0) })
    const filas = [...grupos.values()].map((g) => ({ ...g, cantidad: g.ids.size, ganancia: g.ingresos - g.egresos })).sort((a,b) => a.tipo.localeCompare(b.tipo))
    const ingreso = sumar(cobrados), egreso = sumar(gastosEvento), otrosTotal = sumar(otros), inversion = sumar(inversiones)
    return { filas, ingreso, egreso, otros: otrosTotal, inversion, total: ingreso - egreso - otrosTotal - inversion }
  }, [eventos, cobros, movimientos, rango, estado])

  function exportarExcel() {
    const esc = (v) => String(v ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    const filas = reporte.filas.map((f) => `<Row><Cell><Data ss:Type="String">${esc(f.tipo)}</Data></Cell><Cell><Data ss:Type="Number">${f.cantidad}</Data></Cell><Cell><Data ss:Type="Number">${f.ingresos}</Data></Cell><Cell><Data ss:Type="Number">${f.egresos}</Data></Cell><Cell><Data ss:Type="Number">${f.ganancia}</Data></Cell></Row>`).join("")
    const xml = `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Styles><Style ss:ID="h"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#4E2581" ss:Pattern="Solid"/></Style></Styles><Worksheet ss:Name="Balance"><Table><Row ss:StyleID="h"><Cell><Data ss:Type="String">Tipo de evento</Data></Cell><Cell><Data ss:Type="String">Cantidad</Data></Cell><Cell><Data ss:Type="String">Ingresos cobrados</Data></Cell><Cell><Data ss:Type="String">Egresos vinculados</Data></Cell><Cell><Data ss:Type="String">Ganancia</Data></Cell></Row>${filas}<Row/><Row ss:StyleID="h"><Cell><Data ss:Type="String">Resumen</Data></Cell><Cell><Data ss:Type="String">Importe</Data></Cell></Row>${[["Ingresos eventos",reporte.ingreso],["Egresos eventos",reporte.egreso],["Otros gastos",reporte.otros],["Inversiones",reporte.inversion],["Balance total",reporte.total]].map(([n,v])=>`<Row><Cell><Data ss:Type="String">${n}</Data></Cell><Cell><Data ss:Type="Number">${v}</Data></Cell></Row>`).join("")}</Table></Worksheet></Workbook>`
    const url = URL.createObjectURL(new Blob([xml], {type:"application/vnd.ms-excel"})), a = document.createElement("a"); a.href=url; a.download=`balance_${rango.desde}_${rango.hasta}.xls`; a.click(); URL.revokeObjectURL(url)
  }

  return <div className="balance-page"><header className="balance-header"><div><small>FINANZAS</small><h1>Balance</h1></div><button onClick={exportarExcel}><Download size={19}/> Excel</button></header><section className="balance-filters"><RangePicker value={rango} onChange={setRango}/><label><span>Estados</span><select value={estado} onChange={(e)=>setEstado(e.target.value)}>{estados.map((x)=><option key={x}>{x}</option>)}</select></label></section><p className="balance-note">El reporte usa la fecha real de cada cobro y movimiento. Los ingresos representan importes efectivamente cobrados.</p>{error&&<div className="balance-error">{error}</div>}<section className="balance-table"><div className="balance-scroll"><table><thead><tr><th>Tipo de evento</th><th>Cantidad</th><th>Ingresos cobrados</th><th>Egresos vinculados</th><th>Ganancia</th></tr></thead><tbody>{reporte.filas.map((f)=><tr key={f.tipo}><td>{f.tipo}</td><td>{f.cantidad}</td><td>{dinero.format(f.ingresos)}</td><td>{dinero.format(f.egresos)}</td><td className={f.ganancia>=0?"positive":"negative"}>{dinero.format(f.ganancia)}</td></tr>)}{!reporte.filas.length&&<tr><td colSpan="5" className="empty">No hay cobros ni gastos vinculados en este período.</td></tr>}</tbody><tfoot><tr><td colSpan="4">Total ganancias de eventos</td><td>{dinero.format(reporte.ingreso-reporte.egreso)}</td></tr></tfoot></table></div></section><section className="balance-summary"><Kpi label="Ingresos eventos" value={reporte.ingreso}/><Kpi label="Egresos eventos" value={-reporte.egreso}/><Kpi label="Otros gastos" value={-reporte.otros}/><Kpi label="Inversiones" value={-reporte.inversion}/><Kpi label="Balance total" value={reporte.total} main/></section></div>
}
function Kpi({label,value,main}) { return <article className={main?"main":""}><span>{label}</span><strong>{dinero.format(value)}</strong></article> }
function RangePicker({value,onChange}) { const [open,setOpen]=useState(false),[draft,setDraft]=useState(value); const elegir=(tipo)=>{const h=new Date();let d=h,f=h;if(tipo==="ayer")d=f=new Date(h.getFullYear(),h.getMonth(),h.getDate()-1);if(tipo==="7")d=new Date(h.getFullYear(),h.getMonth(),h.getDate()-6);if(tipo==="30")d=new Date(h.getFullYear(),h.getMonth(),h.getDate()-29);if(tipo==="mes"){d=inicioMes(h);f=finMes(h)}if(tipo==="anterior"){d=new Date(h.getFullYear(),h.getMonth()-1,1);f=new Date(h.getFullYear(),h.getMonth(),0)}if(tipo==="proximo"){d=new Date(h.getFullYear(),h.getMonth()+1,1);f=new Date(h.getFullYear(),h.getMonth()+2,0)}setDraft({desde:iso(d),hasta:iso(f)})}; return <div className="range-wrap"><span>Fecha</span><button className="range-trigger" onClick={()=>{setDraft(value);setOpen(!open)}}><CalendarDays size={17}/>{value.desde.split("-").reverse().join("/")} - {value.hasta.split("-").reverse().join("/")}</button>{open&&<div className="range-pop"><button className="range-close" onClick={()=>setOpen(false)}><X size={17}/></button><div className="presets">{[["hoy","Hoy"],["ayer","Ayer"],["7","Últimos 7 días"],["30","Últimos 30 días"],["mes","Este mes"],["anterior","Mes pasado"],["proximo","Próximo mes"]].map(([id,l])=><button key={id} onClick={()=>elegir(id)}>{l}</button>)}</div><div className="range-dates"><label>Desde<input type="date" value={draft.desde} onChange={(e)=>setDraft({...draft,desde:e.target.value})}/></label><label>Hasta<input type="date" value={draft.hasta} onChange={(e)=>setDraft({...draft,hasta:e.target.value})}/></label><div className="range-actions"><button onClick={()=>{setDraft(value);setOpen(false)}}>Cancelar</button><button className="apply" onClick={()=>{if(draft.desde&&draft.hasta&&draft.desde<=draft.hasta)onChange(draft);setOpen(false)}}>Aplicar</button></div></div></div>}</div> }
