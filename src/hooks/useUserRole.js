import { useEffect, useState } from "react"
import { doc, onSnapshot } from "firebase/firestore"
import { db } from "../firebase"
import { ADMIN_INICIAL_EMAIL, normalizarRol, resolverPermisos } from "../config/permisos"

export function useUserRole(user) {
  const [role, setRole] = useState(null)
  const [permissions, setPermissions] = useState({})
  const [activeUser, setActiveUser] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    if (!user) {
      return undefined
    }

    const esAdminInicial = user.email?.toLowerCase() === ADMIN_INICIAL_EMAIL
    const unsubscribe = onSnapshot(doc(db, "usuarios", user.uid), (userDoc) => {
      if (!active) return
      const userData = userDoc.exists() ? userDoc.data() : null
      const resolvedRole = esAdminInicial ? "admin" : normalizarRol(userData?.rol)
      setRole(resolvedRole)
      setPermissions(resolverPermisos(resolvedRole, userData?.permisos))
      setActiveUser(esAdminInicial || (userDoc.exists() && userData?.activo !== false))
      setLoading(false)
    }, (error) => {
      console.error("No se pudo obtener el rol del usuario", error)
      if (active) {
        setRole(esAdminInicial ? "admin" : "empleado")
        setPermissions(resolverPermisos(esAdminInicial ? "admin" : "empleado"))
        setActiveUser(esAdminInicial)
        setLoading(false)
      }
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [user])

  return {
    role,
    permissions,
    activeUser,
    hasPermission: (permission) => role === "admin" || permissions[permission] === true,
    loading
  }
}
