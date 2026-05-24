import { useNavigate, useParams } from "react-router-dom"
import { useEffect, useState } from "react"

export default function EventoDetalle() {

  const { id } = useParams()
  const navigate = useNavigate()

  const [evento, setEvento] = useState(null)
  const [editando, setEditando] = useState(false)

  const [form, setForm] = useState({
    cliente: "",
    telefono: "",
    direccion: "",
    tipoEvento: "",
    fecha: "",
    hora: "",
    personas: "",
    total: "",
    observaciones: ""
  })

  useEffect(() => {

    const eventos =
      JSON.parse(localStorage.getItem("eventos")) || []

    const encontrado = eventos.find(
      e => String(e.id) === id
    )

    setEvento(encontrado)

    if (encontrado) {
      setForm(encontrado)
    }

  }, [id])

  if (!evento) {
    return <h2>Evento no encontrado</h2>
  }

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    })
  }

  function guardarEdicion() {

    const eventos =
      JSON.parse(localStorage.getItem("eventos")) || []

    const actualizados = eventos.map(e => {

      if (String(e.id) === id) {
        return {
          ...form,
          id: e.id,
          estado: e.estado,
          sena: e.sena || 0,
          saldo: e.saldo || 0
        }
      }

      return e
    })

    localStorage.setItem(
      "eventos",
      JSON.stringify(actualizados)
    )

    setEvento(form)
    setEditando(false)
  }

  function cambiarEstado(nuevoEstado) {

    const eventos =
      JSON.parse(localStorage.getItem("eventos")) || []

    const actualizados = eventos.map(e => {

      if (String(e.id) === id) {
        return {
          ...e,
          estado: nuevoEstado
        }
      }

      return e
    })

    localStorage.setItem(
      "eventos",
      JSON.stringify(actualizados)
    )

    setEvento({
      ...evento,
      estado: nuevoEstado
    })
  }

  function eliminarEvento() {

    const confirmar = confirm("¿Seguro querés eliminar este evento?")
    if (!confirmar) return

    const eventos =
      JSON.parse(localStorage.getItem("eventos")) || []

    const filtrados = eventos.filter(
      e => String(e.id) !== id
    )

    localStorage.setItem(
      "eventos",
      JSON.stringify(filtrados)
    )

    navigate("/eventos")
  }

  function registrarPago() {

    const monto = prompt("Ingresar monto del pago:")
    if (!monto) return

    const nuevaSena =
      Number(evento.sena || 0) + Number(monto)

    const nuevoSaldo =
      Number(evento.total || 0) - nuevaSena

    const eventos =
      JSON.parse(localStorage.getItem("eventos")) || []

    const actualizados = eventos.map(e => {

      if (String(e.id) === id) {
        return {
          ...e,
          sena: nuevaSena,
          saldo: nuevoSaldo
        }
      }

      return e
    })

    localStorage.setItem(
      "eventos",
      JSON.stringify(actualizados)
    )

    setEvento({
      ...evento,
      sena: nuevaSena,
      saldo: nuevoSaldo
    })

    alert("Pago registrado")
  }

  const estadoColor = {
    Presupuestado: "#f59e0b",
    Confirmado: "#2563eb",
    Pagado: "#16a34a",
    Cancelado: "#dc2626"
  }

  return (

    <div style={{
      maxWidth: "1000px",
      margin: "0 auto",
      background: "white",
      borderRadius: "10px",
      padding: "30px"
    }}>

      {/* CABECERA */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "15px",
        marginBottom: "25px"
      }}>

        <div>

          <h2 style={{ margin: 0, color: "#1e3a8a" }}>
            Evento #{evento.id}
          </h2>

          <div style={{
            marginTop: "8px",
            display: "inline-block",
            background: estadoColor[evento.estado],
            color: "white",
            padding: "6px 12px",
            borderRadius: "20px",
            fontSize: "13px"
          }}>
            {evento.estado}
          </div>

        </div>

        {/* BOTONES */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>

          {!editando ? (
            <button onClick={() => setEditando(true)} style={botonAzul}>
              Editar
            </button>
          ) : (
            <button onClick={guardarEdicion} style={botonVerde}>
              Guardar
            </button>
          )}

          <button onClick={() => cambiarEstado("Confirmado")} style={botonAzul}>
            Confirmar
          </button>

          <button onClick={() => cambiarEstado("Pagado")} style={botonVerde}>
            Marcar pagado
          </button>

          <button onClick={() => cambiarEstado("Cancelado")} style={botonRojo}>
            Cancelar
          </button>

          <button onClick={registrarPago} style={botonGris}>
            Registrar pago
          </button>

          <button onClick={eliminarEvento} style={botonRojo}>
            Eliminar
          </button>

        </div>
      </div>

      {/* DATOS */}
      {!editando ? (

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
          gap: "20px"
        }}>

          <Card titulo="Cliente" valor={evento.cliente} />
          <Card titulo="Teléfono" valor={evento.telefono} />
          <Card titulo="Dirección" valor={evento.direccion} />
          <Card titulo="Tipo de evento" valor={evento.tipoEvento} />
          <Card titulo="Fecha" valor={evento.fecha} />
          <Card titulo="Hora" valor={evento.hora} />
          <Card titulo="Personas" valor={evento.personas} />
          <Card titulo="Total" valor={`$${evento.total}`} />
          <Card titulo="Seña" valor={`$${evento.sena}`} />
          <Card titulo="Saldo" valor={`$${evento.saldo}`} />

        </div>

      ) : (

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
          gap: "15px"
        }}>

          {Object.keys(form).map((key) => (
            <input
              key={key}
              name={key}
              value={form[key] || ""}
              onChange={handleChange}
              placeholder={key}
              style={{
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #ccc"
              }}
            />
          ))}

        </div>

      )}

      {/* OBSERVACIONES */}
      <div style={{
        marginTop: "30px",
        borderTop: "1px solid #eee",
        paddingTop: "20px"
      }}>

        <h3>Observaciones</h3>

        <p style={{
          color: "#555",
          lineHeight: "1.6"
        }}>
          {evento.observaciones || "Sin observaciones"}
        </p>

      </div>

    </div>
  )
}

function Card({ titulo, valor }) {

  return (
    <div style={{
      background: "#f9fafb",
      padding: "18px",
      borderRadius: "8px",
      border: "1px solid #e5e7eb"
    }}>
      <div style={{ fontSize: "13px", color: "#6b7280" }}>
        {titulo}
      </div>
      <div style={{ fontSize: "17px", fontWeight: "600" }}>
        {valor || "-"}
      </div>
    </div>
  )
}

const botonAzul = {
  background: "#2563eb",
  color: "white",
  border: "none",
  padding: "10px 16px",
  borderRadius: "6px",
  cursor: "pointer"
}

const botonVerde = {
  background: "#16a34a",
  color: "white",
  border: "none",
  padding: "10px 16px",
  borderRadius: "6px",
  cursor: "pointer"
}

const botonRojo = {
  background: "#dc2626",
  color: "white",
  border: "none",
  padding: "10px 16px",
  borderRadius: "6px",
  cursor: "pointer"
}

const botonGris = {
  background: "#4b5563",
  color: "white",
  border: "none",
  padding: "10px 16px",
  borderRadius: "6px",
  cursor: "pointer"
}