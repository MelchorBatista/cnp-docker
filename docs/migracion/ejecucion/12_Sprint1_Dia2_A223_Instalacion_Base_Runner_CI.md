# Paso 12 - Sprint 1 - Dia 2 - Instalacion base en runner de CI (`A.2.2.3`)

Fecha: 2026-03-04  
Estado: Ejecutado - Confirmado por el usuario (2026-03-04)

## 1) Objetivo del paso

Ejecutar instalacion base de herramientas en runner de CI para validar:

- Git
- Node.js 24.x
- npm
- OpenSSL
- curl

Con instalacion mediante `winget` y fallback `chocolatey` cuando aplique en runner Windows.

## 2) Cambios implementados

### Scripts de runner CI

- `scripts/migracion/instalar_herramientas_base_runner_ci.ps1`
- `scripts/migracion/verificar_herramientas_base_runner_ci.ps1`

Ambos scripts:

- Registran logs en `docs/migracion/ejecucion`.
- Evalua version objetivo de herramientas.
- Ejecutan doble verificacion (sesion actual + sesion nueva + PATH).
- Mantienen compatibilidad con `actions/setup-node@v4` para Node 24.x.

### Workflow CI actualizado

Archivo: `.github/workflows/ci.yml`

Cambios:

- Se agrega trigger `workflow_dispatch`.
- Se agrega job `baseline-toolchain-runner-ci` en `windows-latest`.
- El job ejecuta en secuencia:
  1. `actions/setup-node@v4` con `node-version: '24'`.
  2. Script de instalacion base (`11C`).
  3. Script de verificacion base (`11D`).
  4. Publicacion de logs como artifact (`actions/upload-artifact@v4`).

## 3) Ejecucion realizada

### Validacion local de scripts (simulando runner con Node 24.x en PATH)

Comandos ejecutados:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\migracion\instalar_herramientas_base_runner_ci.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\migracion\verificar_herramientas_base_runner_ci.ps1
```

Resultado:

- Instalacion base: `OK`
- Verificacion doble: `OK`
- Herramientas en estado `Cumple/OK` durante simulacion:
  - Git
  - Node.js 24.x
  - npm
  - OpenSSL
  - curl

## 4) Evidencia de logs

- Instalacion runner CI (simulacion):
  - `docs/migracion/ejecucion/11C_Instalacion_Herramientas_Base_Runner_CI_20260306_130215.log`
- Verificacion runner CI (simulacion):
  - `docs/migracion/ejecucion/11D_Verificacion_Herramientas_Base_Runner_CI_20260306_130214.log`

## 5) Verificacion pendiente en runner remoto

No se ejecuto disparo remoto del workflow desde esta estacion porque no hay cliente GitHub CLI disponible (`gh`) ni `act` para ejecucion local de workflows.

Validacion final recomendada en repositorio remoto:

1. Ejecutar workflow `CI` con trigger manual (`workflow_dispatch`).
2. Confirmar job `Baseline Toolchain Runner CI (A.2.2.3)` en estado exitoso.
3. Descargar artifact `evidencia-a223-herramientas-base-runner-ci`.
4. Confirmar que logs `11C` y `11D` reportan estado sin fallas.

## 6) Checklist del paso

- [x] Scripts de instalacion y verificacion para runner CI creados.
- [x] Workflow CI actualizado para ejecutar validacion A.2.2.3 en `windows-latest`.
- [x] Logs de evidencia generados en entorno local de simulacion.
- [x] Confirmacion de ejecucion remota del workflow CI (validada por confirmacion del usuario).
- [x] `Confirmado` del usuario recibido y `A.2.2.3` marcado en el plan.

