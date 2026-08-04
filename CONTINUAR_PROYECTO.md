# Continuidad del proyecto - Salon de eventos Fun Space

## Avance del 4 de agosto de 2026 - usuarios internos

- Se probó correctamente en producción el envío de cambio de contraseña desde Gestión de usuarios.
- Se probó correctamente el flujo `Olvidé mi contraseña` desde el login y el acceso posterior con la nueva clave.
- Se eliminaron de Firebase Authentication y Firestore los usuarios de prueba; quedó únicamente `muke_1993@hotmail.com` como administrador.
- Se agregó al alta la opción `Usuario interno` para empleados sin correo real.
- El administrador define el nombre de acceso y una contraseña inicial de al menos 8 caracteres.
- El login ahora acepta correo electrónico o nombre de usuario.
- Los usuarios internos no muestran acciones de recuperación por correo; si pierden la clave, debe administrarse desde Firebase Authentication.
- Verificación local: `npm run lint`, `npm run build` y `git diff --check` aprobados.
- Los cambios de usuarios internos se publicaron en Firebase Hosting y se probaron correctamente con un usuario empleado y permisos personalizados.
- El módulo Caja se probó de punta a punta en `caja general`: apertura en $0, ingreso de prueba de $100, egreso compensatorio de $100, cálculo en $0, cierre y consulta histórica.
- La caja cerrada conservó exactamente los dos movimientos y registró correctamente usuario, fecha y hora de apertura y cierre.
- Los cuatro cumpleaños que figuraban pendientes (Valentina, Cielo, Felipe y Camilo) ya habían sido cargados en otra sesión de ChatGPT; no deben volver a cargarse.
- Stock de bebidas se probó con ingresos, conteos, fechas de último ingreso y egreso, ventas, edición por diferencia, anulación y eliminación.
- Se corrigieron las reglas que rechazaban alta, edición y eliminación de ventas de bebidas; los administradores tienen actualización completa de eventos, coherente con su acceso general.
- Al eliminar una venta pendiente, el sistema devuelve el stock, verifica el resultado y ejecuta una reparación idempotente si la devolución no quedó aplicada.
- El usuario confirmó que el stock vuelve correctamente al anular y eliminar una venta.

### Punto exacto para retomar

1. Probar Pago prestadores y verificar el saldo de la cuenta utilizada.
2. Revisar carga de costo y precio de lista si queda algún caso pendiente.
3. Continuar con las mejoras que indique el usuario.

## Cierre del 4 de agosto de 2026

- Se revisó y endureció por completo el módulo de usuarios, roles y permisos.
- Los perfiles se consultan en tiempo real; si un usuario es deshabilitado mientras está conectado, su sesión se cierra.
- Los usuarios deshabilitados o sin perfil reciben un mensaje de acceso claro.
- Los administradores quedaron definidos con acceso completo y ya no muestran permisos individuales engañosos.
- La administración de usuarios permanece reservada exclusivamente a administradores.
- Se impide que un administrador se quite su propio rol desde la interfaz.
- Se corrigió el aviso incorrecto de UID en la pantalla de permisos.
- Si falla la creación del perfil de Firestore, se elimina la cuenta parcial creada en Authentication.
- El alta de usuarios ya no solicita una contraseña visible al administrador: genera una clave interna y envía un correo para que el usuario establezca la suya.
- Se agregó `Olvidé mi contraseña` al login y `Enviar cambio de contraseña` a la tabla de usuarios.
- El login distingue credenciales inválidas, cuenta deshabilitada, bloqueo temporal, problemas de red y perfil sin acceso.
- Se corrigió la regla de Firestore para permitir que un usuario autenticado consulte su propio perfil aunque esté inactivo y así mostrar el motivo correcto.
- Se confirmó que Authentication y la colección `usuarios` son registros separados. Las cuentas creadas manualmente en Authentication no aparecen en Fun Space ni tienen permisos hasta crear/vincular su perfil con el mismo UID.
- Se evaluó una función administrativa para definir contraseñas provisorias, pero requería el plan Blaze. Se retiró completamente junto con sus dependencias; nunca llegó a producción.
- Se mantiene la alternativa gratuita: correos reales, alias de correo, restablecimiento por correo o cambio manual desde Firebase Authentication.
- Firebase Hosting y las reglas de Firestore corregidas quedaron publicados.
- `npm run lint`: aprobado.
- `npm run build`: aprobado.
- `git diff --check`: aprobado.

