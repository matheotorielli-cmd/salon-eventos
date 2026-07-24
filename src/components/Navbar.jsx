import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { auth } from "../firebase"
import { signOut } from "firebase/auth"
import { useUserRole } from "../hooks/useUserRole"
import { ArrowLeftRight, BarChart3, BriefcaseBusiness, Building2, CalendarClock, CalendarDays, CirclePlus, ContactRound, CreditCard, GraduationCap, HandCoins, Landmark, ListTree, PackageOpen, PartyPopper, ReceiptText, Scale, Settings, Shapes, ShieldCheck, Sparkles, Tags, Truck, UserCog, Users, WalletCards } from "lucide-react"

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
            <span style={navItemContent}><CalendarDays size={17}/>Calendario</span>
          </div>

          <div
            onClick={() =>
              navigate("/eventos")
            }
            style={itemStyle}
          >
            <span style={navItemContent}><PartyPopper size={17}/>Eventos</span>
          </div>

          <div
            onClick={() =>
              navigate("/nuevo")
            }
            style={itemStyle}
          >
            <span style={navItemContent}><CirclePlus size={17}/>Nuevo</span>
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
              <span style={navItemContent}><WalletCards size={17}/>Finanzas ▾</span>
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
                  <span style={dropdownContent}><Landmark size={16}/>Cuentas</span>
                </div>

                {role === "admin" && <div onClick={() => { navigate("/balance"); setOpenMenu(null) }} style={dropdownItem}><span style={dropdownContent}><Scale size={16}/>Balance</span></div>}

                <div
                  style={{
                    ...dropdownItem,
                    borderBottom:
                      "none"
                  }}
                >
                  <span style={dropdownContent}><BarChart3 size={16}/>Reportes</span>
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
              <span style={navItemContent}><ArrowLeftRight size={17}/>Movimientos ▾</span>
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
  <span style={dropdownContent}><ReceiptText size={16}/>Mis movimientos</span>
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
                  <span style={dropdownContent}><CirclePlus size={16}/>Nuevo movimiento</span>
                </div>

                <div
                  style={
                    dropdownItem
                  }
                >
                  <span style={dropdownContent}><Truck size={16}/>Pago proveedores</span>
                </div>

                <div
                  onClick={() => {
                    navigate("/pago-prestadores")
                    setOpenMenu(null)
                  }}
                  style={{
                    ...dropdownItem,
                    borderBottom:
                      "none"
                  }}
                >
                  <span style={dropdownContent}><HandCoins size={16}/>Pago prestadores</span>
                </div>

                <div onClick={() => { navigate("/stock-bebidas"); setOpenMenu(null) }} style={{ ...dropdownItem, borderBottom: "none" }}>
                  <span style={dropdownContent}><PackageOpen size={16}/>Stock de bebidas</span>
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
            <Settings size={22}/>
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

            <div
              onClick={() => {
                navigate("/listas-precios")
                setOpenConfig(false)
              }}
              style={configTitle}
            >
              Listas de precios
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

        <MenuItem icon={<ContactRound size={20}/>} label="Clientes" onClick={() => abrir("/clientes")} />
        {puedeConfigurar && <MenuItem icon={<BriefcaseBusiness size={20}/>} label="Prestadores" onClick={() => abrir("/prestadores")} />}
        <MenuItem icon={<Truck size={20}/>} label="Proveedores" />
        <MenuItem icon={<Sparkles size={20}/>} label="Servicios" />
        <MenuItem icon={<CalendarClock size={20}/>} label="Agenda" expandable open={openSections.includes("agenda")} onClick={() => onToggle("agenda")} />
        {openSections.includes("agenda") && <SubItem icon={<CalendarDays size={16}/>} label="Calendario" onClick={() => abrir("/")} />}
        <MenuItem icon={<Tags size={20}/>} label="Listas de precios" onClick={() => abrir("/listas-precios")} />
        <MenuItem icon={<CreditCard size={20}/>} label="Tarjetas Digitales" />

        {role === "admin" && (
          <>
            <MenuItem icon={<UserCog size={20}/>} label="Gestión de usuarios" expandable open={openSections.includes("usuarios")} onClick={() => onToggle("usuarios")} />
            {openSections.includes("usuarios") && (
              <div style={subGrupo}>
                <SubItem icon={<Users size={16}/>} label="Usuarios" onClick={() => abrir("/usuarios")} />
                <SubItem icon={<ShieldCheck size={16}/>} label="Roles y permisos" onClick={() => abrir("/usuarios-permisos")} />
              </div>
            )}
          </>
        )}

        {puedeConfigurar && <MenuItem icon={<Settings size={20}/>} label="Configuración" expandable open={openSections.includes("configuracion")} onClick={() => onToggle("configuracion")} />}
        {puedeConfigurar && openSections.includes("configuracion") && (
          <div style={subGrupo}>
            <SubItem icon={<Building2 size={16}/>} label="Perfil Organización" />
            <SubItem icon={<Building2 size={16}/>} label="Perfil Organización (nuevo)" badge="BETA" />
            <SubItem icon={<GraduationCap size={16}/>} label="Escuelas" onClick={() => abrir("/escuelas")} />
            <SubItem icon={<PartyPopper size={16}/>} label="Tipo de eventos" onClick={() => abrir("/tipos-eventos")} />
            <SubItem icon={<Shapes size={16}/>} label="Tipo de servicios" />
            <SubItem icon={<ListTree size={16}/>} label="Tipo de movimientos" onClick={() => abrir("/tipos-movimientos")} />
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
const navItemContent = { display: "inline-flex", alignItems: "center", gap: 7 }
const dropdownContent = { display: "flex", alignItems: "center", gap: 9 }
const menuIcon = { display: "grid", placeItems: "center", width: 25, color: "white", fontSize: 20, textAlign: "center" }
const flecha = { fontSize: 15, marginRight: 12 }
const subGrupo = { margin: "0 18px 8px 55px", paddingLeft: 12, borderLeft: "2px solid rgba(255,255,255,.16)" }
const subItem = { width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "10px 0", border: 0, background: "transparent", color: "white", fontSize: 17, lineHeight: 1.35, textAlign: "left", cursor: "pointer" }
const subIcon = { display: "grid", placeItems: "center", width: 20, textAlign: "center", fontSize: 16 }
const beta = { marginLeft: 2, padding: "2px 5px", background: "#facc15", color: "#111827", borderRadius: 4, fontSize: 10, fontWeight: 800 }
