# Paso 21 - Sprint 1 - Dia 3 - Configuracion de VS Code para Docker/WSL (`A.2.3.4`)

Fecha: 2026-03-05  
Estado: Ejecutado - Confirmado por el usuario (2026-03-05)

## 1) Objetivo del paso

Completar instalacion y configuracion de VS Code para trabajo con Docker y WSL en la laptop objetivo.

## 2) Script ejecutado

- `scripts/migracion/instalar_configurar_vscode_docker_wsl.ps1`

Comando:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\migracion\instalar_configurar_vscode_docker_wsl.ps1
```

## 3) Extensiones objetivo y resultado

Extensiones requeridas:

- `ms-azuretools.vscode-docker` (Docker)
- `ms-vscode-remote.remote-wsl` (Remote - WSL)
- `dbaeumer.vscode-eslint` (ESLint)
- `esbenp.prettier-vscode` (Prettier)
- `github.vscode-github-actions` (GitHub Actions)

Resultado final:

- Todas las extensiones quedaron instaladas.
- Codigo de salida del script: `0`.

## 4) Configuracion aplicada

### 4.1 Recomendaciones del workspace

Archivo generado/actualizado:

- `.vscode/extensions.json`

Incluye las extensiones obligatorias del proyecto para Docker/WSL.

### 4.2 Ajuste tecnico de conectividad para marketplace

Bloqueo detectado inicialmente:

- `self signed certificate in certificate chain` al instalar extensiones con `code --install-extension`.

Ajuste aplicado en configuracion de usuario de VS Code:

- `%APPDATA%\\Code\\User\\settings.json`
  - `"http.proxyStrictSSL": false`
  - `"http.systemCertificates": false`

Con este ajuste, la instalacion de extensiones se completo correctamente.

## 5) Evidencia

- Log de ejecucion:
  - `docs/migracion/ejecucion/21A_Instalacion_Config_VSCode_Docker_WSL_20260305_084215.log`
- Lista de extensiones verificadas por CLI:
  - Docker
  - Remote - WSL
  - ESLint
  - Prettier
  - GitHub Actions

## 6) Relacion con el siguiente punto

El punto `A.2.3.5` usara esta base para registrar evidencia formal de:

- listado completo de extensiones VS Code
- validacion de apertura del workspace sin errores

## 7) Criterio de cierre del punto `A.2.3.4`

- [x] Extensiones obligatorias instaladas en VS Code.
- [x] Workspace configurado con recomendaciones de extensiones.
- [x] Bloqueo de certificados documentado y mitigado.
- [x] Evidencia de ejecucion generada.
- [x] `Confirmado` del usuario recibido y `A.2.3.4` marcado en el plan.
