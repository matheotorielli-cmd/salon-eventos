import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { addDoc, collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore"
import { db } from "../firebase"
import ClienteModal from "./ClienteModal"
import { nombreCompleto, observarClientes } from "../services/clientes"
import { observarEscuelas } from "../services/escuelas"
import { observarPrestadores, observarTiposEventos } from "../services/configuracion"
import { observarListasPrecios } from "../services/listasPrecios"

const DURACION_PREDETERMINADA_MINUTOS = 150

function completarHorarioFin(formulario, fechaInicio, horaInicio) {
  if (!horaInicio) return formulario

  const [horas, minutos] = horaInicio.split(":").map(Number)
  if (!Number.isFinite(horas) || !Number.isFinite(minutos)) return formulario

  const minutosFin = horas * 60 + minutos + DURACION_PREDETERMINADA_MINUTOS
  const horaFin = `${String(Math.floor((minutosFin % 1440) / 60)).padStart(2, "0")}:${String(minutosFin % 60).padStart(2, "0")}`
  let fechaFin = fechaInicio || formulario.fechaFin

  if (fechaInicio && minutosFin >= 1440) {
    const fecha = new Date(`${fechaInicio}T12:00:00`)
    fecha.setDate(fecha.getDate() + Math.floor(minutosFin / 1440))
    fechaFin = [
      fecha.getFullYear(),
      String(fecha.getMonth() + 1).padStart(2, "0"),
      String(fecha.getDate()).padStart(2, "0")
    ].join("-")
  }

  return { ...formulario, fechaFin, horaFin }
}

export default function NuevoEvento() {

  const navigate = useNavigate()
  const { id } = useParams()
  const editando = Boolean(id)

  const [error, setError] = useState("")
  const [guardando, setGuardando] = useState(false)
  const [cargando, setCargando] = useState(editando)
  const [clientes, setClientes] = useState([])
  const [escuelas, setEscuelas] = useState([])
  const [tiposEventos, setTiposEventos] = useState([])
  const [prestadoresGuardados, setPrestadoresGuardados] = useState([])
  const [listasPrecios, setListasPrecios] = useState([])
  const [mostrarClienteModal, setMostrarClienteModal] = useState(false)

  const [form, setForm] = useState({
    nombreEvento: "",
    clienteId: "",
    cliente: "",
    telefono: "",
    direccion: "",

    tipoEvento: "",
    listaPreciosId: "",
    listaPreciosNombre: "",
    servicioListaId: "",
    servicioListaNombre: "",
    servicioListaPrecio: 0,

    fecha: "",
    fechaFin: "",
    hora: "",
    horaFin: "",

    personas: "",
    cantidadNinos: "",
    escuelaId: "",
    escuela: "",

    prestadores: [],

    total: 0,

    sena: 0,
    totalCobrado: 0,

    estado: "Presupuestado",

    observaciones: "",
    detalles: "",
    notas: ""
  })

  useEffect(() => observarClientes(
    (datos) => setClientes(datos.filter((cliente) => cliente.activo !== false)),
    () => setError("No se pudieron cargar los clientes.")
  ), [])

  useEffect(() => observarEscuelas(
    (datos) => setEscuelas(datos.filter((escuela) => escuela.activa !== false)),
    () => setError("No se pudieron cargar las escuelas.")
  ), [])

  useEffect(() => observarTiposEventos(
    (datos) => {
      const activos = datos.filter((tipo) => tipo.activo !== false)
      setTiposEventos(activos)
      if (!editando && activos.length > 0) {
        setForm((actual) => actual.tipoEvento ? actual : {
          ...actual,
          tipoEvento: activos[0].nombre,
          total: Number(activos[0].precioBase ?? activos[0].precio ?? 0)
        })
      }
    },
    () => setError("No se pudieron cargar los tipos de eventos.")
  ), [editando])

  useEffect(() => observarPrestadores(
    (datos) => setPrestadoresGuardados(datos.filter((prestador) => prestador.activo !== false)),
    () => setError("No se pudieron cargar los prestadores.")
  ), [])

  useEffect(() => observarListasPrecios(
    (datos) => {
      const activas = datos.filter((lista) => lista.activa !== false)
      setListasPrecios(activas)
      if (!editando && activas.length > 0) {
        const listaActiva = activas[0]
        setForm((actual) => actual.listaPreciosId ? actual : {
          ...actual,
          listaPreciosId: listaActiva.id,
          listaPreciosNombre: listaActiva.nombre || ""
        })
      }
    },
    () => setError("No se pudieron cargar las listas de precios.")
  ), [editando])

  useEffect(() => {
    if (!editando) return

    async function cargarEvento() {
      try {
        const snapshot = await getDoc(doc(db, "eventos", id))
        if (!snapshot.exists()) {
          setError("No se encontró el evento.")
          return
        }

        const datos = snapshot.data()
        setForm((actual) => ({
          ...actual,
          ...datos,
          nombreEvento: datos.nombreEvento || "",
          clienteId: datos.clienteId || "",
          fechaFin: datos.fechaFin || datos.fecha || "",
          detalles: datos.detalles || "",
          notas: datos.notas || "",
          prestadores: datos.prestadores || []
        }))
      } catch (loadError) {
        console.error(loadError)
        setError("No se pudo cargar el evento.")
      } finally {
        setCargando(false)
      }
    }

    cargarEvento()
  }, [editando, id])

  function seleccionarCliente(clienteId) {
    const seleccionado = clientes.find((cliente) => cliente.id === clienteId)
    if (!seleccionado) {
      setForm((actual) => ({ ...actual, clienteId: "", cliente: "", telefono: "", direccion: "" }))
      return
    }
    setForm((actual) => ({
      ...actual,
      clienteId: seleccionado.id,
      cliente: nombreCompleto(seleccionado),
      telefono: seleccionado.telefono || "",
      direccion: seleccionado.direccion || ""
    }))
  }

  function clienteCreado(cliente) {
    setClientes((actuales) => [...actuales, cliente])
    setMostrarClienteModal(false)
    setForm((actual) => ({
      ...actual,
      clienteId: cliente.id,
      cliente: nombreCompleto(cliente),
      telefono: cliente.telefono || "",
      direccion: cliente.direccion || ""
    }))
  }

  function seleccionarEscuela(escuelaId) {
    const seleccionada = escuelas.find((escuela) => escuela.id === escuelaId)
    setForm((actual) => ({ ...actual, escuelaId: seleccionada?.id || "", escuela: seleccionada?.nombre || "" }))
  }

  function handleChange(e) {

    const { name, value } = e.target

    let nuevoForm = {
      ...form,
      [name]: value
    }

    if (name === "hora") {
      nuevoForm = completarHorarioFin(nuevoForm, nuevoForm.fecha, value)
    } else if (name === "fecha" && nuevoForm.hora) {
      nuevoForm = completarHorarioFin(nuevoForm, value, nuevoForm.hora)
    }

    if (name === "tipoEvento") {

      const tipoSeleccionado =
        tiposEventos.find(
          t => t.nombre === value
        )

      nuevoForm.total =
        tipoSeleccionado?.precioBase ?? tipoSeleccionado?.precio ?? 0

    }

    setForm(nuevoForm)
  }

  function cambiarFechaHora(campo, parte, valor) {
    setForm((actual) => {
      if (campo === "fin") {
        return { ...actual, [parte === "fecha" ? "fechaFin" : "horaFin"]: valor }
      }

      const actualizado = { ...actual, [parte === "fecha" ? "fecha" : "hora"]: valor }
      const fechaInicio = parte === "fecha" ? valor : actualizado.fecha
      const horaInicio = parte === "hora" ? valor : actualizado.hora
      return completarHorarioFin(actualizado, fechaInicio, horaInicio)
    })
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

  function seleccionarLista(listaId) {
    const lista = listasPrecios.find((item) => item.id === listaId)
    setForm((actual) => ({ ...actual, listaPreciosId: listaId, listaPreciosNombre: lista?.nombre || "", servicioListaId: "", servicioListaNombre: "", servicioListaPrecio: 0 }))
  }

  function seleccionarServicioLista(servicioId) {
    const lista = listasPrecios.find((item) => item.id === form.listaPreciosId)
    const servicio = lista?.servicios?.find((item) => item.id === servicioId)
    setForm((actual) => ({ ...actual, servicioListaId: servicioId, servicioListaNombre: servicio?.nombre || "", servicioListaPrecio: Number(servicio?.precio || 0), tipoEvento: servicio?.nombre || actual.tipoEvento, total: servicio ? Number(servicio.precio || 0) : actual.total }))
  }

  async function guardarEvento(e) {

    e.preventDefault()

    setError("")

    if (!form.nombreEvento.trim()) {
      return setError("Ingresá el nombre del evento")
    }

    if (!form.cliente.trim()) {
      return setError("Ingresá el cliente")
    }

    if (!form.telefono.trim()) {
      return setError("Ingresá el teléfono")
    }

    if (!editando && !form.listaPreciosId) {
      return setError("No hay una lista de precios activa para asignar al evento")
    }

    if (!form.fecha) {
      return setError("Seleccioná una fecha")
    }

    if (!form.hora || !form.horaFin) {
      return setError("Seleccioná la fecha y hora de inicio y fin")
    }

    const inicioEvento = new Date(`${form.fecha}T${form.hora}`)
    const finEvento = new Date(`${form.fechaFin || form.fecha}T${form.horaFin}`)
    if (finEvento <= inicioEvento) {
      return setError("La fecha de finalización debe ser posterior al inicio")
    }

    if (!form.total) {
      return setError("Ingresá el monto total")
    }

    if (
      Number(form.totalCobrado ?? form.sena ?? 0) >
      Number(form.total || 0)
    ) {
      return setError(
        "La seña no puede ser mayor al total"
      )
    }

    let existe = false
    if (!editando && form.clienteId) {
      try {
        const coincidencias = await getDocs(query(
          collection(db, "eventos"),
          where("clienteId", "==", form.clienteId),
          where("fecha", "==", form.fecha)
        ))
        existe = !coincidencias.empty
      } catch (validationError) {
        console.error(validationError)
        return setError("No se pudo validar si el cliente ya tiene un evento ese día")
      }
    }

    if (existe) {

      return setError(
        "Ese cliente ya tiene un evento ese día"
      )

    }

    const nuevoEvento = {

      ...form,

      id: form.id || Date.now(),

      title: form.nombreEvento.trim() || form.cliente,

      start:
        `${form.fecha}T${form.hora}`,

      end:
        `${form.fechaFin || form.fecha}T${form.horaFin}`,

      sena: Number(form.totalCobrado ?? form.sena ?? 0),
      totalCobrado: Number(form.totalCobrado ?? form.sena ?? 0),
      saldo:
        Number(form.total || 0) -
        Number(form.totalCobrado ?? form.sena ?? 0)
    }

    setGuardando(true)
    try {
      if (editando) await updateDoc(doc(db, "eventos", id), nuevoEvento)
      else await addDoc(collection(db, "eventos"), nuevoEvento)
      navigate(editando ? `/evento/${id}` : "/eventos")
    } catch (saveError) {
      console.error(saveError)
      setError("No se pudo guardar el evento")
    } finally {
      setGuardando(false)
    }
  }

  const saldo =
    Number(form.total || 0) -
    Number(form.totalCobrado ?? form.sena ?? 0)

  if (cargando) return <div style={{ padding: 30, color: "#4e2581", fontWeight: 700 }}>Cargando evento...</div>

  return (

    <div
      className="event-form-page"
      style={{
        maxWidth: "1200px",
        margin: "0 auto"
      }}
    >

<div
  style={{
    background:
      "linear-gradient(90deg,#4e2581,#63349a)",
    color: "white",
    padding: "18px 22px",
    borderRadius: "14px",
    marginBottom: "25px",
    fontSize: "24px",
    fontWeight: "700",
    boxShadow:
      "0 4px 14px rgba(37,99,235,0.25)"
  }}
>
  {editando ? "Editar evento" : "Crear nuevo evento"}
</div>

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

        <Section titulo="Información">
          <Grid>
            <div style={{ gridColumn: "1 / -1" }}>
              <Input
                label="Nombre del evento"
                name="nombreEvento"
                value={form.nombreEvento}
                onChange={handleChange}
                placeholder="Ingrese el nombre del evento"
                required
              />
            </div>

            <div>
              <label style={label}>Tipo de evento</label>
              <select name="tipoEvento" value={form.tipoEvento} onChange={handleChange} style={input}>
                <option value="">Seleccione el tipo</option>
                {tiposEventos.map((tipo, index) => <option key={index} value={tipo.nombre}>{tipo.nombre}</option>)}
              </select>
            </div>

            {editando && <div>
              <label style={label}>Lista de precios</label>
              <select value={form.listaPreciosId || ""} onChange={(e) => seleccionarLista(e.target.value)} style={input}>
                <option value="">Sin lista asignada</option>
                {listasPrecios.map((lista) => <option key={lista.id} value={lista.id}>{lista.nombre}</option>)}
              </select>
            </div>}

            {form.listaPreciosId && <div>
              <label style={label}>Cumpleaños o servicio de la lista</label>
              <select value={form.servicioListaId || ""} onChange={(e) => seleccionarServicioLista(e.target.value)} style={input}>
                <option value="">Seleccionar servicio</option>
                {(listasPrecios.find((lista) => lista.id === form.listaPreciosId)?.servicios || []).filter((servicio) => servicio.activo !== false).map((servicio) => <option key={servicio.id} value={servicio.id}>{servicio.nombre} · ${Number(servicio.precio || 0).toLocaleString("es-AR")}</option>)}
              </select>
            </div>}

            <div>
              <div style={clienteLabel}><label style={{ ...label, marginBottom: 0 }}>Cliente</label><button type="button" onClick={() => setMostrarClienteModal(true)} style={agregarClienteBtn}>Agregar cliente</button></div>
              <select value={form.clienteId} onChange={(e) => seleccionarCliente(e.target.value)} style={input} required>
                <option value="">Buscar o seleccionar cliente</option>
                {clientes.map((cliente) => <option key={cliente.id} value={cliente.id}>{nombreCompleto(cliente)}{cliente.dni ? ` · DNI ${cliente.dni}` : ""}</option>)}
              </select>
            </div>
            <Input label="Teléfono" name="telefono" value={form.telefono} onChange={handleChange} required />
            <Input label="Dirección" name="direccion" value={form.direccion} onChange={handleChange} />
            <div style={fechasFila}>
              <FechaHoraInput label="Fecha inicio" fecha={form.fecha} hora={form.hora} onFecha={(valor) => cambiarFechaHora("inicio", "fecha", valor)} onHora={(valor) => cambiarFechaHora("inicio", "hora", valor)} />
              <FechaHoraInput label="Fecha fin" fecha={form.fechaFin || form.fecha} hora={form.horaFin} onFecha={(valor) => cambiarFechaHora("fin", "fecha", valor)} onHora={(valor) => cambiarFechaHora("fin", "hora", valor)} />
            </div>

            <div style={datosCantidad}>
              <Input type="number" label="Cantidad de personas" name="personas" value={form.personas} onChange={handleChange} />
              <Input type="number" label="Cantidad de niños" name="cantidadNinos" value={form.cantidadNinos} onChange={handleChange} />
              <div>
                <label style={label}>Escuela</label>
                <select value={form.escuelaId} onChange={(e) => seleccionarEscuela(e.target.value)} style={input}>
                  <option value="">Seleccionar escuela</option>
                  {escuelas.map((escuela) => <option key={escuela.id} value={escuela.id}>{escuela.nombre}</option>)}
                </select>
              </div>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={label}>Detalles</label>
              <textarea name="detalles" value={form.detalles} onChange={handleChange} rows="4" placeholder="Ingrese un detalle (se visualiza en el comprobante)" style={textarea} />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={label}>Notas</label>
              <textarea name="notas" value={form.notas} onChange={handleChange} rows="4" placeholder="Puede ingresar notas (no se visualizan en el comprobante)" style={textarea} />
            </div>

          </Grid>
        </Section>

        {/* CLIENTE */}
        <Section titulo="Información del cliente" hidden>

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
        <Section titulo="Información del evento" hidden>

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
        <Section titulo="Fecha y horario" hidden>

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
              label="Cobrado (usar Registrar cobro)"
              name="totalCobrado"
              value={form.totalCobrado ?? form.sena ?? 0}
              disabled
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
            disabled={guardando}
            style={{
              background:
                "#4e2581",
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
            {guardando ? "Guardando..." : editando ? "Guardar cambios" : "Guardar evento"}
          </button>

        </div>

      </form>

      {mostrarClienteModal && <ClienteModal onClose={() => setMostrarClienteModal(false)} onCreado={clienteCreado} />}

    </div>
  )
}

/* COMPONENTES */

function Section({
  titulo,
  children,
  hidden = false
}) {

  if (hidden) return null

  return (

    <div
      style={{
        background: "white",
        borderRadius: "14px",
        marginBottom: "28px",
        border: "1px solid #dbe3f0",
        overflow: "hidden",
        boxShadow:
          "0 2px 10px rgba(0,0,0,0.04)"
      }}
    >

      <div
        style={{
          background:
    "linear-gradient(90deg,#4e2581,#63349a)",
          color: "white",
          padding: "14px 20px",
          fontWeight: "700",
          fontSize: "15px"
        }}
      >
        {titulo}
      </div>

      <div
        style={{
          padding: "25px"
        }}
      >
        {children}
      </div>

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
  padding: "13px 14px",
  borderRadius: "10px",
  border: "1px solid #d1d5db",
  fontSize: "15px",
  boxSizing: "border-box",
  background: "#ffffff",
  transition: ".2s",
  outline: "none"
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

function FechaHoraInput({ label, fecha, hora, onFecha, onHora }) {
  const [horaValor = "", minutoValor = ""] = (hora || "").split(":")
  const horas = Array.from({ length: 24 }, (_, indice) => String(indice).padStart(2, "0"))
  const minutos = Array.from({ length: 60 }, (_, indice) => String(indice).padStart(2, "0"))

  function cambiarHora(nuevaHora, nuevoMinuto) {
    if (!nuevaHora && !nuevoMinuto) return onHora("")
    onHora(`${nuevaHora || "00"}:${nuevoMinuto || "00"}`)
  }

  return <div style={fechaHoraCaja}>
    <label style={labelStyle}>{label}</label>
    <input type="date" value={fecha} onChange={(e) => onFecha(e.target.value)} style={input} required />
    <div style={selectorHora}>
      <span style={relojLabel}>Hora</span>
      <select value={horaValor} onChange={(e) => cambiarHora(e.target.value, minutoValor)} style={selectHora} required>
        <option value="">--</option>{horas.map((valor) => <option key={valor} value={valor}>{valor}</option>)}
      </select>
      <span style={dosPuntos}>:</span>
      <select value={minutoValor} onChange={(e) => cambiarHora(horaValor, e.target.value)} style={selectHora} required>
        <option value="">--</option>{minutos.map((valor) => <option key={valor} value={valor}>{valor}</option>)}
      </select>
      <span style={formato24}>24 h</span>
    </div>
  </div>
}

const textarea = {
  ...input,
  minHeight: "105px",
  resize: "vertical",
  fontFamily: "inherit"
}

const clienteLabel = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 8 }
const agregarClienteBtn = { padding: "6px 10px", border: 0, borderRadius: 8, color: "white", background: "#57b6ee", fontSize: 12, fontWeight: 700, cursor: "pointer" }
const fechasFila = { gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 20 }
const datosCantidad = { gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 20 }
const fechaHoraCaja = { padding: 14, border: "1px solid #e5ddec", borderRadius: 12, background: "#fbf9fd" }
const selectorHora = { display: "flex", alignItems: "center", gap: 7, marginTop: 10 }
const relojLabel = { marginRight: 3, color: "#4b4058", fontSize: 13, fontWeight: 700 }
const selectHora = { padding: "8px 9px", border: "1px solid #d1c6dc", borderRadius: 8, background: "white", color: "#33283d", fontWeight: 600 }
const dosPuntos = { color: "#4e2581", fontWeight: 800 }
const formato24 = { marginLeft: 3, color: "#776a82", fontSize: 12, fontWeight: 700 }
