# Runbook de Validacion de Rutas Publicas - DEV

## Objetivo
Validar que el stack Docker DEV publicado por `proxy` responde correctamente en las rutas publicas canonicas del portal:

- `/cnp`
- `/api`
- `/socket.io`

Y, como control adicional, conservar compatibilidad con:

- `/cnp/socket.io`

## Prerrequisitos
- Docker Desktop operativo.
- Stack DEV levantado con `docker-compose.dev.yml`.
- Servicios `backend`, `frontend` y `proxy` en `healthy`.

Comandos sugeridos previos:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\migracion\levantar_stack_compose_dev.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\migracion\verificar_healthchecks_stack_dev.ps1 -VerificarProxyPublicado
```

## Criterio de validacion

### 1. Ruta `/cnp`
La validacion correcta se hace en dos pasos:

1. `GET /cnp`
   Resultado esperado:
   - `301` o `302`
   - `Location: /cnp/` o una URL absoluta equivalente que conserve el mismo puerto publicado

2. `GET /cnp/`
   Resultado esperado:
   - `200 OK`
   - `Content-Type: text/html`
   - HTML del frontend servido bajo base path `/cnp/`

### 2. Ruta `/api`
La familia `/api` se valida con el probe estable:

- `GET /api/health`

Resultado esperado:
- `200 OK`
- payload JSON con `ok = true`

Nota:
- `GET /api` no se considera endpoint funcional del contrato; el probe oficial del runbook es `/api/health`.

### 3. Ruta `/socket.io`
La validacion se hace con el handshake polling de Engine.IO:

- `GET /socket.io/?EIO=4&transport=polling`

Resultado esperado:
- `200 OK`
- body iniciando con `0{...}`
- presencia de `sid`, `pingInterval` y `pingTimeout`

### 4. Compatibilidad `/cnp/socket.io`
Chequeo adicional recomendado:

- `GET /cnp/socket.io/?EIO=4&transport=polling`

Resultado esperado:
- `200 OK`
- mismo paquete de apertura que la ruta canonica `/socket.io`

## Ejecucion automatizada
Ejecutar:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\migracion\verificar_rutas_publicas_stack_dev.ps1 -VerificarSocketCompat
```

Resultado esperado final:

- `Resultado: OK. Las rutas publicas DEV /cnp, /api y /socket.io quedaron validadas.`

## Interpretacion de fallas
- Falla en `/cnp`: revisar `proxy/default.conf.template`, base path `PROXY_BASE_PATH` y build del `frontend`.
- Falla en `/api/health`: revisar `backend`, variables `BASE_PATH`, `API_PREFIX` y logs del contenedor.
- Falla en `/socket.io`: revisar `SOCKETIO_PATH`, proxy websocket y handshake del backend.
- Falla solo en `/cnp/socket.io`: revisar `PROXY_SOCKETIO_COMPAT_PATH` y la regla `rewrite` del proxy.

## Criterio de salida
La validacion DEV solo puede declararse completa cuando:

- `/cnp` redirige correctamente a `/cnp/` sin perder el puerto publicado.
- `/cnp/` devuelve el frontend.
- `/api/health` responde `200` con `ok=true`.
- `/socket.io` responde handshake polling valido.
- `/cnp/socket.io` mantiene compatibilidad si se ejecuta el chequeo adicional.
