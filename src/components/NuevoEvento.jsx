import { useState } from "react"
import { useNavigate } from "react-router-dom"

export default function NuevoEvento() {

  const navigate = useNavigate()

  const [error, setError] = useState("")

  const tiposEventos =
    JSON.parse(
      localStorage.getItem("tiposEventos")
    ) || []

  const prestadoresGuardados =
    JSON.parse(
      localStorage.getItem("prestadores")
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
    cantidadNinos: "",
    escuela: "",

    prestadores: [],

    total:
      tiposEventos[0]?.precio || 0,

    sena: "",

    estado: "Presupuestado",

    observaciones: ""
  })

  function handleChange(e) {

    const { name, value } = e.target

    let nuevoForm = {
      ...form,
      [name]: value
    }

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

  function agregarPrestador(valor) {

    if (!valor) return

    const prestador =
      JSON.parse(valor)

    const yaExiste =
      form.prestadores.find(
        p => p.id === prestador.id
      )

    if (yaExiste) return

    setForm({
      ...form,
      prestadores: [
        ...form.prestadores,
        {
          ...prestador,
          actividad: "",
          costo: "",
          precio: ""
        }
      ]
    })
  }

  function actualizarPrestador(
    index,
    campo,
    valor
  ) {

    const nuevos =
      [...form.prestadores]

    nuevos[index][campo] = valor

    setForm({
      ...form,
      prestadores: nuevos
    })
  }

  function eliminarPrestador(index) {

    const nuevos =
      form.prestadores.filter(
        (_, i) => i !== index
      )

    setForm({
      ...form,
      prestadores: nuevos
    })
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
      JSON.parse(
        localStorage.getItem("eventos")
      ) || []

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

      start:
        `${form.fecha}T${form.hora}`,

      end:
        `${form.fecha}T${form.horaFin}`,

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

          </Grid>

        </Section>

        {/* EVENTO */}
        <Section titulo="Información del evento">

          <Grid>

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

            <Input
              type="number"
              label="Cantidad personas"
              name="personas"
              value={form.personas}
              onChange={handleChange}
            />

            <Input
              type="number"
              label="Cantidad de niños"
              name="cantidadNinos"
              value={form.cantidadNinos}
              onChange={handleChange}
            />

            <div>

              <label style={label}>
                Escuela
              </label>

              <select
                name="escuela"
                value={form.escuela}
                onChange={handleChange}
                style={input}
              >

                <option value="">
                  Seleccionar escuela
                </option>

                <option>
                  Escuela Normal
                </option>

                <option>
                  La Salle
                </option>

                <option>
                  Don Bosco
                </option>

                <option>
                  Cristo Redentor
                </option>

                <option>
                  Escuela Privada
                </option>

                <option>
                  Otra
                </option>

              </select>

            </div>

          </Grid>

        </Section>

        {/* PRESTADORES */}
        <Section titulo="Prestadores">

          <div>

            <label style={label}>
              Seleccionar prestador
            </label>

            <select
              onChange={(e) =>
                agregarPrestador(
                  e.target.value
                )
              }
              style={input}
            >

              <option value="">
                Seleccionar prestador
              </option>

              {prestadoresGuardados.map((p) => (

                <option
                  key={p.id}
                  value={JSON.stringify(p)}
                >
                  {p.nombre} {p.apellido}
                </option>

              ))}

            </select>

          </div>

          {form.prestadores.length > 0 && (

            <div
              style={{
                marginTop: "25px",
                overflowX: "auto"
              }}
            >

              <table
                style={{
                  width: "100%",
                  borderCollapse:
                    "collapse"
                }}
              >

                <thead>

                  <tr
                    style={{
                      background:
                        "#f3f4f6"
                    }}
                  >

                    <th style={th}>
                      Nombre
                    </th>

                    <th style={th}>
                      Apellido
                    </th>

                    <th style={th}>
                      Actividad
                    </th>

                    <th style={th}>
                      Costo
                    </th>

                    <th style={th}>
                      Precio
                    </th>

                    <th style={th}>
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {form.prestadores.map(
                    (
                      prestador,
                      index
                    ) => (

                      <tr key={index}>

                        <td style={td}>
                          {
                            prestador.nombre
                          }
                        </td>

                        <td style={td}>
                          {
                            prestador.apellido
                          }
                        </td>

                        <td style={td}>

                          <input
                            type="text"
                            placeholder="Actividad"
                            value={
                              prestador.actividad
                            }
                            onChange={(e) =>
                              actualizarPrestador(
                                index,
                                "actividad",
                                e.target.value
                              )
                            }
                            style={
                              tableInput
                            }
                          />

                        </td>

                        <td style={td}>

                          <input
                            type="number"
                            placeholder="0"
                            value={
                              prestador.costo
                            }
                            onChange={(e) =>
                              actualizarPrestador(
                                index,
                                "costo",
                                e.target.value
                              )
                            }
                            style={
                              tableInput
                            }
                          />

                        </td>

                        <td style={td}>

                          <input
                            type="number"
                            placeholder="0"
                            value={
                              prestador.precio
                            }
                            onChange={(e) =>
                              actualizarPrestador(
                                index,
                                "precio",
                                e.target.value
                              )
                            }
                            style={
                              tableInput
                            }
                          />

                        </td>

                        <td style={td}>

                          <button
                            type="button"
                            onClick={() =>
                              eliminarPrestador(
                                index
                              )
                            }
                            style={{
                              background:
                                "#dc2626",
                              color: "white",
                              border: "none",
                              width: "34px",
                              height: "34px",
                              borderRadius:
                                "8px",
                              cursor:
                                "pointer"
                            }}
                          >
                            ✕
                          </button>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

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
                  background:
                    "#f3f4f6",
                  padding: "12px",
                  borderRadius:
                    "8px",
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

        {/* OBSERVACIONES */}
        <Section titulo="Observaciones">

          <textarea
            name="observaciones"
            value={
              form.observaciones
            }
            onChange={handleChange}
            rows="6"
            style={{
              width: "100%",
              padding: "14px",
              borderRadius:
                "8px",
              border:
                "1px solid #d1d5db",
              fontSize: "15px",
              resize: "vertical",
              boxSizing:
                "border-box"
            }}
          />

        </Section>

        {/* BOTÓN */}
        <div
          style={{
            marginTop: "30px",
            display: "flex",
            justifyContent:
              "flex-end"
          }}
        >

          <button
            type="submit"
            style={{
              background:
                "#2563eb",
              color: "white",
              border: "none",
              padding:
                "14px 28px",
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

function Section({
  titulo,
  children
}) {

  return (

    <div
      style={{
        background: "white",
        padding: "25px",
        borderRadius: "12px",
        marginBottom: "25px",
        border:
          "1px solid #e5e7eb"
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

const th = {
  textAlign: "left",
  padding: "14px",
  fontSize: "14px",
  color: "#374151",
  borderBottom:
    "1px solid #e5e7eb"
}

const td = {
  padding: "12px",
  borderBottom:
    "1px solid #f3f4f6"
}

const tableInput = {
  width: "100%",
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
  fontSize: "14px",
  boxSizing: "border-box"
}