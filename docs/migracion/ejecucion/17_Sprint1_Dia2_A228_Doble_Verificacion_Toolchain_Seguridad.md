# Paso 17 - Sprint 1 - Dia 2 - Doble verificacion de toolchain de seguridad (`A.2.2.8`)

Fecha: 2026-03-04  
Estado: Ejecutado - Confirmado por el usuario (2026-03-04)

## 1) Objetivo del paso

Ejecutar doble verificacion de versiones y PATH para:

- Trivy
- Hadolint
- Syft (SBOM)

en:

- Terminal de VS Code (estacion)
- Runner de CI

## 2) Script de verificacion utilizado

- `scripts/migracion/verificar_toolchain_seguridad.ps1`

El script valida por herramienta:

- disponibilidad en sesion actual
- disponibilidad en sesion nueva
- presencia de ruta en PATH
- salida de version

## 3) Ejecucion en terminal VS Code

Comando ejecutado:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\migracion\verificar_toolchain_seguridad.ps1
```

Resultado:

- Trivy: `OK`
- Hadolint: `OK`
- Syft: `OK`
- Codigo de salida del script: `0`

Log generado:

- `docs/migracion/ejecucion/05B_Verificacion_Toolchain_Seguridad_20260304_205309.log`

## 4) Integracion de verificacion en runner CI

Workflow actualizado:

- Archivo: `.github/workflows/ci.yml`
- Job: `security-toolchain-runner-ci`

Secuencia en runner:

1. Instalar toolchain de seguridad (`instalar_toolchain_seguridad.ps1`)
2. Verificar toolchain de seguridad (`verificar_toolchain_seguridad.ps1`)
3. Publicar artifacts con logs `05A` y `05B`

Artifact configurado:

- `evidencia-a227-toolchain-seguridad-runner-ci`

## 5) Nota tecnica de hadolint

En esta estacion, `hadolint --version` devuelve mensaje de entorno:

- `getUserDocumentsDirectory ... unsupported operation`

Aun asi, la doble verificacion reporta `estado: OK` porque:

- binario resuelve en sesion actual
- binario resuelve en sesion nueva
- ruta esta registrada en PATH

## 6) Cierre del punto `A.2.2.8`

- [x] Doble verificacion ejecutada en terminal VS Code.
- [x] Log de verificacion `05B` generado.
- [x] Verificacion en runner CI incorporada al workflow.
- [x] Artifact de logs de instalacion/verificacion en runner configurado.
- [x] `Confirmado` del usuario recibido y `A.2.2.8` marcado en el plan.
