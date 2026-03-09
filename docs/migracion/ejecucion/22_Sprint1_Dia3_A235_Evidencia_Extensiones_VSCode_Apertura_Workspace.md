# Paso 22 - Sprint 1 - Dia 3 - Evidencia de extensiones VS Code y apertura de workspace (`A.2.3.5`)

Fecha: 2026-03-05  
Estado: Ejecutado - Pendiente de confirmacion del usuario

## 1) Objetivo del paso

Registrar evidencia verificable de:

- listado de extensiones obligatorias de VS Code
- apertura del workspace del proyecto sin errores

## 2) Script de verificacion utilizado

- `scripts/migracion/verificar_vscode_extensiones_workspace.ps1`

Comando ejecutado:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\migracion\verificar_vscode_extensiones_workspace.ps1
```

## 3) Criterios validados por el script

1. Extensiones requeridas instaladas:
   - `ms-azuretools.vscode-docker`
   - `ms-vscode-remote.remote-wsl`
   - `dbaeumer.vscode-eslint`
   - `esbenp.prettier-vscode`
   - `github.vscode-github-actions`
2. Apertura de workspace por CLI:
   - `code -n . --verbose`
3. Estado de instancia VS Code:
   - `code --status` con `Workspace Stats`

## 4) Resultado final de la verificacion

- Extensiones requeridas instaladas: `OK`
- Apertura de workspace por CLI: `OK`
- Estado de instancia VS Code: `OK`
- Codigo de salida del script: `0`

## 5) Evidencia generada

- Log exitoso de verificacion:
  - `docs/migracion/ejecucion/21B_Verificacion_VSCode_Extensiones_Workspace_20260305_085136.log`

Nota de trazabilidad:

- Se genero un log previo con falla por falso positivo de patron (`...085057.log`).
- El script se ajusto para validar firmas de error reales y evitar coincidencias validas de politica (`systemCertificates`).
- Luego de ese ajuste, la verificacion quedo en `OK`.

## 6) Criterio de cierre del punto `A.2.3.5`

- [x] Listado de extensiones obligatorias validado por CLI.
- [x] Apertura de workspace registrada sin errores.
- [x] Estado de instancia VS Code registrado con `Workspace Stats`.
- [x] Evidencia en log de ejecucion almacenada en `docs/migracion/ejecucion`.
- [ ] Confirmacion del usuario pendiente para marcar `A.2.3.5` con `//`.

