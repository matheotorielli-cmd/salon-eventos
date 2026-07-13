# Continuidad del proyecto - Salon de eventos Fun Space

## Avance del 13 de julio de 2026

- Se migraron `tiposEventos`, `tiposMovimientos` y `prestadores` para que Firestore sea su fuente de verdad.
- Se agregó una importación automática y de una sola vez desde los datos anteriores de `localStorage` cuando la colección de Firestore está vacía. Después de importar, la copia local se elimina.
- Nuevo evento y nuevo movimiento ahora consumen esas configuraciones desde Firestore en tiempo real.
- La validación de eventos repetidos por cliente y fecha ahora consulta Firestore.
- Se eliminó el ingreso directo de señas desde el formulario de eventos. Todo dinero nuevo debe registrarse mediante el flujo transaccional de cobros y una cuenta receptora.
- Se implementó la anulación de cobros únicamente para administradores:
  1. exige motivo y confirmación;
  2. marca el cobro y su movimiento original como anulados;
  3. crea un movimiento inverso;
  4. revierte el saldo de la cuenta;
  5. actualiza cobrado, saldo y estado del evento;
  6. conserva usuario, fecha y trazabilidad.
- Los historiales del evento, movimientos y detalle de cuenta identifican registros anulados.
- Se reforzaron permisos tanto en rutas como en botones y reglas de Firestore.
- Las configuraciones administrativas dejaron de mostrarse a usuarios sin permiso.
- Se agregó carga diferida de rutas y separación de paquetes. El bundle único de aproximadamente 994 KB se dividió en archivos menores; ya no aparece la advertencia de chunks mayores a 500 KB.
- Se reemplazó el README genérico de Vite por documentación del proyecto.
- `npm run lint`: aprobado.
- `npm run build`: aprobado.
- Rutas principales del servidor local: responden HTTP 200.
- Reglas de Firestore: compilación aprobada mediante `firebase deploy --dry-run`.
- Después de desplegar las reglas nuevas, el usuario probó nuevamente la anulación de un cobro y confirmó que funciona correctamente.
- El usuario completó una prueba real del circuito financiero: registró un cobro parcial, confirmó su aparición en el evento y en la cuenta, completó el saldo y verificó que el evento quedara pagado correctamente.
- Se corrigió la edición de fechas de eventos: los valores antiguos de `start` y `end` ya no sobrescriben la fecha nueva y el calendario prioriza `fecha`, `fechaFin`, `hora` y `horaFin`. La corrección fue compilada y publicada en Firebase Hosting.
- Se normalizó la presentación de movimientos: tipo, concepto y descripción ahora aparecen en columnas separadas en movimientos generales, detalle de cuenta y ficha del cliente. El concepto escrito al registrar un cobro se muestra sin ser reemplazado por “Cobro de evento”. Cambio publicado en Firebase Hosting.
- Se agregó el comprobante público de cobro. Al tocar la fecha de un cobro se abre una ventana nueva con dos copias (cliente y comercio), preparada para imprimir en A4. Incluye acciones para imprimir, copiar el enlace y compartir por WhatsApp. El enlace se puede abrir sin iniciar sesión y solo expone los datos del comprobante; no permite listar comprobantes. Si el cobro se anula, el comprobante público queda marcado como anulado. Reglas y Hosting publicados.

### Pendiente para la próxima sesión

- Revisar visualmente con una sesión autenticada las pantallas modificadas en computadora y celular.
- Revisar visualmente el resto de las pantallas modificadas en computadora y celular.
- Continuar con la revisión visual general en computadora y celular sobre la versión publicada.
- Las reglas nuevas de Firestore y Firebase Hosting se desplegaron el 13 de julio de 2026. La anulación y el circuito de cobro parcial/completo quedaron verificados.

## Cierre del 12 de julio de 2026 - segunda sesión

