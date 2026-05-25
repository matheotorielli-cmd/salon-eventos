import { useEffect, useRef, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { auth } from "../firebase"
import { signOut } from "firebase/auth"

export default function Navbar() {

  const navigate = useNavigate()
  const location = useLocation()

  const [openMenu, setOpenMenu] = useState(null)
  const [openUser, setOpenUser] = useState(false)
  const [openConfig, setOpenConfig] = useState(false)

  const user = auth.currentUser
  const menuRef = useRef()

  async function cerrarSesion() {
    await signOut(auth)
    navigate("/login")
  }

  function toggleMenu(menu) {
    setOpenMenu(
      openMenu === menu
        ? null
        : menu
    )
  }

  useEffect(() => {
    setOpenMenu(null)
    setOpenUser(false)
  }, [location.pathname])

  useEffect(() => {

    function handleClickOutside(e) {

      if (
        menuRef.current &&
        !menuRef.current.contains(e.target)
      ) {
        setOpenMenu(null)
        setOpenUser(false)
      }

    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    )

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      )

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
    background: "white",
    color: "#111827"
  }

  return (
    <>
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

        @keyframes slide {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
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
        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
            flexWrap: "wrap"
          }}
        >

          <div
            onClick={() => navigate("/")}
            style={itemStyle}
          >
            Calendario
          </div>

          <div
            onClick={() => navigate("/eventos")}
            style={itemStyle}
          >
            Eventos
          </div>

          <div
            onClick={() => navigate("/nuevo")}
            style={itemStyle}
          >
            Nuevo
          </div>

          {/* MOVIMIENTOS */}
          <div style={{ position: "relative" }}>

            <div
              style={itemStyle}
              onClick={() =>
                toggleMenu("movimientos")
              }
            >
              Movimientos ▾
            </div>

            {openMenu === "movimientos" && (

              <div style={dropdownStyle}>

                <div
                  onClick={() => {
                    navigate("/movimientos")
                    setOpenMenu(null)
                  }}
                  style={dropdownItem}
                >
                  Mis movimientos
                </div>

                <div
                  onClick={() => {
                    navigate("/movimientos/nuevo")
                    setOpenMenu(null)
                  }}
                  style={dropdownItem}
                >
                  Nuevo movimiento
                </div>

                <div
                  onClick={() => {
                    navigate("/movimientos/proveedores")
                    setOpenMenu(null)
                  }}
                  style={dropdownItem}
                >
                  Pago proveedores
                </div>

                <div
                  onClick={() => {
                    navigate("/movimientos/prestadores")
                    setOpenMenu(null)
                  }}
                  style={{
                    ...dropdownItem,
                    borderBottom: "none"
                  }}
                >
                  Pago prestadores
                </div>

              </div>

            )}

          </div>

          {/* FINANZAS */}
          <div style={{ position: "relative" }}>

            <div
              style={itemStyle}
              onClick={() =>
                toggleMenu("finanzas")
              }
            >
              Finanzas ▾
            </div>

            {openMenu === "finanzas" && (

              <div style={dropdownStyle}>

                <div
                  onClick={() => {
                    navigate("/cuentas")
                    setOpenMenu(null)
                  }}
                  style={{
                    ...dropdownItem,
                    borderBottom: "none"
                  }}
                >
                  Cuentas
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
            gap: "10px",
            position: "relative"
          }}
        >

          {/* CONFIG */}
          <div
            onClick={() =>
              setOpenConfig(true)
            }
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              background: "rgba(255,255,255,0.15)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              cursor: "pointer",
              color: "white",
              fontSize: "22px"
            }}
          >
            ⚙️
          </div>

          {/* USUARIO */}
          <div style={{ position: "relative" }}>

            <div
              onClick={() =>
                setOpenUser(!openUser)
              }
              style={{
                cursor: "pointer",
                background:
                  "rgba(255,255,255,0.15)",
                padding: "10px 14px",
                borderRadius: "8px",
                color: "white",
                fontWeight: "600"
              }}
            >
              {user?.email?.split("@")[0] ||
                "Usuario"}
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
                  boxShadow:
                    "0 15px 30px rgba(0,0,0,0.12)",
                  overflow: "hidden",
                  zIndex: 9999
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

      </div>

      {/* PANEL CONFIG */}
      {openConfig && (

        <div
          onClick={() => setOpenConfig(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            zIndex: 99999
          }}
        >

          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "320px",
              height: "100%",
              background: "white",
              boxShadow:
                "-10px 0 30px rgba(0,0,0,0.15)",
              padding: "25px",
              animation: "slide .2s ease-out"
            }}
          >

            <h2
              style={{
                marginTop: 0,
                marginBottom: "25px",
                color: "#1e3a8a"
              }}
            >
              Configuración
            </h2>

            <div
              onClick={() => {
                navigate("/prestadores")
                setOpenConfig(false)
              }}
              style={dropdownItem}
            >
              Prestadores
            </div>

            <div style={dropdownItem}>
              Clientes
            </div>

            <div style={dropdownItem}>
              Servicios
            </div>

            <div
              onClick={() => {
                navigate("/tipos-eventos")
                setOpenConfig(false)
              }}
              style={{
                ...dropdownItem,
                borderBottom: "none"
              }}
            >
              Tipos de eventos
            </div>

          </div>

        </div>

      )}
    </>
  )
}