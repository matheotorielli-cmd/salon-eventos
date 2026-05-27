import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom"

import {
  useEffect,
  useState
} from "react"

import Navbar from "./components/Navbar"

import Calendario from "./components/Calendario"
import Eventos from "./components/MisEventos"
import NuevoEvento from "./components/NuevoEvento"
import EventoDetalle from "./components/EventoDetalle"
import EditarEvento from "./components/EditarEvento"
import RegistrarCobro from "./components/RegistrarCobro"
import NuevoTipoMovimiento from "./components/NuevoTipoMovimiento"

import Login from "./components/Login"
import Prestadores from "./components/Prestadores"
import TiposEventos from "./components/TiposEventos"
import Escuelas from "./components/Escuelas"
import Cuentas from "./components/Cuentas"
import NuevaCuenta from "./components/NuevaCuenta"
import NuevoMovimiento from "./components/NuevoMovimiento"
import TiposMovimientos from "./components/TiposMovimientos"

import { auth } from "./firebase"

function RutaPrivada({
  children,
  user
}) {

  if (user === undefined) {

    return (
      <div style={{ padding: 30 }}>
        Cargando...
      </div>
    )

  }

  return user
    ? children
    : <Navigate to="/login" />
}

function Layout() {

  return (

    <div
      style={{
        minHeight: "100vh",
        background: "#f3f4f6"
      }}
    >

      <Navbar />

      <div
        style={{
          padding: "15px",
          paddingTop: "80px",
          width: "100%",
          maxWidth: "1400px",
          margin: "0 auto",
          boxSizing: "border-box"
        }}
      >

        <Routes>

          <Route
            path="/"
            element={<Calendario />}
          />

          <Route
            path="/eventos"
            element={<Eventos />}
          />

          <Route
            path="/nuevo"
            element={<NuevoEvento />}
          />

          <Route
            path="/evento/:id"
            element={<EventoDetalle />}
          />

          <Route
            path="/evento/:id/editar"
            element={<EditarEvento />}
          />

          <Route
            path="/evento/:id/cobro"
            element={<RegistrarCobro />}
          />

          <Route
            path="/prestadores"
            element={<Prestadores />}
          />

          <Route
            path="/tipos-eventos"
            element={<TiposEventos />}
          />
           
           <Route
  path="/tipos-movimientos"
  element={<TiposMovimientos />}
/>
<Route
  path="/nuevo-tipo-movimiento"
  element={<NuevoTipoMovimiento />}
/>

          <Route
            path="/escuelas"
            element={<Escuelas />}
          />

          <Route
            path="/cuentas"
            element={<Cuentas />}
          />

          <Route
            path="/nueva-cuenta"
            element={<NuevaCuenta />}
          />

          <Route
            path="/nuevo-movimiento"
            element={<NuevoMovimiento />}
          />

        </Routes>

      </div>

    </div>
  )
}

export default function App() {

  const [user, setUser] =
    useState(undefined)

  useEffect(() => {

    const unsub =
      auth.onAuthStateChanged(
        (u) => {
          setUser(u)
        }
      )

    return () => unsub()

  }, [])

  return (

    <BrowserRouter>

      <Routes>

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/*"
          element={
            <RutaPrivada user={user}>
              <Layout />
            </RutaPrivada>
          }
        />

      </Routes>

    </BrowserRouter>
  )
}