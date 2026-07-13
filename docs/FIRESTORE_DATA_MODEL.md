# Modelo de datos propuesto para Firestore

## Objetivo

Usar Firestore como única fuente de verdad del sistema. `localStorage` quedará limitado, en el futuro, a preferencias visuales o caché no crítica.

El modelo prioriza:

- IDs estables en lugar de relacionar registros por nombre.
- Trazabilidad de quién creó o modificó información.
- Cobros y movimientos financieros consistentes.
- Bajas lógicas para información administrativa y financiera.
- Compatibilidad con los datos que actualmente usa la interfaz.

## Colecciones principales

### `usuarios/{uid}`

```js
{
  email: "usuario@correo.com",
  nombre: "Nombre Apellido",
  rol: "admin", // admin | empleado
  activo: true,
  creadoEn: Timestamp,
  actualizadoEn: Timestamp
}
```

El ID debe ser el mismo `uid` de Firebase Authentication. No se debe buscar el rol descargando la colección completa de usuarios.

### `eventos/{eventoId}`

```js
{
  cliente: {
    nombre: "Nombre del cliente",
    telefono: "",
    direccion: ""
  },
  tipoEventoId: "tipoId",
  tipoEventoNombre: "Cumpleaños", // copia histórica
  fecha: "2026-07-10",            // temporal durante la migración
  horaInicio: "18:00",
  horaFin: "22:00",
  inicio: Timestamp,
  fin: Timestamp,
  personas: 40,
  cantidadNinos: 25,
  escuelaId: null,
  escuelaNombre: "",
  prestadores: [
    {
      prestadorId: "prestadorId",
      nombre: "",
      actividad: "",
      precioAcordado: 0
    }
  ],
  total: 300000,
  totalCobrado: 50000,
  saldo: 250000,
  moneda: "ARS",
  estado: "presupuestado", // presupuestado | confirmado | pagado | cancelado
  observaciones: "",
  activo: true,
  creadoPor: "uid",
  actualizadoPor: "uid",
  creadoEn: Timestamp,
  actualizadoEn: Timestamp
}
```

`totalCobrado` y `saldo` son valores derivados que se conservan para mostrar listados rápidamente. Solo deben modificarse mediante el flujo transaccional de cobros.

### `cuentas/{cuentaId}`

```js
{
  nombre: "Efectivo",
  descripcion: "Caja principal",
  moneda: "ARS",
  saldoInicial: 0,
  saldoActual: 0,
  activa: true,
  creadoPor: "uid",
  actualizadoPor: "uid",
  creadoEn: Timestamp,
  actualizadoEn: Timestamp
}
```

Los movimientos deben guardar `cuentaId`; el nombre puede copiarse como dato histórico, pero nunca utilizarse como relación.

### `cobros/{cobroId}`

```js
{
  eventoId: "eventoId",
  cuentaId: "cuentaId",
  monto: 50000,
  moneda: "ARS",
  fecha: Timestamp,
  concepto: "Seña",
  descripcion: "",
  metodoPago: "efectivo",
  anulado: false,
  creadoPor: "uid",
  creadoEn: Timestamp,
  anuladoPor: null,
  anuladoEn: null
}
```

Un cobro no debe eliminarse físicamente. Si fue incorrecto, se anula y se genera el movimiento inverso correspondiente.

### `movimientos/{movimientoId}`

```js
{
  categoria: "ingreso", // ingreso | egreso | transferencia | ajuste
  tipoMovimientoId: "tipoId",
  tipoMovimientoNombre: "Cobro cliente",
  cuentaId: "cuentaId",
  cuentaNombre: "Efectivo",
  cuentaOrigenId: null,
  cuentaDestinoId: null,
  monto: 50000,
  moneda: "ARS",
  fecha: Timestamp,
  concepto: "Seña evento",
  descripcion: "",
  origen: "cobro", // manual | cobro | transferencia | anulacion
  referenciaId: "cobroId",
  anulado: false,
  creadoPor: "uid",
  creadoEn: Timestamp
}
```

