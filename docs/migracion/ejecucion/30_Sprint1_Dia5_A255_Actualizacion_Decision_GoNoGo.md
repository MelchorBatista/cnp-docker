# Paso 30 - Sprint 1 - Dia 5 - Actualizacion formal de decision go/no-go (`A.3.6`)

Fecha: 2026-03-06  
Estado: Ejecutado - Pendiente de confirmacion del usuario

## 1) Objetivo del paso

Emitir una actualizacion formal y trazable de la decision `go/no-go` del Sprint 1, sin reescribir la evidencia historica del Paso 25.

## 2) Decision previa que queda referenciada

Documento base:

- `docs/migracion/ejecucion/25_Sprint1_Dia5_A251_Backlog_Consolidado_Decision_GoNoGo.md`

Decision historica registrada el 2026-03-05:

1. Estado de cierre de Sprint 1: `NO-GO TEMPORAL`.
2. Estado operativo interno: `GO` para continuar con remediaciones de Dia 5.

La decision anterior fue correcta para su momento porque todavia existian bloqueadores tecnicos y de prerrequisitos.

## 3) Hechos nuevos que justifican la actualizacion

Desde la decision original del 2026-03-05 se completaron las siguientes remediaciones relevantes:

1. Se corrigio y valido la topologia SQL del proyecto:
   - `VALIDACION` -> `q1491n2023 / TablasComunes`
   - `CONSULTA` -> `d1491n2023 / DBCSASPv2`
   - `RECEPCION` -> `d1491n2023 / DBCSASPv2`
2. Se validaron localmente los prerrequisitos tecnicos de Sprint 1:
   - `wsl --status`
   - `docker version`
   - `docker info`
   - conectividad a `VALIDACION`, `CONSULTA` y `RECEPCION`
3. Se comprobo conectividad desde el entorno Docker/WSL hacia los hosts SQL institucionales.
4. Se actualizo el baseline oficial de runtime a `Node.js 24.x` y se alino:
   - CI
   - `package.json`
   - scripts PowerShell
   - catalogo y guia oficial
5. Se restauro y valido la evidencia documental obligatoria de Sprint 1 que habia quedado fuera del working tree.

## 4) Criterios de re-evaluacion

| Criterio | Estado actual | Justificacion |
| --- | --- | --- |
| C1. Existe backlog priorizado con responsables y esfuerzo | CUMPLE | Paso 25 sigue vigente y trazable |
| C2. Los prerrequisitos tecnicos locales para continuar la dockerizacion quedaron resueltos | CUMPLE | Docker, WSL y SQL validados localmente |
| C3. La arquitectura y el contrato tecnico de conexiones quedaron definidos | CUMPLE | VALIDACION / CONSULTA / RECEPCION documentadas y separadas |
| C4. El baseline de herramientas ya no tiene contradicciones operativas criticas | CUMPLE | Node 24.x alineado en docs, CI y scripts |
| C5. Persisten bloqueadores que impidan continuar con Sprint B | NO | No persisten bloqueadores tecnicos de continuidad local |

## 5) Riesgos residuales aceptados

1. `CONSULTA` se mantiene como solo lectura por diseno de aplicacion, no por restriccion SQL dedicada.
2. La validacion de despliegue sobre `c1491` sigue fuera de Sprint 1 porque ese servidor depende del departamento de infraestructura.
3. Existe una observacion tecnica futura sobre confianza TLS/CA en ciertos flujos de paquetes dentro de contenedores Alpine; no bloquea el cierre actual de Sprint 1.

## 6) Decision actualizada

Se emite la siguiente decision supersedente:

1. La decision historica `NO-GO TEMPORAL` del 2026-03-05 queda **levantada** para fines de continuidad del programa.
2. El estado actual de Sprint 1 pasa a: `GO`.
3. El alcance de este `GO` es:
   - cerrar los puntos documentales pendientes de Sprint 1
   - habilitar el inicio de Sprint 2 una vez completado el cierre del bloque `A`
4. Este `GO` **no** significa:
   - despliegue aprobado en `STAGING`
   - entrega aprobada a infraestructura
   - promocion a `PRODUCCION`

## 7) Evidencias de soporte

1. `docs/migracion/ejecucion/25_Sprint1_Dia5_A251_Backlog_Consolidado_Decision_GoNoGo.md`
2. `docs/migracion/ejecucion/29_Sprint1_Dia5_A253_Prerequisitos_Locales_Dual_SQL.md`
3. `docs/migracion/ejecucion/26_Sprint1_Dia5_A252_Catalogo_Oficial_Guia_Instalacion_Completa.md`
4. `docs/migracion/ejecucion/20_Sprint1_Dia3_A233_Documento_Stack_Tecnicas_Arquitectura.md`
5. `docs/migracion/ejecucion/30A_Actualizacion_Decision_GoNoGo_20260306_140520.log`

## 8) Resultado del punto `A.3.6`

- [x] Decision formal previa preservada sin alteracion historica.
- [x] Re-evaluacion tecnica realizada con criterios explicitos.
- [x] Decision supersedente `GO` emitida con alcance definido.
- [ ] Pendiente `Confirmado` del usuario para comentar `A.3.6`.
