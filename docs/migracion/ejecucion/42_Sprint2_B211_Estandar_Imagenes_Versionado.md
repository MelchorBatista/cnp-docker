# Paso 42 - Sprint 2 - Estandar de tags, naming y base images (`B.2.1.1`, `B.2.1.2`)

Fecha: 2026-03-09
Estado: Ejecutado - Pendiente de confirmacion del usuario

## 1) Objetivo del paso

Cerrar el primer punto del Sprint 2 dejando un estandar operativo, versionado y reutilizable para:

- naming oficial de imagenes
- politica de tags
- familias de base images
- restricciones tecnicas de backend, frontend y proxy

## 2) Fuentes revisadas

Codigo y contratos actuales:

1. `backend/package.json`
2. `frontend/package.json`
3. `backend/config/configuracionBases.ts`
4. `backend/server.ts`
5. `frontend/vite.config.ts`
6. `frontend/src/utils/socket.ts`
7. `docker-compose.staging.yml`

Documentacion aprobada de Sprint 1:

1. `docs/migracion/ejecucion/19_Sprint1_Dia3_A232_Topologia_Servicios_Flujos.md`
2. `docs/migracion/ejecucion/20_Sprint1_Dia3_A233_Documento_Stack_Tecnicas_Arquitectura.md`

## 3) Hallazgos que condicionan el estandar

### 3.1 Naming ya convergente

El repositorio ya usa de forma consistente los nombres:

- `cnp-backend`
- `cnp-frontend`
- `cnp-proxy`

Esa convergencia aparece en:

- la arquitectura objetivo aprobada
- la topologia de servicios
- `docker-compose.staging.yml`

### 3.2 Baseline tecnico de Node

Backend y frontend ya exigen `Node >=24 <25` en sus `package.json`.

Ademas, la CI actual de referencia ya prepara `node-version: '24'`.

Conclusion:

- la familia base de Node para Docker debe quedar alineada a `24`

### 3.3 Restriccion real del backend para Docker

`backend/config/configuracionBases.ts` permite:

- autenticacion SQL para VALIDACION, CONSULTA y RECEPCION
- autenticacion Windows solo como caso especial de VALIDACION mediante `mssql/msnodesqlv8`

Eso no puede quedar como dependencia del estandar Docker del Sprint 2 porque:

1. el destino operativo definido para Docker es Linux
2. el propio Sprint 1 ya registro como requisito migrar VALIDACION a autenticacion SQL dedicada antes de la entrega Docker

Conclusion:

- el estandar Docker del backend queda fijado sobre autenticacion SQL
- la autenticacion Windows queda explicitamente fuera del baseline de contenedor

## 4) Decisiones formalizadas

Se creo el documento normativo:

- `docs/migracion/operaciones/Estandar_Imagenes_Versionado_Docker.md`

Contenido vinculante introducido:

1. nombres canonicos de imagen: `cnp-backend`, `cnp-frontend`, `cnp-proxy`
2. prohibicion de `latest`
3. tag inmutable obligatorio `sha-<gitsha7>`
4. tags de entorno `dev`, `staging`, `prod`
5. tag semantico `v<semver>` cuando exista release formal
6. familia `node:24-bookworm-slim` para builder/runtime del backend
7. familia `node:24-bookworm-slim` + `nginx:1.27-alpine` para frontend
8. familia `nginx:1.27-alpine` para proxy
9. exclusiones explicitas:
   - backend en Alpine
   - `latest`
   - autenticacion Windows dentro del contenedor backend

## 5) Operaciones concretas que quedan habilitadas para los siguientes puntos

Este paso tambien baja el Sprint 2 a operaciones mas especificas:

### Para `B.2.2.1`

- crear un Dockerfile multi-stage para backend con runtime Node 24 Debian slim
- crear un Dockerfile multi-stage para frontend con runtime Nginx
- crear Dockerfile del proxy Nginx para `/cnp`, `/api`, `/socket.io`

### Para `B.2.2.2`

- construir cada imagen con tag `sha-<gitsha7>`
- agregar tag de entorno segun promocion
- publicar artefactos exportables `cnp-backend.tar`, `cnp-frontend.tar`, `cnp-proxy.tar`
- dejar CI lista para Hadolint, Trivy y SBOM por imagen

### Para `B.2.3.1` en adelante

- alinear variables del backend con `BASE_PATH`, `API_PREFIX`, `SOCKETIO_PATH`
- alinear frontend con `/cnp`, `/api` y compatibilidad `/cnp/socket.io`
- mantener compose DEV con nombres e imagenes canonicas

## 6) Criterio de cierre del paso

- [x] Existe un documento versionado de estandar.
- [x] Naming, tags y base images quedaron definidos.
- [x] El estandar es coherente con arquitectura, compose STAGING y CI actual.
- [x] Se deja explicitamente fuera del baseline Docker la autenticacion Windows en backend.

## 7) Conclusion

`B.2.1.1` y `B.2.1.2` pueden considerarse resueltos. El Sprint 2 deja de depender de una descripcion general y pasa a tener un estandar operativo concreto para implementar Dockerfiles, pipeline y compose DEV sin ambiguedades.
