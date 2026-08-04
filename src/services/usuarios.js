import { collection, doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from "firebase/firestore"
import { auth, db } from "../firebase"
import { initializeApp, getApp, getApps } from "firebase/app"
import { createUserWithEmailAndPassword, deleteUser, getAuth, sendPasswordResetEmail, signOut } from "firebase/auth"
import { firebaseConfig } from "../firebase"

const DOMINIO_USUARIOS_INTERNOS = "usuarios.funspace.invalid"

export function normalizarNombreUsuario(valor) {
  return valor.trim().toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, ".")
}

export function emailUsuarioInterno(nombreUsuario) {
  const identificadorTecnico = normalizarNombreUsuario(nombreUsuario).replace(/@/g, ".arroba.")
  return `${identificadorTecnico}@${DOMINIO_USUARIOS_INTERNOS}`
}

export function normalizarIdentificadorAcceso(valor) {
  const identificador = valor.trim().toLowerCase()
  const esCorreoCompleto = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identificador)
  return esCorreoCompleto ? identificador : emailUsuarioInterno(identificador)
}

export function opcionesIdentificadorAcceso(valor) {
  const identificador = valor.trim().toLowerCase()
  const principal = normalizarIdentificadorAcceso(identificador)
  const interno = emailUsuarioInterno(identificador)
  return principal === interno ? [principal] : [principal, interno]
}

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

function generarPasswordProvisoria() {
  const caracteres = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%"
  const valores = new Uint32Array(24)
  globalThis.crypto.getRandomValues(valores)
  return Array.from(valores, (valor) => caracteres[valor % caracteres.length]).join("")
}

export function enviarRestablecimientoPassword(email) {
  auth.languageCode = "es"
  return sendPasswordResetEmail(auth, email.trim().toLowerCase())
}

export async function crearUsuario({ nombre, apellido, email, telefono, rol, permisos, adminId, tipoAcceso = "correo", nombreUsuario = "", passwordInicial = "" }) {
  const secondaryApp = getApps().find((app) => app.name === "crear-usuario")
    || initializeApp(firebaseConfig, "crear-usuario")
  const secondaryAuth = getAuth(getApp(secondaryApp.name))
  secondaryAuth.languageCode = "es"
  const esInterno = tipoAcceso === "interno"
  const usuarioNormalizado = esInterno ? normalizarNombreUsuario(nombreUsuario) : ""
  const emailNormalizado = esInterno ? emailUsuarioInterno(usuarioNormalizado) : email.trim().toLowerCase()
  const passwordCreacion = esInterno ? passwordInicial : generarPasswordProvisoria()
  const credential = await createUserWithEmailAndPassword(secondaryAuth, emailNormalizado, passwordCreacion)

  try {
    try {
      await setDoc(doc(db, "usuarios", credential.user.uid), {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        email: emailNormalizado,
        tipoAcceso: esInterno ? "interno" : "correo",
        nombreUsuario: usuarioNormalizado,
        telefono: telefono.trim(),
        rol,
        permisos,
        activo: true,
        creadoPor: adminId,
        creadoEn: serverTimestamp(),
        actualizadoPor: adminId,
        actualizadoEn: serverTimestamp()
      })
    } catch (error) {
      try {
        await deleteUser(credential.user)
      } catch (cleanupError) {
        console.error("No se pudo eliminar la cuenta de Authentication creada parcialmente", cleanupError)
      }
      throw error
    }

    if (esInterno) {
      return { uid: credential.user.uid, correoEnviado: false, usuarioInterno: usuarioNormalizado }
    }

    try {
      await sendPasswordResetEmail(secondaryAuth, emailNormalizado)
      return { uid: credential.user.uid, correoEnviado: true }
    } catch (emailError) {
      console.error("El usuario se creó, pero no se pudo enviar el correo de contraseña", emailError)
      return { uid: credential.user.uid, correoEnviado: false }
    }
  } finally {
    await signOut(secondaryAuth)
  }
}
