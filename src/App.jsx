import { lazy, Suspense, useEffect, useState } from "react"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { auth } from "./firebase"
import { useUserRole } from "./hooks/useUserRole"
import Navbar from "./components/Navbar"

const Calendario = lazy(() => import("./components/Calendario"))
const Eventos = lazy(() => import("./components/MisEventos"))
const NuevoEvento = lazy(() => import("./components/NuevoEvento"))
const EventoDetalle = lazy(() => import("./components/EventoDetalle"))
const RegistrarCobro = lazy(() => import("./components/RegistrarCobro"))
const NuevoTipoMovimiento = lazy(() => import("./components/NuevoTipoMovimiento"))
const Login = lazy(() => import("./components/Login"))
const Prestadores = lazy(() => import("./components/Prestadores"))
const TiposEventos = lazy(() => import("./components/TiposEventos"))
const Escuelas = lazy(() => import("./components/Escuelas"))
const Cuentas = lazy(() => import("./components/Cuentas"))
const CuentaDetalle = lazy(() => import("./components/CuentaDetalle"))
const CajaCuenta = lazy(() => import("./components/CajaCuenta"))
const CajaDetalle = lazy(() => import("./components/CajaDetalle"))
const NuevaCuenta = lazy(() => import("./components/NuevaCuenta"))
const NuevoMovimiento = lazy(() => import("./components/NuevoMovimiento"))
const TiposMovimientos = lazy(() => import("./components/TiposMovimientos"))
const MisMovimientos = lazy(() => import("./components/MisMovimientos"))
const UsuariosPermisos = lazy(() => import("./components/UsuariosPermisos"))
const Usuarios = lazy(() => import("./components/Usuarios"))
const Clientes = lazy(() => import("./components/Clientes"))
const ClienteDetalle = lazy(() => import("./components/ClienteDetalle"))
const ComprobantePublico = lazy(() => import("./components/ComprobantePublico"))
const Balance = lazy(() => import("./components/Balance"))
const ListasPrecios = lazy(() => import("./components/ListasPrecios"))
const NuevaListaPrecios = lazy(() => import("./components/NuevaListaPrecios"))

function RutaPrivada({ children, user }) {
  if (user === undefined) return <div style={{ padding: 30 }}>Cargando...</div>
  return user ? children : <Navigate to="/login" replace />
}

function Layout() {
  const { hasPermission, role, loading } = useUserRole(auth.currentUser)
  const permitir = (permiso, contenido) => loading
    ? <div style={{ padding: 30 }}>Cargando permisos...</div>
    : hasPermission(permiso) ? contenido : <div style={{ padding: 30, color: "#776d83" }}>No tenés permiso para acceder a esta sección.</div>

  return <div style={{ minHeight: "100vh", background: "transparent" }}>
    <Navbar />
    <main style={{ padding: 15, paddingTop: 80, width: "100%", maxWidth: 1400, margin: "0 auto", boxSizing: "border-box" }}>
      <Suspense fallback={<div style={{ padding: 30 }}>Cargando sección...</div>}><Routes>
        <Route path="/" element={permitir("eventosVer", <Calendario />)} />
        <Route path="/eventos" element={permitir("eventosVer", <Eventos />)} />
        <Route path="/nuevo" element={permitir("eventosCrear", <NuevoEvento />)} />
        <Route path="/evento/:id" element={permitir("eventosVer", <EventoDetalle />)} />
        <Route path="/evento/:id/editar" element={permitir("eventosEditar", <NuevoEvento />)} />
        <Route path="/evento/:id/cobro" element={permitir("cobrosRegistrar", <RegistrarCobro />)} />
        <Route path="/prestadores" element={permitir("configuracionAdministrar", <Prestadores />)} />
        <Route path="/tipos-eventos" element={permitir("configuracionAdministrar", <TiposEventos />)} />
        <Route path="/tipos-movimientos" element={permitir("configuracionAdministrar", <TiposMovimientos />)} />
        <Route path="/nuevo-tipo-movimiento" element={permitir("configuracionAdministrar", <NuevoTipoMovimiento />)} />
        <Route path="/tipo-movimiento/:id/editar" element={permitir("configuracionAdministrar", <NuevoTipoMovimiento />)} />
        <Route path="/escuelas" element={permitir("configuracionAdministrar", <Escuelas />)} />
        <Route path="/listas-precios" element={permitir("configuracionAdministrar", <ListasPrecios />)} />
        <Route path="/listas-precios/nueva" element={permitir("configuracionAdministrar", <NuevaListaPrecios />)} />
        <Route path="/listas-precios/:id/editar" element={permitir("configuracionAdministrar", <NuevaListaPrecios />)} />
        <Route path="/cuentas" element={permitir("cuentasVer", <Cuentas />)} />
        <Route path="/cuentas/:id" element={permitir("cuentasVer", <CuentaDetalle />)} />
        <Route path="/cuentas/:id/caja" element={permitir("cuentasVer", <CajaCuenta />)} />
        <Route path="/cuentas/:id/caja/:cajaId" element={permitir("cuentasVer", <CajaDetalle />)} />
        <Route path="/nueva-cuenta" element={permitir("cuentasCrear", <NuevaCuenta />)} />
        <Route path="/nuevo-movimiento" element={permitir("movimientosCrear", <NuevoMovimiento />)} />
        <Route path="/movimientos" element={permitir("movimientosVer", <MisMovimientos />)} />
        <Route path="/balance" element={loading ? <div style={{ padding: 30 }}>Cargando permisos...</div> : role === "admin" ? <Balance /> : <div style={{ padding: 30, color: "#776d83" }}>Solo los administradores pueden acceder al balance.</div>} />
        <Route path="/usuarios-permisos" element={permitir("usuariosAdministrar", <UsuariosPermisos />)} />
        <Route path="/usuarios" element={permitir("usuariosAdministrar", <Usuarios />)} />
        <Route path="/clientes" element={permitir("eventosVer", <Clientes />)} />
        <Route path="/clientes/:id" element={permitir("eventosVer", <ClienteDetalle />)} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes></Suspense>
    </main>
  </div>
}

export default function App() {
  const [user, setUser] = useState(undefined)
  useEffect(() => auth.onAuthStateChanged(setUser), [])

  return <BrowserRouter>
    <Suspense fallback={<div style={{ padding: 30 }}>Cargando...</div>}><Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/comprobante/:id" element={<ComprobantePublico />} />
      <Route path="/*" element={<RutaPrivada user={user}><Layout /></RutaPrivada>} />
    </Routes></Suspense>
  </BrowserRouter>
}
