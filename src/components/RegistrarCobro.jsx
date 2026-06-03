import { useEffect, useState } from "react"
import {
  useNavigate,
  useParams
} from "react-router-dom"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "../firebase"

export default function RegistrarCobro() {

  const { id } = useParams()

  const navigate = useNavigate()

  const [evento, setEvento] = useState(null)

  const cuentas =
    JSON.parse(
      localStorage.getItem("cuentas")
    ) || [
      { nombre: "Efectivo" }
    ]

  const fechaHoy =
    new Date()
      .toISOString()
      .split("T")[0]

  const [form, setForm] = useState({
    cuenta: "",
    descripcion: "",
    concepto: "",
    fecha: fechaHoy,
    porcentaje: "",
    monto: ""
  })

useEffect(() => {

  async function cargarEvento() {

    const ref = doc(db, "eventos", id)

    const snap = await getDoc(ref)

    if (snap.exists()) {

      setEvento({
        id: snap.id,
        ...snap.data()
      })

    }

  }

  cargarEvento()

}, [id])

  if (!evento) {
    return <h2>Evento no encontrado</h2>
  }

  function handleChange(e) {

    const { name, value } = e.target

    let nuevoForm = {
      ...form,
      [name]: value
    }

    if (name === "porcentaje") {

      const montoCalculado =
        (
          Number(evento.total || 0)
          * Number(value)
        ) / 100

      nuevoForm.monto =
        montoCalculado.toFixed(0)

    }

    setForm(nuevoForm)
  }

  function registrarCobro(e) {

    e.preventDefault()

    const nuevoPago =
      Number(evento.sena || 0)
      + Number(form.monto || 0)

    const nuevoSaldo =
      Number(evento.total || 0)
      - nuevoPago

    const eventos =
      JSON.parse(
        localStorage.getItem("eventos")
      ) || []

    const actualizados =
      eventos.map(ev => {

        if (
          String(ev.id) === id
        ) {

          return {
            ...ev,
            sena: nuevoPago,
            saldo: nuevoSaldo
          }

        }

        return ev
      })

    localStorage.setItem(
      "eventos",
      JSON.stringify(actualizados)
    )

    alert("Cobro registrado")

    navigate(`/evento/${id}`)
  }

  return (

    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        background: "white",
        borderRadius: "10px",
        overflow: "hidden"
      }}
    >

      {/* CABECERA */}
      <div
        style={{
          background: "#2563eb",
          color: "white",
          padding: "18px 25px",
          fontSize: "22px",
          fontWeight: "600"
        }}
      >
        Registrar cobro
      </div>

      <div
        style={{
          padding: "30px"
        }}
      >

        {/* INFO */}
        <div
          style={{
            fontSize: "22px",
            marginBottom: "30px"
          }}
        >

          Precio del evento:
          <b>
            {" "}
            ${evento.total}
          </b>

          {" "} - {" "}

          Saldo actual:
          <b>
            {" "}
            ${evento.saldo}
          </b>

        </div>

        <form onSubmit={registrarCobro}>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(250px,1fr))",
              gap: "20px"
            }}
          >

            {/* CUENTA */}
            <div>

              <label style={label}>
                Cuenta
              </label>

              <select
                name="cuenta"
                value={form.cuenta}
                onChange={handleChange}
                style={input}
              >

                <option value="">
                  Seleccionar cuenta
                </option>

                {cuentas.map(
                  (cuenta, index) => (

                    <option
                      key={index}
                      value={cuenta.nombre}
                    >
                      {cuenta.nombre}
                    </option>

                  )
                )}

              </select>

            </div>

            {/* DESCRIPCION */}
            <div>

              <label style={label}>
                Descripción
              </label>

              <input
                type="text"
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                placeholder="Descripción"
                style={input}
              />

            </div>

            {/* CONCEPTO */}
            <div>

              <label style={label}>
                Concepto
              </label>

              <input
                type="text"
                name="concepto"
                value={form.concepto}
                onChange={handleChange}
                placeholder="Concepto"
                style={input}
              />

            </div>

            {/* FECHA */}
            <div>

              <label style={label}>
                Fecha
              </label>

              <input
                type="date"
                name="fecha"
                value={form.fecha}
                onChange={handleChange}
                style={input}
              />

            </div>

            {/* PORCENTAJE */}
            <div>

              <label style={label}>
                Porcentaje
              </label>

              <select
                name="porcentaje"
                value={form.porcentaje}
                onChange={handleChange}
                style={input}
              >

                <option value="">
                  Seleccionar %
                </option>

                <option value="25">
                  25%
                </option>

                <option value="50">
                  50%
                </option>

                <option value="75">
                  75%
                </option>

                <option value="100">
                  100%
                </option>

              </select>

            </div>

            {/* MONTO */}
            <div>

              <label style={label}>
                Monto
              </label>

              <input
                type="number"
                name="monto"
                value={form.monto}
                onChange={handleChange}
                placeholder="Monto"
                style={input}
              />

            </div>

          </div>

          {/* BOTON */}
          <div
            style={{
              marginTop: "35px",
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
                padding: "14px 30px",
                borderRadius: "8px",
                fontSize: "16px",
                cursor: "pointer"
              }}
            >
              Cobrar
            </button>

          </div>

        </form>

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