### Punto exacto para retomar

1. Resolver las cuentas que existen únicamente en Firebase Authentication (`muke_1993@hotmail.com` y posiblemente `matheotori...`): eliminarlas y recrearlas desde Fun Space si no tienen uso, o crear una herramienta gratuita para vincular un UID existente con un perfil de Firestore.
2. Probar en producción el ingreso de un usuario creado desde Fun Space y el flujo `Olvidé mi contraseña`.
3. Continuar con las mejoras que indique el usuario.

## Cierre del 27 de julio de 2026

- Se configuró la duración predeterminada de los eventos en 2 horas y 30 minutos.
- Al elegir la hora de inicio, la hora final se completa automáticamente; si cruza la medianoche, también cambia la fecha final.
- La hora y la fecha finales continúan siendo editables manualmente.
- Se agregó `Configuración > Tipos de cobro`.
- La configuración de cada tipo de cobro quedó vinculada directamente a una cuenta.
- Al seleccionar una cuenta en Registrar cobro, el descuento configurado para esa cuenta se aplica automáticamente, sin elegir un tipo de cobro adicional.
- En cobros divididos, cada cuenta aplica su propio porcentaje sobre la parte del evento que cancela.
- El dinero real aumenta el saldo de la cuenta y el descuento se registra por separado.
- Un pago del 100% con descuento deja el evento completamente pagado y sin saldo pendiente.
- Los descuentos aparecen en el evento, historial y comprobante, y se revierten al anular el cobro.
- Reglas de Firestore y Firebase Hosting publicados.
- `npm run lint`: aprobado.
- `npm run build`: aprobado.
- Commits publicados:
  - `eb55419`: completa automáticamente el horario final.
  - `de382f1`: agrega tipos de cobro con descuentos.
  - `d65d0bd`: corrige el flujo para aplicar descuentos según la cuenta elegida.

### Datos pendientes de cargar desde la imagen

Todos son cumpleaños del año 2026, comienzan a las 16:00 y finalizan automáticamente a las 18:30:

1. Valentina — responsable: Vanesa Bartola — 03/08/2026 — recibo 292650 — efectivo $105.750 — teléfono 3436114753.
2. Cielo — responsable: Elisa Rodríguez — 18/09/2026 — recibo 292854 — efectivo $105.750 — teléfono 3435146429.
3. Felipe — responsable: Laureano Buralli — 10/08/2026 — recibo 293013 — efectivo $423.000 — teléfono 3434199868.
4. Camilo — responsable: Virginia Humoffe — 15/12/2026 — recibo 293349 — efectivo $423.000 — teléfono 3436113756.

Significado de las letras de la planilla: `N` = nuevo, `A` = adelanto y `C` = pago completo.

Antes de confirmar cada cobro se debe seleccionar la cuenta cuyo cálculo automático coincida exactamente con el importe de la imagen. Si ninguna cuenta produce el importe exacto, no registrar el cobro y avisar al usuario.

**Punto exacto para retomar:** reparar o reconectar el navegador integrado Browser, abrir `https://salon-eventos-ef008.web.app`, iniciar sesión y cargar los cuatro clientes, cumpleaños y cobros anteriores. No se cargó todavía ninguno de esos cuatro registros.

## Cierre del 24 de julio de 2026

- Cierre final: se reemplazaron los símbolos del Navbar, menús desplegables y panel de Configuración por íconos uniformes de Lucide.
- Los íconos quedaron publicados en Firebase Hosting y guardados en el commit `2c177cf`.
- Se corrigieron los porcentajes de pago para que el servicio del evento y las bebidas se calculen por separado.
- Los porcentajes del calendario y de Registrar cobro usan solamente el precio y los cobros del servicio.
- Se agregó `Movimientos > Pago prestadores`, con filtros, pagos individuales o masivos, selección de cuenta, egreso automático y trazabilidad.
- Se agregó `Movimientos > Stock de bebidas`, con stock actual y mínimo, ingresos, ajustes, historial y fechas de último ingreso y egreso.
- Las ventas de bebidas descuentan stock; editar una venta aplica la diferencia y eliminarla devuelve las unidades.
- Se impide registrar ventas cuando no hay stock suficiente.
- El editor de listas de precios permite cargar las bebidas del Excel `Control Stock FunSpace compras Junio.xlsx`.
- La carga de junio incluye las 14 bebidas de la tabla aprobada, con `Costo lista` y `Precio lista` separados, y actualiza sin duplicar.
- El ícono de Escuelas en Configuración se unificó con el punto usado por Tipo de eventos.
- Se agregaron reglas de Firestore para pagos a prestadores y movimientos de stock.
- `npm run lint`: aprobado.
- `npm run build`: aprobado.

