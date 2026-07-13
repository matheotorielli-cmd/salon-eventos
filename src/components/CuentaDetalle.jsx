import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { observarCuenta } from "../services/cuentas"
import { observarMovimientos } from "../services/movimientos"

const pesos = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })
const fechaTexto = new Intl.DateTimeFormat("es-AR")

export default function CuentaDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [cuenta, setCuenta] = useState(null)
  const [movimientos, setMovimientos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState("")
  const [filtros, setFiltros] = useState({ desde: "", hasta: "", tipo: "" })

  useEffect(() => {
    const cancelarCuenta = observarCuenta(id, (data) => { setCuenta(data); setCargando(false) }, () => { setError("No se pudo cargar la cuenta."); setCargando(false) })
    const cancelarMovimientos = observarMovimientos((data) => {
      setMovimientos(data.filter((mov) => mov.cuentaId === id || mov.cuentaOrigenId === id || mov.cuentaDestinoId === id))
    }, () => setError("No se pudieron cargar los movimientos de esta cuenta."))
    return () => { cancelarCuenta(); cancelarMovimientos() }
  }, [id])

  const filtrados = useMemo(() => movimientos.filter((mov) => {
    const fecha = mov.fecha?.toDate?.().toISOString().slice(0, 10) || ""
    const tipoCuenta = obtenerTipo(mov, id)
    return (!filtros.desde || fecha >= filtros.desde) && (!filtros.hasta || fecha <= filtros.hasta) && (!filtros.tipo || tipoCuenta === filtros.tipo)
  }), [filtros, id, movimientos])

  const creditos = filtrados.reduce((total, mov) => obtenerTipo(mov, id) === "ingreso" ? total + Number(mov.monto || 0) : total, 0)
  const debitos = filtrados.reduce((total, mov) => obtenerTipo(mov, id) === "egreso" ? total + Number(mov.monto || 0) : total, 0)

  if (cargando) return <div style={mensaje}>Cargando cuenta...</div>
  if (!cuenta) return <div style={mensaje}>La cuenta no existe.</div>

  return (
    <div style={pagina}>
      <button onClick={() => navigate("/cuentas")} style={volver}>← Volver a cuentas</button>
      <header style={cabecera}>
        <div><span style={sobreTitulo}>ESTADO DE CUENTA</span><h1 style={{ margin: "3px 0 5px" }}>{cuenta.nombre}</h1><p style={{ margin: 0, color: "#e9dcf6" }}>{cuenta.descripcion || "Sin descripción"}</p></div>
        <div style={{ textAlign: "right" }}><span style={{ color: "#cdeeff", fontSize: 13 }}>Saldo actual</span><strong style={saldo}>{pesos.format(Number(cuenta.saldoActual || 0))}</strong></div>
      </header>

      <section style={resumen}>
        <Resumen label="Ingresos del período" valor={creditos} color="#16865c" />
        <Resumen label="Egresos del período" valor={debitos} color="#c0394b" />
        <Resumen label="Movimiento neto" valor={creditos - debitos} color="#4e2581" />
      </section>

      <section style={filtrosBox}>
        <Filtro label="Desde"><input type="date" value={filtros.desde} onChange={(e) => setFiltros({ ...filtros, desde: e.target.value })} /></Filtro>
        <Filtro label="Hasta"><input type="date" value={filtros.hasta} onChange={(e) => setFiltros({ ...filtros, hasta: e.target.value })} /></Filtro>
        <Filtro label="Tipo"><select value={filtros.tipo} onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}><option value="">Todos</option><option value="ingreso">Ingresos</option><option value="egreso">Egresos</option></select></Filtro>
        <button onClick={() => setFiltros({ desde: "", hasta: "", tipo: "" })} style={limpiar}>Limpiar filtros</button>
      </section>

      {error && <div style={errorBox}>{error}</div>}
      <section style={tablaBox}>
        <div style={tablaTitulo}><h2 style={{ margin: 0 }}>Movimientos de {cuenta.nombre}</h2><span>{filtrados.length} registros</span></div>
        <div style={{ overflowX: "auto" }}><table style={tabla}>
          <thead><tr><th style={th}>Fecha</th><th style={th}>Movimiento</th><th style={th}>Tipo</th><th style={th}>Concepto</th><th style={th}>Descripción</th><th style={th}>Usuario</th><th style={th}>Monto</th></tr></thead>
          <tbody>
            {filtrados.map((mov) => {
              const tipo = obtenerTipo(mov, id)
              const transferencia = mov.categoria === "transferencia"
              const descripcion = transferencia ? (tipo === "ingreso" ? `Desde ${mov.cuentaOrigenNombre}` : `Hacia ${mov.cuentaDestinoNombre}`) : mov.descripcion
              return <tr key={mov.id} style={mov.anulado ? { opacity: .62, background: "#fff1f2" } : undefined}>
                <td style={td}>{mov.fecha?.toDate ? fechaTexto.format(mov.fecha.toDate()) : "—"}</td>
                <td style={td}><span style={tipo === "ingreso" ? badgeIngreso : badgeEgreso}>{transferencia ? "Transferencia" : tipo === "ingreso" ? "Ingreso" : "Egreso"}</span></td>
                <td style={td}>{mov.tipoMovimientoNombre || "Movimiento"}{mov.anulado && <span style={anuladoBadge}>ANULADO</span>}</td>
                <td style={td}>{mov.concepto || "—"}</td>
                <td style={td}>{descripcion || "—"}</td>
                <td style={td}>{mov.creadoPorNombre || mov.creadoPorEmail || mov.creadoPor?.slice?.(0, 8) || "—"}</td>
                <td style={{ ...td, color: tipo === "ingreso" ? "#16865c" : "#c0394b", fontWeight: 700 }}>{tipo === "ingreso" ? "+ " : "− "}{pesos.format(Number(mov.monto || 0))}</td>
              </tr>
            })}
            {filtrados.length === 0 && <tr><td colSpan="7" style={mensaje}>Esta cuenta todavía no tiene movimientos.</td></tr>}
          </tbody>
        </table></div>
      </section>
    </div>
  )
}

