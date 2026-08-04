import { useState } from "react"
import { signInWithEmailAndPassword, signOut } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "../firebase"
import { ADMIN_INICIAL_EMAIL } from "../config/permisos"
import { enviarRestablecimientoPassword } from "../services/usuarios"
import { useNavigate } from "react-router-dom"

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(() => {
    const mensaje = sessionStorage.getItem("mensajeAcceso") || ""
    sessionStorage.removeItem("mensajeAcceso")
    return mensaje
  })
  const [loading, setLoading] = useState(false)
  const [enviandoReset, setEnviandoReset] = useState(false)
  const [mensaje, setMensaje] = useState("")

  async function recuperarPassword() {
    setError("")
    setMensaje("")
    if (!email.trim()) {
      setError("Escribí tu correo electrónico para recuperar la contraseña.")
      return
    }
    setEnviandoReset(true)
    try {
      await enviarRestablecimientoPassword(email)
      setMensaje("Si el correo está registrado, recibirás un enlace para elegir una contraseña nueva.")
    } catch (resetError) {
      console.error(resetError)
      setError("No se pudo enviar el correo de recuperación. Intentá nuevamente.")
    } finally {
      setEnviandoReset(false)
    }
  }

  async function handleLogin(e) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password)
      const esAdminInicial = credential.user.email?.toLowerCase() === ADMIN_INICIAL_EMAIL
      const perfil = await getDoc(doc(db, "usuarios", credential.user.uid))
      if (!esAdminInicial && (!perfil.exists() || perfil.data()?.activo === false)) {
        await signOut(auth)
        setError(perfil.exists()
          ? "Tu usuario está deshabilitado. Comunicate con un administrador."
          : "Tu usuario no tiene un perfil de acceso. Comunicate con un administrador.")
        return
      }
      navigate("/")
    } catch (loginError) {
      console.error(loginError)
      if (auth.currentUser) await signOut(auth)
      const mensajes = {
        "auth/invalid-credential": "El correo o la contraseña no son correctos.",
        "auth/user-disabled": "Esta cuenta está deshabilitada en Firebase Authentication.",
        "auth/too-many-requests": "Se bloquearon temporalmente los intentos de acceso. Esperá unos minutos y volvé a intentar.",
        "auth/network-request-failed": "No se pudo conectar con Firebase. Revisá tu conexión a Internet.",
        "permission-denied": "La contraseña es correcta, pero el perfil no tiene acceso al sistema. Comunicate con un administrador."
      }
      setError(mensajes[loginError.code] || "No se pudo iniciar sesión. Intentá nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page" style={pagina}>
      <section className="login-welcome" style={bienvenida}>
        <img src="/fun-space-logo.png" alt="Fun Space · Diversión Asegurada" style={marcaMini} />
        <div>
          <span style={etiqueta}>GESTIÓN DEL SALÓN</span>
          <h1 style={titulo}>Diversión asegurada,<br />gestión simplificada.</h1>
          <p style={descripcion}>Organizá eventos, cobros, cuentas y equipos desde un solo lugar.</p>
        </div>
        <div style={formas} aria-hidden="true"><span>★</span><span>●</span><span>✦</span></div>
      </section>

      <section style={zonaFormulario}>
        <form onSubmit={handleLogin} style={tarjeta}>
          <div className="login-mobile-logo" style={logoMovil}><img src="/fun-space-logo.png" alt="Fun Space · Diversión Asegurada" /></div>
          <span style={bienvenido}>¡Hola de nuevo!</span>
          <h2 style={tituloForm}>Iniciá sesión</h2>
          <p style={ayuda}>Ingresá tus datos para administrar el salón.</p>

          <label style={label} htmlFor="email">Correo electrónico</label>
          <input id="email" type="email" placeholder="nombre@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />

          <label style={{ ...label, marginTop: 18 }} htmlFor="password">Contraseña</label>
          <div style={passwordWrap}>
            <input id="password" type={showPassword ? "text" : "password"} placeholder="Tu contraseña" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required style={{ paddingRight: 76 }} />
            <button type="button" onClick={() => setShowPassword((value) => !value)} style={verClave}>{showPassword ? "Ocultar" : "Ver"}</button>
          </div>

          <button type="button" onClick={recuperarPassword} disabled={enviandoReset} style={recuperar}>
            {enviandoReset ? "Enviando..." : "Olvidé mi contraseña"}
          </button>

          {error && <div role="alert" style={errorBox}>{error}</div>}
          {mensaje && <div role="status" style={mensajeBox}>{mensaje}</div>}
          <button type="submit" disabled={loading} style={entrar}>{loading ? "Ingresando..." : "Ingresar"}</button>
          <p style={pie}>Fun Space · Diversión Asegurada</p>
        </form>
      </section>
    </main>
  )
}

