# Paso 43 - Sprint 2 - Dockerfiles backend/frontend/proxy (`B.2.2.1`)

Fecha: 2026-03-09
Estado: Ejecutado - Pendiente de confirmacion del usuario

## 1) Objetivo del paso

Disenar, implementar y validar los Dockerfiles base de:

- backend
- frontend
- proxy

alineados con el estandar definido en `B.2.1.1` y con la topologia oficial `/cnp`, `/api`, `/socket.io`.

## 2) Archivos implementados

### Backend

- `backend/Dockerfile`
- `backend/.dockerignore`

### Frontend

- `frontend/Dockerfile`
- `frontend/.dockerignore`
- `frontend/nginx/default.conf`

### Proxy

- `proxy/Dockerfile`
- `proxy/default.conf.template`

## 3) Decisiones tecnicas aplicadas

### 3.1 Backend

- multi-stage build sobre `node:24-bookworm-slim`
- toolchain de compilacion en stage de dependencias
- instalacion de `unixodbc` y `unixodbc-dev` para compilar `msnodesqlv8`
- runtime final Node 24 con `USER node`
- healthcheck HTTP contra `/api/health`

### 3.2 Frontend

- build con `node:24-bookworm-slim`
- runtime final `nginx:1.27-alpine`
- publicacion del build en `/cnp/`
- healthcheck HTTP contra `/healthz`
- contrato de build args alineado con variables Vite del proyecto

### 3.3 Proxy

- runtime `nginx:1.27-alpine`
- plantilla Nginx con `envsubst`
- soporte explicito para:
  - `/cnp`
  - `/api`
  - `/socket.io`
  - compatibilidad `/cnp/socket.io`
- healthcheck HTTP contra `/healthz`

## 4) Desvios reales encontrados y correccion

### 4.1 Compilacion Linux del backend

Primer hallazgo:

- la primera build del backend fallo en Linux porque `msnodesqlv8` no encontraba `sql.h`

Evidencia:

- `43A_Docker_Build_Backend_20260309_133015.log`

Causa:

- faltaban headers ODBC en la imagen de build

Correccion aplicada:

- se agregaron `unixodbc` y `unixodbc-dev` al stage de dependencias de `backend/Dockerfile`

Resultado:

- la build del backend quedo exitosa

Evidencia valida final:

- `43A_Docker_Build_Backend_20260309_133308.log`
- `43A_Docker_Build_Backend_20260309_134346.log`

### 4.2 Arranque del backend sin base CONSULTA disponible

Segundo hallazgo:

- el backend podia salir del proceso al arrancar si `CONSULTA` no estaba disponible

Causa:

- `backend/utils/dbPool.ts` abria la conexion a `CONSULTA` en import-time

Correccion aplicada:

- se reemplazo por inicializacion lazy con `getDbPool()`
- se ajustaron:
  - `backend/utils/dbPool.ts`
  - `backend/controllers/nominaResumidaController.ts`
  - `backend/controllers/poderNominaResumidaController.ts`

Resultado:

- el backend ya puede arrancar y quedar `healthy` aunque la base de validacion/consulta no este disponible en la smoke local

### 4.3 Smoke temporal del proxy

Tercer hallazgo:

- una smoke intermedia fallo porque el proxy estaba configurado para resolver `frontend` y `backend`, pero los contenedores temporales se habian levantado como `b221-frontend` y `b221-backend`

Evidencia diagnostica:

- `43D_Docker_Run_Smoke_20260309_134431.log`
- `43E_Docker_Run_Diagnostico_20260309_134234.log`

Correccion aplicada:

- la smoke final se repitio usando alias de red `frontend` y `backend`, que son los nombres canonicos esperados por la imagen del proxy y por `compose`

Resultado:

- la smoke temporal del stack quedo exitosa

Evidencia valida final:

- `43D_Docker_Run_Smoke_20260309_134520.log`

## 5) Resultado de build validado

Imagenes construidas:

| Imagen | Tag validado | Digest | Tamano bytes |
|---|---|---|---:|
| `cnp-backend` | `b221` | `sha256:73ecbcd88cd874862fa911545a28f3ff09be6633c3a2c2f015fb919199cd8934` | `96846112` |
| `cnp-frontend` | `b221` | `sha256:ad48c3122eac249002bf1f887bca05bbbf09ca200b40ea343f26af182c6dc93b` | `21329900` |
| `cnp-proxy` | `b221` | `sha256:0558a79daf2cb8907bbbabb10b152264adb10d3e728a0d09f0e591e2d9937ac9` | `20976235` |

## 6) Resultado de smoke temporal

La validacion efimera en red temporal dejo:

- backend: `running` y `healthy`
- frontend: `running` y `healthy`
- proxy: `running` y `healthy`

Respuestas verificadas por proxy:

- `/healthz` -> `ok`
- `/api/health` -> `200` con payload `{"ok":true,...}`
- `/cnp/` -> `200 OK`

Observacion:

- durante la smoke el backend registro error esperado de conectividad a `VALIDACION` porque se usaron credenciales dummy y no una base real; eso no impidio que el servicio arrancara ni que el healthcheck HTTP quedara en `OK`

## 7) Observaciones no bloqueantes

### Frontend build

La build del frontend emitio advertencias no bloqueantes:

1. chunk principal mayor a 500 kB tras minificacion
2. heuristica de Docker sobre nombres de variables con `SECRET` y `PASSWORD` en build args

Estas observaciones no invalidan `B.2.2.1`, pero deben sanearse despues en:

- variables por entorno (`B.2.3`)
- optimizacion/reduccion de artefactos (`B.4.5` y afinamiento posterior)

## 8) Trazabilidad de repos anidados

`backend` y `frontend` se encuentran como repos anidados dentro del workspace actual.

Implicacion:

- los Dockerfiles y ajustes hechos dentro de esos directorios quedaron aplicados alli
- el repo raiz observa esos cambios como modificacion del directorio embebido

Esto no bloquea el cierre tecnico del punto, pero debe tenerse en cuenta si luego se versionan cambios desde el repo raiz y desde los repos anidados por separado.

## 9) Criterio de cierre del paso

- [x] Existe Dockerfile para backend.
- [x] Existe Dockerfile para frontend.
- [x] Existe Dockerfile para proxy.
- [x] Las tres imagenes construyen en Docker local.
- [x] El backend arranca sin depender de conexion exitosa inmediata a CONSULTA.
- [x] La smoke temporal valida `/healthz`, `/api/health` y `/cnp/`.

## 10) Conclusion

`B.2.2.1` puede considerarse resuelto. Ya existe una base Docker funcional y validada para backend, frontend y proxy, con evidencia de build real, correccion de desvio de arranque en backend y smoke temporal del stack sobre red Docker local.
