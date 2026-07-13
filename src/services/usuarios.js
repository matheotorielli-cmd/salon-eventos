import { collection, doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from "firebase/firestore"
import { db } from "../firebase"
import { initializeApp, getApp, getApps } from "firebase/app"
import { createUserWithEmailAndPassword, getAuth, signOut } from "firebase/auth"
import { firebaseConfig } from "../firebase"

export function observarUsuarios(onData, onError) {
  return onSnapshot(collection(db, "usuarios"), (snapshot) => {
    const usuarios = snapshot.docs
      .map((userDoc) => ({ id: userDoc.id, ...userDoc.data() }))
      .sort((a, b) => (a.nombre || a.email || "").localeCompare(b.nombre || b.email || "", "es"))
    onData(usuarios)
  }, onError)
}

export function actualizarAccesoUsuario({ usuarioId, rol, activo, permisos, adminId, nombre, apellido, telefono }) {
  const cambios = {
    rol,
    activo,
    permisos,
    actualizadoPor: adminId,
    actualizadoEn: serverTimestamp()
  }
  if (nombre !== undefined) cambios.nombre = nombre.trim()
  if (apellido !== undefined) cambios.apellido = apellido.trim()
  if (telefono !== undefined) cambios.telefono = telefono.trim()
  return updateDoc(doc(db, "usuarios", usuarioId), cambios)
}

export function asegurarAdministradorInicial({ uid, email, permisos }) {
  return setDoc(doc(db, "usuarios", uid), {
    email,
    nombre: email.split("@")[0],
    rol: "admin",
    activo: true,
    permisos,
    actualizadoPor: uid,
    actualizadoEn: serverTimestamp()
  }, { merge: true })
}

export async function crearUsuario({ nombre, apellido, email, telefono, rol, permisos, password, adminId }) {
  const secondaryApp = getApps().find((app) => app.name === "crear-usuario")
    || initializeApp(firebaseConfig, "crear-usuario")
  const secondaryAuth = getAuth(getApp(secondaryApp.name))
  const credential = await createUserWithEmailAndPassword(secondaryAuth, email, password)

  try {
    await setDoc(doc(db, "usuarios", credential.user.uid), {
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      email: email.trim().toLowerCase(),
      telefono: telefono.trim(),
      rol,
      permisos,
      activo: true,
      creadoPor: adminId,
      creadoEn: serverTimestamp(),
      actualizadoPor: adminId,
      actualizadoEn: serverTimestamp()
    })
  } finally {
    await signOut(secondaryAuth)
  }

  return credential.user.uid
}
