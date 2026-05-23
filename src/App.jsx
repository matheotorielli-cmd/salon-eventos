import { Routes, Route, Navigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "./firebase"

import Navbar from "./components/Navbar"
import Calendario from "./components/Calendario"
import NuevoEvento from "./components/NuevoEvento"
import EventoDetalle from "./components/EventoDetalle"
import Login from "./Login"

export default function App() {

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })

    return () => unsub()
  }, [])

  if (loading) return <p>Cargando...</p>

  return (
    <Routes>

      {/* LOGIN */}
      <Route
        path="/login"
        element={!user ? <Login /> : <Navigate to="/" />}
      />

      {/* APP PROTEGIDA */}
      <Route
        path="/*"
        element={
          user ? (
            <div style={{ minHeight: "100vh", background: "#f3f4f6" }}>
              <Navbar />

              <div style={{ padding: "20px" }}>
                <Routes>
                  <Route path="/" element={<Calendario />} />
                  <Route path="/eventos" element={<Calendario />} />
                  <Route path="/nuevo" element={<NuevoEvento />} />
                  <Route path="/evento/:id" element={<EventoDetalle />} />

                  <Route path="/finanzas" element={<div>Finanzas</div>} />
                  <Route path="/movimientos" element={<div>Movimientos</div>} />
                </Routes>
              </div>
            </div>
          ) : (
            <Navigate to="/login" />
          )
        }
      />

    </Routes>
  )
}