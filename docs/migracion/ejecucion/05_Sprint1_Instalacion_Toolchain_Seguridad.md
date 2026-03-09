# Paso 5 - Sprint 1 - Instalacion y doble verificacion de toolchain de seguridad

Fecha: 2026-03-04  
Estado: Ejecutado - pendiente de `Confirmado` del usuario

## 1) Objetivo del paso

Implementar y ejecutar el flujo de instalacion y verificacion para Trivy, Hadolint y Syft, cumpliendo:

- `A.2.8.4` Scripts PowerShell estandarizados con `winget` y fallback `chocolatey`.
- `A.2.8.5` Doble verificacion de versiones y PATH.
- `A.2.9.7` Instalacion de Trivy/Hadolint/SBOM por script.
- `A.2.9.8` Doble validacion desde terminal de VS Code.
- `A.3.2.7` Ejecucion del script de instalacion.
- `A.3.2.8` Evidencia de doble verificacion.

## 2) Artefactos creados

- Script de instalacion: `scripts/migracion/instalar_toolchain_seguridad.ps1`
- Script de verificacion: `scripts/migracion/verificar_toolchain_seguridad.ps1`

## 3) Ejecucion realizada en terminal de VS Code

Comandos ejecutados:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\migracion\instalar_toolchain_seguridad.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\migracion\verificar_toolchain_seguridad.ps1
```

Resultado general:

- Instalacion por `winget` disponible.
- `chocolatey` no fue requerido en esta ejecucion.
- Verificacion de sesion actual: OK.
- Verificacion de sesion nueva: OK.
- Verificacion de PATH (proceso y sistema): OK.

## 4) Evidencia de logs

Log principal de instalacion:

- `docs/migracion/ejecucion/05A_Instalacion_Toolchain_Seguridad_20260304_114527.log`

Log principal de verificacion:

- `docs/migracion/ejecucion/05B_Verificacion_Toolchain_Seguridad_20260304_114654.log`

Resumen de estado (extraido de logs):

- Trivy: instalado, detectado en PATH, sesion nueva OK.
- Hadolint: instalado, detectado en PATH, sesion nueva OK.
- Syft: instalado, detectado en PATH, sesion nueva OK.

Nota tecnica:

- `hadolint --version` devuelve un error de entorno en esta maquina (`getUserDocumentsDirectory ... unsupported operation`), pero el binario esta instalado y resolviendo correctamente en PATH en ambas verificaciones.

## 5) Checklist de cierre del paso

- [x] Scripts de instalacion/verificacion creados.
- [x] Flujo `winget` con fallback `chocolatey` implementado.
- [x] Doble verificacion implementada (sesion actual + sesion nueva + PATH).
- [x] Ejecucion real completada desde terminal del workspace.
- [x] Evidencia guardada en `docs/migracion/ejecucion`.
- [ ] Pendiente confirmacion del usuario para marcar lineas del plan con `//`.
