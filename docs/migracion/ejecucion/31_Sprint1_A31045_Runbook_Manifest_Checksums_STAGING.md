# Paso 31 - Sprint 1 - Runbook, manifest y checksums del paquete STAGING (`A.3.10.4`, `A.3.10.5`)

## 1) Objetivo
Formalizar el runbook en espanol para la entrega local a infraestructura y dejar definida la estructura minima de `manifest.json` y `checksums.sha256` del paquete STAGING.

## 2) Archivos actualizados
- `docs/migracion/operaciones/Runbook_Entrega_Local_Infraestructura_STAGING.md`
- `scripts/migracion/preparar_paquete_entrega_local_infraestructura.ps1`

## 3) Ajustes aplicados
### 3.1 Runbook
- Se documento el contenido obligatorio del paquete local STAGING.
- Se agrego una validacion explicita de `manifest.json` y `checksums.sha256`.
- Se dejo trazado que el paquete incluye imagenes `.tar`, compose, plantilla de entorno, runbook y metadatos.

### 3.2 Script de empaquetado
- Se agrego el parametro `RutaRunbook`.
- El script copia el runbook al directorio de salida.
- Cada artefacto exportado ahora registra `categoria`, `sha256` y `tamanoBytes`.
- `checksums.sha256` ahora cubre imagenes `.tar`, archivos de soporte y `manifest.json`.
- `checksums.sha256` no se auto-firma para evitar dependencia circular.

## 4) Definicion operativa del paquete
Artefactos esperados por defecto en `evidence/paquete_staging_local`:
- `cnp-backend.tar`
- `cnp-frontend.tar`
- `cnp-proxy.tar`
- `docker-compose.staging.yml`
- `backend.env.example`
- `Runbook_Entrega_Local_Infraestructura_STAGING.md`
- `manifest.json`
- `checksums.sha256`

## 5) Validacion tecnica
- Sintaxis PowerShell del script validada con el parser del runtime local.
- La generacion completa del paquete queda condicionada a disponer de las imagenes `cnp-backend:staging`, `cnp-frontend:staging` y `cnp-proxy:staging`.

## 6) Estado frente al plan
- `A.3.10.4`: listo para cierre documental.
- `A.3.10.5`: listo para cierre documental.
- `Migracion_Docker.ini`: pendiente de marcar con `#` hasta validacion del usuario con la palabra `Confirmado`, segun la regla de trazabilidad del plan.
