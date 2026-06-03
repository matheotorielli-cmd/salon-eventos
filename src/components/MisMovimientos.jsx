import { useEffect, useState } from "react"

export default function MisMovimientos() {

  const [movimientos, setMovimientos] = useState([])

  const [fechaDesde, setFechaDesde] = useState("")
  const [fechaHasta, setFechaHasta] = useState("")
  const [cuentaFiltro, setCuentaFiltro] = useState("")
  const [tipoFiltro, setTipoFiltro] = useState("")

  useEffect(() => {
    const guardados =
      JSON.parse(localStorage.getItem("movimientos")) || []

    guardados.sort(
      (a, b) => new Date(b.fecha) - new Date(a.fecha)
    )

    setMovimientos(guardados)
  }, [])

  const cuentas = [
    ...new Set(
      movimientos.map((m) => m.cuenta).filter(Boolean)
    )
  ]

  const tipos = [
    ...new Set(
      movimientos.map((m) => m.tipo).filter(Boolean)
    )
  ]

  const filtrados = movimientos.filter((mov) => {
    const cumpleFecha =
      fechaDesde && fechaHasta
        ? mov.fecha >= fechaDesde && mov.fecha <= fechaHasta
        : true

    const cumpleCuenta =
      cuentaFiltro
        ? mov.cuenta === cuentaFiltro
        : true

    const cumpleTipo =
      tipoFiltro
        ? mov.tipo === tipoFiltro
        : true

    return cumpleFecha && cumpleCuenta && cumpleTipo
  })

  function eliminarMovimiento(id) {
    const confirmar = confirm("¿Seguro querés eliminar este movimiento?")

    if (!confirmar) return

    const nuevos = movimientos.filter((m) => m.id !== id)

    localStorage.setItem(
      "movimientos",
      JSON.stringify(nuevos)
    )

    setMovimientos(nuevos)
  }

  function colorTipo(mov) {
    if (mov.categoria === "Ingreso") return "#16a34a"
    if (mov.categoria === "Egreso") return "#64748b"
    return "#2563eb"
  }

  function formatearMonto(mov) {
    const monto = Number(mov.monto || 0)

    const signo =
      mov.categoria === "Egreso"
        ? "-"
        : ""

    return `${signo}$${monto.toLocaleString("es-AR")}`
  }

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto" }}>

      {/* FILTROS */}
      <div
        style={{
          background: "white",
          padding: "18px",
          borderRadius: "10px",
          marginBottom: "20px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))",
          gap: "16px",
          alignItems: "end"
        }}
      >

        <div>
          <label style={label}>Fecha desde</label>
          <input
            type="date"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
            style={input}
          />
        </div>

        <div>
          <label style={label}>Fecha hasta</label>
          <input
            type="date"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
            style={input}
          />
        </div>

        <div>
          <label style={label}>Cuenta</label>
          <select
            value={cuentaFiltro}
            onChange={(e) => setCuentaFiltro(e.target.value)}
            style={input}
          >
            <option value="">Todas</option>

            {cuentas.map((cuenta) => (
              <option key={cuenta} value={cuenta}>
                {cuenta}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={label}>Tipo de movimiento</label>
          <select
            value={tipoFiltro}
            onChange={(e) => setTipoFiltro(e.target.value)}
            style={input}
          >
            <option value="">Todos</option>

            {tipos.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => {
            setFechaDesde("")
            setFechaHasta("")
            setCuentaFiltro("")
            setTipoFiltro("")
          }}
          style={botonAzul}
        >
          Limpiar
        </button>

      </div>

      {/* TABLA */}
      <div
        style={{
          background: "white",
          borderRadius: "10px",
          overflow: "hidden",
          border: "1px solid #dbeafe"
        }}
      >

        <div
          style={{
            background: "#2563eb",
            color: "white",
            padding: "16px 20px",
            fontSize: "22px",
            fontWeight: "600"
          }}
        >
          Movimientos
        </div>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse"
            }}
          >
            <thead>
              <tr style={{ background: "#f3f4f6" }}>
                <th style={th}>Fecha</th>
                <th style={th}>Tipo de movimiento</th>
                <th style={th}>Concepto</th>
                <th style={th}>Divisa</th>
                <th style={th}>Monto</th>
                <th style={th}>Referencia</th>
                <th style={th}>Cuenta</th>
                <th style={th}>Usuario</th>
                <th style={th}>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {filtrados.map((mov) => (
                <tr key={mov.id}>
                  <td style={td}>{mov.fecha}</td>

                  <td style={td}>
                    <span
                      style={{
                        background: colorTipo(mov),
                        color: "white",
                        padding: "5px 9px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "700"
                      }}
                    >
                      {mov.tipo}
                    </span>
                  </td>

                  <td style={td}>
                    {mov.concepto || mov.descripcion || "-"}
                  </td>

                  <td style={td}>Peso</td>

                  <td
                    style={{
                      ...td,
                      color:
                        mov.categoria === "Ingreso"
                          ? "#16a34a"
                          : "#dc2626",
                      fontWeight: "700"
                    }}
                  >
                    {formatearMonto(mov)}
                  </td>

                  <td style={td}>
                    {mov.referencia || "-"}
                  </td>

                  <td style={td}>
                    {mov.cuenta || "-"}
                  </td>

                  <td style={td}>
                    {mov.usuario || "FunSpace"}
                  </td>

                  <td style={td}>
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        flexWrap: "wrap"
                      }}
                    >
                      <button style={botonEditar}>
                        Editar
                      </button>

                      <button
                        onClick={() => eliminarMovimiento(mov.id)}
                        style={botonEliminar}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtrados.length === 0 && (
                <tr>
                  <td
                    colSpan="9"
                    style={{
                      padding: "35px",
                      textAlign: "center",
                      color: "#6b7280"
                    }}
                  >
                    No hay movimientos cargados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  )
}

const label = {
  display: "block",
  marginBottom: "8px",
  fontWeight: "600",
  color: "#374151"
}

const input = {
  width: "100%",
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
  fontSize: "15px",
  boxSizing: "border-box"
}

const th = {
  textAlign: "left",
  padding: "14px",
  fontSize: "14px",
  color: "#374151",
  borderBottom: "1px solid #e5e7eb",
  whiteSpace: "nowrap"
}

const td = {
  padding: "14px",
  borderBottom: "1px solid #f3f4f6",
  fontSize: "14px",
  whiteSpace: "nowrap"
}

const botonAzul = {
  background: "#2563eb",
  color: "white",
  border: "none",
  padding: "12px 18px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600"
}

const botonEditar = {
  background: "#0284c7",
  color: "white",
  border: "none",
  padding: "8px 12px",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "600"
}

const botonEliminar = {
  background: "#dc2626",
  color: "white",
  border: "none",
  padding: "8px 12px",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "600"
}