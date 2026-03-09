# Paso 19 - Sprint 1 - Dia 3 - Topologia de servicios y flujos `/cnp`, `/api`, `/socket.io` (`A.2.3.2`)

Fecha: 2026-03-04  
Estado: Ejecutado - Confirmado por el usuario (2026-03-04)

## 1) Objetivo del paso

Definir topologia objetivo y flujo de trafico para:

- Frontend en `/cnp`
- API en `/api`
- WebSocket en `/socket.io`

con consistencia entre backend, frontend, proxy y entornos.

## 2) Topologia objetivo por componentes

Componentes logicos:

1. `cnp-nginx` (edge/proxy publico)
2. `cnp-frontend` (artefacto estatico React/Vite)
3. `cnp-backend` (API Express + Socket.IO)
4. `sqlserver-institucional` (externo, fuera de Docker Compose)

Topologia de red objetivo:

- Red publica:
  - expone solo `cnp-nginx`
- Red interna de app:
  - `cnp-nginx` <-> `cnp-frontend`
  - `cnp-nginx` <-> `cnp-backend`
- Red externa institucional:
  - `cnp-backend` -> `sqlserver-institucional:1433`

## 3) Canonical routing definido

Rutas publicas canonicas:

- `/cnp/` -> frontend
- `/api/` -> backend API
- `/socket.io` -> backend Socket.IO

Compatibilidad requerida adicional:

- `/cnp/socket.io` debe ser soportado en proxy por compatibilidad con frontend en modo PROD actual.

Motivo:

- Frontend PROD usa `path = /cnp/socket.io`.
- Backend por defecto escucha `SOCKETIO_PATH = /socket.io`.
- El proxy debe alinear ambos extremos para evitar fallas de handshake.

## 4) Mapeo de rutas (publico -> interno)

| Ruta publica | Destino interno | Observacion |
|---|---|---|
| `/cnp/` | `cnp-frontend` | app SPA y assets |
| `/api/*` | `cnp-backend:3000` | API HTTP |
| `/socket.io/*` | `cnp-backend:3000/socket.io/*` | Socket.IO canonico |
| `/cnp/socket.io/*` | `cnp-backend:3000/socket.io/*` | compatibilidad PROD actual |

Regla de proxy WebSocket:

- Habilitar `Upgrade` y `Connection: upgrade`.
- Mantener `X-Forwarded-*` para trazabilidad de IP/origen.

## 5) Flujo funcional por canal

### 5.1 Flujo frontend (`/cnp`)

1. Navegador -> `cnp-nginx` -> `location /cnp/`
2. Nginx entrega SPA (React/Vite)
3. Rutas internas de SPA resueltas por fallback a `index.html`

### 5.2 Flujo API (`/api`)

1. Frontend llama `/api/*`
2. `cnp-nginx` reenvia a `cnp-backend:3000`
3. Backend procesa con prefijos configurables:
   - `BASE_PATH`
   - `API_PREFIX`
4. Respuesta retorna por `cnp-nginx` al cliente

### 5.3 Flujo WebSocket (`/socket.io`)

1. Frontend inicia handshake Socket.IO
2. `cnp-nginx` enruta a backend con headers de upgrade
3. Backend mantiene sesion Socket.IO en path interno definido
4. Eventos bidireccionales se mantienen sobre conexion persistente

## 6) Politica de exposicion por entorno

### DEV

- Puede existir exposicion directa temporal del backend para debugging controlado.
- Canonico recomendado: mantener acceso por proxy para no divergir de STAGING/PROD.

### STAGING

- Exposicion publica: solo `cnp-nginx`.
- `cnp-backend` y `cnp-frontend` en red interna.
- Validacion obligatoria de `/cnp`, `/api`, `/socket.io` antes de promover.

### PRODUCCION

- Exposicion publica: solo `cnp-nginx`.
- Backend no expuesto directamente.
- TLS, control de cabeceras y limites de trafico aplicados en edge.

## 7) Decisiones tecnicas vinculantes de este punto

1. SQL Server institucional se mantiene como servicio externo obligatorio.
2. Rutas publicas oficiales de la plataforma:
   - `/cnp`
   - `/api`
   - `/socket.io`
3. Compatibilidad con `/cnp/socket.io` se conserva por transicion controlada.
4. El proxy Nginx objetivo debe incorporar explicitamente rutas `/api` y Socket.IO (actualmente ausentes en configuracion vigente del repo).

## 8) Riesgos y controles inmediatos

Riesgos:

- Divergencia de path Socket.IO entre frontend y backend.
- Configuracion Nginx actual sin proxy `/api` ni `/socket.io`.
- Rutas absolutas Windows en Nginx actual no portables a contenedor.

Controles:

- Definir mapeo canonico + compatibilidad en este paso.
- Implementar proxy de API/WebSocket en sprint de dockerizacion.
- Sustituir rutas absolutas por rutas portables en imagen/contenedor.

## 9) Criterio de cierre del punto `A.2.3.2`

- [x] Topologia objetivo de servicios definida.
- [x] Flujo `/cnp`, `/api`, `/socket.io` documentado.
- [x] Politica de exposicion por entorno definida.
- [x] Riesgos de ruteo y compatibilidad identificados con control.
- [x] `Confirmado` del usuario recibido y `A.2.3.2` marcado en el plan.
