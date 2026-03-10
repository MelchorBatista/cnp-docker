# Paso 51 - Sprint 2 - Validacion de `/cnp`, `/api` y `/socket.io` en DEV y runbook publicado (`B.2.5.1`)

Fecha: 2026-03-10
Estado: Ejecutado - Pendiente de confirmacion del usuario

## 1) Objetivo del paso

Cerrar `B.2.5.1` dejando:

- validacion real de las rutas publicas DEV
- un runbook reutilizable para repetir la prueba

Rutas requeridas por el punto:

- `/cnp`
- `/api`
- `/socket.io`

Control adicional ejecutado:

- `/cnp/socket.io`

## 2) Hallazgo real y correccion aplicada

Durante la primera validacion aparecio un desvio real en `proxy`:

- `GET /cnp` devolvia `301`
- pero el header `Location` perdia el puerto publicado `8080`
- resultado observado previo: redireccion a `http://127.0.0.1/cnp/`

Causa:

- `nginx` estaba emitiendo redirects absolutos por defecto

Correccion aplicada:

- en `proxy/default.conf.template` se agrego `absolute_redirect off;`

Resultado:

- `GET /cnp` ahora devuelve `Location: /cnp/`
- el navegador conserva correctamente el puerto publicado del proxy

## 3) Script operativo agregado

Se creo:

- `scripts/migracion/verificar_rutas_publicas_stack_dev.ps1`

Responsabilidades del script:

1. ubicar la URL publicada del `proxy`
2. validar `GET /cnp` como redirect correcto a `/cnp/`
3. validar `GET /cnp/` como frontend HTML operativo
4. validar `GET /api/health` como probe estable de la familia `/api`
5. validar handshake polling de `GET /socket.io/?EIO=4&transport=polling`
6. validar opcionalmente compatibilidad `GET /cnp/socket.io/?EIO=4&transport=polling`
7. fallar si algun probe no devuelve el contrato esperado

## 4) Runbook publicado

Se publico el runbook operativo:

- `docs/migracion/operaciones/Runbook_Validacion_Rutas_DEV.md`

El runbook deja documentados:

- prerrequisitos del stack DEV
- probes oficiales por ruta
- interpretacion de fallas
- criterio de salida

Importante:

- la familia `/api` se valida por `GET /api/health`
- `GET /api` no se considera endpoint funcional del contrato

## 5) Ejecucion validada

Para aplicar la correccion del proxy y dejar la validacion final se ejecuto:

```powershell
docker compose -p cnp-dev -f .\docker-compose.dev.yml up -d --build
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\migracion\verificar_rutas_publicas_stack_dev.ps1 -VerificarSocketCompat
```

Logs finales:

- `docs/migracion/ejecucion/51A_Rebuild_Proxy_DEV_20260310_133424.log`
- `docs/migracion/ejecucion/51B_Validacion_Rutas_DEV_20260310_133424.log`

## 6) Resultado observado

La corrida valida dejo:

- `GET /cnp` -> `301`, `Location: /cnp/`
- `GET /cnp/` -> `200 OK`, `Content-Type: text/html`
- `GET /api/health` -> `200 OK`, body `{"ok":true,...}`
- `GET /socket.io/?EIO=4&transport=polling` -> `200 OK`, paquete de apertura Engine.IO con `sid`, `pingInterval` y `pingTimeout`
- `GET /cnp/socket.io/?EIO=4&transport=polling` -> `200 OK`, misma apertura valida por ruta de compatibilidad

## 7) Resultado del paso

`B.2.5.1` puede considerarse resuelto.

El stack DEV ya no depende de una prueba manual imprecisa para comprobar el ruteo publico. Queda:

- el proxy corregido para `/cnp`
- un verificador reusable
- un runbook operativo publicado

## 8) Conclusion

Con `B.2.5.1` cerrado tecnicamente, el siguiente paso natural es `B.2.5.2`, donde corresponde consolidar la evidencia final del checklist DEV completo.