**Punto exacto para retomar mañana:** probar en producción Pago prestadores y Stock de bebidas con operaciones reales controladas. Verificar especialmente ingreso de stock, venta, edición/eliminación de venta, fechas de ingreso/egreso, carga de costo y precio de lista, y saldo de la cuenta usada para pagar prestadores. Después continuar con las mejoras que indique el usuario.

## Cierre del 20 de julio de 2026

- Se revisaron y cerraron cambios pendientes de seguridad en cobros distribuidos, sincronización de clientes y reglas de Firestore.
- Al registrar un pago general, el concepto se completa como `Cobro tipo de evento (Nombre del evento)` y la descripción muestra fecha y horario completo, por ejemplo `25/07/2026 · 16 hs a 18:30 hs`.
- Este autocompletado no se aplica a los cobros de ventas de bebidas.
- En eventos nuevos se quitó el selector visible de lista de precios. Se asigna automáticamente la lista activa más reciente y se mantiene la selección del servicio.
- Las cuentas ahora pueden editar nombre, descripción, saldo inicial, saldo actual y estado. Los cambios de saldo exigen motivo y crean un movimiento de ajuste trazable.
- El módulo de bebidas quedó dividido en dos pestañas: catálogo completo y bebidas seleccionadas. Las cantidades aparecen únicamente después de elegir los productos.
- Las bebidas seleccionadas pueden quitarse antes de registrar la venta.
- Las ventas de bebidas pendientes pueden editarse o eliminarse individualmente, aunque existan otras ventas cobradas. Las ventas con cobros parciales o completos no se pueden editar ni eliminar.
- Se agregó un módulo de Caja independiente para cada cuenta:
  1. botón `Caja` desde la lista de cuentas;
  2. historial individual de aperturas y cierres;
  3. nueva apertura con fecha, hora y monto;
  4. una sola caja abierta simultáneamente por cuenta;
  5. detalle con los movimientos del período;
  6. cierre con monto calculado, resultado y usuario;
  7. formato horario de 24 horas;
  8. conservación de los movimientos exactos incluidos al cerrar.
- Se reforzaron las reglas de Firestore para edición de cuentas, ajustes de saldo, ventas de bebidas y cajas.
- `npm run lint`: aprobado.
- `npm run build`: aprobado.
- Reglas de Firestore y Firebase Hosting desplegados en `salon-eventos-ef008`.
- Todos los commits quedaron subidos a `origin/main`.

**Punto exacto para retomar:** iniciar una nueva sesión leyendo este archivo. Probar visualmente en computadora y celular el módulo Caja, especialmente apertura, movimientos, cierre y consulta de una caja cerrada. Después continuar con las mejoras que indique el usuario.

## Avance del 14 de julio de 2026 - listas de precios y bebidas

- Se creó el módulo de Listas de precios dentro de Configuración, con listado, alta, edición y habilitar/deshabilitar.
- Cada lista guarda vigencia, descripción, servicios/cumpleaños y bebidas con nombre, presentación, precio y estado.
- Las listas usan Firestore como fuente de verdad mediante la colección `listasPrecios`.
- Nuevo evento y Editar evento permiten asignar una lista y seleccionar un servicio; el precio elegido se copia al evento.
- El detalle del evento incorpora la sección Bebidas, permite elegir cantidades desde la lista asignada y conserva una copia histórica de producto, presentación y precio.
- Registrar una venta de bebidas aumenta el total y el saldo pendiente del evento mediante una transacción.
- Cada venta de bebidas puede cobrarse desde el evento. El cobro puede ingresar en una cuenta o dividirse entre dos cuentas diferentes.
- Los cobros divididos crean un movimiento por cuenta, actualizan ambos saldos y se guardan como una sola operación trazable.
- La anulación de un cobro dividido revierte cada cuenta y movimiento correspondiente.
- El cobro de bebidas muestra todas las cuentas activas con un campo de importe por cuenta; valida distribuido, faltante o excedente y exige coincidencia exacta con el total.
- El comprobante público de bebidas detalla producto, presentación, cantidad, precio unitario, subtotal, total, distribución por cuentas y usuario que registró el cobro.
- Las reglas nuevas de Firestore fueron compiladas y desplegadas al proyecto `salon-eventos-ef008`.
- `npm run lint` y `npm run build`: aprobados.

