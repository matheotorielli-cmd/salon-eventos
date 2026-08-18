import { useEffect, useState } from "react"
import { doc, onSnapshot } from "firebase/firestore"
import { db } from "../firebase"
import { normalizarRol, resolverPermisos } from "../config/permisos"

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

    const unsubscribe = onSnapshot(doc(db, "usuarios", user.uid), (userDoc) => {
      if (!active) return
      const userData = userDoc.exists() ? userDoc.data() : null
      const resolvedRole = normalizarRol(userData?.rol)
      setRole(resolvedRole)
      setPermissions(resolverPermisos(resolvedRole, userData?.permisos))
      setActiveUser(userDoc.exists() && userData?.activo !== false)
      setLoading(false)
    }, (error) => {
      console.error("No se pudo obtener el rol del usuario", error)
      if (active) {
        setRole("empleado")
        setPermissions(resolverPermisos("empleado"))
        setActiveUser(false)
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
