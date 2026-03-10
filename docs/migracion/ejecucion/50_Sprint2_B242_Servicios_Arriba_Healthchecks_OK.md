# Paso 50 - Sprint 2 - Servicios arriba con healthchecks en OK (`B.2.4.2`)

Fecha: 2026-03-10
Estado: Ejecutado - Pendiente de confirmacion del usuario

## 1) Objetivo del paso

Dejar evidencia formal de que el stack DEV definido en `B.2.4.1` sigue levantado y que sus tres servicios canonicos reportan:

- `running`
- `healthy`

Servicios evaluados:

- `backend`
- `frontend`
- `proxy`

## 2) Fuente real de los healthchecks

`docker-compose.dev.yml` no redefine healthchecks a nivel Compose. El stack DEV consume los `HEALTHCHECK` ya versionados en las imagenes del paso `B.2.2.1`:

- `backend/Dockerfile` -> `http://127.0.0.1:3000/api/health`
- `frontend/Dockerfile` -> `http://127.0.0.1/healthz`
- `proxy/Dockerfile` -> `http://127.0.0.1/healthz`

Ademas, el servicio `proxy` depende de:

- `frontend` con `condition: service_healthy`
- `backend` con `condition: service_healthy`

Eso asegura que el stack DEV no solo arranca, sino que respeta el criterio de salud ya fijado en las imagenes canonicas.

## 3) Script operativo agregado

Se creo:

- `scripts/migracion/verificar_healthchecks_stack_dev.ps1`

Responsabilidades del script:

1. ejecutar `docker compose ps`
2. ubicar el contenedor activo de cada servicio
3. inspeccionar `State.Status` y `State.Health.Status`
4. registrar el comando real de `HEALTHCHECK`
5. registrar la ultima ejecucion del healthcheck (`Start`, `End`, `ExitCode`)
6. validar opcionalmente `http://127.0.0.1:8080/healthz` publicado por `proxy`
7. fallar si algun servicio no esta en `running` + `healthy`

## 4) Ejecucion validada

Se ejecuto:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\migracion\verificar_healthchecks_stack_dev.ps1 -VerificarProxyPublicado
```

Log generado:

- `docs/migracion/ejecucion/50A_Verificacion_Healthchecks_Stack_DEV_20260310_131818.log`

## 5) Resultado observado

La corrida valida dejo:

| Servicio | Contenedor | Imagen | Estado | Healthcheck | Ultimo exit code |
|---|---|---|---|---|---:|
| `backend` | `cnp-dev-backend-1` | `cnp-backend:dev` | `running` | `healthy` | `0` |
| `frontend` | `cnp-dev-frontend-1` | `cnp-frontend:dev` | `running` | `healthy` | `0` |
| `proxy` | `cnp-dev-proxy-1` | `cnp-proxy:dev` | `running` | `healthy` | `0` |

Validacion adicional del servicio publicado:

- `http://127.0.0.1:8080/healthz` -> `200 OK`
- body -> `ok`

## 6) Desvios menores del verificador

Durante la primera implementacion del script aparecieron dos falsos negativos del propio wrapper PowerShell:

1. `docker compose ps -q` devolvia una sola linea y PowerShell la trataba como `string`, no como arreglo.
2. `Invoke-WebRequest` devolvia el body de `/healthz` como `byte[]`, por lo que `ok` se renderizaba como `111 107`.

Ambos problemas quedaron corregidos en el script antes de la corrida final. La evidencia valida del punto es el log final `50A_...131818.log`.

## 7) Resultado del paso

`B.2.4.2` puede considerarse resuelto.

El stack DEV ya no depende de una observacion manual de Docker Desktop para probar salud. Existe una verificacion repetible y versionada que demuestra:

- servicios arriba
- healthchecks en `OK`
- proxy publicado saludable

## 8) Conclusion

Con `B.2.4.1` y `B.2.4.2` cerrados tecnicamente, el bloque `B.2.4` queda listo para marcarse cuando el usuario confirme este paso.
