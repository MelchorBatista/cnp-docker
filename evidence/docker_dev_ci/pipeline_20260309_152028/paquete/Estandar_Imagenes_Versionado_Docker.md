# Estandar de imagenes y versionado Docker

Fecha base: 2026-03-09
Estado: Vigente para Sprint 2 (`B.2.1.1`)

## 1) Objetivo

Definir el estandar obligatorio de:

- naming de imagenes
- tags de trazabilidad y promocion
- familias de base images
- reglas minimas de build para backend, frontend y proxy

Este documento aplica a DEV, STAGING y PRODUCCION salvo que un runbook de entorno agregue una restriccion adicional.

## 2) Naming oficial de imagenes

Nombres canonicos:

- `cnp-backend`
- `cnp-frontend`
- `cnp-proxy`

Mapeo compose esperado:

| Servicio compose | Imagen canonica | Proposito |
|---|---|---|
| `backend` | `cnp-backend` | API Express + Socket.IO |
| `frontend` | `cnp-frontend` | SPA React/Vite servida como estatico |
| `proxy` | `cnp-proxy` | borde Nginx para `/cnp`, `/api`, `/socket.io` |

Reglas:

1. No se crean aliases alternos para las imagenes base del proyecto.
2. El nombre del paquete npm no gobierna el nombre de la imagen.
3. Los nombres anteriores deben mantenerse en compose, CI y artefactos exportados.

## 3) Politica de tags

Tags obligatorios por build:

| Tipo de tag | Formato | Uso |
|---|---|---|
| trazabilidad inmutable | `sha-<gitsha7>` | identifica exactamente el commit construido |
| entorno mutable | `dev`, `staging`, `prod` | referencia operativa por entorno controlado |
| version semantica | `v<semver>` | release formal cuando exista version aprobada |

Reglas:

1. Queda prohibido usar `latest`.
2. Un build promovible debe publicar como minimo el tag `sha-<gitsha7>`.
3. Cuando un build se promueve a un entorno, se agrega ademas el tag del entorno (`dev`, `staging` o `prod`).
4. Cuando exista release formal, el mismo digest se etiqueta tambien con `v<semver>`.
5. Los `tar` de entrega local a infraestructura pueden seguir nombre fijo por servicio, pero el `manifest.json` debe registrar el tag inmutable `sha-<gitsha7>`.

Ejemplo de etiquetado para STAGING:

- `cnp-backend:sha-a1b2c3d`
- `cnp-backend:staging`
- `cnp-frontend:sha-a1b2c3d`
- `cnp-frontend:staging`
- `cnp-proxy:sha-a1b2c3d`
- `cnp-proxy:staging`

## 4) Base images permitidas

Familias autorizadas:

| Imagen objetivo | Builder | Runtime | Motivo |
|---|---|---|---|
| `cnp-backend` | `node:24-bookworm-slim` | `node:24-bookworm-slim` | baseline Node 24 del proyecto y compatibilidad Linux/Debian para dependencias SQL |
| `cnp-frontend` | `node:24-bookworm-slim` | `nginx:1.27-alpine` | build Vite con Node 24 y entrega estatica en Nginx |
| `cnp-proxy` | no aplica | `nginx:1.27-alpine` | proxy reverso liviano para `/cnp`, `/api`, `/socket.io` |

Reglas:

1. No se usa `node:latest`, `nginx:latest` ni variantes sin version.
2. En implementacion de Dockerfiles se debe fijar digest o patch concreto sobre estas familias.
3. El backend no debe usar Alpine en Sprint 2.
4. El backend y el proxy se ejecutan como contenedores Linux, no Windows.

## 5) Reglas especificas por servicio

### 5.1 Backend

Obligatorio:

- multi-stage build
- runtime Node 24
- puerto interno `3000`
- soporte de `BASE_PATH`, `API_PREFIX` y `SOCKETIO_PATH`
- configuracion exclusiva por variables de entorno

Restricciones:

1. El contenedor backend para DEV/STAGING/PROD se estandariza sobre autenticacion SQL.
2. No se acepta dependencia de autenticacion Windows dentro del contenedor.
3. No se incorpora ningun motor alterno a SQL Server institucional.

Nota operativa:

- `DB_AUTH_VALIDACION=windows` queda fuera del estandar Docker y solo se considera una condicion historica/transitoria hasta completar la migracion exigida para VALIDACION.

### 5.2 Frontend

Obligatorio:

- multi-stage build
- build con Node 24
- artefacto final estatico
- base path oficial `/cnp/`
- consumo de API por `/api`
- Socket.IO con compatibilidad `/socket.io` y `/cnp/socket.io`

### 5.3 Proxy

Obligatorio:

- Nginx como borde unico expuesto
- rutas publicas soportadas:
  - `/cnp`
  - `/api`
  - `/socket.io`
  - compatibilidad `/cnp/socket.io`
- soporte de cabeceras `Upgrade` y `Connection` para WebSocket

## 6) Estandar de artefactos derivados

Nombres de exportacion local:

- `cnp-backend.tar`
- `cnp-frontend.tar`
- `cnp-proxy.tar`

Archivos auxiliares obligatorios del paquete:

- `manifest.json`
- `checksums.sha256`
- `docker-compose.<entorno>.yml`
- `Runbook_Entrega_Local_Infraestructura_STAGING.md` cuando aplique entrega a infraestructura

## 7) Metadata minima obligatoria

Cada imagen construida en Sprint 2 debe quedar preparada para incluir etiquetas OCI equivalentes a:

- `org.opencontainers.image.title`
- `org.opencontainers.image.version`
- `org.opencontainers.image.revision`
- `org.opencontainers.image.source`
- `org.opencontainers.image.created`

La implementacion concreta se materializa en `B.2.2`.

## 8) Criterio de cumplimiento

`B.2.1.1` se considera cumplido cuando:

- existe este documento versionado en el repositorio
- naming, tags y base images quedan definidos sin ambiguedad
- el estandar es consistente con el compose STAGING y la arquitectura aprobada
- habilita la construccion de Dockerfiles y pipeline base del Sprint 2
