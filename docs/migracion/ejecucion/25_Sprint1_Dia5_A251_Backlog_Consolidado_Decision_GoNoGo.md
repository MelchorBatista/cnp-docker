# Paso 25 - Sprint 1 - Dia 5 - Backlog consolidado y decision go/no-go (`A.2.5.1`)

Fecha: 2026-03-05  
Estado: Ejecutado - Pendiente de confirmacion del usuario

## 1) Objetivo del paso

Consolidar el backlog prioritario de cierre de Sprint 1 y emitir una decision formal `go/no-go` basada en riesgos activos y prerequisitos pendientes.

## 2) Fuentes de entrada

1. `Migracion_Docker.js`
2. `docs/migracion/ejecucion/20_Sprint1_Dia3_A233_Documento_Stack_Tecnicas_Arquitectura.md`
3. `docs/migracion/ejecucion/23_Sprint1_Dia4_A241_Catalogo_Secretos_Estrategia_Institucional.md`
4. `docs/migracion/ejecucion/24_Sprint1_Dia4_A242_Matriz_Secretos_Registro_Riesgos.md`
5. `docs/migracion/ejecucion/25A_Backlog_Decision_GoNoGo_20260305_091327.log`

## 3) Backlog consolidado priorizado

| ID | Item backlog | Prioridad | Dependencias | Responsable | Esfuerzo estimado | Criterio de cierre | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| BLG-001 | Retirar `VITE_SECRET_KEY` del frontend y migrar la operacion sensible al backend | P0 | Ninguna | Frontend + Backend + Seguridad | 1 dia | Sin secretos en `VITE_*` y prueba funcional OK | Abierto |
| BLG-002 | Migrar secretos criticos de `backend/.env.production` a mecanismo institucional | P0 | BLG-001 | DevOps + Seguridad + Backend | 1 dia | Variables criticas inyectadas en runtime y fuera de repo | Abierto |
| BLG-003 | Definir provisionamiento institucional de llave privada JWT y validar carga | P0 | BLG-002 | Seguridad + DevOps | 0.5 dia | Llave montada readonly y verificada en ejecucion | Abierto |
| BLG-004 | Endurecer reglas de ignorado para `.env.*` y artefactos sensibles | P0 | Ninguna | Backend + DevOps | 0.5 dia | Regla de ignore validada y sin archivos sensibles versionados | Abierto |
| BLG-005 | Incorporar escaneo de secretos como gate de PR en CI | P1 | BLG-004 | DevOps + Seguridad | 1 dia | Pipeline falla ante secreto critico detectado | Abierto |
| BLG-006 | Formalizar bitacora de rotacion de secretos con fecha de vencimiento | P1 | BLG-002 | Seguridad + Operaciones | 0.5 dia | Bitacora publicada con responsables y periodicidad | Abierto |
| BLG-007 | Aprobar catalogo oficial de stack/tecnicas (`A.2.5.2`) | P0 | Ninguna | Lider tecnico + Operaciones | 0.5 dia | Documento aprobado y versionado | Pendiente |
| BLG-008 | Aprobar guia de instalacion completa (`A.2.5.2`) | P0 | BLG-007 | Lider tecnico + DevOps | 0.5 dia | Guia unica aprobada para estacion/runner/laptop | Pendiente |
| BLG-009 | Validar certificados TLS para STAGING (`A.2.5.3`) | P0 | Ninguna | Infra + Seguridad | 0.5 dia | Checklist TLS en estado OK | Pendiente |
| BLG-010 | Validar DNS y reglas firewall para STAGING (`A.2.5.3`) | P0 | BLG-009 | Redes + Infra | 0.5 dia | Resolucion y conectividad validadas | Pendiente |
| BLG-011 | Validar credenciales CI/CD y permisos de despliegue (`A.2.5.3`) | P0 | Ninguna | DevOps + Seguridad | 0.5 dia | Credenciales probadas con acceso controlado | Pendiente |
| BLG-012 | Validar acceso al registry privado (`A.2.5.3`) | P0 | BLG-011 | DevOps | 0.5 dia | Push/pull de prueba exitoso | Pendiente |
| BLG-013 | Confirmar ventana de cambio autorizada para STAGING (`A.2.5.3`) | P0 | Ninguna | Operaciones + Gestion de cambio | 0.5 dia | Ventana registrada y aprobada | Pendiente |

## 4) Criterios de decision `go/no-go` evaluados

| Criterio | Resultado | Justificacion |
| --- | --- | --- |
| C1. Backlog consolidado con prioridad, responsable y esfuerzo | CUMPLE | El backlog de cierre de Sprint 1 queda trazado en BLG-001 a BLG-013 |
| C2. Sin bloqueadores criticos activos para cierre del Sprint | NO CUMPLE | Persisten riesgos criticos de secretos y aprobaciones pendientes |
| C3. Prerequisitos externos de STAGING validados | NO CUMPLE | La validacion corresponde al punto `A.2.5.3`, aun no ejecutado |

## 5) Decision emitida en `A.2.5.1`

1. Estado de cierre de Sprint 1: `NO-GO TEMPORAL`.
2. Estado operativo para continuar secuencia interna del Dia 5: `GO` para ejecutar `A.2.5.2` y `A.2.5.3`.

## 6) Resultado del punto `A.2.5.1`

- [x] Backlog consolidado y priorizado con responsables/estimacion.
- [x] Decision formal go/no-go emitida y justificada.
- [x] Evidencia de trazabilidad registrada en log.
- [ ] Pendiente `Confirmado` del usuario para comentar `A.2.5.1`.

