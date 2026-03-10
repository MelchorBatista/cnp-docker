# 47. Sprint 2 - B.2.3.1 Externalizar variables y eliminar localhost hardcodeado critico

Fecha de cierre tecnico: 2026-03-10
Responsable: Codex
Estado: Resuelto a nivel tecnico y documental, pendiente de confirmacion del usuario para marcar `Migracion_Docker.ini`.

## Objetivo

Eliminar dependencias criticas a `localhost` en backend y frontend, dejando el contrato de URLs externalizado por variables y compatible con:

- Docker DEV/STAGING
- Vite local con proxy explicito
- despliegue IIS con `web.config` parametrizable

## Cambios aplicados

### Backend

- [backend/middleware/csrfOrigin.ts](/c:/Desarrollo/cnp-docker/backend/middleware/csrfOrigin.ts) deja de inyectar `http://localhost:5173` y `http://127.0.0.1:5173` como orígenes permitidos por defecto.
- [backend/middleware/csrfOrigin.ts](/c:/Desarrollo/cnp-docker/backend/middleware/csrfOrigin.ts) recalcula los orígenes permitidos en tiempo de ejecución, evitando congelarlos antes de cargar variables de entorno.
- [backend/controllers/userController.ts](/c:/Desarrollo/cnp-docker/backend/controllers/userController.ts) elimina los fallbacks `http://localhost:3000` y `http://localhost:5173`.
- [backend/controllers/userController.ts](/c:/Desarrollo/cnp-docker/backend/controllers/userController.ts) construye:
  - enlaces públicos de confirmación desde `BACKEND_URL` o `FRONTEND_URL + API_PREFIX`
  - redirecciones al frontend desde `FRONTEND_URL + BASE_PATH`
- [backend/.env.example](/c:/Desarrollo/cnp-docker/backend/.env.example) deja de mezclar variables `VITE_*` y documenta `BACKEND_URL` como opcional.

### Frontend

- [frontend/src/components/AutenticaDO.tsx](/c:/Desarrollo/cnp-docker/frontend/src/components/AutenticaDO.tsx) reemplaza el fallback `http://localhost:3000/api` por `API_BASE_URL` relativo o externalizado.
- [frontend/src/components/AutenticaDO.tsx](/c:/Desarrollo/cnp-docker/frontend/src/components/AutenticaDO.tsx) reemplaza el enlace fijo a `http://localhost:5173/solicitar-acceso` por una ruta construida desde `BASE_URL`.
- [frontend/src/components/Asignaciones.tsx](/c:/Desarrollo/cnp-docker/frontend/src/components/Asignaciones.tsx) deja de depender de `VITE_BACKEND_URL` hardcodeado y usa `buildApiUrl(...)`.
- [frontend/src/services/apiClient.ts](/c:/Desarrollo/cnp-docker/frontend/src/services/apiClient.ts) exporta `API_BASE_URL` y `buildApiUrl(...)` como contrato común.
- [frontend/src/utils/socket.ts](/c:/Desarrollo/cnp-docker/frontend/src/utils/socket.ts) elimina el fallback `http://localhost:<port>` y usa `VITE_SOCKET_URL`, `VITE_BACKEND_URL` o mismo origen con proxy de Vite.
- [frontend/src/App.tsx](/c:/Desarrollo/cnp-docker/frontend/src/App.tsx) monta `BrowserRouter` con `basename` derivado de `BASE_URL`, alineando redirecciones y rutas con `/cnp`.
- [frontend/vite.config.ts](/c:/Desarrollo/cnp-docker/frontend/vite.config.ts) elimina el fallback a `localhost`, exige `CNP_DEV_BACKEND_ORIGIN` o `VITE_BACKEND_URL` para `npm run dev`, y agrega proxy websocket para `/socket.io`.
- [frontend/.env.example](/c:/Desarrollo/cnp-docker/frontend/.env.example) documenta el contrato de variables del frontend.

### IIS / web.config

- [frontend/public/web.config.template](/c:/Desarrollo/cnp-docker/frontend/public/web.config.template) sustituye el upstream fijo por el token `__IIS_BACKEND_UPSTREAM__`.
- [frontend/scripts/render-web-config.mjs](/c:/Desarrollo/cnp-docker/frontend/scripts/render-web-config.mjs) genera [frontend/public/web.config](/c:/Desarrollo/cnp-docker/frontend/public/web.config) desde plantilla.
- [frontend/package.json](/c:/Desarrollo/cnp-docker/frontend/package.json) ejecuta ese render antes del build.
- El upstream queda externalizado por `IIS_BACKEND_UPSTREAM`, con fallback no-local `http://backend:3000`.

### Compose / contrato de despliegue

- [docker-compose.staging.yml](/c:/Desarrollo/cnp-docker/docker-compose.staging.yml) incorpora `BACKEND_URL` como variable opcional del backend para enlaces públicos.

## Validacion ejecutada

- Backend `typecheck` OK:
  - [47A_Typecheck_Backend_B231_20260310_110508.log](/c:/Desarrollo/cnp-docker/docs/migracion/ejecucion/47A_Typecheck_Backend_B231_20260310_110508.log)
- Frontend `build` OK:
  - [47B_Build_Frontend_B231_20260310_110508.log](/c:/Desarrollo/cnp-docker/docs/migracion/ejecucion/47B_Build_Frontend_B231_20260310_110508.log)
- Barrido de `localhost` critico en codigo/configuracion relevante:
  - [47C_Barrido_Localhost_Critico_B231_20260310_110508.log](/c:/Desarrollo/cnp-docker/docs/migracion/ejecucion/47C_Barrido_Localhost_Critico_B231_20260310_110508.log)
  - resultado: sin coincidencias criticas fuera de healthchecks internos

## Exclusiones intencionales

Los `127.0.0.1` restantes en [backend/Dockerfile](/c:/Desarrollo/cnp-docker/backend/Dockerfile), [frontend/Dockerfile](/c:/Desarrollo/cnp-docker/frontend/Dockerfile) y [proxy/Dockerfile](/c:/Desarrollo/cnp-docker/proxy/Dockerfile) se mantienen por ser `HEALTHCHECK` internos del contenedor, no dependencias de red del entorno.

## Conclusión

`B.2.3.1` puede considerarse cumplido. El código ya no depende de `localhost` para URLs críticas de aplicación, el contrato de variables quedó externalizado y la validación técnica pasó en backend y frontend.

El siguiente punto natural queda siendo `B.2.3.2`, donde corresponde consolidar la matriz de variables validada como evidencia formal del contrato.
