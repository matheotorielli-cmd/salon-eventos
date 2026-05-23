import { useEffect, useState } from "react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "../firebase"

export function useUserRole(user) {

  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {

    async function buscarRol() {

      if (!user) return

      const snap = await getDocs(collection(db, "usuarios"))

      const users = snap.docs.map(doc => doc.data())

      const found = users.find(u => u.email === user.email)

      if (found) {
        setRole(found.rol)
      } else {
        setRole("empleado")
      }

      setLoading(false)
    }

    buscarRol()

  }, [user])

  return { role, loading }
}