### Prueba visual pendiente

1. Crear una lista con un servicio y al menos dos bebidas.
2. Crear o editar un evento y asignarle esa lista y servicio.
3. Desde el detalle, agregar bebidas y comprobar el aumento de total y saldo.
4. Cobrar la venta dividiendo el importe entre dos cuentas y verificar ambos movimientos.
5. Anular el cobro dividido con un administrador y confirmar la reversión.

## Cierre del 14 de julio de 2026

- El usuario probó desde computadora y celular el módulo de bebidas y confirmó su funcionamiento visual.
- El cobro de bebidas quedó rediseñado para mostrar todas las cuentas activas con un importe editable por cuenta.
- La pantalla informa total distribuido, faltante o excedente y exige que la suma coincida exactamente con el cobro.
- El comprobante de bebidas muestra productos, presentaciones, cantidades, precios unitarios, subtotales, total y distribución por cuentas.
- Los comprobantes usan numeración correlativa anual con formato `2026-000001`; los anteriores se actualizan al volver a abrirse.
- Los estados de ventas de bebidas usan etiquetas: verde para Pagado, amarillo para Parcial y rojo suave para Pendiente.
- Las ventas pagadas ya no muestran la acción Cobrar bebidas.
- Se incorporó el logo oficial de Fun Space en PNG transparente a comprobantes y pantalla de acceso.
- El logo de acceso quedó ampliado y centrado entre la parte superior y el contenido principal.
- Todas las mejoras se publicaron en Firebase Hosting y las reglas necesarias se desplegaron en Firestore.
- Verificación final: `npm run lint` y `npm run build` aprobados.

**Punto exacto para retomar:** revisar visualmente el logo en los comprobantes impresos y, si está aprobado, continuar con las mejoras que indique el usuario. Los cambios de esta sesión quedaron publicados.

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
- Se corrigió la generación para eventos antiguos que conservan un ID numérico interno: el comprobante ahora utiliza siempre el `eventoId` real vinculado al cobro.
- El botón de WhatsApp del comprobante ahora usa el teléfono guardado en el cliente, lo normaliza para Argentina y abre directamente ese chat con el mensaje y enlace preparados. Los comprobantes generados anteriormente incorporan el teléfono al volver a abrirlos desde la fecha del cobro.
- Las fechas de movimientos vinculados a cobros o anulaciones ahora también abren el comprobante desde la pantalla general de Movimientos y desde el detalle de la cuenta. Las fechas de movimientos manuales y transferencias permanecen como texto normal.

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

## Modulo Balance (13/07/2026)

- Se agrego la ruta `/balance`, visible y accesible solamente para administradores.
- El filtro usa las fechas reales de cobros y movimientos, con rangos rapidos y rango personalizado.
- Los ingresos se calculan con todos los cobros no anulados, sin importar la cuenta.
- La tabla agrupa por tipo de evento y muestra cantidad de eventos cobrados, ingresos, egresos vinculados y ganancia.
- El resumen separa ingresos de eventos, egresos vinculados, otros gastos, inversiones y balance total.
- Se agrego exportacion compatible con Excel para el periodo filtrado.
- Se agrego la categoria `inversion` a movimientos y reglas de seguridad.
- Al crear un egreso se puede vincular opcionalmente a un evento.
- En Mis movimientos, un administrador puede vincular egresos manuales anteriores que todavia no tengan evento; queda registrado quien y cuando hizo la vinculacion.
- Las anulaciones de cobros no se vuelven a descontar como gastos, evitando duplicar su impacto.
- Verificacion local: `npm run lint` y `npm run build` aprobados.
