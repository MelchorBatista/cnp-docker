# Paso 54 - Sprint 2 - Entregable obligatorio: Dockerfiles backend/frontend/proxy (`B.3.2`)

Fecha: 2026-03-10
Estado: Ejecutado - Pendiente de confirmacion del usuario

## 1) Objetivo del paso

Cerrar `B.3.2` como entregable obligatorio del Sprint 2, verificando que el repositorio mantiene versionados y vigentes los Dockerfiles de:

- `backend`
- `frontend`
- `proxy`

junto con sus archivos de soporte minimos para runtime web:

- `frontend/nginx/default.conf`
- `proxy/default.conf.template`

## 2) Base tecnica ya aprobada

La implementacion y validacion inicial de estos Dockerfiles ya habia quedado resuelta en:

- `docs/migracion/ejecucion/43_Sprint2_B221_Dockerfiles_Backend_Frontend_Proxy.md`

Ese paso cubrio:

- diseno e implementacion
- build local real
- smoke temporal del stack
- correcciones tecnicas de backend y proxy

`B.3.2` no rediseña esos Dockerfiles; valida que el entregable obligatorio existe hoy, esta versionado en el repo actual y sigue alineado con el estandar Docker del proyecto.

## 3) Archivos que materializan el entregable

Entregable principal:

- `backend/Dockerfile`
- `frontend/Dockerfile`
- `proxy/Dockerfile`

Archivos de soporte asociados al entregable:

- `backend/.dockerignore`
- `frontend/.dockerignore`
- `frontend/nginx/default.conf`
- `proxy/default.conf.template`

## 4) Revalidacion tecnica ejecutada

Se genero la evidencia nueva:

- `docs/migracion/ejecucion/54A_Validacion_Entregable_Dockerfiles_20260310_143035.log`

La validacion cubrio:

1. confirmacion de que los Dockerfiles y archivos de soporte estan versionados en el repo raiz
2. confirmacion de ausencia de submodules activos
3. `SHA256` de los Dockerfiles y configuraciones asociadas
4. extraccion de instrucciones clave:
   - `FROM`
   - `WORKDIR`
   - `COPY`
   - `EXPOSE`
   - `HEALTHCHECK`
   - `ARG OCI_*`
   - `ENV` operativo relevante
5. inspeccion de las imagenes DEV actuales:
   - `cnp-backend:dev`
   - `cnp-frontend:dev`
   - `cnp-proxy:dev`

## 5) Resultado observado

La evidencia actual confirma:

- `backend/Dockerfile`
  - multi-stage sobre `node:24-bookworm-slim`
  - instala `unixodbc` y `unixodbc-dev`
  - expone `3000`
  - define `HEALTHCHECK` contra `/api/health`
  - ejecuta como `USER node`

- `frontend/Dockerfile`
  - build sobre `node:24-bookworm-slim`
  - runtime `nginx:1.27-alpine`
  - publica artefacto en `/usr/share/nginx/html/cnp/`
  - define `HEALTHCHECK` contra `/healthz`

- `proxy/Dockerfile`
  - runtime `nginx:1.27-alpine`
  - configura variables `PROXY_*` para `/cnp`, `/api`, `/socket.io`
  - copia `default.conf.template`
  - define `HEALTHCHECK` contra `/healthz`

Ademas:

- los tres Dockerfiles siguen presentes como archivos normales del repo raiz
- `git submodule status` no reporta submodules activos
- las imagenes DEV actuales existen localmente y corresponden al baseline vigente del Sprint 2

## 6) Resultado del paso

`B.3.2` puede considerarse resuelto.

El Sprint 2 ya tiene el entregable obligatorio de Dockerfiles para `backend`, `frontend` y `proxy`:

- versionado
- trazable
- con archivos de soporte asociados
- consistente con el estandar de imagenes y con las imagenes DEV actuales

## 7) Conclusion

El siguiente pendiente en secuencia dentro de `B.3` es `B.3.3`.
