# Paso 2 - Sprint 1 - Arquitectura objetivo (A.2.3 / A.1.1 parcial)

Fecha: 2026-02-24  
Estado: Ejecutado - Confirmado por el usuario (2026-02-24)

## 1) Objetivo del paso

Definir y dejar documentada la arquitectura objetivo para Docker en los entornos DEV, STAGING y PRODUCCION, conservando SQL Server institucional como dependencia externa obligatoria.

## 2) Evidencia tecnica levantada del repositorio

### Backend/API (Node + Express + Socket.IO)
- Puerto backend por defecto: `PORT || SERVER_PORT || 3000` (`backend/server.ts:60`).
- API base configurable: `BASE_PATH` + `API_PREFIX` (default `/api`) (`backend/server.ts:87-89`, `backend/server.ts:183-187`).
- Socket.IO path configurable: default `/socket.io` (`backend/server.ts:89`, `backend/server.ts:225-227`).
- Ruta healthcheck disponible: `GET /health` dentro del router API (`backend/server.ts:141`).

### Frontend (React + Vite)
- Basepath por defecto: `/cnp/` (`frontend/vite.config.ts:20-28`, `frontend/vite.config.ts:41`).
- Proxy dev para `/api` activo hacia backend URL/puerto resuelto (`frontend/vite.config.ts:49-56`).
- Socket client:
	- En PROD usa mismo origen con path `/cnp/socket.io` (`frontend/src/utils/socket.ts:42-56`).
	- En DEV usa `VITE_SOCKET_URL` o backend URL/fallback (`frontend/src/utils/socket.ts:57-69`).

### Nginx actual
- Expone `80` (redirect) y `8443` (SSL) (`nginx/conf/nginx.conf:17`, `nginx/conf/nginx.conf:25`).
- Sirve frontend en `/cnp/` (`nginx/conf/nginx.conf:38-42`).
- No tiene proxy actual para `/api` ni `/socket.io` en esta configuracion (`nginx/conf/nginx.conf`).
- Usa rutas absolutas Windows de una ruta anterior `C:/Desarrollo/cnp/...` (`nginx/conf/nginx.conf:28-29`, `nginx/conf/nginx.conf:39`).

### SQL Server institucional
- Conexion via `mssql` con host/usuario/clave/puerto por variables de entorno (`backend/config/connectRecepcion.ts:29-33`, `backend/config/connectConsulta.ts:28-32`, `backend/config/connectValidacion.ts:28-32`).
- Puerto por defecto SQL Server: `1433` en los conectores (`backend/config/connectRecepcion.ts:33`, `backend/config/connectConsulta.ts:32`, `backend/config/connectValidacion.ts:32`).

## 3) Arquitectura objetivo aprobable (propuesta de trabajo)

### 3.1 Topologia objetivo
- `cnp-nginx` (entrypoint)
	- Publica HTTPS y enruta:
		- `/cnp` -> `cnp-frontend`
		- `/api` -> `cnp-backend`
		- `/socket.io` -> `cnp-backend`
- `cnp-frontend`
	- Build estatico React/Vite servido por Nginx interno o artefacto estatico.
- `cnp-backend`
	- API Express + Socket.IO.
	- Sin exposicion publica directa en STAGING/PROD (solo red interna Docker).
- `sqlserver-institucional` (externo, fuera de Docker Compose del proyecto)
	- Unico motor autorizado.
	- Acceso desde `cnp-backend` por red institucional y firewall.

### 3.2 Flujos de red objetivo
- Usuario navegador -> `cnp-nginx:443` -> `/cnp` -> `cnp-frontend`.
- Frontend -> `/api/*` -> `cnp-nginx` -> `cnp-backend:3000`.
- Frontend Socket.IO -> `/socket.io` -> `cnp-nginx` -> `cnp-backend:3000/socket.io`.
- Backend -> SQL Server institucional `DB_SERVER:1433`.

### 3.3 Politica de exposicion por entorno
- DEV:
	- Puede exponerse backend para debugging controlado.
	- Logs mas verbosos y herramientas de desarrollo activas.
- STAGING:
	- Solo `cnp-nginx` expuesto.
	- Backend aislado en red interna.
- PRODUCCION:
	- Solo `cnp-nginx` expuesto.
	- Hardening TLS, rate limiting y politicas estrictas de secretos.

## 4) Brechas detectadas para cerrar en siguientes pasos

- No existen aun `Dockerfile` ni `docker-compose.yml` en el repo.
- `nginx.conf` actual no enruta `/api` ni `/socket.io` (requerido para arquitectura destino).
- `nginx.conf` contiene rutas absolutas Windows de carpeta previa (`C:/Desarrollo/cnp/...`), no aptas para contenedores.
- Debe normalizarse decision de puerto backend (codigo default `3000` vs fallback frontend DEV `28444`).

## 5) Decision tecnica de este paso

- Se aprueba como arquitectura objetivo base:
	- Edge Nginx + Frontend + Backend en contenedores.
	- SQL Server institucional externo obligatorio (sin reemplazo).
	- Rutas canonicas de publicacion: `/cnp`, `/api`, `/socket.io`.

## 6) Checklist de cierre del paso

- [x] Arquitectura objetivo definida para DEV/STAGING/PROD.
- [x] Dependencia obligatoria de SQL Server institucional reafirmada.
- [x] Flujos `/cnp`, `/api` y `/socket.io` documentados.
- [x] Brechas tecnicas registradas para sprints siguientes.
- [x] Confirmado del usuario recibido; paso marcado con `//` en el plan.

## 7) Impacto sobre A.1.1

- Componente "arquitectura objetivo aprobada": preparado para cierre, pendiente confirmacion explicita.
- Componente "backlog priorizado": pendiente (paso posterior).
- Componente "riesgos controlados": pendiente (paso posterior con matriz de riesgos).


