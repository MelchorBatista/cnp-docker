# Paso 39 - Sprint 1 - Cierre DoD `A.4.13` - VS Code preparado para el proyecto

Fecha: 2026-03-09  
Estado: Resuelto a nivel documental y tecnico. Pendiente de confirmacion del usuario para marcado en `Migracion_Docker.ini`.

## 1) Objetivo del punto

Demostrar que la estacion actual mantiene VS Code preparado para el proyecto, con:

- extensiones obligatorias instaladas
- recomendaciones del workspace presentes
- apertura del workspace por CLI sin errores
- estado operativo de la instancia de VS Code

## 2) Evidencia historica ya aprobada

Fuentes primarias:

- `docs/migracion/ejecucion/21_Sprint1_Dia3_A234_Configuracion_VSCode_Docker_WSL.md`
- `docs/migracion/ejecucion/22_Sprint1_Dia3_A235_Evidencia_Extensiones_VSCode_Apertura_Workspace.md`

Conclusion historica:

- `A.2.3.4` ya habia dejado instaladas las extensiones obligatorias
- `A.2.3.5` ya habia dejado evidencia de apertura del workspace y estado `OK`

## 3) Desvio detectado el 2026-03-09

En la revalidacion inicial de hoy se genero:

- `docs/migracion/ejecucion/21B_Verificacion_VSCode_Extensiones_Workspace_20260309_114948.log`

Ese intento reporto `FALLA`, pero el origen no era la falta real de extensiones.

Causa tecnica identificada:

- los scripts `instalar_configurar_vscode_docker_wsl.ps1` y `verificar_vscode_extensiones_workspace.ps1`
- estaban resolviendo `Code.exe` en lugar de `code.cmd`
- en Windows eso hace que argumentos como `--list-extensions`, `-n` y `--status` se interpreten incorrectamente

Impacto:

- falso negativo en la verificacion
- no evidencia un problema real del entorno VS Code, sino del metodo de comprobacion

## 4) Correccion aplicada

Se ajustaron ambos scripts para priorizar el CLI correcto en Windows:

- `code.cmd`
- fallback a `code`
- fallback final a `C:\Program Files\Microsoft VS Code\bin\code.cmd`

Adicionalmente:

- se reejecuto `scripts/migracion/instalar_configurar_vscode_docker_wsl.ps1`
- se restauro `C:\Desarrollo\cnp-docker\.vscode\extensions.json`

## 5) Revalidacion posterior exitosa

### 5.1 Reinstalacion/configuracion

Evidencia fresca:

- `docs/migracion/ejecucion/21A_Instalacion_Config_VSCode_Docker_WSL_20260309_115101.log`

Resultado:

- todas las extensiones requeridas ya estaban instaladas
- no hubo faltantes ni reinstalacion efectiva
- se actualizo `.vscode/extensions.json`

Extensiones obligatorias confirmadas:

- `ms-azuretools.vscode-docker`
- `ms-vscode-remote.remote-wsl`
- `dbaeumer.vscode-eslint`
- `esbenp.prettier-vscode`
- `github.vscode-github-actions`

### 5.2 Verificacion formal

Evidencia fresca:

- `docs/migracion/ejecucion/21B_Verificacion_VSCode_Extensiones_Workspace_20260309_115110.log`

Resultados validados:

- extensiones requeridas instaladas: `OK`
- apertura de workspace por CLI (`code -n . --verbose`): `OK`
- estado de instancia VS Code (`code --status`): `OK`

Datos tecnicos relevantes del log:

- CLI detectado: `C:\Program Files\Microsoft VS Code\bin\code.cmd`
- version de VS Code: `1.111.0`
- arquitectura: `x64`
- `Workspace Stats` presentes para `cnp-docker`

## 6) Estado actual del workspace

Archivo de recomendaciones presente:

- `C:\Desarrollo\cnp-docker\.vscode\extensions.json`

Contenido esperado:

- Docker
- Remote - WSL
- ESLint
- Prettier
- GitHub Actions

## 7) Criterio de cierre de `A.4.13`

- [x] Extensiones obligatorias instaladas.
- [x] Workspace con recomendaciones de extensiones presente.
- [x] Apertura de workspace por CLI validada.
- [x] Estado operativo de VS Code validado con `Workspace Stats`.
- [x] La verificacion actual queda corregida y trazable.

## 8) Conclusion

`A.4.13` puede considerarse cumplido.

El fallo observado al inicio de la revision del `2026-03-09` fue un falso negativo del script por uso de `Code.exe`. Una vez corregida esa resolucion, la estacion confirma que VS Code sigue preparado para el proyecto y mantiene instaladas las extensiones obligatorias.
