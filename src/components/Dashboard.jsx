import { useEffect, useState } from "react"

export default function Dashboard() {

  const [eventos, setEventos] = useState([])

  useEffect(() => {

    const guardados =
      JSON.parse(localStorage.getItem("eventos")) || []

    setEventos(guardados)

  }, [])

  const totalEventos = eventos.length

  const confirmados = eventos.filter(
    e => e.estado === "Confirmado"
  ).length

  const pagados = eventos.filter(
    e => e.estado === "Pagado"
  ).length

  const pendiente = eventos.reduce(
    (acc, ev) =>
      acc + Number(ev.saldo || 0),
    0
  )

  const proximos = [...eventos]
    .sort(
      (a, b) =>
        new Date(a.fecha) -
        new Date(b.fecha)
    )
    .slice(0, 5)

  return (

    <div>

      <h2
        style={{
          marginBottom: "25px"
        }}
      >
        Dashboard
      </h2>

      {/* CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(220px,1fr))",
          gap: "20px"
        }}
      >

        <Card
          titulo="Total eventos"
          valor={totalEventos}
        />

        <Card
          titulo="Confirmados"
          valor={confirmados}
        />

        <Card
          titulo="Pagados"
          valor={pagados}
        />

        <Card
          titulo="Saldo pendiente"
          valor={`$${pendiente}`}
        />

      </div>

      {/* PROXIMOS EVENTOS */}
      <div
        style={{
          marginTop: "35px",
          background: "white",
          padding: "20px",
          borderRadius: "10px"
        }}
      >

        <h3>
          Próximos eventos
        </h3>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse"
          }}
        >

          <thead>

            <tr>

              <th style={th}>
                Cliente
              </th>

              <th style={th}>
                Fecha
              </th>

              <th style={th}>
                Estado
              </th>

              <th style={th}>
                Saldo
              </th>

            </tr>

          </thead>

          <tbody>

            {proximos.map(ev => (

              <tr
                key={ev.id}
                style={{
                  borderBottom:
                    "1px solid #eee"
                }}
              >

                <td style={td}>
                  {ev.cliente}
                </td>

                <td style={td}>
                  {ev.fecha}
                </td>

                <td style={td}>
                  {ev.estado}
                </td>

                <td style={td}>
                  ${ev.saldo}
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  )
}

function Card({ titulo, valor }) {

  return (

    <div
      style={{
        background: "white",
        padding: "25px",
        borderRadius: "10px",
        border: "1px solid #e5e7eb"
      }}
    >

      <div
        style={{
          color: "#6b7280",
          fontSize: "14px",
          marginBottom: "10px"
        }}
      >
        {titulo}
      </div>

      <div
        style={{
          fontSize: "28px",
          fontWeight: "bold",
          color: "#111827"
        }}
      >
        {valor}
      </div>

    </div>
  )
}

const th = {
  textAlign: "left",
  padding: "12px"
}

const td = {
  padding: "12px"
}