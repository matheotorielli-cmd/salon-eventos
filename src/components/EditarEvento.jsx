import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

export default function EditarEvento() {

  const { id } = useParams()

  const navigate = useNavigate()

  const [form, setForm] = useState(null)

  useEffect(() => {

    const eventos =
      JSON.parse(localStorage.getItem("eventos")) || []

    const encontrado = eventos.find(
      e => String(e.id) === id
    )

    setForm(encontrado)

  }, [id])

  if (!form) {
    return <h2>Cargando...</h2>
  }

  function handleChange(e) {

    setForm({
      ...form,
      [e.target.name]: e.target.value
    })

  }

  function guardarCambios(e) {

    e.preventDefault()

    const eventos =
      JSON.parse(localStorage.getItem("eventos")) || []

    const actualizados = eventos.map(ev => {

      if (String(ev.id) === id) {

        return {

          ...form,

          saldo:
            Number(form.total || 0) -
            Number(form.sena || 0)

        }

      }

      return ev
    })

    localStorage.setItem(
      "eventos",
      JSON.stringify(actualizados)
    )

    navigate(`/evento/${id}`)
  }

  return (

    <div
      style={{
        maxWidth: "1000px",
        margin: "0 auto",
        background: "white",
        padding: "30px",
        borderRadius: "10px"
      }}
    >

      <h2>
        Editar evento
      </h2>

      <form onSubmit={guardarCambios}>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(250px,1fr))",
            gap: "20px"
          }}
        >

          <input
            name="cliente"
            value={form.cliente}
            onChange={handleChange}
            placeholder="Cliente"
          />

          <input
            name="telefono"
            value={form.telefono}
            onChange={handleChange}
            placeholder="Teléfono"
          />

          <input
            name="direccion"
            value={form.direccion}
            onChange={handleChange}
            placeholder="Dirección"
          />

          <input
            type="date"
            name="fecha"
            value={form.fecha}
            onChange={handleChange}
          />

          <input
            type="time"
            name="hora"
            value={form.hora}
            onChange={handleChange}
          />

          <input
            type="number"
            name="personas"
            value={form.personas}
            onChange={handleChange}
            placeholder="Personas"
          />

          <input
            type="number"
            name="total"
            value={form.total}
            onChange={handleChange}
            placeholder="Total"
          />

          <input
            type="number"
            name="sena"
            value={form.sena}
            onChange={handleChange}
            placeholder="Seña"
          />

        </div>

        <textarea
          name="observaciones"
          value={form.observaciones}
          onChange={handleChange}
          rows="5"
          placeholder="Observaciones"
          style={{
            width: "100%",
            marginTop: "20px"
          }}
        />

        <button
          type="submit"
          style={{
            marginTop: "25px",
            background: "#2563eb",
            color: "white",
            border: "none",
            padding: "12px 22px",
            borderRadius: "6px",
            cursor: "pointer"
          }}
        >
          Guardar cambios
        </button>

      </form>

    </div>
  )
}