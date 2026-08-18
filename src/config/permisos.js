export const PERMISOS = [
  { id: "eventosVer", label: "Ver eventos" },
  { id: "eventosCrear", label: "Crear eventos" },
  { id: "eventosEditar", label: "Editar eventos" },
  { id: "eventosEliminar", label: "Eliminar eventos" },
  { id: "eventosCancelar", label: "Cancelar eventos" },
  { id: "cobrosRegistrar", label: "Registrar cobros" },
  { id: "cobrosAnular", label: "Anular cobros" },
  { id: "cuentasVer", label: "Ver cuentas" },
  { id: "cuentasCrear", label: "Crear cuentas" },
  { id: "cuentasAdministrar", label: "Habilitar o deshabilitar cuentas" },
  { id: "movimientosVer", label: "Ver movimientos" },
  { id: "movimientosCrear", label: "Crear movimientos" },
  { id: "movimientosAnular", label: "Anular movimientos" },
  { id: "configuracionAdministrar", label: "Administrar configuracion" },
  { id: "usuariosAdministrar", label: "Administrar usuarios y permisos" }
]

const permisosAdmin = Object.fromEntries(PERMISOS.map(({ id }) => [id, true]))

const permisosEmpleado = {
  eventosVer: true,
  eventosCrear: true,
  eventosEditar: true,
  eventosEliminar: false,
  eventosCancelar: false,
  cobrosRegistrar: true,
  cobrosAnular: false,
  cuentasVer: true,
  cuentasCrear: true,
  cuentasAdministrar: false,
  movimientosVer: true,
  movimientosCrear: true,
  movimientosAnular: false,
  configuracionAdministrar: false,
  usuariosAdministrar: false
}

export const PERMISOS_POR_ROL = {
  admin: permisosAdmin,
  empleado: permisosEmpleado
}

export function normalizarRol(valor) {
  const rol = String(valor || "").trim().toLowerCase()
  return rol === "admin" || rol === "administrador" ? "admin" : "empleado"
}

export function resolverPermisos(rol, personalizados = {}) {
  return {
    ...(PERMISOS_POR_ROL[rol] || permisosEmpleado),
    ...personalizados
  }
}
