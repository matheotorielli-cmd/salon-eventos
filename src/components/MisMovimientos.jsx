import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { observarMovimientos } from "../services/movimientos"

const pesos = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })
const fechaTexto = new Intl.DateTimeFormat("es-AR")

export default function MisMovimientos() {
  const navigate = useNavigate()
  const [movimientos, setMovimientos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState("")
  const [filtros, setFiltros] = useState({ desde: "", hasta: "", cuenta: "", categoria: "" })

  useEffect(() => observarMovimientos(
    (data) => { setMovimientos(data); setCargando(false) },
    (loadError) => { console.error(loadError); setError("No se pudieron cargar los movimientos."); setCargando(false) }
  ), [])

  const cuentas = useMemo(() => [...new Set(movimientos.flatMap((m) => [m.cuentaNombre, m.cuentaOrigenNombre, m.cuentaDestinoNombre]).filter(Boolean))].sort(), [movimientos])
  const filtrados = movimientos.filter((mov) => {
    const fecha = mov.fecha?.toDate?.().toISOString().slice(0, 10) || ""
    const coincideCuenta = !filtros.cuenta || [mov.cuentaNombre, mov.cuentaOrigenNombre, mov.cuentaDestinoNombre].includes(filtros.cuenta)
    return (!filtros.desde || fecha >= filtros.desde) && (!filtros.hasta || fecha <= filtros.hasta) && coincideCuenta && (!filtros.categoria || mov.categoria === filtros.categoria)
  })
  const ingresos = filtrados.filter((m) => m.categoria === "ingreso").reduce((total, m) => total + Number(m.monto), 0)
  const egresos = filtrados.filter((m) => m.categoria === "egreso").reduce((total, m) => total + Number(m.monto), 0)

  return (
    <div style={pagina}>
      <div style={cabecera}>
        <div><span style={sobreTitulo}>FINANZAS</span><h1 style={{ margin: "3px 0 0" }}>Movimientos de cuentas</h1></div>
        <button onClick={() => navigate("/nuevo-movimiento")} style={nuevoBtn}>+ Nuevo movimiento</button>
      </div>

      <div style={resumen}>
        <Resumen label="Ingresos" valor={ingresos} color="#16865c" fondo="#e8f8f1" />
        <Resumen label="Egresos" valor={egresos} color="#c0394b" fondo="#fff0f2" />
        <Resumen label="Resultado" valor={ingresos - egresos} color="#4e2581" fondo="#eee7f7" />
      </div>

      <div style={filtrosBox}>
        <Filtro label="Desde"><input type="date" value={filtros.desde} onChange={(e) => setFiltros({ ...filtros, desde: e.target.value })} /></Filtro>
        <Filtro label="Hasta"><input type="date" value={filtros.hasta} onChange={(e) => setFiltros({ ...filtros, hasta: e.target.value })} /></Filtro>
        <Filtro label="Cuenta"><select value={filtros.cuenta} onChange={(e) => setFiltros({ ...filtros, cuenta: e.target.value })}><option value="">Todas las cuentas</option>{cuentas.map((cuenta) => <option key={cuenta}>{cuenta}</option>)}</select></Filtro>
        <Filtro label="Categoría"><select value={filtros.categoria} onChange={(e) => setFiltros({ ...filtros, categoria: e.target.value })}><option value="">Todas</option><option value="ingreso">Ingresos</option><option value="egreso">Egresos</option><option value="transferencia">Transferencias</option></select></Filtro>
        <button onClick={() => setFiltros({ desde: "", hasta: "", cuenta: "", categoria: "" })} style={limpiar}>Limpiar</button>
      </div>

      {error && <div style={errorBox}>{error}</div>}
      <div style={tablaBox}><div style={{ overflowX: "auto" }}><table style={tabla}>
        <thead><tr><th style={th}>Fecha</th><th style={th}>Categoría</th><th style={th}>Tipo</th><th style={th}>Concepto</th><th style={th}>Descripción</th><th style={th}>Cuenta</th><th style={th}>Monto</th><th style={th}>Usuario</th></tr></thead>
        <tbody>
          {cargando && <FilaMensaje texto="Cargando movimientos..." />}
          {!cargando && filtrados.map((mov) => <tr key={mov.id} style={mov.anulado ? { opacity: .62, background: "#fff1f2" } : undefined}>
            <td style={td}>{mov.fecha?.toDate ? fechaTexto.format(mov.fecha.toDate()) : "—"}</td>
            <td style={td}><span style={badge[mov.categoria] || badge.ingreso}>{mov.categoria}</span></td>
            <td style={td}><strong>{mov.tipoMovimientoNombre || "Movimiento"}</strong>{mov.anulado && <span style={anuladoBadge}>ANULADO</span>}</td>
            <td style={td}>{mov.concepto || "—"}</td>
            <td style={td}><div style={detalle}>{mov.descripcion || "—"}</div></td>
            <td style={td}>{mov.categoria === "transferencia" ? `${mov.cuentaOrigenNombre} → ${mov.cuentaDestinoNombre}` : mov.cuentaNombre}</td>
            <td style={{ ...td, fontWeight: 700, color: mov.categoria === "egreso" ? "#c0394b" : mov.categoria === "ingreso" ? "#16865c" : "#4e2581" }}>{mov.categoria === "egreso" ? "− " : mov.categoria === "ingreso" ? "+ " : ""}{pesos.format(Number(mov.monto || 0))}</td>
            <td style={td}>{mov.creadoPorNombre || mov.creadoPorEmail || mov.creadoPor?.slice?.(0, 8) || "—"}</td>
          </tr>)}
          {!cargando && filtrados.length === 0 && <FilaMensaje texto="No hay movimientos para mostrar" />}
        </tbody>
      </table></div></div>
    </div>
  )
}

function Resumen({ label, valor, color, fondo }) { return <div style={{ ...resumenCard, background: fondo }}><span style={resumenLabel}>{label}</span><strong style={{ color, fontSize: 24 }}>{pesos.format(valor)}</strong></div> }
function Filtro({ label, children }) { return <label><span style={labelStyle}>{label}</span>{children}</label> }
function FilaMensaje({ texto }) { return <tr><td colSpan="8" style={{ padding: 35, textAlign: "center", color: "#776d83" }}>{texto}</td></tr> }

const pagina = { maxWidth: 1400, margin: "0 auto" }
const cabecera = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 18, flexWrap: "wrap", padding: "22px 25px", borderRadius: 18, color: "white", background: "linear-gradient(100deg,#4e2581,#63349a)", boxShadow: "0 12px 28px rgba(78,37,129,.15)" }
const sobreTitulo = { color: "#bfe8ff", fontSize: 12, fontWeight: 700, letterSpacing: ".12em" }
const nuevoBtn = { padding: "11px 18px", border: 0, borderRadius: 999, background: "#f4d00c", color: "#38145f", fontWeight: 700, cursor: "pointer" }
const resumen = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 14, margin: "18px 0" }
const resumenCard = { display: "flex", flexDirection: "column", gap: 7, padding: 18, borderRadius: 15, border: "1px solid rgba(78,37,129,.07)" }
const resumenLabel = { color: "#665b71", fontSize: 13, fontWeight: 600 }
const filtrosBox = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, alignItems: "end", padding: 18, marginBottom: 18, background: "white", border: "1px solid #e8e1ee", borderRadius: 15 }
const labelStyle = { display: "block", marginBottom: 7, color: "#665b71", fontSize: 13, fontWeight: 600 }
const limpiar = { padding: 11, border: 0, borderRadius: 10, background: "#eee9f1", color: "#4e2581", fontWeight: 600, cursor: "pointer" }
const tablaBox = { overflow: "hidden", background: "white", border: "1px solid #e8e1ee", borderRadius: 16, boxShadow: "0 12px 30px rgba(78,37,129,.07)" }
const tabla = { width: "100%", borderCollapse: "collapse" }
const th = { padding: 14, textAlign: "left", background: "#f7f5fb", color: "#665b71", fontSize: 13, whiteSpace: "nowrap" }
const td = { padding: 14, borderTop: "1px solid #f0eaf4", fontSize: 14, whiteSpace: "nowrap" }
const detalle = { marginTop: 3, color: "#8c8295", fontSize: 12, fontWeight: 400 }
const badge = { ingreso: { padding: "5px 9px", borderRadius: 999, color: "#166747", background: "#dcf7eb", fontSize: 12, fontWeight: 700, textTransform: "capitalize" }, egreso: { padding: "5px 9px", borderRadius: 999, color: "#a12d3e", background: "#ffe3e8", fontSize: 12, fontWeight: 700, textTransform: "capitalize" }, transferencia: { padding: "5px 9px", borderRadius: 999, color: "#4e2581", background: "#eee7f7", fontSize: 12, fontWeight: 700, textTransform: "capitalize" } }
const errorBox = { marginBottom: 16, padding: 12, borderRadius: 10, background: "#fff1f2", color: "#be123c" }
const anuladoBadge = { display: "inline-block", marginLeft: 7, padding: "2px 6px", borderRadius: 999, background: "#fee2e2", color: "#b42339", fontSize: 10, fontWeight: 800 }
