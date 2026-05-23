import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { auth } from "../firebase"
import { signOut } from "firebase/auth"

export default function Navbar() {

  const navigate = useNavigate()

  const [openMenu, setOpenMenu] = useState(null)

  const menuRef = useRef()

  const user = auth.currentUser

  async function cerrarSesion() {
    await signOut(auth)
    navigate("/login")
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

  function toggleMenu(menu) {
    setOpenMenu(openMenu === menu ? null : menu)
  }

  return (
    <div className="topbar">

      <div className="topbar-content" ref={menuRef}>

        {/* LOGO */}
        <div
          className="logo"
          onClick={() => navigate("/")}
        >
          bonete
        </div>

        {/* MENUS */}
        <div className="menu-area">

          <div
            className="menu-item"
            onClick={() => navigate("/")}
          >
            📅 Calendario
          </div>

          {/* EVENTOS */}
          <div
            className="menu-item dropdown-parent"
            onClick={() => toggleMenu("eventos")}
          >
            📁 Eventos ▾

            {openMenu === "eventos" && (
              <div className="dropdown">

                <div
                  className="dropdown-item"
                  onClick={() => navigate("/eventos")}
                >
                  Mis eventos
                </div>

                <div
                  className="dropdown-item"
                  onClick={() => navigate("/presupuestados")}
                >
                  Presupuestados
                </div>

                <div
                  className="dropdown-item"
                  onClick={() => navigate("/ventas")}
                >
                  Punto de ventas
                </div>

              </div>
            )}

          </div>

          {/* NUEVO */}
          <div
            className="menu-item"
            onClick={() => navigate("/nuevo")}
          >
            ➕ Nuevo
          </div>

          {/* FINANZAS */}
          <div
            className="menu-item dropdown-parent"
            onClick={() => toggleMenu("finanzas")}
          >
            💳 Finanzas ▾

            {openMenu === "finanzas" && (
              <div className="dropdown">

                <div
                  className="dropdown-item"
                  onClick={() => navigate("/cuentas")}
                >
                  Cuentas
                </div>

                <div
                  className="dropdown-item"
                  onClick={() => navigate("/reportes")}
                >
                  Reportes
                </div>

              </div>
            )}

          </div>

          {/* MOVIMIENTOS */}
          <div
            className="menu-item dropdown-parent"
            onClick={() => toggleMenu("movimientos")}
          >
            💸 Movimientos ▾

            {openMenu === "movimientos" && (
              <div className="dropdown">

                <div
                  className="dropdown-item"
                  onClick={() => navigate("/movimientos")}
                >
                  Mis movimientos
                </div>

                <div
                  className="dropdown-item"
                  onClick={() => navigate("/movimientos/nuevo")}
                >
                  Nuevo movimiento
                </div>

                <div
                  className="dropdown-item"
                  onClick={() => navigate("/movimientos/proveedores")}
                >
                  Pago proveedores
                </div>

                <div
                  className="dropdown-item"
                  onClick={() => navigate("/movimientos/prestadores")}
                >
                  Pago prestadores
                </div>

              </div>
            )}

          </div>

        </div>

        {/* DERECHA */}
        <div className="right-area">

          <span>🔔</span>

          <span className="user-name">
            {user?.email?.split("@")[0] || "Usuario"}
          </span>

          <span
            className="config-btn"
            onClick={cerrarSesion}
          >
            ⚙️
          </span>

        </div>

      </div>

    </div>
  )
}