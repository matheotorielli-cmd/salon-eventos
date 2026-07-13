import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { auth } from "../firebase"
import { signOut } from "firebase/auth"
import { useUserRole } from "../hooks/useUserRole"

export default function Navbar() {

  const navigate = useNavigate()
  const [openMenu, setOpenMenu] = useState(null)
  const [openUser, setOpenUser] = useState(false)
  const [openConfig, setOpenConfig] = useState(false)
  const mostrarMenuAnterior = Boolean(import.meta.env.VITE_MENU_ANTERIOR)

  const [openSection, setOpenSection] = useState(["usuarios", "configuracion"])

  const user = auth.currentUser
  const { role, hasPermission } = useUserRole(user)
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

  function toggleSection(section) {
    setOpenSection((sections) => sections.includes(section)
      ? sections.filter((item) => item !== section)
      : [...sections, section])
  }

  useEffect(() => {

    function handleClickOutside(e) {

      if (
        menuRef.current &&
        !menuRef.current.contains(
          e.target
        )
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
    boxShadow:
      "0 15px 30px rgba(0,0,0,0.12)",
    zIndex: 9999,
    overflow: "hidden"
  }

  const dropdownItem = {
    padding: "12px",
    cursor: "pointer",
    borderBottom: "1px solid #eee",
    fontSize: "14px",
    background: "white",
    color: "#111827"
  }

  const configTitle = {
    padding: "14px",
    fontWeight: "700",
    fontSize: "15px",
    cursor: "pointer",
    borderBottom: "1px solid #eee",
    background: "#f9fafb",
    color: "#111827"
  }

  const configSub = {
    padding: "12px 20px",
    borderBottom: "1px solid #f1f1f1",
    cursor: "pointer",
    fontSize: "14px",
    color: "#374151",
    background: "white"
  }

  return (

    <>

      <style>{`

        @keyframes slide {

          from {
            transform:
              translateX(100%);
          }

          to {
            transform:
              translateX(0);
          }

        }

      `}</style>

      <div
        className="navbar-main"
        ref={menuRef}
        style={{
          background: "linear-gradient(90deg,#3b1765,#4E2581 58%,#623598)",
          padding: "14px 20px",
          display: "flex",
          justifyContent:
            "space-between",
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
          className="navbar-links"
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
            flexWrap: "wrap"
          }}
        >

          <div
            onClick={() =>
              navigate("/")
            }
            style={itemStyle}
          >
            Calendario
          </div>

          <div
            onClick={() =>
              navigate("/eventos")
            }
            style={itemStyle}
          >
            Eventos
          </div>

          <div
            onClick={() =>
              navigate("/nuevo")
            }
            style={itemStyle}
          >
            Nuevo
          </div>

          {/* FINANZAS */}
          <div
            style={{
              position: "relative"
            }}
          >

            <div
              style={itemStyle}
              onClick={() =>
                toggleMenu(
                  "finanzas"
                )
              }
            >
              Finanzas ▾
            </div>

            {openMenu ===
              "finanzas" && (

              <div
                style={
                  dropdownStyle
                }
              >

                <div
                  onClick={() => {

                    navigate(
                      "/cuentas"
                    )

                    setOpenMenu(
                      null
                    )

                  }}
                  style={
                    dropdownItem
                  }
                >
                  Cuentas
                </div>

                <div
                  style={
                    dropdownItem
                  }
                >
                  Balance
                </div>

                <div
                  style={{
                    ...dropdownItem,
                    borderBottom:
                      "none"
                  }}
                >
                  Reportes
                </div>

              </div>

            )}

          </div>

          {/* MOVIMIENTOS */}
          <div
            style={{
              position: "relative"
            }}
          >

            <div
              style={itemStyle}
              onClick={() =>
                toggleMenu(
                  "movimientos"
                )
              }
            >
              Movimientos ▾
            </div>

            {openMenu ===
              "movimientos" && (

              <div
                style={
                  dropdownStyle
                }
              >
                

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
                    

                    navigate(
                      "/nuevo-movimiento"
                    )

                    setOpenMenu(
                      null
                    )

                  }}
                  style={
                    dropdownItem
                  }
                >
                  Nuevo movimiento
                </div>

                <div
                  style={
                    dropdownItem
                  }
                >
                  Pago proveedores
                </div>

                <div
                  style={{
                    ...dropdownItem,
                    borderBottom:
                      "none"
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
            gap: "10px"
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
              borderRadius:
                "10px",
              background:
                "rgba(255,255,255,0.15)",
              display: "flex",
              justifyContent:
                "center",
              alignItems:
                "center",
              cursor: "pointer",
              color: "white",
              fontSize: "22px"
            }}
          >
            ⚙️
          </div>

          {/* USUARIO */}
          <div
            style={{
              position: "relative"
            }}
          >

            <div
              onClick={() =>
                setOpenUser(
                  !openUser
                )
              }
              style={{
                cursor: "pointer",
                background:
                  "rgba(255,255,255,0.15)",
                padding:
                  "10px 14px",
                borderRadius:
                  "8px",
                color: "white",
                fontWeight:
                  "600"
              }}
            >
              {user?.email?.split(
                "@"
              )[0] ||
                "Usuario"}
            </div>

            {openUser && (

              <div
                style={{
                  position:
                    "absolute",
                  right: 0,
                  top: "52px",
                  background:
                    "white",
                  borderRadius:
                    "10px",
                  width: "180px",
                  boxShadow:
                    "0 15px 30px rgba(0,0,0,0.12)",
                  overflow:
                    "hidden",
                  zIndex: 99999
                }}
              >

                <div
                  onClick={
                    cerrarSesion
                  }
                  style={{
                    padding:
                      "12px",
                    cursor:
                      "pointer",
                    color:
                      "#dc2626",
                    fontWeight:
                      "600"
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
        <ConfigPanel
          role={role}
          puedeConfigurar={hasPermission("configuracionAdministrar")}
          navigate={navigate}
          onClose={() => setOpenConfig(false)}
          openSections={openSection}
          onToggle={toggleSection}
        />
      )}
      {mostrarMenuAnterior && openConfig && (

        <div
          onClick={() =>
            setOpenConfig(false)
          }
          style={{
            position: "fixed",
            inset: 0,
            background:
              "rgba(0,0,0,0.35)",
            zIndex: 99999
          }}
        >

          <div
            onClick={(e) =>
              e.stopPropagation()
            }
            style={{
              position:
                "absolute",
              top: 0,
              right: 0,
              width: "340px",
              height: "100%",
              background:
                "white",
              boxShadow:
                "-10px 0 30px rgba(0,0,0,0.15)",
              overflowY:
                "auto",
              animation:
                "slide .2s ease-out"
            }}
          >

            <div
              style={{
                padding: "20px",
                borderBottom:
                  "1px solid #eee",
                fontWeight:
                  "700",
                fontSize:
                  "22px",
                color:
                  "#4e2581"
              }}
            >
              Configuración
            </div>

            {role === "admin" && (
              <div
                onClick={() => {
                  navigate("/usuarios-permisos")
                  setOpenConfig(false)
                }}
                style={{ ...configSub, fontWeight: "700", color: "#4e2581" }}
              >
                Usuarios, roles y permisos
              </div>
            )}

            {/* CLIENTES */}
            <div>

              <div
                style={
                  configTitle
                }
                onClick={() =>
                  toggleSection(
                    "clientes"
                  )
                }
              >
                Clientes ▾
              </div>

              {openSection ===
                "clientes" && (
                <>

                  <div
                    style={
                      configSub
                    }
                    onClick={() => {
                      navigate("/clientes")
                      setOpenConfig(false)
                    }}
                  >
                    Historial
                  </div>

                  <div
                    style={
                      configSub
                    }
                  >
                    Cumpleaños
                  </div>

                  <div
                    style={
                      configSub
                    }
                  >
                    Eventos realizados
                  </div>

                  <div
                    style={
                      configSub
                    }
                  >
                    Deuda / saldo
                  </div>

                </>
              )}

            </div>

            {/* PRESTADORES */}
            <div>

              <div
                style={
                  configTitle
                }
                onClick={() =>
                  toggleSection(
                    "prestadores"
                  )
                }
              >
                Prestadores ▾
              </div>

              {openSection ===
                "prestadores" && (
                <>

                  <div
                    style={
                      configSub
                    }
                    onClick={() => {

                      navigate(
                        "/prestadores"
                      )

                      setOpenConfig(
                        false
                      )

                    }}
                  >
                    Lista prestadores
                  </div>

                  <div
                    style={
                      configSub
                    }
                  >
                    Teléfonos
                  </div>

                  <div
                    style={
                      configSub
                    }
                  >
                    Pagos
                  </div>

                </>
              )}

            </div>

            {/* SERVICIOS */}
            <div>

              <div
                style={
                  configTitle
                }
                onClick={() =>
                  toggleSection(
                    "servicios"
                  )
                }
              >
                Servicios ▾
              </div>

              {openSection ===
                "servicios" && (
                <>

                  <div
                    style={
                      configSub
                    }
                  >
                    Combos del salón
                  </div>

                  <div
                    onClick={() => {

                      navigate(
                        "/tipos-eventos"
                      )

                      setOpenConfig(
                        false
                      )

                    }}
                    style={
                      configSub
                    }
                  >
                    Tipos de eventos
                  </div>

                </>
              )}

            </div>
<div
  onClick={() => {

    navigate(
      "/tipos-movimientos"
    )

    setOpenConfig(
      false
    )

  }}
  style={
    configSub
  }
>
  Tipos de movimiento
</div>
            {/* ESCUELAS */}
            <div>

              <div
                style={
                  configTitle
                }
                onClick={() => {
                  navigate("/escuelas")
                  setOpenConfig(false)
                }}
              >
                Escuelas
              </div>

            </div>

          </div>

        </div>

      )}

    </>

  )
}

function ConfigPanel({ role, puedeConfigurar, navigate, onClose, openSections, onToggle }) {
  function abrir(ruta) {
    navigate(ruta)
    onClose()
  }

  return (
    <div onClick={onClose} style={panelOverlay}>
      <aside onClick={(e) => e.stopPropagation()} style={panelLateral}>
        <div style={panelHeader}>
          <span>Configuración</span>
          <button onClick={onClose} style={botonCerrar} aria-label="Cerrar menú">×</button>
        </div>

        <MenuItem icon="♟" label="Clientes" onClick={() => abrir("/clientes")} />
        {puedeConfigurar && <MenuItem icon="♞" label="Prestadores" onClick={() => abrir("/prestadores")} />}
        <MenuItem icon="▰" label="Proveedores" />
        <MenuItem icon="♨" label="Servicios" />
        <MenuItem icon="▦" label="Agenda" expandable open={openSections.includes("agenda")} onClick={() => onToggle("agenda")} />
        {openSections.includes("agenda") && <SubItem label="Calendario" onClick={() => abrir("/")} />}
        <MenuItem icon="◆" label="Listas de precios" />
        <MenuItem icon="✉" label="Tarjetas Digitales" />

        {role === "admin" && (
          <>
            <MenuItem icon="♣" label="Gestión de usuarios" expandable open={openSections.includes("usuarios")} onClick={() => onToggle("usuarios")} />
            {openSections.includes("usuarios") && (
              <div style={subGrupo}>
                <SubItem icon="●" label="Usuarios" onClick={() => abrir("/usuarios")} />
                <SubItem icon="♟" label="Roles y permisos" onClick={() => abrir("/usuarios-permisos")} />
              </div>
            )}
          </>
        )}

        {puedeConfigurar && <MenuItem icon="▥" label="Configuración" expandable open={openSections.includes("configuracion")} onClick={() => onToggle("configuracion")} />}
        {puedeConfigurar && openSections.includes("configuracion") && (
          <div style={subGrupo}>
            <SubItem icon="⚑" label="Perfil Organización" />
            <SubItem label="Perfil Organización (nuevo)" badge="BETA" />
            <SubItem icon="◇" label="Escuelas" onClick={() => abrir("/escuelas")} />
            <SubItem icon="●" label="Tipo de eventos" onClick={() => abrir("/tipos-eventos")} />
            <SubItem icon="●" label="Tipo de servicios" />
            <SubItem icon="●" label="Tipo de movimientos" onClick={() => abrir("/tipos-movimientos")} />
          </div>
        )}
      </aside>
    </div>
  )
}

function MenuItem({ icon, label, onClick, expandable = false, open = false }) {
  return (
    <button type="button" onClick={onClick} style={menuLateralItem}>
      <span style={menuIcon}>{icon}</span>
      <span style={{ flex: 1, textAlign: "left" }}>{label}</span>
      {expandable && <span style={flecha}>{open ? "▴" : "▾"}</span>}
    </button>
  )
}

function SubItem({ icon, label, onClick, badge }) {
  return (
    <button type="button" onClick={onClick} style={subItem}>
      {icon && <span style={subIcon}>{icon}</span>}
      <span>{label}</span>
      {badge && <span style={beta}>{badge}</span>}
    </button>
  )
}

const panelOverlay = { position: "fixed", inset: 0, background: "rgba(15,23,42,.38)", zIndex: 99999 }
const panelLateral = { position: "absolute", top: 0, right: 0, width: "min(340px,90vw)", height: "100%", padding: "8px 0 24px", background: "linear-gradient(180deg,#4E2581,#38145f)", boxShadow: "-12px 0 35px rgba(78,37,129,.3)", overflowY: "auto", animation: "slide .2s ease-out", color: "white" }
const panelHeader = { height: 58, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px 0 27px", fontSize: 23, borderBottom: "1px solid rgba(255,255,255,.18)" }
const botonCerrar = { border: 0, background: "transparent", color: "white", fontSize: 28, cursor: "pointer", lineHeight: 1 }
const menuLateralItem = { width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "13px 26px", border: 0, background: "transparent", color: "white", fontSize: 18, cursor: "pointer" }
const menuIcon = { width: 25, color: "white", fontSize: 20, textAlign: "center" }
const flecha = { fontSize: 15, marginRight: 12 }
const subGrupo = { margin: "0 18px 8px 55px", paddingLeft: 12, borderLeft: "2px solid rgba(255,255,255,.16)" }
const subItem = { width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "10px 0", border: 0, background: "transparent", color: "white", fontSize: 17, lineHeight: 1.35, textAlign: "left", cursor: "pointer" }
const subIcon = { width: 20, textAlign: "center", fontSize: 16 }
const beta = { marginLeft: 2, padding: "2px 5px", background: "#facc15", color: "#111827", borderRadius: 4, fontSize: 10, fontWeight: 800 }
