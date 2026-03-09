# Paso 11 - Sprint 1 - Dia 2 - Instalacion base en estaciones de desarrollo (`A.2.2.2`)

Fecha: 2026-03-04  
Estado: Ejecutado - Confirmado por el usuario (2026-03-04). Actualizado el 2026-03-06 para alinear el baseline oficial a Node.js 24.x.

## 1) Objetivo del paso

Ejecutar instalacion base de herramientas en estaciones de desarrollo, con enfoque en:

- Git
- Node.js 24.x
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
- Node.js 24.x: `OK`
  - Version activa detectada en PATH: `v24.14.0`
  - Resultado: la estacion ya cumple el baseline aprobado actual.
- npm: `OK`
  - Version detectada: `11.9.0`
- OpenSSL: `OK`
  - Instalada y valida en PATH.
  - Version detectada: `OpenSSL 3.6.1 27 Jan 2026`
- curl: `OK`
  - Version detectada: `curl 8.16.0`

## 5) Evidencia de logs

- Instalacion (alineada a baseline Node 24.x):  
  `docs/migracion/ejecucion/11A_Instalacion_Herramientas_Base_Estaciones_20260306_130214.log`
- Verificacion (alineada a baseline Node 24.x):  
  `docs/migracion/ejecucion/11B_Verificacion_Herramientas_Base_Estaciones_20260306_130214.log`

## 6) Estado de alineacion y remediacion

Estado actual:

- La estacion usa `Node.js v24.14.0` en PATH.
- Esa version cumple el baseline aprobado `24.x`.
- No existe bloqueo abierto para este punto.

Remediacion futura si una estacion diverge del baseline:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\migracion\ajustar_node24_admin.ps1
```

Resultado esperado tras remediacion:

- `node --version` debe iniciar con `v24.`
- `npm --version` disponible y funcional.

## 7) Checklist del paso

- [x] Script de instalacion base en estaciones creado.
- [x] Script de verificacion (sesion actual + sesion nueva + PATH) creado.
- [x] Git validado.
- [x] npm validado.
- [x] OpenSSL instalado y validado.
- [x] curl validado.
- [x] Node.js 24.x activo en PATH.
- [x] `Confirmado` del usuario recibido y `A.2.2.2` marcado en el plan.