- La aplicación quedó publicada en `https://salon-eventos-ef008.web.app` mediante Firebase Hosting.
- Se configuró Hosting para React SPA y se desactivó la caché de `index.html`.
- Se creó el módulo de clientes en Firestore, con alta, búsqueda, estado y acceso a WhatsApp.
- Se agregó la ficha del cliente con pestañas de eventos y movimientos vinculados.
- Crear y editar evento comparten el mismo formulario y diseño.
- El formulario de eventos incluye nombre obligatorio, cliente guardado, fechas, horarios, escuela, detalles, notas, prestadores y finanzas.
- Las escuelas se administran desde Configuración usando Firestore; permiten editar, habilitar, deshabilitar, eliminar y ver cantidad de usos.
- El calendario muestra el nombre del evento y colores por porcentaje pagado: 0%, 25%, 50%, 75% y 100%; cancelados en rojo.
- Los teléfonos del detalle del evento y de clientes abren WhatsApp.
- Se mejoró la vista móvil del calendario y se conservaron Año, Mes, Semana, Día y Lista.
- La barra superior se restauró al formato original solicitado por el usuario.
- Se corrigió el idioma del documento a español para evitar traducciones y textos duplicados.
- `npm run lint`: aprobado.
- `npm run build`: aprobado; continúa solamente la advertencia conocida del bundle mayor a 500 KB.
- Firestore Rules y Firebase Hosting quedaron desplegados.

**Punto para retomar mañana:** revisar desde computadora y celular la barra superior y las vistas del calendario. Después continuar con las mejoras que indique el usuario.

**Ultimo guardado:** 12 de julio de 2026, al finalizar la sesion.

**Punto exacto para retomar:** revisar visualmente en el navegador todas las rutas luego de la unificacion de diseño Fun Space. Despues, probar un cobro de evento y comprobar que el nombre del usuario aparezca tanto en el historial del evento como en los movimientos de la cuenta seleccionada. Luego decidir si se implementa anulacion de cobros o el futuro modulo de bebidas.

## Actualizacion visual del 12 de julio de 2026

- Se revisaron las rutas y se detecto que varias pantallas conservaban el diseño azul anterior.
- Se unificaron las rutas con la identidad visual de Fun Space.
- El morado `#4E2581` reemplazo al azul heredado como color principal.
- Se conservaron el celeste `#57B6EE` y el amarillo `#F4D00C` como colores de acento.
- Se normalizaron tipografias Fredoka/Poppins, tarjetas blancas, bordes suaves, sombras moradas y esquinas redondeadas.
- Se actualizaron especialmente Calendario, Mis eventos, Nuevo evento, Editar evento, Prestadores, Escuelas, Etiquetas, Tipos de eventos, Tipos de movimientos y Nuevo tipo de movimiento.
- Tambien se eliminaron restos azules del Navbar y Sidebar.
- Se conservaron los colores semanticos de estados: verde para pagos o acciones positivas y rojo para cancelaciones o acciones peligrosas.
- La logica funcional no fue modificada durante esta unificacion visual.
- `npm run lint`: aprobado, 0 errores.
- `npm run build`: aprobado.
- Continua solamente la advertencia conocida del bundle mayor a 500 KB; no impide funcionar.

## Como retomar en un chat nuevo

Decir: **"Abri el proyecto salon-eventos y lee CONTINUAR_PROYECTO.md. Continuemos desde ahi."**

Proyecto local: `C:\Users\muke_\OneDrive\Desktop\salon-eventos`

## Identidad visual acordada

- Marca: Fun Space - Diversion Asegurada.
- Morado principal: `#4E2581`.
- Celeste: `#57B6EE`.
- Amarillo: `#F4D00C`.
- Tipografias: Fredoka para titulos y Poppins para textos.
- Estilo moderno, alegre, infantil, profesional, con tarjetas redondeadas y sombras suaves.
- El usuario aprobo esta direccion visual.

## Decisiones funcionales

- El sistema administra un solo salon.
- La moneda es exclusivamente pesos argentinos (`ARS`).
- Un cobro nunca puede superar el saldo pendiente del evento.
- Los permisos se administran por rol y tambien individualmente.
- Los registros financieros no se eliminan fisicamente; en el futuro se anulan.
- Firestore debe ser la fuente de verdad de los datos operativos.

## Administrador inicial

- Correo autorizado: `nahuel@hui.com`.
- Firebase CLI quedo autenticado con acceso al proyecto `salon-eventos-ef008`.
- Las reglas de Firestore se validaron y desplegaron.

## Usuarios, roles y permisos

- Rutas:
  - `/usuarios`: tabla de usuarios con busqueda, alta, edicion y habilitar/deshabilitar.
  - `/usuarios-permisos`: asignacion detallada de roles y permisos.
- Roles base: `admin` y `empleado`.
- Los permisos individuales se guardan en `usuarios/{uid}`.
- Menu lateral de configuracion redisenado con Gestion de usuarios y Roles y permisos.

## Cuentas

