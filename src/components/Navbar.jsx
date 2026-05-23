import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { auth } from "../firebase"
import { signOut } from "firebase/auth"

export default function Navbar() {

  const navigate = useNavigate()

  const [openMenu, setOpenMenu] = useState(null)
  const [openUser, setOpenUser] = useState(false)

  const user = auth.currentUser
  const menuRef = useRef()

  async function cerrarSesion() {
    await signOut(auth)
    navigate("/login")
  }

  function toggleMenu(menu) {
    // 🔥 esto hace que solo 1 menú esté abierto a la vez
    setOpenMenu(prev => (prev === menu ? null : menu))
    setOpenUser(false)
  }

  function toggleUser() {
    setOpenUser(prev => !prev)
    setOpenMenu(null)
  }

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenu(null)
        setOpenUser(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const itemStyle = {
    cursor: "pointer",
    padding: "10px 14px",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    position: "relative",
    color: "white"
  }

  const dropdownStyle = {
    position: "absolute",
    top: "50px",
    left: 0,
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    minWidth: "220px",
    boxShadow: "0 15px 30px rgba(0,0,0,0.12)",
    zIndex: 9999,
    animation: "fadeSlide .15s forwards"
  }

  const dropdownItem = {
    padding: "10px",
    cursor: "pointer",
    fontSize: "14px",
    borderBottom: "1px solid #f1f1f1"
  }

  return (
    <>
      <style>
        {`
          @keyframes fadeSlide {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>

      <div
        ref={menuRef}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "14px 24px",
          background: "#1d4ed8",
          borderBottom: "2px solid #1e40af"
        }}
      >

        {/* IZQUIERDA */}
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>

          <div onClick={() => navigate("/")} style={itemStyle}>
            Calendario
          </div>

          <div onClick={() => navigate("/eventos")} style={itemStyle}>
            Eventos
          </div>

          <div onClick={() => navigate("/nuevo")} style={itemStyle}>
            Nuevo
          </div>

          {/* FINANZAS */}
          <div style={itemStyle} onClick={() => toggleMenu("finanzas")}>
            Finanzas ▾

            {openMenu === "finanzas" && (
              <div style={dropdownStyle}>
                <div onClick={() => { navigate("/cuentas"); setOpenMenu(null) }} style={dropdownItem}>
                  Cuentas
                </div>
                <div onClick={() => { navigate("/reportes"); setOpenMenu(null) }} style={dropdownItem}>
                  Reportes
                </div>
              </div>
            )}
          </div>

          {/* MOVIMIENTOS */}
          <div style={itemStyle} onClick={() => toggleMenu("movimientos")}>
            Movimientos ▾

            {openMenu === "movimientos" && (
              <div style={dropdownStyle}>

                <div
                  onClick={() => { navigate("/movimientos"); setOpenMenu(null) }}
                  style={dropdownItem}
                >
                  Mis movimientos
                </div>

                <div
                  onClick={() => { navigate("/movimientos/nuevo"); setOpenMenu(null) }}
                  style={dropdownItem}
                >
                  Nuevo movimiento
                </div>

                <div
                  onClick={() => { navigate("/movimientos/proveedores"); setOpenMenu(null) }}
                  style={dropdownItem}
                >
                  Pago proveedores
                </div>

                <div
                  onClick={() => { navigate("/movimientos/prestadores"); setOpenMenu(null) }}
                  style={dropdownItem}
                >
                  Pago prestadores
                </div>

              </div>
            )}
          </div>

        </div>

        {/* USUARIO */}
        <div style={{ position: "relative", color: "white", fontSize: "16px" }}>

          <div
            onClick={toggleUser}
            style={{
              cursor: "pointer",
              padding: "8px 12px",
              borderRadius: "8px",
              background: "rgba(255,255,255,0.15)"
            }}
          >
            {user?.email?.split("@")[0] || "Usuario"}
          </div>

          {openUser && (
            <div style={{
              position: "absolute",
              right: 0,
              top: "50px",
              background: "white",
              borderRadius: "10px",
              width: "180px",
              boxShadow: "0 15px 30px rgba(0,0,0,0.12)",
              zIndex: 9999
            }}>
              <div
                onClick={cerrarSesion}
                style={{
                  padding: "10px",
                  cursor: "pointer",
                  color: "red",
                  fontSize: "14px"
                }}
              >
                Cerrar sesión
              </div>
            </div>
          )}

        </div>

      </div>
    </>
  )
}