Los movimientos financieros no se eliminan. Se anulan para mantener trazabilidad.

## Colecciones de configuración

### `tiposEventos/{tipoEventoId}`

```js
{
  nombre: "Cumpleaños",
  precioBase: 300000,
  moneda: "ARS",
  activo: true,
  creadoEn: Timestamp,
  actualizadoEn: Timestamp
}
```

### `tiposMovimientos/{tipoMovimientoId}`

```js
{
  nombre: "Pago prestador",
  categoria: "egreso",
  descripcion: "",
  activo: true,
  creadoEn: Timestamp,
  actualizadoEn: Timestamp
}
```

### `prestadores/{prestadorId}`

```js
{
  nombre: "",
  telefono: "",
  actividad: "",
  observaciones: "",
  activo: true,
  creadoEn: Timestamp,
  actualizadoEn: Timestamp
}
```

### `escuelas/{escuelaId}`

```js
{
  nombre: "",
  descripcion: "",
  activa: true,
  creadoEn: Timestamp,
  actualizadoEn: Timestamp
}
```

## Operaciones que deben ser transacciones

### Registrar un cobro

Una única transacción debe:

1. Leer el evento y la cuenta.
2. Validar que el monto sea positivo y no supere el saldo, salvo permiso administrativo explícito.
3. Crear el documento en `cobros`.
4. Crear un movimiento de categoría `ingreso`.
5. Incrementar `totalCobrado` y reducir `saldo` en el evento.
6. Incrementar `saldoActual` en la cuenta.
7. Cambiar el evento a `pagado` si el saldo queda en cero.

Si una parte falla, ninguna modificación debe guardarse.

### Transferencia entre cuentas

Una única transacción debe crear el movimiento y actualizar los saldos de la cuenta de origen y destino. Las cuentas deben ser diferentes y compartir moneda, salvo que posteriormente se implemente conversión.

### Anular un cobro o movimiento

No se elimina el registro. Se marca como anulado, se crea el movimiento inverso y se recalculan evento y cuenta en una transacción.

## Validaciones mínimas

- Todos los montos deben ser números finitos y mayores que cero cuando corresponda.
- El total de un evento no puede ser negativo.
- El saldo debe ser `total - totalCobrado` y nunca modificarse manualmente.
- Las referencias (`eventoId`, `cuentaId`, etc.) deben existir y estar activas.
- Las fechas operativas deben guardarse como `Timestamp`; los textos de fecha actuales se mantendrán solo durante la migración.
- El cliente puede repetirse, pero debe advertirse cuando se superponen horarios de eventos activos.
- Solo un administrador puede anular movimientos, gestionar usuarios o modificar saldos iniciales.

## Índices previstos

- `eventos`: `activo + inicio`.
- `eventos`: `estado + inicio`.
- `cobros`: `eventoId + fecha`.
- `movimientos`: `cuentaId + fecha`.
- `movimientos`: `categoria + fecha`.

Firestore indicará los índices compuestos exactos al ejecutar las consultas por primera vez.

## Orden de migración

1. Crear reglas y funciones de acceso compartidas.
2. Migrar `tiposEventos`, `tiposMovimientos`, `prestadores` y `escuelas`.
3. Migrar cuentas con IDs estables.
4. Migrar movimientos y reemplazar nombres de cuenta por `cuentaId`.
5. Normalizar los eventos existentes.
6. Implementar cobros transaccionales.
7. Retirar las lecturas y escrituras operativas de `localStorage`.
8. Validar saldos y cantidades antes de dar la migración por terminada.

## Decisiones funcionales confirmadas

- El sistema administrará un único salón; no se incorporará una entidad de sedes o sucursales.
- La única moneda operativa será el peso argentino (`ARS`).
- Un cobro nunca podrá superar el saldo pendiente del evento.
- Los empleados no podrán eliminar ni anular información.
- Solamente un usuario con rol `admin` podrá eliminar o anular registros.

Estas restricciones deben validarse tanto en la interfaz como en las reglas y operaciones de Firestore. Ocultar un botón no se considera una medida de seguridad suficiente.
