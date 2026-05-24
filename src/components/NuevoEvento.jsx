import { useState } from "react"
import { useNavigate } from "react-router-dom"

export default function NuevoEvento() {

  const navigate = useNavigate()

  const [error, setError] = useState("")

  const tiposEventos =
    JSON.parse(
      localStorage.getItem("tiposEventos")
    ) || []

  const [form, setForm] = useState({
    cliente: "",
    telefono: "",
    direccion: "",
    tipoEvento:
      tiposEventos[0]?.nombre || "",
    fecha: "",
    hora: "",
    horaFin: "",
    personas: "",
    total:
      tiposEventos[0]?.precio || 0,
    sena: "",
    estado: "Presupuestado",
    decoracion: "",
    dj: "",
    catering: "",
    observaciones: ""
  })

  function handleChange(e) {

    const { name, value } = e.target

    let nuevoForm = {
      ...form,
      [name]: value
    }

    /* PRECIO AUTOMÁTICO */
    if (name === "tipoEvento") {

      const tipoSeleccionado =
        tiposEventos.find(
          t => t.nombre === value
        )

      nuevoForm.total =
        tipoSeleccionado?.precio || 0

    }

    setForm(nuevoForm)
  }

  function guardarEvento(e) {

    e.preventDefault()

    setError("")

    if (!form.cliente.trim()) {
      return setError("Ingresá el cliente")
    }

    if (!form.telefono.trim()) {
      return setError("Ingresá el teléfono")
    }

    if (!form.fecha) {
      return setError("Seleccioná una fecha")
    }

    if (!form.total) {
      return setError("Ingresá el monto total")
    }

    if (
      Number(form.sena || 0) >
      Number(form.total || 0)
    ) {
      return setError(
        "La seña no puede ser mayor al total"
      )
    }

    const eventos =
      JSON.parse(localStorage.getItem("eventos")) || []

    const existe = eventos.find(ev =>

      ev.fecha === form.fecha &&

      ev.cliente.toLowerCase() ===
      form.cliente.toLowerCase()

    )

    if (existe) {

      return setError(
        "Ese cliente ya tiene un evento ese día"
      )

    }

    const nuevoEvento = {

      id: Date.now(),

      title: form.cliente,

      start: `${form.fecha}T${form.hora}`,

      ...form,

      saldo:
        Number(form.total || 0) -
        Number(form.sena || 0)
    }

    eventos.push(nuevoEvento)

    localStorage.setItem(
      "eventos",
      JSON.stringify(eventos)
    )

    navigate("/eventos")
  }

  const saldo =
    Number(form.total || 0) -
    Number(form.sena || 0)

  return (

    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto"
      }}
    >

      <h1
        style={{
          marginBottom: "25px",
          color: "#1e3a8a"
        }}
      >
        Nuevo Evento
      </h1>

      {error && (

        <div
          style={{
            background: "#fee2e2",
            color: "#b91c1c",
            padding: "14px",
            borderRadius: "8px",
            marginBottom: "20px",
            fontWeight: "600"
          }}
        >
          {error}
        </div>

      )}

      <form onSubmit={guardarEvento}>

        {/* CLIENTE */}
        <Section titulo="Información del cliente">

          <Grid>

            <Input
              label="Cliente"
              name="cliente"
              value={form.cliente}
              onChange={handleChange}
              required
            />

            <Input
              label="Teléfono"
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
              required
            />

            <Input
              label="Dirección"
              name="direccion"
              value={form.direccion}
              onChange={handleChange}
            />

            <div>

              <label style={label}>
                Tipo de evento
              </label>

              <select
                name="tipoEvento"
                value={form.tipoEvento}
                onChange={handleChange}
                style={input}
              >

                {tiposEventos.map((tipo, index) => (

                  <option
                    key={index}
                    value={tipo.nombre}
                  >
                    {tipo.nombre}
                  </option>

                ))}

              </select>

            </div>

          </Grid>

        </Section>

        {/* FECHA */}
        <Section titulo="Fecha y horario">

          <Grid>

            <Input
              type="date"
              label="Fecha"
              name="fecha"
              value={form.fecha}
              onChange={handleChange}
              required
            />

            <Input
              type="time"
              label="Hora inicio"
              name="hora"
              value={form.hora}
              onChange={handleChange}
            />

            <Input
              type="time"
              label="Hora finalización"
              name="horaFin"
              value={form.horaFin}
              onChange={handleChange}
            />

            <Input
              type="number"
              label="Cantidad personas"
              name="personas"
              value={form.personas}
              onChange={handleChange}
            />

          </Grid>

        </Section>

        {/* FINANZAS */}
        <Section titulo="Finanzas">

          <Grid>

            <Input
              type="number"
              label="Monto total"
              name="total"
              value={form.total}
              onChange={handleChange}
              required
            />

            <Input
              type="number"
              label="Seña"
              name="sena"
              value={form.sena}
              onChange={handleChange}
            />

            <div>

              <label style={label}>
                Saldo pendiente
              </label>

              <div
                style={{
                  background: "#f3f4f6",
                  padding: "12px",
                  borderRadius: "8px",
                  fontSize: "18px",
                  fontWeight: "bold",
                  color:
                    saldo > 0
                      ? "#dc2626"
                      : "#16a34a"
                }}
              >
                ${saldo}
              </div>

            </div>

            <div>

              <label style={label}>
                Estado
              </label>

              <select
                name="estado"
                value={form.estado}
                onChange={handleChange}
                style={input}
              >

                <option>
                  Presupuestado
                </option>

                <option>
                  Confirmado
                </option>

                <option>
                  Pagado
                </option>

                <option>
                  Cancelado
                </option>

              </select>

            </div>

          </Grid>

        </Section>

        {/* SERVICIOS */}
        <Section titulo="Servicios y extras">

          <Grid>

            <Input
              label="Decoración"
              name="decoracion"
              value={form.decoracion}
              onChange={handleChange}
            />

            <Input
              label="DJ"
              name="dj"
              value={form.dj}
              onChange={handleChange}
            />

            <Input
              label="Catering"
              name="catering"
              value={form.catering}
              onChange={handleChange}
            />

          </Grid>

        </Section>

        {/* OBSERVACIONES */}
        <Section titulo="Observaciones">

          <textarea
            name="observaciones"
            value={form.observaciones}
            onChange={handleChange}
            rows="6"
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              fontSize: "15px",
              resize: "vertical",
              boxSizing: "border-box"
            }}
          />

        </Section>

        {/* BOTÓN */}
        <div
          style={{
            marginTop: "30px",
            display: "flex",
            justifyContent: "flex-end"
          }}
        >

          <button
            type="submit"
            style={{
              background: "#2563eb",
              color: "white",
              border: "none",
              padding: "14px 28px",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            Guardar evento
          </button>

        </div>

      </form>

    </div>
  )
}

/* COMPONENTES */

function Section({ titulo, children }) {

  return (

    <div
      style={{
        background: "white",
        padding: "25px",
        borderRadius: "12px",
        marginBottom: "25px",
        border: "1px solid #e5e7eb"
      }}
    >

      <h3
        style={{
          marginTop: 0,
          marginBottom: "20px",
          color: "#111827"
        }}
      >
        {titulo}
      </h3>

      {children}

    </div>
  )
}

function Grid({ children }) {

  return (

    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit,minmax(250px,1fr))",
        gap: "20px"
      }}
    >
      {children}
    </div>
  )
}

function Input({
  label,
  type = "text",
  ...props
}) {

  return (

    <div>

      <label style={labelStyle}>
        {label}
      </label>

      <input
        type={type}
        {...props}
        style={input}
      />

    </div>
  )
}

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  fontSize: "14px",
  fontWeight: "600",
  color: "#374151"
}

const label = {
  display: "block",
  marginBottom: "8px",
  fontSize: "14px",
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