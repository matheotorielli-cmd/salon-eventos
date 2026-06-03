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

  const [openSection, setOpenSection] =
    useState(null)

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

  function toggleSection(section) {

    setOpenSection(
      openSection === section
        ? null
        : section
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
        ref={menuRef}
        style={{
          background: "#1d4ed8",
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
                  "#1e3a8a"
              }}
            >
              Configuración
            </div>

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
            {/* ETIQUETAS */}
            <div>

              <div
                style={
                  configTitle
                }
                onClick={() =>
                  toggleSection(
                    "etiquetas"
                  )
                }
              >
                Etiquetas ▾
              </div>

              {openSection ===
                "etiquetas" && (
                <>

                  <div
                    style={
                      configSub
                    }
                    onClick={() => {

                      navigate(
                        "/escuelas"
                      )

                      setOpenConfig(
                        false
                      )

                    }}
                  >
                    Escuelas
                  </div>

                </>
              )}

            </div>

          </div>

        </div>

      )}

    </>

  )
}