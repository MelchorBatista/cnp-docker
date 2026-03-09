# Paso 16 - Sprint 1 - Dia 2 - Instalacion de toolchain de seguridad en estacion y runner (`A.2.2.7`)

Fecha: 2026-03-04  
Estado: Ejecutado - Confirmado por el usuario (2026-03-04)

## 1) Objetivo del paso

Ejecutar scripts PowerShell de instalacion de herramientas de seguridad:

- Trivy
- Hadolint
- Syft (SBOM)

en:

- Estacion de desarrollo
- Runner de CI

con politica `winget` y fallback a `chocolatey`.

## 2) Script utilizado

- `scripts/migracion/instalar_toolchain_seguridad.ps1`

## 3) Ejecucion en estacion de desarrollo

Comando ejecutado:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\migracion\instalar_toolchain_seguridad.ps1
```

Resultado del script:

- Trivy: Instalado
- Hadolint: Instalado
- Syft: Instalado
- Codigo de salida: `0`

Log generado:

- `docs/migracion/ejecucion/05A_Instalacion_Toolchain_Seguridad_20260304_203706.log`

## 4) Ejecucion en runner de CI

Se actualizo workflow para ejecutar el mismo script en `windows-latest`:

- Archivo: `.github/workflows/ci.yml`
- Job agregado: `security-toolchain-runner-ci`
- Dependencia: `needs: baseline-toolchain-runner-ci`
- Paso principal:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\migracion\instalar_toolchain_seguridad.ps1
```

Artifact de evidencia configurado:

- `evidencia-a227-toolchain-seguridad-runner-ci`
- Incluye: `docs/migracion/ejecucion/05A_Instalacion_Toolchain_Seguridad_*.log`

## 5) Nota para el siguiente punto (`A.2.2.8`)

La doble verificacion de versiones y PATH en VS Code y runner CI se ejecuta en el punto siguiente (`A.2.2.8`) con el script de verificacion correspondiente.

## 6) Cierre del punto `A.2.2.7`

- [x] Script de instalacion de seguridad ejecutado en estacion.
- [x] Log de instalacion en estacion generado.
- [x] Runner CI configurado para ejecutar el mismo script.
- [x] Publicacion de artifact de logs de runner configurada.
- [x] `Confirmado` del usuario recibido y `A.2.2.7` marcado en el plan.
