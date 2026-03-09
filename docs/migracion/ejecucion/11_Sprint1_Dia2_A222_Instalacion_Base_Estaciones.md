# Paso 11 - Sprint 1 - Dia 2 - Instalacion base en estaciones de desarrollo (`A.2.2.2`)

Fecha: 2026-03-04  
Estado: Ejecutado - Confirmado por el usuario (2026-03-04) con desviacion tecnica registrada en Node.js 18

## 1) Objetivo del paso

Ejecutar instalacion base de herramientas en estaciones de desarrollo, con enfoque en:

- Git
- Node.js 18 LTS
- npm
- OpenSSL
- curl

Cumpliendo instalacion con `winget` y fallback a `chocolatey` cuando aplique.

## 2) Artefactos creados

- `scripts/migracion/instalar_herramientas_base_estaciones.ps1`
- `scripts/migracion/verificar_herramientas_base_estaciones.ps1`

## 3) Ejecucion realizada en terminal de VS Code

Comandos ejecutados:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\migracion\instalar_herramientas_base_estaciones.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\migracion\verificar_herramientas_base_estaciones.ps1
```

## 4) Resultado tecnico por herramienta

- Git: `OK`
  - Version detectada: `git version 2.53.0.windows.1`
- Node.js 18 LTS: `FALLA`
  - Version activa detectada en PATH: `v24.14.0`
  - Intento `winget` para `OpenJS.NodeJS.18` ejecutado.
  - Resultado: se instala paquete de usuario, pero el comando `node` sigue resolviendo contra instalacion previa de maquina.
- npm: `OK`
  - Version detectada: `11.9.0`
- OpenSSL: `OK`
  - Instalada y valida en PATH.
  - Version detectada: `OpenSSL 3.6.1 27 Jan 2026`
- curl: `OK`
  - Version detectada: `curl 8.16.0`

## 5) Evidencia de logs

- Instalacion (ejecucion final):  
  `docs/migracion/ejecucion/11A_Instalacion_Herramientas_Base_Estaciones_20260304_165158.log`
- Verificacion (ejecucion final):  
  `docs/migracion/ejecucion/11B_Verificacion_Herramientas_Base_Estaciones_20260304_171315.log`

## 6) Bloqueo identificado y remediacion requerida

Bloqueo:

- La estacion tiene Node.js de maquina (`v24.14.0`) priorizado en PATH.
- El cambio efectivo a `Node.js 18` requiere operacion con privilegios de administrador para reemplazar/desinstalar instalacion de maquina.

Remediacion propuesta (PowerShell elevado):

```powershell
winget uninstall --id OpenJS.NodeJS.LTS --silent --disable-interactivity
winget install --id OpenJS.NodeJS.18 --exact --scope machine --silent --accept-package-agreements --accept-source-agreements --disable-interactivity
node --version
npm --version
```

Resultado esperado tras remediacion:

- `node --version` debe iniciar con `v18.`
- `npm --version` disponible y funcional.

## 7) Checklist del paso

- [x] Script de instalacion base en estaciones creado.
- [x] Script de verificacion (sesion actual + sesion nueva + PATH) creado.
- [x] Git validado.
- [x] npm validado.
- [x] OpenSSL instalado y validado.
- [x] curl validado.
- [ ] Node.js 18 activo en PATH (pendiente por privilegios de administrador).
- [x] `Confirmado` del usuario recibido y `A.2.2.2` marcado en el plan.
