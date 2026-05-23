import { useState } from "react"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "./firebase"
import { useNavigate } from "react-router-dom"

export default function Login() {

  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")

  async function handleLogin(e) {
    e.preventDefault()
    setError("")

    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate("/")
    } catch (err) {
      setError("Error de login")
    }
  }

  const baseInput = {
    width: "100%",
    height: "48px", // 🔥 FORZAMOS MISMA ALTURA
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "16px",
    padding: "0 14px",
    boxSizing: "border-box"
  }

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#1d4ed8"
      }}
    >
      <form
        onSubmit={handleLogin}
        style={{
          background: "white",
          padding: "40px",
          borderRadius: "16px",
          width: "350px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
          textAlign: "center"
        }}
      >

        <h2 style={{ fontSize: "28px", marginBottom: "25px", color: "#1d4ed8" }}>
          Iniciar sesión
        </h2>

        {/* EMAIL */}
        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            ...baseInput,
            marginBottom: "15px"
          }}
        />

        {/* PASSWORD */}
        <div style={{ position: "relative", marginBottom: "20px" }}>

          <input
            type={showPassword ? "text" : "password"}
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              ...baseInput,
              paddingRight: "70px"
            }}
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: "absolute",
              right: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "14px",
              color: "#1d4ed8",
              fontWeight: "bold"
            }}
          >
            {showPassword ? "Ocultar" : "Ver"}
          </button>

        </div>

        {/* BOTÓN LOGIN */}
        <button
          type="submit"
          style={{
            width: "100%",
            height: "48px",
            background: "#1d4ed8",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          Entrar
        </button>

        {error && (
          <p style={{ color: "red", marginTop: "15px" }}>
            {error}
          </p>
        )}

      </form>
    </div>
  )
}