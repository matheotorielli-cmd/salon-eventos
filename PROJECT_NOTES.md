# Notas del proyecto — Salón de eventos

## Rediseño del login (pendiente)

El rediseño visual del login se realizará más adelante siguiendo el brand kit de **Fun Space — Diversión Asegurada**.

Lineamientos registrados:

- Morado principal: `#4E2581`.
- Celeste diversión: `#57B6EE`.
- Amarillo energía: `#F4D00C`.
- Colores auxiliares: blanco `#FFFFFF`, gris claro `#F5F5F5` y gris oscuro `#4B5563`.
- Tipografía para títulos y logo: **Fredoka**.
- Tipografía para textos: **Poppins**.
- Estética infantil, alegre, positiva, segura y profesional.
- Elementos gráficos posibles: globos, estrellas, pelotas y pelotero.
- Mantener como concepto de marca: **Fun Space — Diversión Asegurada**.

Antes de implementarlo, solicitar:

- Logo oficial en formato SVG, preferentemente, o PNG de buena resolución con fondo transparente.
- Opcional: fotografía horizontal del pelotero.
- Opcional: recursos gráficos oficiales de la marca.

No recortar el logo desde la imagen completa del brand kit porque perdería calidad.

## Mejora funcional y migración a Firestore

Se definió un primer modelo para unificar la información del sistema en Firestore. Está documentado en `docs/FIRESTORE_DATA_MODEL.md`.

Prioridades acordadas:

1. Firestore será la única fuente de verdad para datos operativos.
2. Los cobros deberán actualizar evento, movimiento y cuenta mediante una transacción.
3. Las relaciones utilizarán IDs, no nombres.
4. Los registros financieros se anularán; no se eliminarán físicamente.
5. La migración desde `localStorage` será gradual y deberá validar saldos.

Decisiones confirmadas:

- Se administrará un solo salón.
- La moneda será exclusivamente pesos argentinos (`ARS`).
- Ningún cobro podrá superar el saldo pendiente del evento.
- Los empleados no podrán eliminar ni anular información.
- Solamente los administradores podrán eliminar o anular registros.

### Avance: módulo de cuentas

- `Cuentas` ahora lee la colección `cuentas` de Firestore en tiempo real.
- `NuevaCuenta` crea cuentas en Firestore con moneda fija `ARS`.
- Cada cuenta guarda `saldoInicial`, `saldoActual`, autor y fechas de auditoría.
- El cambio entre cuenta activa e inactiva se limita en la interfaz al rol `admin`.
- La consulta de roles usa primero `usuarios/{uid}` y conserva compatibilidad temporal con documentos antiguos identificados por email.
- No se migraron automáticamente cuentas antiguas de `localStorage` para evitar duplicados.
- Los archivos del módulo pasan ESLint y la compilación de producción.
- Los 23 errores globales de ESLint fueron resueltos; `npm run lint` finaliza correctamente.
- Pendiente: confirmar o desplegar reglas de Firestore que autoricen estas operaciones con los permisos definidos.

### Avance: reglas de seguridad de Firestore

- Se agregaron `firebase.json`, `firestore.rules` y `firestore.indexes.json` al proyecto.
- Las reglas exigen autenticacion y un documento `usuarios/{uid}` activo para acceder a datos operativos.
- Solamente el rol `admin` puede eliminar eventos o registros de configuracion y habilitar o deshabilitar cuentas.
- Las cuentas nuevas se validan como `ARS`, con saldo inicial no negativo y auditoria asociada al usuario autenticado.
- Los documentos financieros no se pueden eliminar fisicamente.
- Las escrituras de `cobros` y `movimientos` permanecen cerradas hasta implementar y validar el flujo transaccional.
- Antes de desplegar, los usuarios antiguos deben tener su documento migrado al ID de Firebase Authentication (`usuarios/{uid}`).

### Avance: administracion de usuarios y permisos

- Se agrego la ruta `/usuarios-permisos`, visible desde Configuracion solo para administradores.
- El administrador puede asignar los roles `admin` o `empleado`, activar o desactivar usuarios y personalizar permisos por funcion.
- Los perfiles de rol cargan permisos predeterminados, que luego pueden ajustarse por usuario.
- Se impide que el administrador conectado se quite a si mismo el rol o desactive su propia cuenta.
- Las reglas de Firestore consultan los permisos guardados en `usuarios/{uid}` para eventos, cuentas y configuraciones.
- El modulo de cuentas ya respeta el permiso individual `cuentasAdministrar`.

### Limpieza técnica completada

- Se eliminó la función duplicada e inválida de edición de eventos.
- Los componentes que leen datos locales ahora usan inicialización perezosa de estado en lugar de actualizar estado sincrónicamente desde efectos.
- El formulario de eventos utiliza el estado `guardando` para bloquear envíos repetidos y mostrar progreso.
- Se retiraron imports y variables sin uso.
- Navbar ya no modifica estado innecesariamente al cambiar la ruta.
- La compilación de producción y ESLint completo pasan correctamente.
