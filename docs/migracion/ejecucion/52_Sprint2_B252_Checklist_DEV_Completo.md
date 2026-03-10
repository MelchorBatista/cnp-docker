# Paso 52 - Sprint 2 - Evidencia de checklist DEV completo (`B.2.5.2`)

Fecha: 2026-03-10
Estado: Ejecutado - Pendiente de confirmacion del usuario

## 1) Objetivo del paso

Cerrar `B.2.5.2` consolidando en una sola evidencia que el baseline DEV del Sprint 2 quedo completo en terminos de:

- estandares
- Dockerfiles e imagenes
- pipeline base
- variables y contrato
- stack Compose DEV
- healthchecks
- rutas publicas
- runbook operativo

## 2) Evidencias fuente integradas

1. Estandar y versionado:
   - `docs/migracion/operaciones/Estandar_Imagenes_Versionado_Docker.md`
   - `docs/migracion/ejecucion/42_Sprint2_B211_Estandar_Imagenes_Versionado.md`
2. Dockerfiles y build local base:
   - `docs/migracion/ejecucion/43_Sprint2_B221_Dockerfiles_Backend_Frontend_Proxy.md`
3. Pipeline base DEV/CI:
   - `docs/migracion/ejecucion/44_Sprint2_B222_Pipeline_CI_Base_Docker_DEV.md`
4. Toolchain del runner Docker CI:
   - `docs/migracion/ejecucion/45_Sprint2_B223_Toolchain_Seguridad_Runner_CI_Docker.md`
5. Integracion remota y artefactos:
   - `docs/migracion/ejecucion/46_Sprint2_B224_Evidencia_Build_Local_Pipeline_Integracion_Artefactos.md`
6. Variables y contrato:
   - `docs/migracion/ejecucion/47_Sprint2_B231_Externalizar_Variables_Eliminar_Localhost_Critico.md`
   - `docs/migracion/ejecucion/48_Sprint2_B232_Matriz_Variables_Validada.md`
   - `docs/migracion/operaciones/Matriz_Variables_Entorno_Docker_CNP.md`
7. Stack DEV y salud:
   - `docs/migracion/ejecucion/49_Sprint2_B241_Stack_DEV_Compose_Definido_Levantado.md`
   - `docs/migracion/ejecucion/50_Sprint2_B242_Servicios_Arriba_Healthchecks_OK.md`
8. Rutas publicas y runbook:
   - `docs/migracion/ejecucion/51_Sprint2_B251_Validacion_Rutas_DEV_Runbook_Publicado.md`
   - `docs/migracion/operaciones/Runbook_Validacion_Rutas_DEV.md`
9. Trazabilidad consolidada de este paso:
   - `scripts/migracion/verificar_checklist_dev_completo.ps1`
   - `docs/migracion/ejecucion/52A_Checklist_DEV_Completo_20260310_134720.log`

## 3) Checklist consolidado del baseline DEV

| Item | Criterio | Evidencia principal | Estado |
|---|---|---|---|
| 1 | Estandar de imagenes, tags y base images definido | Paso 42 | CUMPLE |
| 2 | Dockerfiles de `backend`, `frontend` y `proxy` construyen localmente | Paso 43 | CUMPLE |
| 3 | Pipeline base DEV/CI ejecuta build, scan, SBOM y paquete local | Paso 44 | CUMPLE |
| 4 | Runner CI valida toolchain de seguridad con doble chequeo | Paso 45 | CUMPLE |
| 5 | GitHub Actions ejecuta el pipeline remoto de integracion con exito | Paso 46 | CUMPLE |
| 6 | Variables externas y `localhost` critico eliminados del contrato Docker | Paso 47 | CUMPLE |
| 7 | Matriz de variables declarada, consumida y trazada | Paso 48 | CUMPLE |
| 8 | `docker-compose.dev.yml` definido y stack `cnp-dev` levantado | Paso 49 | CUMPLE |
| 9 | `backend`, `frontend` y `proxy` arriba con `healthchecks` en `healthy` | Paso 50 | CUMPLE |
| 10 | `/cnp`, `/api` y `/socket.io` validados en DEV con runbook publicado | Paso 51 | CUMPLE |
| 11 | Revalidacion integral del baseline DEV sobre el estado actual local | Paso 52 (`52A_...`) | CUMPLE |

Resultado integrado:

- `11/11` criterios del checklist DEV en `CUMPLE`

## 4) Revalidacion ejecutada en este paso

Se ejecuto:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\migracion\verificar_checklist_dev_completo.ps1
```

El script valida en una sola corrida:

1. existencia de artefactos y documentos obligatorios del baseline DEV
2. `docker compose config` del stack DEV
3. presencia local de `cnp-backend:dev`, `cnp-frontend:dev` y `cnp-proxy:dev`
4. `healthchecks` del stack mediante `verificar_healthchecks_stack_dev.ps1`
5. rutas publicas mediante `verificar_rutas_publicas_stack_dev.ps1`

Log generado:

- `docs/migracion/ejecucion/52A_Checklist_DEV_Completo_20260310_134720.log`

## 5) Estado actual evidenciado

### 5.1 Imagenes DEV presentes

Del log `52A_...`:

| Imagen | Id evidenciado | Fecha de creacion |
|---|---|---|
| `cnp-backend:dev` | `sha256:6f1f8cf862f30f4cf05b898201a10c7d68bf3bd69a20748bac361345c8ef2c77` | `2026-03-10T17:05:36.084647526Z` |
| `cnp-frontend:dev` | `sha256:b4c428182a43de9057f6e95abb7a93850ea08784b6025929f2da5c2ecec19b72` | `2026-03-10T17:06:24.127769144Z` |
| `cnp-proxy:dev` | `sha256:48101139890febe9223638e5a9cc61fc16daeaad6d40a2f78d4ac134839da7a8` | `2026-03-10T17:33:38.154466413Z` |

### 5.2 Stack actual saludable

Del mismo log:

- `cnp-dev-backend-1` -> `running` + `healthy`
- `cnp-dev-frontend-1` -> `running` + `healthy`
- `cnp-dev-proxy-1` -> `running` + `healthy`

### 5.3 Rutas publicas actuales

Del mismo log:

- `GET /cnp` -> `301` con `Location: /cnp/`
- `GET /cnp/` -> `200 OK`
- `GET /api/health` -> `200 OK`
- `GET /socket.io/?EIO=4&transport=polling` -> `200 OK`
- `GET /cnp/socket.io/?EIO=4&transport=polling` -> `200 OK`

## 6) Resultado del paso

`B.2.5.2` puede considerarse resuelto.

El Sprint 2 ya no tiene su baseline DEV disperso en pruebas aisladas. Queda una evidencia consolidada y un verificador repetible que prueban que DEV esta completo en:

- definicion
- construccion
- seguridad base
- salud operativa
- ruteo publico

## 7) Conclusion

Con `B.2.5.1` y `B.2.5.2` cerrados tecnicamente, el bloque `B.2.5` queda listo para marcarse cuando el usuario confirme este paso. Y como tambien quedan cerrados `B.2.1` a `B.2.4`, el bloque `B.2` completo queda listo para marcarse en el mismo cierre.
