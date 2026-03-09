# Paso 15 - Sprint 1 - Dia 2 - Evidencia WSL y Docker en estado OK (`A.2.2.6`)

Fecha: 2026-03-04  
Estado: Ejecutado - Confirmado por el usuario (2026-03-04)

## 1) Objetivo del paso

Registrar evidencia formal de:

- `wsl --status` en estado OK
- `docker version` en estado OK

como cierre tecnico posterior al punto `A.2.2.5`.

## 2) Artefacto de verificacion creado

- `scripts/migracion/verificar_wsl_docker_laptop.ps1`

Este script:

- Ejecuta `wsl --status`, `wsl -l -v` y `docker version`.
- Detecta automaticamente ruta de `docker.exe` cuando el comando `docker` no esta en PATH de la sesion actual.
- Emite log estructurado y resultado `OK/FALLA`.

## 3) Ejecucion realizada

Comando ejecutado:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\migracion\verificar_wsl_docker_laptop.ps1
```

Resultado:

- `wsl --status`: `OK`
- `docker version`: `OK`
- Codigo de salida del script: `0`

## 4) Evidencia de log

- `docs/migracion/ejecucion/14B_Verificacion_WSL_Docker_Laptop_20260304_202705.log`

Fragmentos clave:

- `Default Distribution: Ubuntu`
- `Default Version: 2`
- `docker-desktop` presente en WSL2
- `Client` y `Server` activos en `docker version`

## 5) Criterio de cierre de `A.2.2.6`

- [x] Salida de `wsl --status` registrada y validada.
- [x] Salida de `docker version` registrada y validada.
- [x] Evidencia log almacenada en `docs/migracion/ejecucion`.
- [x] `Confirmado` del usuario recibido y `A.2.2.6` marcado en el plan.
