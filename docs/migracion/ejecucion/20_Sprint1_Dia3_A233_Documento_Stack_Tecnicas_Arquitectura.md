# Paso 20 - Sprint 1 - Dia 3 - Documento integrado de stack + tecnicas + arquitectura (`A.2.3.3`)

Fecha: 2026-03-04  
Estado: Ejecutado - Confirmado por el usuario (2026-03-04)

## 1) Objetivo del paso

Consolidar en un solo documento operativo:

- Stack objetivo del proyecto
- Tecnicas transversales (build, seguridad, calidad, despliegue)
- Arquitectura y topologia por entorno

para habilitar ejecucion consistente de la migracion Docker.

## 2) Fuentes consolidadas

Documentos base usados para integracion:

1. `docs/migracion/ejecucion/10_Sprint1_Dia2_A221_Inventario_Tecnico.md`
2. `docs/migracion/ejecucion/18_Sprint1_Dia3_A231_Tecnicas_Transversales.md`
3. `docs/migracion/ejecucion/19_Sprint1_Dia3_A232_Topologia_Servicios_Flujos.md`
4. Configuracion activa:
   - `backend/package.json`
   - `frontend/package.json`
   - `backend/server.ts`
   - `frontend/vite.config.ts`
   - `frontend/src/utils/socket.ts`
   - `nginx/conf/nginx.conf`
   - `.github/workflows/ci.yml`

## 3) Stack integrado objetivo (catalogo operativo)

### 3.1 Tecnologias de aplicacion

- Backend:
  - Node.js + TypeScript
  - Express 4.x
  - Socket.IO 4.x
  - `mssql` hacia SQL Server institucional
- Frontend:
  - React 18
  - Vite 6
  - TypeScript
  - `socket.io-client` 4.x
- Proxy:
  - Nginx
- Base de datos:
  - SQL Server institucional (externo y obligatorio)

### 3.2 Toolchain base

- Git
- Node.js 24.x (baseline operativo aprobada actual)
- npm
- OpenSSL
- curl
- WSL2 + Docker Desktop para laptop Windows

### 3.3 Toolchain de seguridad

- Trivy
- Hadolint
- Syft (SBOM)

### 3.4 Toolchain de calidad

- ESLint
- Prettier
- Jest (backend)
- TypeScript typecheck

## 4) Tecnicas transversales integradas

### 4.1 Build

- Runtime de referencia en CI: Node.js 24.
- Instalacion deterministica en CI: `npm ci`.
- Compilacion backend: `npm run typecheck` + `npm run build`.
- Compilacion frontend: `npm run build`.
- Objetivo de imagenes: multi-stage build, tags por version y commit.

### 4.2 Seguridad

- Secretos productivos fuera de repositorio.
- Escaneo obligatorio en ciclo tecnico:
  - Trivy
  - Hadolint
  - Syft
- Validacion de disponibilidad/version/PATH en estacion y runner CI.

### 4.3 Calidad

- Gates minimos actuales en backend CI:
  - `npm ci`
  - `npm run typecheck`
  - `npm test --silent`
  - `npm audit --audit-level=moderate || true`
- Estandar de formato/lint:
  - ESLint + Prettier

### 4.4 Despliegue

- Promocion por entornos: DEV -> STAGING -> PRODUCCION.
- Criterio bloqueante: no pasar a PRODUCCION sin evidencia en STAGING.
- Validaciones de salida:
  - `/cnp`
  - `/api`
  - `/socket.io`
- Rollback a version estable previa ante falla de smoke/operacion.

## 5) Arquitectura integrada por entorno

### 5.1 Topologia comun objetivo

1. `cnp-nginx` (entrypoint de borde)
2. `cnp-frontend` (estatico)
3. `cnp-backend` (API + Socket.IO)
4. `sqlserver-institucional` (externo)

### 5.2 Ruteo canonico

- `/cnp/` -> frontend
- `/api/*` -> backend
- `/socket.io/*` -> backend socket

Compatibilidad de transicion:

- Soporte en proxy para `/cnp/socket.io/*` -> backend socket

### 5.3 Exposicion por entorno

- DEV:
  - puede permitir depuracion controlada
  - recomendado mantener patron de proxy para alinear con STAGING/PROD
- STAGING:
  - expuesto solo `cnp-nginx`
  - backend/frontend aislados en red interna
- PRODUCCION:
  - expuesto solo `cnp-nginx`
  - controles TLS y endurecimiento en edge

## 6) Estado consolidado de implementacion (al cierre de `A.2.3.3`)

Implementado y validado:

- Inventario tecnico completo de stack/rutas/configuracion.
- Tecnicas transversales definidas y documentadas.
- Topologia y flujos `/cnp`, `/api`, `/socket.io` definidos.
- Baseline de herramientas en estacion y runner con evidencias.
- WSL2 y Docker Desktop operativos en laptop objetivo.
- Toolchain de seguridad instalada y doble verificada.

Pendientes de sprint para completar Dia 3:

- `A.2.3.4` Configuracion final de VS Code para Docker/WSL.
- `A.2.3.5` Evidencia de extensiones y apertura de workspace sin errores.

## 7) Riesgos tecnicos vigentes

1. Nginx actual del repo no implementa aun proxy para `/api` y `/socket.io`.
2. `nginx.conf` vigente usa rutas absolutas Windows no portables a contenedor.
3. Divergencia historica de Socket.IO (`/cnp/socket.io` vs `/socket.io`) requiere regla de compatibilidad en proxy.
4. Alineacion estricta de Node 24.x en todas las estaciones y en CI debe mantenerse como politica activa.

## 8) Decisiones vinculantes registradas

1. SQL Server institucional no se reemplaza.
2. Rutas publicas oficiales:
   - `/cnp`
   - `/api`
   - `/socket.io`
3. Seguridad de pipeline requiere Trivy + Hadolint + Syft.
4. Salida de entorno superior solo con evidencia de entorno previo.

## 9) Criterio de cierre del punto `A.2.3.3`

- [x] Documento integrado stack + tecnicas + arquitectura consolidado.
- [x] Arquitectura por entorno incluida.
- [x] Decisiones tecnicas vinculantes registradas.
- [x] Riesgos vigentes y pendientes de continuidad declarados.
- [x] `Confirmado` del usuario recibido y `A.2.3.3` marcado en el plan.
