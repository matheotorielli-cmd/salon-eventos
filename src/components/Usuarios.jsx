import { useEffect, useMemo, useState } from "react"
import { auth } from "../firebase"
import { normalizarRol, PERMISOS_POR_ROL } from "../config/permisos"
import { useUserRole } from "../hooks/useUserRole"
import { actualizarAccesoUsuario, crearUsuario, enviarRestablecimientoPassword, normalizarNombreUsuario, observarUsuarios } from "../services/usuarios"

export default function Usuarios() {
  const user = auth.currentUser
  const { role, loading: cargandoRol } = useUserRole(user)
  const [usuarios, setUsuarios] = useState([])
  const [buscar, setBuscar] = useState("")
  const [limite, setLimite] = useState(10)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState(null)
  const [error, setError] = useState("")
  const [mensaje, setMensaje] = useState("")
  const [enviandoId, setEnviandoId] = useState(null)

  useEffect(() => {
    if (cargandoRol || role !== "admin") return undefined
    return observarUsuarios(setUsuarios, (loadError) => {
      console.error(loadError)
      setError("No se pudieron cargar los usuarios.")
    })
  }, [cargandoRol, role])

  const filtrados = useMemo(() => {
    const texto = buscar.trim().toLowerCase()
    return usuarios.filter((usuario) => !texto || [usuario.nombre, usuario.apellido, usuario.email, usuario.rol]
      .some((valor) => String(valor || "").toLowerCase().includes(texto)))
  }, [buscar, usuarios])

  async function cambiarEstado(usuario) {
    if (usuario.id === user.uid || usuario.email === user.email) {
      setError("No podes deshabilitar tu propio usuario.")
      return
    }
    try {
      await actualizarAccesoUsuario({
        usuarioId: usuario.id,
        rol: normalizarRol(usuario.rol),
        activo: usuario.activo === false,
        permisos: usuario.permisos || PERMISOS_POR_ROL[normalizarRol(usuario.rol)],
        adminId: user.uid
      })
    } catch (updateError) {
      console.error(updateError)
      setError("No se pudo cambiar el estado del usuario.")
    }
  }

  async function enviarCambioPassword(usuario) {
    setError("")
    setMensaje("")
    if (usuario.tipoAcceso === "interno") {
      setError("Los usuarios internos no reciben correos. La contraseña se administra al crear la cuenta o desde Firebase Authentication.")
      return
    }
    setEnviandoId(usuario.id)
    try {
      await enviarRestablecimientoPassword(usuario.email)
      setMensaje(`Enviamos a ${usuario.email} el enlace para cambiar la contraseña.`)
    } catch (resetError) {
      console.error(resetError)
      setError("No se pudo enviar el correo para cambiar la contraseña.")
    } finally {
      setEnviandoId(null)
    }
  }

  if (cargandoRol) return <p>Cargando...</p>
  if (role !== "admin") return <p>No tenes permiso para ver usuarios.</p>

  return (
    <div style={contenedor}>
      <div style={tituloBarra}>
        <span>Usuarios</span>
        <button onClick={() => setMostrarForm(true)} style={botonNuevo}>Nuevo usuario</button>
      </div>

      <div style={controles}>
        <label>Mostrar <select value={limite} onChange={(e) => setLimite(Number(e.target.value))} style={select}><option>5</option><option>10</option><option>25</option></select> registros</label>
        <label>Buscar: <input value={buscar} onChange={(e) => setBuscar(e.target.value)} style={buscador} /></label>
      </div>

      {error && <div role="alert" style={errorBox}>{error}</div>}
      {mensaje && <div role="status" style={mensajeBox}>{mensaje}</div>}

      <div style={{ overflowX: "auto" }}>
        <table style={tabla}>
          <thead><tr>
            <th style={th}>Id</th><th style={th}>Nombre</th><th style={th}>Apellido</th><th style={th}>Rol</th>
            <th style={th}>Correo electrónico</th><th style={th}>Teléfono</th><th style={th}>Acciones</th>
          </tr></thead>
          <tbody>
            {filtrados.slice(0, limite).map((usuario, index) => (
              <tr key={usuario.id} style={usuario.activo === false ? filaInactiva : undefined}>
                <td style={td}>{index + 1}</td>
                <td style={td}>{usuario.nombre || "—"}</td>
                <td style={td}>{usuario.apellido || "—"}</td>
                <td style={td}>{normalizarRol(usuario.rol) === "admin" ? "Administrador" : "Empleado"}</td>
                <td style={td}>{usuario.tipoAcceso === "interno" ? `${usuario.nombreUsuario} (interno)` : usuario.email || "—"}</td>
                <td style={td}>{usuario.telefono || "—"}</td>
                <td style={{ ...td, whiteSpace: "nowrap" }}>
                  <button onClick={() => setEditando(usuario)} style={botonEditar}>✎ Editar</button>{" "}
                  <button onClick={() => cambiarEstado(usuario)} style={usuario.activo === false ? botonHabilitar : botonDeshabilitar}>
                    {usuario.activo === false ? "✓ Habilitar" : "⊘ Deshabilitar"}
                  </button>{" "}
                  {usuario.tipoAcceso !== "interno" && <button onClick={() => enviarCambioPassword(usuario)} disabled={enviandoId === usuario.id} style={botonPassword}>
                    {enviandoId === usuario.id ? "Enviando..." : "Enviar cambio de contraseña"}
                  </button>}
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && <tr><td colSpan="7" style={{ ...td, textAlign: "center" }}>No se encontraron usuarios</td></tr>}
          </tbody>
        </table>
      </div>

      <div style={pie}>Mostrando {Math.min(filtrados.length, limite)} de un total de {filtrados.length} registros</div>

      {(mostrarForm || editando) && (
        <FormularioUsuario
          usuario={editando}
          adminId={user.uid}
          onClose={() => { setMostrarForm(false); setEditando(null) }}
          onError={setError}
          onSuccess={setMensaje}
        />
      )}
    </div>
  )
}

function FormularioUsuario({ usuario, adminId, onClose, onError, onSuccess }) {
  const rolInicial = normalizarRol(usuario?.rol)
  const esUsuarioActual = usuario?.id === adminId
  const [form, setForm] = useState({
    nombre: usuario?.nombre || "", apellido: usuario?.apellido || "", email: usuario?.email || "",
    telefono: usuario?.telefono || "", rol: rolInicial, tipoAcceso: usuario?.tipoAcceso || "correo",
    nombreUsuario: usuario?.nombreUsuario || "", passwordInicial: ""
  })
  const [guardando, setGuardando] = useState(false)
  const [mostrarPassword, setMostrarPassword] = useState(false)

  async function guardar(e) {
    e.preventDefault()
    onError("")
    setGuardando(true)
    try {
      if (usuario) {
        if (esUsuarioActual && form.rol !== "admin") {
          onError("No podés quitarte tu propio acceso de administrador.")
          return
        }
        await actualizarAccesoUsuario({
          usuarioId: usuario.id, rol: form.rol, activo: usuario.activo !== false,
          permisos: usuario.rol === form.rol && usuario.permisos ? usuario.permisos : PERMISOS_POR_ROL[form.rol],
          nombre: form.nombre, apellido: form.apellido, telefono: form.telefono, adminId
        })
        onSuccess("Usuario actualizado correctamente.")
      } else {
        if (form.tipoAcceso === "interno") {
          const nombreUsuario = normalizarNombreUsuario(form.nombreUsuario)
          if (!/^[a-z0-9@._-]{2,30}$/.test(nombreUsuario)) {
            onError("El nombre de usuario debe tener entre 2 y 30 caracteres y no puede contener espacios.")
            return
          }
          if (form.passwordInicial.length < 8) {
            onError("La contraseña inicial debe tener al menos 8 caracteres.")
            return
          }
        }
        const resultado = await crearUsuario({ ...form, permisos: PERMISOS_POR_ROL[form.rol], adminId })
        onSuccess(resultado.usuarioInterno
          ? `Usuario interno creado. Podrá ingresar como “${resultado.usuarioInterno}” con la contraseña que definiste.`
          : resultado.correoEnviado
          ? `Usuario creado. Enviamos a ${form.email} el enlace para establecer su contraseña.`
          : `Usuario creado, pero no se pudo enviar el correo. Usá “Enviar cambio de contraseña” para reintentarlo.`)
      }
      onClose()
    } catch (saveError) {
      console.error(saveError)
      onError(saveError.code === "auth/email-already-in-use" ? "Ese correo ya está registrado." : "No se pudo guardar el usuario.")
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div style={modalFondo} onClick={onClose}>
      <form style={modal} onClick={(e) => e.stopPropagation()} onSubmit={guardar}>
        <h2 style={{ marginTop: 0 }}>{usuario ? "Editar usuario" : "Nuevo usuario"}</h2>
        <div style={formGrid}>
          <Campo label="Nombre" name="nombre" value={form.nombre} onChange={setForm} form={form} required />
          <Campo label="Apellido" name="apellido" value={form.apellido} onChange={setForm} form={form} />
          {!usuario && <label>Tipo de acceso<select value={form.tipoAcceso} onChange={(e) => setForm({ ...form, tipoAcceso: e.target.value })} style={input}>
            <option value="correo">Correo real</option><option value="interno">Usuario interno</option>
          </select></label>}
          {form.tipoAcceso === "interno" && !usuario ? <>
            <label>Nombre de usuario
              <input name="nombreUsuario" value={form.nombreUsuario} onChange={(e) => setForm({ ...form, nombreUsuario: e.target.value.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ@._-]/g, "") })} style={input} placeholder="Ej.: cristian o @cristian" required autoComplete="off" />
              <small style={ayudaInterna}>Podés usar letras y, si querés, números, @, puntos o guiones.</small>
            </label>
            <label>Contraseña inicial<div style={{ position: "relative" }}>
              <input name="passwordInicial" type={mostrarPassword ? "text" : "password"} value={form.passwordInicial} onChange={(e) => setForm({ ...form, passwordInicial: e.target.value })} style={{ ...input, paddingRight: 70 }} minLength={8} required autoComplete="new-password" />
              <button type="button" onClick={() => setMostrarPassword((valor) => !valor)} style={botonVerPassword}>{mostrarPassword ? "Ocultar" : "Ver"}</button>
            </div><small style={ayudaInterna}>Guardala en un lugar seguro: no se enviará por correo.</small></label>
          </> : <Campo label="Correo electrónico" name="email" type="email" value={form.email} onChange={setForm} form={form} required disabled={Boolean(usuario)} />}
          <Campo label="Teléfono" name="telefono" value={form.telefono} onChange={setForm} form={form} />
          <label>Rol<select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })} style={input} disabled={esUsuarioActual}><option value="empleado">Empleado</option><option value="admin">Administrador</option></select></label>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 22 }}>
          <button type="button" onClick={onClose} style={botonCancelar}>Cancelar</button>
          <button type="submit" disabled={guardando} style={botonGuardar}>{guardando ? "Guardando..." : "Guardar"}</button>
        </div>
      </form>
    </div>
  )
}