const pagina = { minHeight: "100vh", display: "grid", gridTemplateColumns: "minmax(360px,1.08fr) minmax(380px,.92fr)", background: "#f7f5fb" }
const bienvenida = { position: "relative", overflow: "hidden", display: "grid", gridTemplateRows: "1fr auto 1fr", padding: "clamp(35px,6vw,80px)", color: "white", background: "linear-gradient(145deg,#38145f 0%,#4e2581 58%,#67369d 100%)" }
const marcaMini = { display: "block", alignSelf: "center", justifySelf: "center", width: "clamp(280px,42vw,390px)", maxWidth: "78%", height: "auto" }
const etiqueta = { display: "inline-block", padding: "7px 12px", borderRadius: 999, background: "rgba(87,182,238,.2)", color: "#bfe8ff", fontSize: 12, fontWeight: 700, letterSpacing: ".12em" }
const titulo = { margin: "22px 0 16px", fontSize: "clamp(42px,5.3vw,72px)", lineHeight: 1.02, letterSpacing: "-.025em" }
const descripcion = { maxWidth: 560, margin: 0, color: "#e9dcf6", fontSize: 18, lineHeight: 1.7 }
const formas = { alignSelf: "end", display: "flex", gap: 22, alignItems: "center", color: "#f4d00c", fontSize: 28, opacity: .9 }
const zonaFormulario = { display: "grid", placeItems: "center", padding: "32px" }
const tarjeta = { width: "min(440px,100%)", padding: "clamp(28px,5vw,48px)", background: "white", border: "1px solid #eee7f4", borderRadius: 24, boxShadow: "0 24px 65px rgba(78,37,129,.13)" }
const logoMovil = { display: "none", justifyContent: "center", marginBottom: 28 }
const bienvenido = { color: "#57b6ee", fontWeight: 700 }
const tituloForm = { margin: "7px 0", color: "#4e2581", fontSize: 36 }
const ayuda = { margin: "0 0 28px", color: "#776d83", lineHeight: 1.6 }
const label = { display: "block", marginBottom: 7, color: "#4b4058", fontSize: 14, fontWeight: 600 }
const passwordWrap = { position: "relative" }
const verClave = { position: "absolute", right: 8, top: 7, padding: "6px 9px", border: 0, background: "transparent", color: "#4e2581", fontWeight: 700, cursor: "pointer", boxShadow: "none" }
const recuperar = { display: "block", margin: "10px 0 0 auto", padding: 0, border: 0, background: "transparent", color: "#4e2581", fontWeight: 700, cursor: "pointer", boxShadow: "none" }
const errorBox = { marginTop: 18, padding: 11, borderRadius: 10, background: "#fff1f2", color: "#be123c", fontSize: 13 }
const mensajeBox = { marginTop: 18, padding: 11, borderRadius: 10, background: "#ecfdf3", color: "#166534", fontSize: 13 }
const entrar = { width: "100%", marginTop: 22, padding: 13, border: 0, borderRadius: 11, background: "linear-gradient(90deg,#4e2581,#63349a)", color: "white", fontWeight: 700, cursor: "pointer", boxShadow: "0 10px 22px rgba(78,37,129,.2)" }
const pie = { margin: "24px 0 0", textAlign: "center", color: "#a096aa", fontSize: 12 }
