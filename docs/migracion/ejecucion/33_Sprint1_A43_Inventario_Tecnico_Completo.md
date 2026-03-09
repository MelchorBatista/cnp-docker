# Paso 33 - Sprint 1 - Validacion DoD `A.4.3` Inventario tecnico completo sin pendientes criticos

Fecha: 2026-03-09
Estado: Ejecutado - Pendiente de confirmacion del usuario

## 1) Objetivo

Validar si el inventario tecnico del Sprint 1 puede considerarse completo y sin pendientes criticos para efectos del DoD `A.4.3`, usando evidencia historica y el estado actual real del repositorio.

## 2) Evidencias base consideradas

Documentos previos del Sprint 1:

- `10_Sprint1_Dia2_A221_Inventario_Tecnico.md`
- `19_Sprint1_Dia3_A232_Topologia_Servicios_Flujos.md`
- `20_Sprint1_Dia3_A233_Documento_Stack_Tecnicas_Arquitectura.md`
- `29_Sprint1_Dia5_A253_Prerequisitos_Locales_Dual_SQL.md`
- `30_Sprint1_Dia5_A255_Actualizacion_Decision_GoNoGo.md`

Fuentes primarias del repositorio actual:

- `backend/server.ts`
- `backend/config/configuracionBases.ts`
- `backend/package.json`
- `frontend/vite.config.ts`
- `frontend/package.json`
- `docker-compose.staging.yml`
- `docs/migracion/operaciones/Runbook_Entrega_Local_Infraestructura_STAGING.md`

## 3) Inventario tecnico consolidado

### 3.1 Servicios identificados

- `backend`
  - API Express + Socket.IO
  - entrada principal: `backend/server.ts`
- `frontend`
  - SPA React + Vite
  - configuracion principal: `frontend/vite.config.ts`
- `proxy`
  - representado en el contrato de despliegue por el servicio `proxy` de `docker-compose.staging.yml`
  - imagen objetivo: `cnp-proxy:staging`
- SQL Server institucional externo
  - `VALIDACION`
  - `CONSULTA`
  - `RECEPCION`

### 3.2 Hosts y roles operativos identificados

- `c1491`
  - WebServer administrado por infraestructura
- `q1491n2023`
  - host de `VALIDACION`
  - base objetivo: `TablasComunes`
  - rol: solo lectura
- `d1491n2023`
  - host de `CONSULTA`
  - base objetivo: `DBCSASPv2`
  - rol: solo lectura operativa sobre vistas
- `d1491n2023`
  - host de `RECEPCION`
  - base objetivo: `DBCSASPv2`
  - rol: lectura/escritura

### 3.3 Puertos y rutas tecnicas identificadas

- backend
  - puerto: `PORT || SERVER_PORT || 3000`
  - healthcheck: `/health`
  - prefijos configurables:
    - `BASE_PATH`
    - `API_PREFIX`
    - `SOCKETIO_PATH`
- frontend
  - basepath Vite: `VITE_BASEPATH`
  - proxy DEV hacia backend por `/api`
- proxy STAGING
  - expone `80/443`
  - contrato de rutas:
    - `/cnp`
    - `/api`
    - `/socket.io`
    - `/cnp/socket.io`
- SQL Server institucional
  - puerto objetivo: `1433`

### 3.4 Variables y contrato de configuracion identificados

Backend:

- runtime:
  - `NODE_ENV`
  - `PORT`
  - `SERVER_PORT`
  - `TRUST_PROXY`
- ruteo:
  - `BASE_PATH`
  - `API_PREFIX`
  - `SOCKETIO_PATH`
  - `FRONTEND_URL`
  - `CORS_ORIGINS`
  - `CSRF_ORIGINS`
- SQL dual/triple:
  - `DB_SERVER_VALIDACION`
  - `DB_PORT_VALIDACION`
  - `VALIDACION_DATABASE`
  - `DB_AUTH_VALIDACION`
  - `DB_USER_VALIDACION`
  - `DB_PASSWORD_VALIDACION`
  - `DB_SERVER_CONSULTA`
  - `DB_PORT_CONSULTA`
  - `CONSULTA_DATABASE`
  - `DB_AUTH_CONSULTA`
  - `DB_USER_CONSULTA`
  - `DB_PASSWORD_CONSULTA`
  - `DB_SERVER_RECEPCION`
  - `DB_PORT_RECEPCION`
  - `RECEPCION_DATABASE`
  - `DB_AUTH_RECEPCION`
  - `DB_USER_RECEPCION`
  - `DB_PASSWORD_RECEPCION`
