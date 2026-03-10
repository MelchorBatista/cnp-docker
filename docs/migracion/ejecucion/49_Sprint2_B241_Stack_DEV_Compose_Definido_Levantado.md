# Paso 49 - Sprint 2 - Stack DEV con Compose definido y levantado (`B.2.4.1`)

Fecha: 2026-03-10
Estado: Ejecutado - Pendiente de confirmacion del usuario

## 1) Objetivo del paso

Definir un stack DEV reproducible con Docker Compose y dejarlo levantado localmente, alineado a la arquitectura aprobada del proyecto:

- `proxy`
- `frontend`
- `backend`

manteniendo las rutas oficiales:

- `/cnp`
- `/api`
- `/socket.io`
- compatibilidad `/cnp/socket.io`

## 2) Archivos implementados

Se agregaron:

- `docker-compose.dev.yml`
- `scripts/migracion/levantar_stack_compose_dev.ps1`

Y se ajusto:

- `frontend/Dockerfile`

## 3) Decisiones tecnicas aplicadas

### 3.1 Topologia DEV

`docker-compose.dev.yml` define los tres servicios canonicos:

1. `backend`
2. `frontend`
3. `proxy`

con dos redes:

- `red_publica`
- `red_aplicacion` (`internal: true`)

La exposicion al host queda solo en el proxy:

- `8080 -> 80` por defecto

### 3.2 Politica de build local

El compose DEV no depende de `docker load` previo ni de imagenes externas del proyecto.

Cada servicio construye localmente desde su contexto:

- `./backend`
- `./frontend`
- `./proxy`

y publica como:

- `cnp-backend:dev`
- `cnp-frontend:dev`
- `cnp-proxy:dev`

### 3.3 Contrato DEV pragmatica

Para que el stack pueda levantar en una estacion local aun sin conectividad SQL/SMTP institucional valida, el backend usa defaults que privilegian arranque sobre integracion:

- `DB_SERVER_*` y compatibilidad `DB_SERVER` -> `host.docker.internal`
- `SMTP_HOST` -> `host.docker.internal`
- credenciales dummy por defecto

Eso permite que el backend arranque, exponga `/api/health` y deje trazabilidad de error de infraestructura real sin tumbar el proceso.

### 3.4 Frontend y `web.config`

`frontend/Dockerfile` ahora acepta:

- `IIS_BACKEND_UPSTREAM`
- `FRONTEND_WEB_BACKEND_UPSTREAM`

para que el render de `frontend/public/web.config` quede parametrizable tambien desde build Docker y no solo desde ejecucion local fuera de contenedor.

## 4) Script operativo agregado

Se creo:

- `scripts/migracion/levantar_stack_compose_dev.ps1`

Responsabilidades:

1. validar que existe `docker-compose.dev.yml`
2. ejecutar `docker compose config`
3. opcionalmente bajar el stack previo con `-RecrearLimpio`
4. levantar con `docker compose up -d --build`
5. listar el estado final con `docker compose ps`

## 5) Validacion ejecutada

Se ejecuto:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\migracion\levantar_stack_compose_dev.ps1 -RecrearLimpio
```

Resultado:

- validacion `docker compose config` correcta
- build local correcto de `backend`, `frontend` y `proxy`
- stack `cnp-dev` levantado localmente

Logs:

- `docs/migracion/ejecucion/49A_Levantar_Stack_DEV_Compose_20260310_130436.log`
- `docs/migracion/ejecucion/49B_Estado_Stack_DEV_Compose_20260310_130436.log`

## 6) Nota operativa importante

Los defaults del backend quedan alineados al puerto host `8080`:

- `FRONTEND_URL=http://localhost:8080`
- `CORS_ORIGINS=http://localhost:8080`
- `CSRF_ORIGINS=http://localhost:8080`

Si se cambia `PROXY_HTTP_PORT`, esas tres variables deben ajustarse en el entorno de Compose para mantener coherencia en redirects y CSRF/CORS.

## 7) Resultado del paso

`B.2.4.1` puede considerarse resuelto.

El repositorio ya no depende de una smoke manual efimera para DEV; ahora existe una definicion Compose versionada y un script repetible para levantar el stack local sobre los nombres canonicos del proyecto.

## 8) Conclusion

El siguiente paso natural es `B.2.4.2`, donde corresponde dejar la evidencia formal de servicios arriba y healthchecks en `OK` sobre este stack ya levantado.
