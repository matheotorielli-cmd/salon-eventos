import { useState } from "react"
import { useNavigate } from "react-router-dom"

export default function NuevoEvento() {

  const navigate = useNavigate()

  const [cliente, setCliente] = useState("")
  const [telefono, setTelefono] = useState("")
  const [direccion, setDireccion] = useState("")
  const [tipoEvento, setTipoEvento] = useState("")
  const [inicio, setInicio] = useState("")
  const [fin, setFin] = useState("")
  const [total, setTotal] = useState("")

  function guardarEvento() {

    const eventosGuardados =
      JSON.parse(localStorage.getItem("eventos")) || []

    const nuevoEvento = {
      id: Date.now().toString(),

      title: cliente,

      cliente,
      telefono,
      direccion,
      tipoEvento,

      start: inicio,
      end: fin,

      estado: "Pendiente",

      total: Number(total),
      cobrado: 0,

      notas: "",

      color: "#3b82f6"
    }

    eventosGuardados.push(nuevoEvento)

    localStorage.setItem(
      "eventos",
      JSON.stringify(eventosGuardados)
    )

    navigate("/")
  }

  return (
    <div
      style={{
        background: "white",
        padding: "30px",
        borderRadius: "10px"
      }}
    >

      <h1>Nuevo Evento</h1>

      <input
        type="text"
        placeholder="Cliente"
        value={cliente}
        onChange={(e) =>
          setCliente(e.target.value)
        }
        style={inputStyle}
      />

      <input
        type="text"
        placeholder="Teléfono"
        value={telefono}
        onChange={(e) =>
          setTelefono(e.target.value)
        }
        style={inputStyle}
      />

      <input
        type="text"
        placeholder="Dirección"
        value={direccion}
        onChange={(e) =>
          setDireccion(e.target.value)
        }
        style={inputStyle}
      />

      <input
        type="text"
        placeholder="Tipo de evento"
        value={tipoEvento}
        onChange={(e) =>
          setTipoEvento(e.target.value)
        }
        style={inputStyle}
      />

      <input
        type="datetime-local"
        value={inicio}
        onChange={(e) =>
          setInicio(e.target.value)
        }
        style={inputStyle}
      />

      <input
        type="datetime-local"
        value={fin}
        onChange={(e) =>
          setFin(e.target.value)
        }
        style={inputStyle}
      />

      <input
        type="number"
        placeholder="Precio total"
        value={total}
        onChange={(e) =>
          setTotal(e.target.value)
        }
        style={inputStyle}
      />

      <button
        onClick={guardarEvento}
        style={{
          background: "#2563eb",
          color: "white",
          border: "none",
          padding: "12px 20px",
          borderRadius: "8px",
          marginTop: "20px"
        }}
      >
        Guardar Evento
      </button>

    </div>
  )
}

const inputStyle = {
  width: "100%",
  padding: "10px",
  marginBottom: "15px",
  borderRadius: "8px",
  border: "1px solid #d1d5db"
}