import { useEffect, useState } from "react"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"

export default function App() {

  const [editando, setEditando] = useState(null)
  const [cliente, setCliente] = useState("")
  const [fecha, setFecha] = useState("")
  const [hora, setHora] = useState("")
  const [reservas, setReservas] = useState(() => {
    const guardadas = localStorage.getItem("reservas")
    return guardadas ? JSON.parse(guardadas) : []
  })

  useEffect(() => {
    localStorage.setItem("reservas", JSON.stringify(reservas))
  }, [reservas])
  function cambiarEstado(id, nuevoEstado) {

  const actualizadas = reservas.map((r) => {
    if (r.id === id) {
      return { ...r, estado: nuevoEstado }
    }
    return r
  })

  setReservas(actualizadas)
}
function iniciarEdicion(reserva) {
  setEditando(reserva)

  setCliente(reserva.cliente)
  setFecha(reserva.fecha)
  setHora(reserva.hora)
}
function handleEventDrop(info) {

  const nuevas = reservas.map((r) => {
    if (r.id === Number(info.event.id)) {
      return {
        ...r,
        fecha: info.event.startStr
      }
    }
    return r
  })

  setReservas(nuevas)
}
  function handleDateClick(info) {
    setFecha(info.dateStr)
  }

  function handleEventClick(info) {
    const reserva = reservas.find(
      (r) => r.id === Number(info.event.id)
    )

    if (reserva) {
      alert(
        `Cliente: ${reserva.cliente}\nFecha: ${reserva.fecha}\nHora: ${reserva.hora}`
      )
    }
  }

  function agregarReserva() {

    const existe = reservas.find(
      (r) => r.fecha === fecha && r.hora === hora
    )

    if (existe) {
      alert("Ya existe una reserva en ese horario")
      return
    }

    const nueva = {
      id: Date.now(),
      cliente,
      fecha,
      hora,
      estado: "pendiente"
    }

    if (editando) {

  const actualizadas = reservas.map((r) => {
    if (r.id === editando.id) {
      return {
        ...r,
        cliente,
        fecha,
        hora
      }
    }
    return r
  })

  setReservas(actualizadas)
  setEditando(null)

} else {

  setReservas([...reservas, nueva])
}

    setCliente("")
    setFecha("")
    setHora("")
  }

  function eliminarReserva(id) {
    setReservas(reservas.filter(r => r.id !== id))
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "Arial" }}>

      <div style={{ width: "250px", background: "#6d28d9", color: "white", padding: "20px" }}>
        <h1>Mi Salón</h1>
        <hr />
        <p>Dashboard</p>
        <p>Calendario</p>
        <p>Reservas</p>
        <p>Clientes</p>
        <p>Pagos</p>
      </div>

      <div style={{ flex: 1, padding: "30px", background: "#f3f4f6" }}>

        <h1>Nueva Reserva</h1>

        <input
          placeholder="Cliente"
          value={cliente}
          onChange={(e) => setCliente(e.target.value)}
        />

        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
        />

        <input
          type="time"
          value={hora}
          onChange={(e) => setHora(e.target.value)}
        />

        <button onClick={agregarReserva}>
          Agregar
        </button>

        <h2>Calendario</h2>

        <FullCalendar
          plugins={[dayGridPlugin]}
          initialView="dayGridMonth"
          height="500px"
          events={reservas.map(r => {

  let color = "#ef4444" // rojo por defecto (pendiente)

  if (r.estado === "seña") color = "#f59e0b"
  if (r.estado === "pagado") color = "#22c55e"

  return {
    id: r.id,
    title: r.cliente,
    date: r.fecha,
    color: color
  }
})}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          editable={true}
        />

        
        <h2>Reservas</h2>

{reservas.map((r) => {

  let color = "#ef4444"

  if (r.estado === "seña") color = "#f59e0b"
  if (r.estado === "pagado") color = "#22c55e"

  return (
    <div
      key={r.id}
      style={{
        background: "white",
        padding: "10px",
        marginBottom: "10px",
        borderRadius: "8px",
        borderLeft: `6px solid ${color}`
      }}
    >
      <p><b>{r.cliente}</b></p>
      <p>{r.fecha} - {r.hora}</p>

      <p>Estado: {r.estado}</p>

      <button onClick={() => eliminarReserva(r.id)}>
        Eliminar
      </button>

      <button onClick={() => iniciarEdicion(r)}>
        Editar
      </button>

      <div style={{ marginTop: "10px" }}>
        <button onClick={() => cambiarEstado(r.id, "pendiente")}>
          Pendiente
        </button>

        <button onClick={() => cambiarEstado(r.id, "seña")}>
          Seña
        </button>

        <button onClick={() => cambiarEstado(r.id, "pagado")}>
          Pagado
        </button>
      </div>
    </div>
  )
})}

        

      </div>
    </div>
  )
}