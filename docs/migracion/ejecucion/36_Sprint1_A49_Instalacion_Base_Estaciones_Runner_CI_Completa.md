# Paso 36 - Sprint 1 - Cierre DoD `A.4.9` - Instalacion base completada en estaciones objetivo y runner CI

Fecha: 2026-03-09  
Estado: Resuelto a nivel documental y tecnico. Pendiente de confirmacion del usuario para marcado en `Migracion_Docker.ini`.

## 1) Objetivo del punto

Demostrar que la instalacion base del entorno objetivo ya fue completada y validada en:

- estaciones de desarrollo objetivo
- runner de CI Windows

para el baseline aprobado del Sprint 1:

- Git
- Node.js 24.x
- npm
- OpenSSL
- curl

## 2) Evidencia primaria en estaciones objetivo

Fuente principal: `A.2.2.2`

Documento:

- `docs/migracion/ejecucion/11_Sprint1_Dia2_A222_Instalacion_Base_Estaciones.md`

Evidencia referenciada:

- `docs/migracion/ejecucion/11A_Instalacion_Herramientas_Base_Estaciones_20260306_130214.log`
- `docs/migracion/ejecucion/11B_Verificacion_Herramientas_Base_Estaciones_20260306_130214.log`

Resultado consolidado:

- Git: `OK`
- Node.js 24.x: `OK` (`v24.14.0`)
- npm: `OK`
- OpenSSL: `OK`
- curl: `OK`

Conclusion parcial:

- la estacion objetivo cumple el baseline oficial vigente
- no hay bloqueo abierto documentado para este punto

## 3) Evidencia primaria en runner CI

Fuente principal: `A.2.2.3`

Documento:

- `docs/migracion/ejecucion/12_Sprint1_Dia2_A223_Instalacion_Base_Runner_CI.md`

Evidencia referenciada:

- `docs/migracion/ejecucion/11C_Instalacion_Herramientas_Base_Runner_CI_20260306_130215.log`
- `docs/migracion/ejecucion/11D_Verificacion_Herramientas_Base_Runner_CI_20260306_130214.log`

Resultado consolidado:

- Git: `OK`
- Node.js 24.x: `OK`
- npm: `OK`
- OpenSSL: `OK`
- curl: `OK`

Conclusion parcial:

- la instalacion base del runner CI fue ejecutada y verificada con logs trazables
- el paso `A.2.2.3` ya habia quedado confirmado por el usuario durante Sprint 1

## 4) Evidencia consolidada adicional

Documento de checklist:

- `docs/migracion/ejecucion/13_Sprint1_Dia2_A224_Checklist_Instalacion_Comandos_Validados.md`

Ese documento confirma:

- comandos de validacion estandar documentados
- versionado esperado trazado para estacion y runner
- resultado `5/5 OK` en ambos contextos

## 5) Correccion de deriva detectada el 2026-03-09

Durante la revision de `A.4.9` se detecto que el archivo `.github/workflows/ci.yml` ya no reflejaba el job documentado `baseline-toolchain-runner-ci`.

Accion aplicada:

- se restauro en `.github/workflows/ci.yml` el trigger `workflow_dispatch`
- se restauro el job `baseline-toolchain-runner-ci` en `windows-latest`
- se restauro el job `security-toolchain-runner-ci` con dependencia `needs: baseline-toolchain-runner-ci`

Alcance de la correccion:

- alinea el repositorio actual con la evidencia aprobada en `A.2.2.3`, `A.2.2.7` y `A.2.2.8`
- evita que `A.4.9` quede sustentado por documentacion que ya no coincide con el workflow real

## 6) Criterio de cierre de `A.4.9`

- [x] Instalacion base en estaciones objetivo completada y trazable.
- [x] Instalacion base en runner CI completada y trazable.
- [x] Checklist consolidado de comandos/versiones disponible.
- [x] Workflow actual alineado con la evidencia documental del runner.
- [x] Sin pendiente critico abierto para este punto.

## 7) Conclusion

`A.4.9` puede considerarse cumplido.

La evidencia historica ya existia en `A.2.2.2`, `A.2.2.3` y `A.2.2.4`; en esta revision solo se consolido el cierre del DoD y se corrigio la deriva del workflow para que el estado actual del repositorio vuelva a coincidir con esa evidencia.
