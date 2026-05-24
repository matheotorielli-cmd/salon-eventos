import { Routes, Route, Navigate } from "react-router-dom"
import { useEffect, useState } from "react"

import Navbar from "./components/Navbar"
import Calendario from "./components/Calendario"
import Eventos from "./components/MisEventos"
import NuevoEvento from "./components/NuevoEvento"
import EventoDetalle from "./components/EventoDetalle"
import Login from "./components/Login"
import TiposEventos from "./components/TiposEventos"

import { auth } from "./firebase"
import { BrowserRouter } from "react-router-dom"

function RutaPrivada({ children, user }) {
  if (user === undefined) return null
  return user ? children : <Navigate to="/login" />
}

export default function App() {
  const [user, setUser] = useState(undefined)

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setUser(u)
    })
    return () => unsub()
  }, [])

  if (user === undefined) {
    return <div style={{ padding: 30 }}>Cargando...</div>
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/*"
          element={
            <RutaPrivada user={user}>
              <div style={{ minHeight: "100vh", background: "#f3f4f6" }}>
                <Navbar />

                <div style={{ padding: "20px", paddingTop: "80px" }}>
                  <Routes>
                    <Route path="/" element={<Calendario />} />
                    <Route path="/eventos" element={<Eventos />} />
                    <Route path="/nuevo" element={<NuevoEvento />} />
                    <Route path="/evento/:id" element={<EventoDetalle />} />
                    <Route path="/tipos-eventos" element={<TiposEventos />} />
                  </Routes>
                </div>
              </div>
            </RutaPrivada>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}