- Las cuentas usan Firestore (`cuentas`).
- Guardan saldo inicial, saldo actual, moneda ARS, estado y auditoria.
- La lista muestra saldo total, cuentas activas e inactivas.
- Al hacer clic en el nombre de una cuenta se abre `/cuentas/{id}`.
- El detalle muestra solamente los movimientos de esa cuenta, incluyendo transferencias entrantes y salientes.
- Se puede filtrar por fechas y tipo de movimiento.

## Movimientos financieros

- Los movimientos ya no se guardan en `localStorage`; usan Firestore (`movimientos`).
- Ingresos: aumentan el saldo de la cuenta.
- Egresos: descuentan saldo y validan fondos suficientes.
- Transferencias: actualizan simultaneamente origen y destino.
- Todo se ejecuta mediante transacciones de Firestore.
- Se vinculan mediante IDs de cuenta, no nombres.
- Los movimientos nuevos guardan nombre, correo y UID del usuario que los creo.
- Los registros antiguos pueden mostrar solamente el UID abreviado.

## Cobros de eventos

- En Registrar cobro se mantienen las opciones de porcentaje: 25%, 50%, 75% y 100%.
- Elegir un porcentaje calcula el monto automaticamente como antes.
- Se muestran las cuentas activas para seleccionar cual recibe el dinero.
- En el selector se muestra solamente el nombre de la cuenta, no su saldo.
- El saldo pendiente del evento sigue visible.
- Al confirmar, una transaccion:
  1. crea el cobro en `cobros`;
  2. crea un movimiento de ingreso;
  3. aumenta el saldo de la cuenta elegida;
  4. actualiza cobrado y saldo del evento;
  5. marca el evento pagado si el saldo llega a cero.
- Los cobros nuevos guardan nombre, correo y UID del usuario.

## Detalle del evento

- La pantalla se reorganizo en secciones separadas:
  1. informacion basica y contabilidad;
  2. servicio contratado;
  3. prestadores;
  4. movimientos y cobros.
- El resumen muestra precio total, cobrado, saldo y porcentaje pagado.
- El historial de cobros muestra fecha, concepto, descripcion, cuenta, usuario y monto.
- A futuro se agregara un modulo de venta de bebidas para los padres. Todavia no implementarlo sin confirmacion.

## Reglas y seguridad

- Archivos: `firestore.rules`, `firebase.json`, `firestore.indexes.json`.
- Reglas desplegadas al proyecto `salon-eventos-ef008`.
- Validan usuarios activos, roles y permisos.
- Validan transacciones de movimientos y cobros.
- Solo se permiten montos positivos y moneda ARS.

## Estado tecnico

- `npm run lint`: aprobado, 0 errores.
- `npm run build`: aprobado.
- Persiste una advertencia de Vite porque el bundle supera 500 KB; no impide funcionar.
- El servidor local suele ejecutarse en `http://127.0.0.1:5173`.

## Archivos principales modificados

- `src/components/Login.jsx`
- `src/components/Navbar.jsx`
- `src/components/Usuarios.jsx`
- `src/components/UsuariosPermisos.jsx`
- `src/components/Cuentas.jsx`
- `src/components/CuentaDetalle.jsx`
- `src/components/NuevoMovimiento.jsx`
- `src/components/MisMovimientos.jsx`
- `src/components/RegistrarCobro.jsx`
- `src/components/EventoDetalle.jsx`
- `src/services/usuarios.js`
- `src/services/cuentas.js`
- `src/services/movimientos.js`
- `src/services/cobros.js`
- `src/config/permisos.js`
- `src/hooks/useUserRole.js`
- `src/index.css`
- `firestore.rules`

## Proximos pasos posibles

1. Probar un cobro real y confirmar que aparece en el evento y en la cuenta seleccionada.
2. Crear el flujo de anulacion de cobros solo para administradores.
3. Migrar tipos de movimientos desde `localStorage` a Firestore.
4. Agregar el modulo de bebidas/punto de venta cuando el usuario lo solicite.
5. Optimizar el bundle con carga diferida de rutas.

## Cierre de la ultima sesion

- El usuario confirmo que desea pausar el trabajo por limite de tiempo y continuar mas tarde.
- Todo el avance funcional, visual y de seguridad de esta sesion esta registrado en este archivo.
- No quedan despliegues de reglas pendientes de esta sesion.
- Al retomar, primero leer este archivo completo antes de modificar el proyecto.
