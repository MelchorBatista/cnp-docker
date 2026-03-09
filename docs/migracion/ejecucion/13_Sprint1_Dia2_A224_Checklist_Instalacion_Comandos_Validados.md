# Paso 13 - Sprint 1 - Dia 2 - Checklist de instalacion y comandos validados (`A.2.2.4`)

Fecha: 2026-03-04  
Estado: Ejecutado - Confirmado por el usuario (2026-03-04)

## 1) Objetivo del paso

Consolidar la evidencia de instalacion base y validar comandos/versiones para:

- Estacion de desarrollo
- Runner de CI

Incluyendo trazabilidad de scripts y logs.

## 2) Comandos de validacion estandar

Comandos utilizados como base de verificacion:

```powershell
git --version
node --version
npm --version
openssl version
curl --version
```

## 3) Evidencia fuente utilizada

### Estacion de desarrollo

- Instalacion:
  - `docs/migracion/ejecucion/11A_Instalacion_Herramientas_Base_Estaciones_20260304_165158.log`
- Verificacion:
  - `docs/migracion/ejecucion/11B_Verificacion_Herramientas_Base_Estaciones_20260304_171315.log`

### Runner de CI

- Instalacion:
  - `docs/migracion/ejecucion/11C_Instalacion_Herramientas_Base_Runner_CI_20260304_174739.log`
- Verificacion:
  - `docs/migracion/ejecucion/11D_Verificacion_Herramientas_Base_Runner_CI_20260304_174749.log`

## 4) Checklist consolidado de validacion

### 4.1 Estacion de desarrollo

| Herramienta | Version evidenciada | Estado |
|---|---|---|
| Git | `git version 2.53.0.windows.1` | OK |
| Node.js 24.x | `v24.14.0` | OK |
| npm | `11.9.0` | OK |
| OpenSSL | `OpenSSL 3.6.1 27 Jan 2026` | OK |
| curl | `curl 8.16.0` | OK |

Resultado estacion:

- 5/5 validaciones `OK`.

### 4.2 Runner de CI (simulacion con Node 24.x en PATH)

| Herramienta | Version evidenciada | Estado |
|---|---|---|
| Git | `git version 2.53.0.windows.1` | OK |
| Node.js 24.x | `v24.14.0` | OK |
| npm | `10.8.2` | OK |
| OpenSSL | `OpenSSL 3.6.1 27 Jan 2026` | OK |
| curl | `curl 8.16.0` | OK |

Resultado runner:

- 5/5 validaciones `OK`.

## 5) Trazabilidad tecnica

Scripts asociados al checklist:

- Estacion de desarrollo:
  - `scripts/migracion/instalar_herramientas_base_estaciones.ps1`
  - `scripts/migracion/verificar_herramientas_base_estaciones.ps1`
- Runner de CI:
  - `scripts/migracion/instalar_herramientas_base_runner_ci.ps1`
  - `scripts/migracion/verificar_herramientas_base_runner_ci.ps1`

Workflow asociado:

- `.github/workflows/ci.yml` (job `baseline-toolchain-runner-ci`)

## 6) Observaciones y desviaciones

Estado actual:

- El baseline oficial fue actualizado a `Node.js 24.x`.
- La estacion de desarrollo y la simulacion del runner cumplen ese baseline.
- No hay desviacion abierta para Node en este punto.

Comando de remediacion documentado si una estacion o runner diverge:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\migracion\ajustar_node24_admin.ps1
```

## 7) Criterio de cierre de `A.2.2.4`

- [x] Checklist consolidado generado.
- [x] Comandos de version documentados y trazables.
- [x] Evidencia de estacion y runner referenciada.
- [x] Desviaciones tecnicas registradas con remediacion.
- [x] `Confirmado` del usuario recibido y `A.2.2.4` marcado en el plan.