- SQL comun:
  - `SQL_ENCRYPT`
  - `SQL_TRUST_SERVER_CERTIFICATE`
- SMTP/JWT y operacion:
  - `SMTP_*`
  - `JWT_*`
  - `RATE_LIMIT_*`
  - `LOG_LEVEL`
  - `FILE_UPLOAD_MAX_MB`

Frontend:

- `VITE_BASEPATH`
- `VITE_BACKEND_URL`
- `VITE_DEV_BACKEND_PORT`
- `VITE_API_BASE_URL`

### 3.5 Dependencias principales identificadas

Backend (`backend/package.json`):

- Node `>=24.0.0 <25`
- Express `^4.21.2`
- Socket.IO `^4.8.1`
- `mssql` `^11.0.1`
- `msnodesqlv8` `^5.1.5`
- `jsonwebtoken` `^9.0.2`
- `nodemailer` `^6.10.0`

Frontend (`frontend/package.json`):

- Node `>=24.0.0 <25`
- React `^18.3.1`
- React Router DOM `^7.1.3`
- Redux Toolkit `^2.5.0`
- Axios `^1.8.4`
- Socket.IO Client `^4.8.1`
- Vite `^6.3.6`

## 4) Hallazgos historicos ya supersedidos

El Paso 10 fue una fotografia temprana del 2026-03-04. Dos observaciones de ese documento ya no constituyen pendiente critico de inventario:

1. `Docker` y `WSL` no estaban disponibles en la sesion observada en ese momento.
   - Esto quedo supersedido por:
     - `15_Sprint1_Dia2_A226_Evidencia_WSL_Docker_OK.md`
     - `29_Sprint1_Dia5_A253_Prerequisitos_Locales_Dual_SQL.md`
     - `30_Sprint1_Dia5_A255_Actualizacion_Decision_GoNoGo.md`
2. La referencia a `nginx/conf/nginx.conf` no coincide con el arbol actual del repositorio.
   - El inventario vigente del proxy queda representado por:
     - `docker-compose.staging.yml`
     - `Runbook_Entrega_Local_Infraestructura_STAGING.md`
   - Por tanto, no hay un hueco de descubrimiento; hay un cambio en la forma del artefacto inventariado.

## 5) Evaluacion de pendientes criticos

Para `A.4.3`, un pendiente critico seria cualquiera de estos casos:

- servicio principal sin identificar
- host SQL o rol operativo ambiguo
- rutas publicas o puertos objetivo sin documentar
- dependencia principal sin fuente verificable
- configuracion de conexiones institucionales sin contrato trazable

Resultado de la evaluacion:

- No hay servicios principales sin inventariar.
- No hay ambiguedad vigente en `VALIDACION`, `CONSULTA` y `RECEPCION`.
- Las rutas `/cnp`, `/api`, `/socket.io` y `/cnp/socket.io` estan documentadas.
- Las dependencias principales de backend y frontend tienen fuente verificable en `package.json`.
- El contrato tecnico del proxy esta identificado a nivel de servicio/imagen/compose aunque el repo actual no incluya un `nginx.conf` versionado.

## 6) Conclusion

El inventario tecnico puede considerarse completo y sin pendientes criticos para efectos del DoD `A.4.3`, porque ya existe trazabilidad suficiente sobre:

- servicios
- hosts
- puertos
- rutas
- variables
- dependencias
- topologia SQL institucional

Los riesgos o trabajos abiertos restantes del Sprint 1 no invalidan este punto porque corresponden a seguridad, prerrequisitos externos o continuidad de despliegue, no a ausencia de inventario tecnico.

## 7) Estado frente al plan

- `A.4.3`: listo para marcar con `#` en `Migracion_Docker.ini` cuando el usuario confirme.
- No se modifican otros puntos DoD en este paso.
