import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { auth } from "../firebase"
import { useUserRole } from "../hooks/useUserRole"
import { actualizarEstadoCuenta, observarCuentas } from "../services/cuentas"

const pesos = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0
})

export default function Cuentas() {
  const navigate = useNavigate()
  const user = auth.currentUser
  const { hasPermission, loading: cargandoRol } = useUserRole(user)
  const [cuentas, setCuentas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState("")
  const [actualizandoId, setActualizandoId] = useState(null)
  const cuentasActivas = cuentas.filter((cuenta) => cuenta.activa !== false)
  const saldoTotal = cuentasActivas.reduce((total, cuenta) => total + Number(cuenta.saldoActual || 0), 0)

  useEffect(() => observarCuentas(
    (data) => {
      setCuentas(data)
      setCargando(false)
    },
    (loadError) => {
      console.error(loadError)
      setError("No se pudieron cargar las cuentas desde Firestore.")
      setCargando(false)
    }
  ), [])

  async function cambiarEstado(cuenta) {
    if (!hasPermission("cuentasAdministrar") || !user) return

    setError("")
    setActualizandoId(cuenta.id)

    try {
      await actualizarEstadoCuenta({
        cuentaId: cuenta.id,
        activa: cuenta.activa === false,
        userId: user.uid
      })
    } catch (updateError) {
      console.error(updateError)
      setError("No se pudo cambiar el estado de la cuenta.")
    } finally {
      setActualizandoId(null)
    }
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <div style={cabecera}>
        <div><span style={sobreTitulo}>FINANZAS</span><h2 style={{ margin: "3px 0 0" }}>Cuentas</h2></div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={() => navigate("/movimientos")} style={botonMovimientos}>Ver movimientos</button>
          <button onClick={() => navigate("/nueva-cuenta")} style={botonNueva}>+ Nueva cuenta</button>
        </div>
      </div>

      {error && <p role="alert" style={errorStyle}>{error}</p>}

      <div style={resumen}>
        <div style={resumenCard}><span style={resumenLabel}>Saldo total</span><strong style={resumenValor}>{pesos.format(saldoTotal)}</strong></div>
        <div style={resumenCard}><span style={resumenLabel}>Cuentas activas</span><strong style={resumenValor}>{cuentasActivas.length}</strong></div>
        <div style={resumenCard}><span style={resumenLabel}>Cuentas inactivas</span><strong style={resumenValor}>{cuentas.length - cuentasActivas.length}</strong></div>
      </div>

      <div style={{ background: "white", borderRadius: "16px", overflowX: "auto", border: "1px solid #e8e1ee", boxShadow: "0 12px 30px rgba(78,37,129,.07)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f7f5fb" }}>
              <th style={th}>Nombre</th>
              <th style={th}>Descripción</th>
              <th style={th}>Moneda</th>
              <th style={th}>Saldo inicial</th>
              <th style={th}>Saldo actual</th>
              <th style={th}>Estado</th>
              <th style={th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando && <FilaMensaje texto="Cargando cuentas..." />}
            {!cargando && cuentas.length === 0 && <FilaMensaje texto="No hay cuentas cargadas en Firestore" />}

            {cuentas.map((cuenta) => (
              <tr key={cuenta.id}>
                <td style={td}>
                  <button onClick={() => navigate(`/cuentas/${cuenta.id}`)} style={nombreCuenta}>{cuenta.nombre}</button>
                </td>
                <td style={td}>{cuenta.descripcion || "—"}</td>
                <td style={td}>{cuenta.moneda || "ARS"}</td>
                <td style={td}>{pesos.format(Number(cuenta.saldoInicial ?? cuenta.monto ?? 0))}</td>
                <td style={{ ...td, fontWeight: "700", color: Number(cuenta.saldoActual || 0) >= 0 ? "#16a34a" : "#dc2626" }}>
                  {pesos.format(Number(cuenta.saldoActual ?? cuenta.monto ?? 0))}
                </td>
                <td style={td}>
                  <span style={cuenta.activa === false ? estadoInactivo : estadoActivo}>
                    {cuenta.activa === false ? "Inactiva" : "Activa"}
                  </span>
                </td>
                <td style={td}>
                  {cargandoRol ? (
                    <span style={{ color: "#6b7280" }}>Verificando permisos...</span>
                  ) : hasPermission("cuentasAdministrar") ? (
                    <button
                      onClick={() => cambiarEstado(cuenta)}
                      style={cuenta.activa === false ? botonVerde : botonRojo}
                      disabled={actualizandoId === cuenta.id}
                    >
                      {actualizandoId === cuenta.id ? "Guardando..." : cuenta.activa === false ? "Habilitar" : "Deshabilitar"}
                    </button>
                  ) : (
                    <span style={{ color: "#6b7280" }}>Solo administrador</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function FilaMensaje({ texto }) {
  return <tr><td colSpan="7" style={{ padding: "25px", textAlign: "center", color: "#6b7280" }}>{texto}</td></tr>
}

const cabecera = { background: "linear-gradient(90deg,#4e2581,#63349a)", color: "white", padding: "18px 22px", borderRadius: "16px 16px 0 0", display: "flex", justifyContent: "space-between", alignItems: "center" }
const sobreTitulo = { color: "#bfe8ff", fontSize: 12, fontWeight: 700, letterSpacing: ".12em" }
const botonNueva = { background: "#f4d00c", color: "#38145f", border: "none", padding: "10px 18px", borderRadius: "999px", cursor: "pointer", fontWeight: "700" }
const botonMovimientos = { background: "rgba(255,255,255,.14)", color: "white", border: "1px solid rgba(255,255,255,.28)", padding: "10px 16px", borderRadius: "999px", cursor: "pointer", fontWeight: "600" }
const resumen = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14, margin: "18px 0" }
const resumenCard = { padding: 18, background: "white", border: "1px solid #e8e1ee", borderRadius: 15, boxShadow: "0 8px 20px rgba(78,37,129,.06)" }
const resumenLabel = { display: "block", marginBottom: 7, color: "#776d83", fontSize: 13, fontWeight: 600 }
const resumenValor = { color: "#4e2581", fontFamily: "Fredoka", fontSize: 25 }
const th = { padding: "14px", textAlign: "left", borderBottom: "1px solid #e5e7eb", color: "#374151", fontSize: "14px" }
const td = { padding: "14px", borderBottom: "1px solid #f0eaf4" }
const botonRojo = { background: "#ef4444", color: "white", border: "none", padding: "9px 14px", borderRadius: "6px", cursor: "pointer" }
const botonVerde = { background: "#22c55e", color: "white", border: "none", padding: "9px 14px", borderRadius: "6px", cursor: "pointer" }
const estadoActivo = { color: "#166534", background: "#dcfce7", padding: "5px 9px", borderRadius: "999px", fontSize: "12px", fontWeight: "700" }
const estadoInactivo = { color: "#991b1b", background: "#fee2e2", padding: "5px 9px", borderRadius: "999px", fontSize: "12px", fontWeight: "700" }
const errorStyle = { margin: "12px 0", color: "#b91c1c", background: "#fef2f2", border: "1px solid #fecaca", padding: "12px", borderRadius: "8px" }
const nombreCuenta = { padding: 0, border: 0, background: "transparent", color: "#4e2581", fontWeight: 700, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }
