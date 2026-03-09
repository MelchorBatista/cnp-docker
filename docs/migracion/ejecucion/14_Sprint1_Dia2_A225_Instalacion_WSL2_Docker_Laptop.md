# Paso 14 - Sprint 1 - Dia 2 - Instalacion de WSL2 y Docker Desktop en laptop objetivo (`A.2.2.5`)

Fecha: 2026-03-04  
Estado: Ejecutado - Confirmado por el usuario (2026-03-04)

## 1) Objetivo del paso

Ejecutar instalacion de:

- WSL2
- Docker Desktop

en la laptop objetivo, usando flujo `winget` y fallback `chocolatey` cuando aplique.

## 2) Artefactos creados

- Script de instalacion (sesion normal):
  - `scripts/migracion/instalar_wsl2_docker_laptop.ps1`
- Script de instalacion para sesion elevada (admin):
  - `scripts/migracion/instalar_wsl2_docker_admin.ps1`

## 3) Ejecucion realizada desde terminal VS Code

Comando ejecutado:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\migracion\instalar_wsl2_docker_laptop.ps1
```

## 4) Resultado de la ejecucion

Estado final detectado:

- WSL2: `No instalado`
- Docker Desktop: `No instalado`

Motivo tecnico principal:

- La terminal no estaba en modo administrador.
- Instaladores de WSL2 y Docker Desktop requieren elevacion/UAC.

## 5) Evidencia de log

- `docs/migracion/ejecucion/14A_Instalacion_WSL2_Docker_Laptop_20260304_193339.log`

Hallazgos relevantes del log:

- `Sesion administrador: False`
- WSL reporta no instalado y sugiere `wsl.exe --install`
- `winget` descarga Docker Desktop, pero instalador falla por elevacion
- fallback `chocolatey` falla por permisos en `C:\ProgramData\chocolatey`

## 6) Remediacion requerida (sesion elevada)

Ejecutar en PowerShell de administrador:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\migracion\instalar_wsl2_docker_admin.ps1
```

Si Windows solicita reinicio, reiniciar antes del siguiente paso.

## 7) Validacion posterior exitosa (usuario + verificacion tecnica)

Salidas de validacion reportadas por el usuario:

- `wsl --status`:
  - `Default Distribution: Ubuntu`
  - `Default Version: 2`
- `wsl -l -v`:
  - `Ubuntu` en `VERSION 2`
  - `docker-desktop` en `VERSION 2`
- `winget list --id Docker.DockerDesktop`:
  - `Docker Desktop 4.63.0`
- `docker version` y `docker info`:
  - cliente/servidor Docker operativos

Verificacion adicional desde esta estacion:

- `wsl --status`: OK
- `wsl -l -v`: OK
- `docker.exe` en `C:\Program Files\Docker\Docker\resources\bin`: OK

Nota operativa:

- En sesiones antiguas de terminal puede no resolverse `docker` por PATH hasta abrir una nueva sesion.

## 8) Cierre del punto `A.2.2.5`

- [x] Flujo de instalacion ejecutado y evidenciado.
- [x] Bloqueo tecnico identificado y documentado.
- [x] Script de remediacion admin preparado.
- [x] Instalacion efectiva de WSL2 y Docker Desktop validada.
- [x] `Confirmado` del usuario recibido y `A.2.2.5` marcado en el plan.