function Campo({ label, name, form, onChange, ...props }) {
  return <label>{label}<input name={name} onChange={(e) => onChange({ ...form, [name]: e.target.value })} style={input} {...props} /></label>
}

const contenedor = { maxWidth: 1250, margin: "0 auto", background: "white", border: "1px solid #e8e1ee", borderRadius: 18, overflow: "hidden", boxShadow: "0 12px 32px rgba(78,37,129,.1)" }
const tituloBarra = { background: "linear-gradient(90deg,#4e2581,#63349a)", color: "white", padding: "15px 18px", fontFamily: "Fredoka", fontSize: 21, display: "flex", justifyContent: "space-between", alignItems: "center" }
const botonNuevo = { background: "#f4d00c", color: "#38145f", border: 0, borderRadius: 999, padding: "9px 18px", fontWeight: 700, cursor: "pointer" }
const controles = { display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, padding: "9px 7px" }
const select = { margin: "0 5px", padding: 4, border: "1px solid #cbd5e1" }
const buscador = { padding: 6, border: "1px solid #cbd5e1", borderRadius: 3 }
const tabla = { width: "100%", borderCollapse: "collapse", fontSize: 13 }
const th = { background: "#f3f4f6", textAlign: "left", padding: "10px 9px", border: "1px solid #d1d5db" }
const td = { padding: "9px", border: "1px solid #d1d5db" }
const filaInactiva = { opacity: 0.55, background: "#f9fafb" }
const botonEditar = { background: "#57b6ee", color: "#17364a", border: 0, borderRadius: 7, padding: "7px 10px", fontWeight: 600, cursor: "pointer" }
const botonDeshabilitar = { background: "#ef334f", color: "white", border: 0, borderRadius: 3, padding: "6px 9px", cursor: "pointer" }
const botonHabilitar = { ...botonDeshabilitar, background: "#16a34a" }
const botonPassword = { background: "#4e2581", color: "white", border: 0, borderRadius: 7, padding: "7px 10px", fontWeight: 600, cursor: "pointer" }
const botonVerPassword = { position: "absolute", right: 7, top: 7, padding: "5px 8px", border: 0, background: "transparent", color: "#4e2581", fontWeight: 700, cursor: "pointer" }
const ayudaInterna = { display: "block", marginTop: 6, color: "#6b7280", lineHeight: 1.35 }
const pie = { padding: "12px 8px", fontSize: 12 }
const errorBox = { margin: "0 8px 10px", padding: 10, color: "#991b1b", background: "#fee2e2" }
const mensajeBox = { margin: "0 8px 10px", padding: 10, color: "#166534", background: "#dcfce7" }
const modalFondo = { position: "fixed", inset: 0, zIndex: 100000, display: "grid", placeItems: "center", background: "rgba(15,23,42,.5)", padding: 18 }
const modal = { width: "min(650px,95vw)", background: "white", borderRadius: 10, padding: 24, boxShadow: "0 20px 50px rgba(0,0,0,.25)" }
const formGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16 }
const input = { display: "block", width: "100%", boxSizing: "border-box", marginTop: 6, padding: 10, border: "1px solid #cbd5e1", borderRadius: 5 }
const botonCancelar = { padding: "10px 16px", border: 0, borderRadius: 5, cursor: "pointer" }
const botonGuardar = { ...botonCancelar, background: "#4e2581", color: "white" }
