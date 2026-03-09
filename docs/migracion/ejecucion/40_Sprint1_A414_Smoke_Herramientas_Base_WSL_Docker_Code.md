# Paso 40 - Sprint 1 - Cierre DoD `A.4.14` - Smoke de herramientas base `wsl/docker/code`

Fecha: 2026-03-09  
Estado: Resuelto a nivel documental y tecnico. Pendiente de confirmacion del usuario para marcado en `Migracion_Docker.ini`.

## 1) Objetivo del punto

Demostrar mediante una smoke test local que las herramientas base del entorno de trabajo responden correctamente en una misma corrida:

- WSL
- Docker Desktop / daemon Docker
- VS Code CLI / workspace

## 2) Script de smoke creado para este punto

Archivo:

- `scripts/migracion/verificar_smoke_herramientas_base_local.ps1`

Cobertura de la smoke:

- `wsl --status`
- `wsl -l -v`
- `docker desktop status`
- `docker version`
- `docker info`
- `code --version`
- `code --status`

## 3) Incidencia menor detectada y corregida el mismo dia

En la primera ejecucion de hoy se genero:

- `docs/migracion/ejecucion/40A_Smoke_Herramientas_Base_Local_20260309_115748.log`

Ese intento marco `Docker daemon: FALLA`, pero la salida real de `docker version` era correcta.

Causa tecnica:

- el script usaba un patron sin modo multilinea para detectar `Server:`

Correccion aplicada:

- se ajusto la validacion a `(?im)^Server:`

Impacto:

- falso negativo del script
- no falla real del entorno

## 4) Ejecucion exitosa de la smoke

Evidencia valida final:

- `docs/migracion/ejecucion/40A_Smoke_Herramientas_Base_Local_20260309_115814.log`

Resultado consolidado:

- `WSL status`: `OK`
- `WSL distros v2`: `OK`
- `Docker Desktop`: `OK`
- `Docker daemon`: `OK`
- `Docker WSL2 backend`: `OK`
- `VS Code CLI`: `OK`
- `VS Code workspace`: `OK`

## 5) Hallazgos tecnicos clave

### 5.1 WSL

`wsl --status`:

- `Default Distribution: Ubuntu`
- `Default Version: 2`

`wsl -l -v`:

```text
NAME              STATE           VERSION

* Ubuntu            Running         2
  docker-desktop    Running         2
```

### 5.2 Docker

`docker desktop status`:

- `Status: running`

`docker version`:

- cliente activo `29.2.1`
- servidor activo `Docker Desktop 4.63.0 (220185)`
- contexto `desktop-linux`

`docker info`:

- `Operating System: Docker Desktop`
- `OSType: linux`
- `Kernel Version: 6.6.87.2-microsoft-standard-WSL2`
- `Name: docker-desktop`
- `CPUs: 4`
- memoria total cercana a `5.788 GiB`

### 5.3 VS Code

CLI detectado:

- `C:\Program Files\Microsoft VS Code\bin\code.cmd`

`code --version`:

- `1.111.0`
- `x64`

`code --status`:

- respuesta exitosa
- `Workspace Stats` presentes para `cnp-docker`

## 6) Relacion con puntos previos del DoD

La smoke de `A.4.14` consolida en una sola corrida lo ya validado por separado en:

- `A.4.11` WSL2 operativo
- `A.4.12` Docker Desktop operativo con integracion WSL2
- `A.4.13` VS Code preparado para el proyecto

La diferencia es que aqui se demuestra operatividad conjunta y no solo validaciones aisladas.

## 7) Criterio de cierre de `A.4.14`

- [x] Existe smoke test local especifica para `wsl/docker/code`.
- [x] La smoke fue ejecutada el `2026-03-09`.
- [x] Todos los chequeos relevantes terminaron en `OK`.
- [x] Los resultados quedaron registrados en log trazable.
- [x] El falso negativo inicial quedo corregido y documentado.

## 8) Conclusion

`A.4.14` puede considerarse cumplido.

La estacion actual supera la smoke de herramientas base para `wsl/docker/code` con resultados registrados y coherentes con el estado operativo observado hoy.
