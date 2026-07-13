# Fun Space — Salón de eventos

Sistema web para administrar eventos, clientes, calendario, cobros, cuentas, movimientos, prestadores, escuelas, usuarios y permisos de Fun Space.

## Tecnología

- React 19 y Vite 8.
- Firebase Authentication.
- Cloud Firestore con reglas transaccionales.
- Firebase Hosting.
- FullCalendar.

## Desarrollo local

```bash
npm install
npm run dev
```

La aplicación queda disponible normalmente en `http://127.0.0.1:5173`.

## Validaciones

```bash
npm run lint
npm run build
```

Para validar las reglas sin desplegarlas:

```bash
npm exec --yes firebase-tools -- deploy --only firestore:rules --project salon-eventos-ef008 --dry-run --non-interactive
```

## Datos y seguridad

- Firestore es la fuente de verdad de los datos operativos.
- La moneda es exclusivamente ARS.
- Los cobros actualizan evento, cuenta y movimiento en una transacción.
- Los cobros anulados no se eliminan: generan un movimiento inverso con auditoría.
- Las rutas, acciones visibles y reglas respetan permisos de usuario.
- Los datos históricos de configuración guardados localmente se importan una sola vez cuando la colección correspondiente de Firestore está vacía.

## Despliegue

Proyecto Firebase: `salon-eventos-ef008`.

Sitio publicado: `https://salon-eventos-ef008.web.app`.

Consultar `CONTINUAR_PROYECTO.md` antes de retomar el desarrollo.
