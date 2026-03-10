# Paso 45 - Sprint 2 - Toolchain de seguridad en runner CI Docker (`B.2.2.3`)

Fecha: `2026-03-10`

## Objetivo

Dejar validada la disponibilidad de:

- Trivy
- Hadolint
- Syft

en el runner CI que ejecuta el pipeline Docker del Sprint 2, con doble chequeo de:

- version
- resolucion en PATH
- sesion actual
- sesion hija

## Cambios implementados

### 1. Provision explicita en el runner Docker CI

Se agrego [provisionar_toolchain_seguridad_runner_ci_docker.ps1](c:\Desarrollo\cnp-docker\scripts\migracion\provisionar_toolchain_seguridad_runner_ci_docker.ps1).

Responsabilidades:

- ejecutar solo en Linux (`ubuntu-latest`)
- descargar versiones pinneadas de Trivy, Hadolint y Syft
- instalar los binarios en directorio temporal del runner
- agregar ese directorio a `PATH`
- persistir el path a pasos siguientes mediante `GITHUB_PATH`
- registrar log `45A`

Versiones fijadas:

- Trivy `0.69.3`
- Hadolint `2.14.0`
- Syft `1.42.1`

### 2. Verificacion explicita con doble chequeo

Se agrego [verificar_toolchain_seguridad_runner_ci_docker.ps1](c:\Desarrollo\cnp-docker\scripts\migracion\verificar_toolchain_seguridad_runner_ci_docker.ps1).

Validaciones ejecutadas por herramienta:

- disponibilidad en sesion actual
- disponibilidad en sesion hija PowerShell
- ruta resuelta en ambas sesiones
- directorio presente en `PATH`
- lectura de version en ambas sesiones

Salida:

- log `45B_Verificacion_Toolchain_Seguridad_Runner_CI_Docker_<timestamp>.log`

### 3. Pipeline Docker en modo estricto

Se actualizo [ejecutar_pipeline_base_docker_dev_ci.ps1](c:\Desarrollo\cnp-docker\scripts\migracion\ejecutar_pipeline_base_docker_dev_ci.ps1) con:

- parametro `-ExigirHerramientasLocales`

Efecto:

- cuando ese switch esta activo, el pipeline falla si `trivy`, `hadolint` o `syft` no estan realmente presentes en `PATH`
- ya no puede caer silenciosamente a imagenes fallback de contenedor

### 4. Workflow CI

Se actualizo [ci.yml](c:\Desarrollo\cnp-docker\.github\workflows\ci.yml) dentro del job:

- `docker-build-scan-package-dev`

Nuevo orden:

1. `checkout`
2. provision de toolchain seguridad del runner Docker CI
3. verificacion de toolchain seguridad del runner Docker CI
4. ejecucion del pipeline Docker con `-ExigirHerramientasLocales`
5. publicacion separada de evidencia `B.2.2.3`
6. publicacion de evidencia `B.2.2.2`

Artifact nuevo:

- `evidencia-b223-toolchain-seguridad-runner-docker-ci`

## Validacion realizada

### 1. Validacion de sintaxis

Parser PowerShell:

- [provisionar_toolchain_seguridad_runner_ci_docker.ps1](c:\Desarrollo\cnp-docker\scripts\migracion\provisionar_toolchain_seguridad_runner_ci_docker.ps1): `COUNT=0`
- [verificar_toolchain_seguridad_runner_ci_docker.ps1](c:\Desarrollo\cnp-docker\scripts\migracion\verificar_toolchain_seguridad_runner_ci_docker.ps1): `COUNT=0`
- [ejecutar_pipeline_base_docker_dev_ci.ps1](c:\Desarrollo\cnp-docker\scripts\migracion\ejecutar_pipeline_base_docker_dev_ci.ps1): `COUNT=0`

### 2. Ejecucion local de la verificacion

Se ejecuto:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\migracion\verificar_toolchain_seguridad_runner_ci_docker.ps1
```

Resultado:

- Trivy: `OK`
- Hadolint: `OK`
- Syft: `OK`

Evidencia:

- [45B_Verificacion_Toolchain_Seguridad_Runner_CI_Docker_20260310_082104.log](c:\Desarrollo\cnp-docker\docs\migracion\ejecucion\45B_Verificacion_Toolchain_Seguridad_Runner_CI_Docker_20260310_082104.log)

### 3. Ejecucion local estricta del pipeline

Se ejecuto:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\migracion\ejecutar_pipeline_base_docker_dev_ci.ps1 -ExigirHerramientasLocales
```

Resultado:

- `OK`
- el pipeline corrio usando herramientas locales
- no dependio de fallback por contenedor
- se genero paquete en [pipeline_20260310_082139\paquete](c:\Desarrollo\cnp-docker\evidence\docker_dev_ci\pipeline_20260310_082139\paquete)

Resumen:

- [44G_Resumen_Pipeline_Base_Docker_DEV_CI_20260310_082139.log](c:\Desarrollo\cnp-docker\docs\migracion\ejecucion\44G_Resumen_Pipeline_Base_Docker_DEV_CI_20260310_082139.log)

## Alcance y limite de esta validacion

Este punto deja resuelto el mecanismo de validacion del runner CI Docker y lo amarra al pipeline real.

Queda explicitamente separado de `B.2.2.4`:

- `B.2.2.3` cierra la provision, verificacion y gate tecnico del runner
- `B.2.2.4` cerrara la evidencia de ejecucion del workflow en rama de integracion y la publicacion efectiva de artifacts remotos

En consecuencia:

- el log `45A` se generara cuando el job corra en `ubuntu-latest`
- la ausencia actual de ese log local no bloquea `B.2.2.3`
- si bloquearia `B.2.2.4`

## Conclusion

`B.2.2.3` puede considerarse resuelto a nivel tecnico y documental.

El runner Docker CI del Sprint 2 queda:

- provisionado por version fija
- verificado con doble chequeo
- enlazado al pipeline real
- y forzado a usar herramientas locales antes de construir, escanear y empaquetar
