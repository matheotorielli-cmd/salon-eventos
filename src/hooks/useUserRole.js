import { useEffect, useState } from "react"
import { collection, doc, getDoc, getDocs, limit, query, where } from "firebase/firestore"
import { db } from "../firebase"
import { ADMIN_INICIAL_EMAIL, normalizarRol, resolverPermisos } from "../config/permisos"

export function useUserRole(user) {
  const [role, setRole] = useState(null)
  const [permissions, setPermissions] = useState({})
  const [activeUser, setActiveUser] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function buscarRol() {
      if (!user) {
        if (active) {
          setRole(null)
          setPermissions({})
          setActiveUser(false)
          setLoading(false)
        }
        return
      }

      setLoading(true)

      try {
        const userDoc = await getDoc(doc(db, "usuarios", user.uid))
        let userData = userDoc.exists() ? userDoc.data() : null
        let userRole = userData?.rol || null

        // Compatibilidad temporal con usuarios antiguos cuyo documento no usa el uid.
        if (!userRole && user.email) {
          const legacyQuery = query(
            collection(db, "usuarios"),
            where("email", "==", user.email),
            limit(1)
          )
          const legacySnapshot = await getDocs(legacyQuery)
          userData = legacySnapshot.docs[0]?.data() || null
          userRole = userData?.rol || null
        }

        if (active) {
          const esAdminInicial = user.email?.toLowerCase() === ADMIN_INICIAL_EMAIL
          const resolvedRole = esAdminInicial ? "admin" : normalizarRol(userRole)
          setRole(resolvedRole)
          setPermissions(resolverPermisos(resolvedRole, userData?.permisos))
          setActiveUser(userData?.activo !== false)
        }
      } catch (error) {
        console.error("No se pudo obtener el rol del usuario", error)
        if (active) {
          setRole("empleado")
          setPermissions(resolverPermisos("empleado"))
          setActiveUser(false)
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    buscarRol()
    return () => {
      active = false
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