function obtenerTipo(movimiento, cuentaId) {
  if (movimiento.categoria === "transferencia") return movimiento.cuentaDestinoId === cuentaId ? "ingreso" : "egreso"
  return movimiento.categoria
}
function Resumen({ label, valor, color }) { return <div style={resumenCard}><span style={resumenLabel}>{label}</span><strong style={{ color, fontSize: 24 }}>{pesos.format(valor)}</strong></div> }
function Filtro({ label, children }) { return <label><span style={labelStyle}>{label}</span>{children}</label> }

const pagina = { maxWidth: 1300, margin: "0 auto" }
const volver = { marginBottom: 12, padding: 0, border: 0, background: "transparent", color: "#4e2581", fontWeight: 700, cursor: "pointer", boxShadow: "none" }
const cabecera = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, flexWrap: "wrap", padding: "24px 27px", borderRadius: 18, color: "white", background: "linear-gradient(100deg,#4e2581,#63349a)", boxShadow: "0 14px 30px rgba(78,37,129,.17)" }
const sobreTitulo = { color: "#bfe8ff", fontSize: 12, fontWeight: 700, letterSpacing: ".12em" }
const saldo = { display: "block", marginTop: 4, fontFamily: "Fredoka", fontSize: 32 }
const resumen = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 14, margin: "18px 0" }
const resumenCard = { padding: 18, borderRadius: 15, background: "white", border: "1px solid #e8e1ee", boxShadow: "0 8px 22px rgba(78,37,129,.06)" }
const resumenLabel = { display: "block", marginBottom: 7, color: "#776d83", fontSize: 13, fontWeight: 600 }
const filtrosBox = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, alignItems: "end", padding: 18, marginBottom: 18, borderRadius: 15, background: "white", border: "1px solid #e8e1ee" }
const labelStyle = { display: "block", marginBottom: 7, color: "#665b71", fontSize: 13, fontWeight: 600 }
const limpiar = { padding: 11, border: 0, borderRadius: 10, background: "#eee9f1", color: "#4e2581", fontWeight: 600, cursor: "pointer" }
const tablaBox = { overflow: "hidden", borderRadius: 16, background: "white", border: "1px solid #e8e1ee", boxShadow: "0 12px 30px rgba(78,37,129,.07)" }
const tablaTitulo = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "17px 20px", color: "#4e2581", borderBottom: "1px solid #eee7f4" }
const tabla = { width: "100%", borderCollapse: "collapse" }
const th = { padding: 14, textAlign: "left", color: "#665b71", background: "#f7f5fb", fontSize: 13, whiteSpace: "nowrap" }
const td = { padding: 14, borderTop: "1px solid #f0eaf4", fontSize: 14, whiteSpace: "nowrap" }
const badgeIngreso = { padding: "5px 9px", borderRadius: 999, color: "#166747", background: "#dcf7eb", fontSize: 12, fontWeight: 700 }
const badgeEgreso = { padding: "5px 9px", borderRadius: 999, color: "#a12d3e", background: "#ffe3e8", fontSize: 12, fontWeight: 700 }
const mensaje = { padding: 35, textAlign: "center", color: "#776d83" }
const errorBox = { marginBottom: 16, padding: 12, borderRadius: 10, background: "#fff1f2", color: "#be123c" }
const anuladoBadge = { display: "inline-block", marginLeft: 7, padding: "2px 6px", borderRadius: 999, background: "#fee2e2", color: "#b42339", fontSize: 10, fontWeight: 800 }
