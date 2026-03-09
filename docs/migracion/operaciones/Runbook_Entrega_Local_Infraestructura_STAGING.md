# Runbook de Entrega Local a Infraestructura - STAGING

## Objetivo
Preparar en la laptop de desarrollo el paquete local de entrega Docker para que infraestructura lo despliegue posteriormente en `c1491`.

## Topologia SQL vigente
- `VALIDACION`: `q1491n2023 / TablasComunes` - catalogos, solo lectura.
- `CONSULTA`: `d1491n2023 / DBCSASPv2` - views de consulta, solo lectura logica.
- `RECEPCION`: `d1491n2023 / DBCSASPv2` - operaciones de lectura y escritura.

## Restricciones vigentes
- `c1491` es administrado por infraestructura. Sprint 1 no depende de SSH a ese servidor.
- `CONSULTA` y `RECEPCION` comparten hoy el mismo servidor y credenciales. Si se requiere solo lectura real para `CONSULTA`, infraestructura/DBA debe emitir credenciales dedicadas.
- No se requiere registry privado para la primera entrega a infraestructura.

## Contenido obligatorio del paquete
- `cnp-backend.tar`
- `cnp-frontend.tar`
- `cnp-proxy.tar`
- `docker-compose.staging.yml`
- `backend.env.example`
- `Runbook_Entrega_Local_Infraestructura_STAGING.md`
- `manifest.json`
- `checksums.sha256`

## Paso 1. Verificar prerrequisitos locales
Ejecutar:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\migracion\verificar_prerequisitos_locales_dual_sql.ps1
```

Resultado esperado:
- `WSL: OK`
- `Docker version: OK`
- `Docker info: OK`
- `VALIDACION permisos: OK`
- `CONSULTA permisos: OK`
- `RECEPCION permisos: OK`

## Paso 2. Construir imagenes localmente
Etiquetas sugeridas:
- `cnp-backend:staging`
- `cnp-frontend:staging`
- `cnp-proxy:staging`

Compose de referencia requerido por infraestructura:
- `docker-compose.staging.yml`
- servicios definidos: `proxy`, `frontend`, `backend`
- publicacion objetivo: `proxy` expone `80/443`; `frontend` y `backend` solo en red interna
- dependencia externa: SQL Server institucional fuera de Docker Compose
- rutas publicas esperadas: `/cnp`, `/api`, `/socket.io`, `/cnp/socket.io`

## Paso 3. Exportar paquete para infraestructura
Ejecutar:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\migracion\preparar_paquete_entrega_local_infraestructura.ps1
```

Resultado esperado:
- directorio `evidence/paquete_staging_local`
- imagenes exportadas en `.tar`
- copia local del compose, plantilla de entorno y runbook
- archivos `manifest.json` y `checksums.sha256`

## Paso 4. Validar manifest y checksums
`manifest.json` debe definir:
- fecha de generacion del paquete
- directorio de salida
- algoritmo de checksum usado (`SHA256`)
- imagenes exportadas con `nombre`, `categoria`, `etiqueta`, `archivo`, `sha256` y `tamanoBytes`
- archivos de soporte con `nombre`, `categoria`, `archivo`, `sha256` y `tamanoBytes`

`checksums.sha256` debe definir:
- una linea `SHA256 *archivo` por cada `.tar`
- una linea por `docker-compose.staging.yml`, `backend.env.example` y `Runbook_Entrega_Local_Infraestructura_STAGING.md`
- una linea por `manifest.json`
- exclusion explicita de `checksums.sha256` para evitar auto-referencia circular

Comando sugerido de revision:

```powershell
Get-Content .\evidence\paquete_staging_local\checksums.sha256
```

## Criterio de salida
La entrega local solo puede declararse lista cuando:
- Docker local construye y exporta las imagenes.
- `VALIDACION` prueba solo lectura.
- `CONSULTA` prueba solo lectura.
- `RECEPCION` prueba lectura/escritura.
- `manifest.json` y `checksums.sha256` describen el mismo paquete exportado.
