import { useEffect, useState } from "react"
import { auth } from "../firebase"
import { ADMIN_INICIAL_EMAIL, normalizarRol, PERMISOS, PERMISOS_POR_ROL, resolverPermisos } from "../config/permisos"
import { useUserRole } from "../hooks/useUserRole"
import { actualizarAccesoUsuario, asegurarAdministradorInicial, observarUsuarios } from "../services/usuarios"

export default function UsuariosPermisos() {
  const user = auth.currentUser
  const { role, loading: cargandoRol } = useUserRole(user)
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [guardandoId, setGuardandoId] = useState(null)
  const [error, setError] = useState("")
  const [mensaje, setMensaje] = useState("")

  useEffect(() => {
    if (cargandoRol || role !== "admin") return undefined
    if (user?.email?.toLowerCase() === ADMIN_INICIAL_EMAIL) {
      asegurarAdministradorInicial({
        uid: user.uid,
        email: user.email,
        permisos: PERMISOS_POR_ROL.admin
      }).catch((saveError) => console.error("No se pudo normalizar el administrador inicial", saveError))
    }
    return observarUsuarios(
      (data) => {
        setUsuarios(data.map((usuario) => ({
          ...usuario,
          rol: normalizarRol(usuario.rol),
          activo: usuario.activo !== false,
          permisos: resolverPermisos(usuario.rol, usuario.permisos)
        })))
        setCargando(false)
      },
      (loadError) => {
        console.error(loadError)
        setError("No se pudieron cargar los usuarios.")
        setCargando(false)
      }
    )
  }, [cargandoRol, role, user])

  function cambiarRol(usuarioId, rol) {
    setUsuarios((actuales) => actuales.map((usuario) => usuario.id === usuarioId
      ? { ...usuario, rol, permisos: { ...PERMISOS_POR_ROL[rol] } }
      : usuario))
  }

  function cambiarPermiso(usuarioId, permisoId) {
    setUsuarios((actuales) => actuales.map((usuario) => usuario.id === usuarioId
      ? { ...usuario, permisos: { ...usuario.permisos, [permisoId]: !usuario.permisos[permisoId], usuariosAdministrar: false } }
      : usuario))
  }

  function cambiarActivo(usuarioId) {
    setUsuarios((actuales) => actuales.map((usuario) => usuario.id === usuarioId
      ? { ...usuario, activo: !usuario.activo }
      : usuario))
  }

  async function guardar(usuario) {
    if (!user || role !== "admin") return
    const esUsuarioActual = usuario.id === user.uid || usuario.email === user.email
    if (esUsuarioActual && (!usuario.activo || usuario.rol !== "admin")) {
      setError("No podes quitarte tu propio acceso de administrador.")
      return
    }

    setError("")
    setMensaje("")
    setGuardandoId(usuario.id)
    try {
      await actualizarAccesoUsuario({
        usuarioId: usuario.id,
        rol: usuario.rol,
        activo: usuario.activo,
        permisos: usuario.rol === "admin"
          ? PERMISOS_POR_ROL.admin
          : { ...usuario.permisos, usuariosAdministrar: false },
        adminId: user.uid
      })
      setMensaje(`Permisos de ${usuario.nombre || usuario.email || "usuario"} actualizados.`)
    } catch (saveError) {
      console.error(saveError)
      setError("No se pudieron guardar los permisos.")
    } finally {
      setGuardandoId(null)
    }
  }

  if (cargandoRol) return <p>Cargando permisos...</p>
  if (role !== "admin") return <div style={aviso}>No tenes permiso para administrar usuarios.</div>

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div style={cabecera}>
        <h1 style={{ margin: 0, fontSize: 24 }}>Usuarios, roles y permisos</h1>
        <p style={{ margin: "8px 0 0", opacity: 0.9 }}>Asigna un perfil base y ajusta cada permiso individualmente.</p>
      </div>

      {error && <div role="alert" style={{ ...aviso, color: "#991b1b", background: "#fee2e2" }}>{error}</div>}
      {mensaje && <div role="status" style={{ ...aviso, color: "#166534", background: "#dcfce7" }}>{mensaje}</div>}
      {cargando && <div style={tarjeta}>Cargando usuarios...</div>}
      {!cargando && usuarios.length === 0 && <div style={tarjeta}>No hay usuarios registrados.</div>}

      {usuarios.map((usuario) => (
        <section key={usuario.id} style={tarjeta}>
          <div style={filaUsuario}>
            <div>
              <h2 style={{ margin: 0, fontSize: 19 }}>{usuario.nombre || "Usuario sin nombre"}</h2>
              <div style={{ color: "#6b7280", marginTop: 4 }}>{usuario.email || usuario.id}</div>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <label>
                Rol{" "}
                <select value={usuario.rol} onChange={(e) => cambiarRol(usuario.id, e.target.value)} style={select}>
                  <option value="empleado">Empleado</option>
                  <option value="admin">Administrador</option>
                </select>
              </label>
              <label style={{ display: "flex", gap: 7, alignItems: "center" }}>
                <input type="checkbox" checked={usuario.activo} onChange={() => cambiarActivo(usuario.id)} />
                Usuario activo
              </label>
            </div>
          </div>

          {usuario.rol === "admin" ? (
            <div style={accesoTotal}>Los administradores tienen acceso completo a todas las funciones.</div>
          ) : <div style={grilla}>
            {PERMISOS.filter((permiso) => permiso.id !== "usuariosAdministrar").map((permiso) => (
              <label key={permiso.id} style={permisoItem}>
                <input
                  type="checkbox"
                  checked={usuario.permisos?.[permiso.id] === true}
                  onChange={() => cambiarPermiso(usuario.id, permiso.id)}
                />
                {permiso.label}
              </label>
            ))}
          </div>}

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
            <button onClick={() => guardar(usuario)} disabled={guardandoId === usuario.id} style={boton}>
              {guardandoId === usuario.id ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </section>
      ))}
    </div>
  )
}

const cabecera = { background: "linear-gradient(90deg,#4e2581,#63349a)", color: "white", padding: 24, borderRadius: 16, marginBottom: 18, boxShadow: "0 12px 28px rgba(78,37,129,.16)" }
const tarjeta = { background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: 22, marginBottom: 18 }
const filaUsuario = { display: "flex", justifyContent: "space-between", gap: 20, flexWrap: "wrap", borderBottom: "1px solid #e5e7eb", paddingBottom: 18 }
const grilla = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 10, marginTop: 18 }
const permisoItem = { display: "flex", gap: 9, alignItems: "center", padding: 10, background: "#f9fafb", borderRadius: 8 }
const accesoTotal = { marginTop: 18, padding: 14, borderRadius: 10, background: "#eef8ff", color: "#245a78", fontWeight: 600 }
const select = { padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 7 }
const boton = { border: 0, borderRadius: 10, padding: "11px 18px", background: "#4e2581", color: "white", fontWeight: 700, cursor: "pointer" }
const aviso = { padding: 14, borderRadius: 10, marginBottom: 16, background: "#f7f5fb", color: "#4b4058" }
