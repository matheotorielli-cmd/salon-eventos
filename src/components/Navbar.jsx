import { useEffect, useRef, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { auth } from "../firebase"
import { signOut } from "firebase/auth"

export default function Navbar() {

  const navigate = useNavigate()
  const location = useLocation()

  const [openMenu, setOpenMenu] = useState(null)
  const [openUser, setOpenUser] = useState(false)

  const user = auth.currentUser
  const menuRef = useRef()

  async function cerrarSesion() {
    await signOut(auth)
    navigate("/login")
  }

  function toggleMenu(menu) {
    setOpenMenu(openMenu === menu ? null : menu)
  }

  // 🔥 cerrar menús cuando cambia la ruta
  useEffect(() => {
    setOpenMenu(null)
    setOpenUser(false)
  }, [location.pathname])

  // 🔥 cerrar si haces click afuera
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenu(null)
        setOpenUser(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () =>
      document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const itemStyle = {
    cursor: "pointer",
    padding: "12px 16px",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "600",
    color: "white",
    whiteSpace: "nowrap",
    position: "relative"
  }

  const dropdownStyle = {
    position: "absolute",
    top: "52px",
    left: 0,
    background: "white",
    borderRadius: "10px",
    minWidth: "220px",
    boxShadow: "0 15px 30px rgba(0,0,0,0.12)",
    zIndex: 9999,
    overflow: "hidden",
    animation: "dropdown .15s ease-out"
  }

  const dropdownItem = {
    padding: "12px",
    cursor: "pointer",
    borderBottom: "1px solid #eee",
    fontSize: "14px",
    background: "white"
  }

  return (
    <>
      {/* 🔥 ANIMACIÓN GLOBAL */}
      <style>{`
        @keyframes dropdown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div
        ref={menuRef}
        style={{
          background: "#1d4ed8",
          padding: "14px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "15px",
          flexWrap: "wrap",
          position: "sticky",
          top: 0,
          zIndex: 9999
        }}
      >

        {/* IZQUIERDA */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>

          <div onClick={() => navigate("/")} style={itemStyle}>
            Calendario
          </div>

          <div onClick={() => navigate("/eventos")} style={itemStyle}>
            Eventos
          </div>

          <div onClick={() => navigate("/nuevo")} style={itemStyle}>
            Nuevo
          </div>

          <div onClick={() => navigate("/tipos-eventos")} style={itemStyle}>
            Tipos
          </div>

          {/* MOVIMIENTOS */}
          <div style={{ position: "relative" }}>
            <div style={itemStyle} onClick={() => toggleMenu("movimientos")}>
              Movimientos ▾
            </div>

            {openMenu === "movimientos" && (
              <div style={dropdownStyle}>
                <div onClick={() => { navigate("/movimientos"); setOpenMenu(null) }} style={dropdownItem}>
                  Mis movimientos
                </div>

                <div onClick={() => { navigate("/movimientos/nuevo"); setOpenMenu(null) }} style={dropdownItem}>
                  Nuevo movimiento
                </div>

                <div onClick={() => { navigate("/movimientos/proveedores"); setOpenMenu(null) }} style={dropdownItem}>
                  Pago proveedores
                </div>

                <div onClick={() => { navigate("/movimientos/prestadores"); setOpenMenu(null) }} style={{ ...dropdownItem, borderBottom: "none" }}>
                  Pago prestadores
                </div>
              </div>
            )}
          </div>

          {/* FINANZAS */}
          <div style={{ position: "relative" }}>
            <div style={itemStyle} onClick={() => toggleMenu("finanzas")}>
              Finanzas ▾
            </div>

            {openMenu === "finanzas" && (
              <div style={dropdownStyle}>
                <div onClick={() => { navigate("/cuentas"); setOpenMenu(null) }} style={{ ...dropdownItem, borderBottom: "none" }}>
                  Cuentas
                </div>
              </div>
            )}
          </div>

        </div>

        {/* USUARIO */}
        <div style={{ position: "relative" }}>

          <div
            onClick={() => setOpenUser(!openUser)}
            style={{
              cursor: "pointer",
              background: "rgba(255,255,255,0.15)",
              padding: "10px 14px",
              borderRadius: "8px",
              color: "white",
              fontWeight: "600"
            }}
          >
            {user?.email?.split("@")[0] || "Usuario"}
          </div>

          {openUser && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "52px",
                background: "white",
                borderRadius: "10px",
                width: "180px",
                boxShadow: "0 15px 30px rgba(0,0,0,0.12)",
                overflow: "hidden",
                zIndex: 9999,
                animation: "dropdown .15s ease-out"
              }}
            >
              <div
                onClick={cerrarSesion}
                style={{
                  padding: "12px",
                  cursor: "pointer",
                  color: "#dc2626",
                  fontWeight: "600"
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