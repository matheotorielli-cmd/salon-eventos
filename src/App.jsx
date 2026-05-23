import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { auth } from "../firebase"
import { signOut } from "firebase/auth"

export default function Navbar() {

  const navigate = useNavigate()

  const [openMenu, setOpenMenu] = useState(null)
  const [mobileMenu, setMobileMenu] = useState(false)

  const menuRef = useRef()

  const user = auth.currentUser

  async function cerrarSesion() {
    await signOut(auth)
    navigate("/login")
  }

  function toggleMenu(menu) {
    setOpenMenu(openMenu === menu ? null : menu)
  }

  useEffect(() => {

    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenu(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }

  }, [])

  const menuItem = {
    color: "white",
    cursor: "pointer",
    fontSize: "14px",
    padding: "10px 12px",
    display: "flex",
    alignItems: "center",
    gap: "5px",
    position: "relative",
    whiteSpace: "nowrap"
  }

  const dropdownStyle = {
    position: "absolute",
    top: "42px",
    left: 0,
    background: "white",
    minWidth: "200px",
    borderRadius: "6px",
    boxShadow: "0 8px 25px rgba(0,0,0,0.12)",
    overflow: "hidden",
    zIndex: 9999
  }

  const dropdownItem = {
    padding: "12px",
    cursor: "pointer",
    fontSize: "14px",
    borderBottom: "1px solid #f1f1f1",
    color: "#333",
    background: "white"
  }

  return (
    <div
      ref={menuRef}
      style={{
        width: "100%",
        background: "#0066ff",
        borderBottom: "1px solid rgba(255,255,255,0.1)"
      }}
    >

      {/* CONTENEDOR CENTRAL */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 15px",
          minHeight: "58px",
          flexWrap: "wrap"
        }}
      >

        {/* IZQUIERDA */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            flexWrap: "wrap"
          }}
        >

          {/* LOGO */}
          <div
            onClick={() => navigate("/")}
            style={{
              color: "white",
              fontWeight: "bold",
              fontSize: "28px",
              marginRight: "20px",
              cursor: "pointer"
            }}
          >
            bonete
          </div>

          {/* CALENDARIO */}
          <div
            style={menuItem}
            onClick={() => navigate("/")}
          >
            📅 Calendario
          </div>

          {/* EVENTOS */}
          <div
            style={menuItem}
            onClick={() => toggleMenu("eventos")}
          >
            📁 Eventos ▾

            {openMenu === "eventos" && (
              <div style={dropdownStyle}>

                <div
                  style={dropdownItem}
                  onClick={() => {
                    navigate("/eventos")
                    setOpenMenu(null)
                  }}
                >
                  Mis eventos
                </div>

                <div
                  style={dropdownItem}
                  onClick={() => {
                    navigate("/presupuestados")
                    setOpenMenu(null)
                  }}
                >
                  Presupuestados
                </div>

                <div
                  style={dropdownItem}
                  onClick={() => {
                    navigate("/ventas")
                    setOpenMenu(null)
                  }}
                >
                  Punto de ventas
                </div>

              </div>
            )}
          </div>

          {/* NUEVO */}
          <div
            style={menuItem}
            onClick={() => navigate("/nuevo")}
          >
            ➕ Nuevo
          </div>

          {/* FINANZAS */}
          <div
            style={menuItem}
            onClick={() => toggleMenu("finanzas")}
          >
            💳 Finanzas ▾

            {openMenu === "finanzas" && (
              <div style={dropdownStyle}>

                <div
                  style={dropdownItem}
                  onClick={() => {
                    navigate("/cuentas")
                    setOpenMenu(null)
                  }}
                >
                  Cuentas
                </div>

                <div
                  style={dropdownItem}
                  onClick={() => {
                    navigate("/reportes")
                    setOpenMenu(null)
                  }}
                >
                  Reportes
                </div>

              </div>
            )}
          </div>

          {/* MOVIMIENTOS */}
          <div
            style={menuItem}
            onClick={() => toggleMenu("movimientos")}
          >
            💸 Movimientos ▾

            {openMenu === "movimientos" && (
              <div style={dropdownStyle}>

                <div
                  style={dropdownItem}
                  onClick={() => {
                    navigate("/movimientos")
                    setOpenMenu(null)
                  }}
                >
                  Mis movimientos
                </div>

                <div
                  style={dropdownItem}
                  onClick={() => {
                    navigate("/movimientos/nuevo")
                    setOpenMenu(null)
                  }}
                >
                  Nuevo movimiento
                </div>

                <div
                  style={dropdownItem}
                  onClick={() => {
                    navigate("/movimientos/proveedores")
                    setOpenMenu(null)
                  }}
                >
                  Pago proveedores
                </div>

                <div
                  style={dropdownItem}
                  onClick={() => {
                    navigate("/movimientos/prestadores")
                    setOpenMenu(null)
                  }}
                >
                  Pago prestadores
                </div>

              </div>
            )}
          </div>

        </div>

        {/* DERECHA */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "15px",
            color: "white",
            fontSize: "14px",
            padding: "10px 0"
          }}
        >

          <div style={{ cursor: "pointer" }}>
            🔔
          </div>

          <div>
            {user?.email?.split("@")[0] || "Usuario"}
          </div>

          <div
            onClick={cerrarSesion}
            style={{
              cursor: "pointer"
            }}
          >
            ⚙️
          </div>

        </div>

      </div>

    </div>
  )
}