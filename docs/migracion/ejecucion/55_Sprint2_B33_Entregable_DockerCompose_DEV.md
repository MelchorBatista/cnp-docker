# Paso 55 - Sprint 2 - Entregable obligatorio: docker-compose para DEV (`B.3.3`)

Fecha: 2026-03-10
Estado: Ejecutado - Pendiente de confirmacion del usuario

## 1) Objetivo del paso

Cerrar `B.3.3` como entregable obligatorio del Sprint 2, verificando que el repositorio mantiene un `docker-compose` versionado para DEV y que ese archivo sigue describiendo correctamente el stack local canonico:

- `backend`
- `frontend`
- `proxy`

## 2) Base tecnica ya aprobada

La definicion inicial y la validacion operativa del stack DEV ya habian quedado resueltas en:

- `docs/migracion/ejecucion/49_Sprint2_B241_Stack_DEV_Compose_Definido_Levantado.md`

Ese paso cubrio:

- creacion de `docker-compose.dev.yml`
- script operativo de levantamiento
- build local del stack
- levantamiento del proyecto `cnp-dev`

`B.3.3` no redefine el compose; valida que ese archivo existe hoy como entregable obligatorio y sigue alineado con el stack DEV vigente.

## 3) Archivos que materializan el entregable

Entregable principal:

- `docker-compose.dev.yml`

Soporte operativo asociado:

- `scripts/migracion/levantar_stack_compose_dev.ps1`

## 4) Revalidacion tecnica ejecutada

Se genero la evidencia nueva:

- `docs/migracion/ejecucion/55A_Validacion_Entregable_Compose_DEV_20260310_144413.log`

La validacion cubrio:

1. confirmacion de versionado de:
   - `docker-compose.dev.yml`
   - `scripts/migracion/levantar_stack_compose_dev.ps1`
2. `SHA256` del archivo `docker-compose.dev.yml`
3. salida completa de `docker compose config`
4. salida actual de `docker compose ps`
5. resolucion del puerto publicado por `proxy`

## 5) Resultado observado

La evidencia actual confirma:

- `docker-compose.dev.yml` sigue versionado en el repo raiz
- el compose define los tres servicios canonicos:
  - `backend`
  - `frontend`
  - `proxy`
- las imagenes objetivo siguen siendo:
  - `cnp-backend:dev`
  - `cnp-frontend:dev`
  - `cnp-proxy:dev`
- las redes siguen siendo:
  - `red_publica`
  - `red_aplicacion` con `internal: true`
- solo `proxy` publica puertos al host
- el puerto publicado actual del proxy sigue resolviendo a `8080`

Ademas, el estado real del proyecto `cnp-dev` en la validacion fue:

- `cnp-dev-backend-1` -> `healthy`
- `cnp-dev-frontend-1` -> `healthy`
- `cnp-dev-proxy-1` -> `healthy`

## 6) Resultado del paso

`B.3.3` puede considerarse resuelto.

El Sprint 2 ya tiene el entregable obligatorio de `docker-compose` para DEV:

- versionado
- trazable
- alineado al stack actual
- soportado por script operativo de levantamiento

## 7) Conclusion

El siguiente pendiente en secuencia dentro de `B.3` es `B.3.4`.
