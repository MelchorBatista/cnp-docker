# Runbook de Entrega Local a Infraestructura - STAGING

## Objetivo
Preparar en la laptop de desarrollo el paquete de entrega de Docker para que infraestructura lo despliegue posteriormente en `c1491`.

## Topologia SQL vigente
- `VALIDACION`: `q1491n2023 / TablasComunes` - catalogos, solo lectura.
- `CONSULTA`: `d1491n2023 / DBCSASPv2` - views de consulta, solo lectura logica.
- `RECEPCION`: `d1491n2023 / DBCSASPv2` - operaciones de lectura y escritura.

## Restricciones vigentes
- `c1491` es administrado por infraestructura. Sprint 1 no depende de SSH a ese servidor.
- `CONSULTA` y `RECEPCION` comparten hoy el mismo servidor y credenciales. Si se requiere solo lectura real para `CONSULTA`, infraestructura/DBA debe emitir credenciales dedicadas.
- No se requiere registry privado para la primera entrega a infraestructura.

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

## Paso 3. Exportar paquete para infraestructura
Ejecutar:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\migracion\preparar_paquete_entrega_local_infraestructura.ps1
```

## Criterio de salida
La entrega local solo puede declararse lista cuando:
- Docker local construye y exporta las imagenes.
- `VALIDACION` prueba solo lectura.
- `CONSULTA` prueba solo lectura.
- `RECEPCION` prueba lectura/escritura.