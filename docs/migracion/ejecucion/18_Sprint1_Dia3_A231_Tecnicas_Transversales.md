# Paso 18 - Sprint 1 - Dia 3 - Tecnicas transversales del proyecto (`A.2.3.1`)

Fecha: 2026-03-04  
Estado: Ejecutado - Confirmado por el usuario (2026-03-04)

## 1) Objetivo del paso

Definir el marco transversal del proyecto para:

- Build
- Seguridad
- Calidad
- Despliegue

con lineamientos aplicables a frontend, backend, proxy y pipeline CI/CD.

## 2) Alcance y principios base

Principios aprobados para todo el proyecto:

1. Reproducibilidad: mismo resultado en DEV, CI, STAGING y PRODUCCION.
2. Trazabilidad: cada build debe quedar asociada a version de codigo y evidencia.
3. Seguridad por defecto: sin secretos en repositorio y con scans automatizados.
4. Promocion controlada: despliegue por etapas, con validaciones y rollback.

## 3) Tecnicas transversales de build

### 3.1 Estandar de version y runtime

- Runtime oficial de aplicacion: Node.js 24.x (alineado a `engines` del backend/frontend y CI).
- Gestor de paquetes: `npm` con `npm ci` en CI para instalar desde lockfile.
- Prohibido compilar con versiones no controladas en pipeline oficial.

### 3.2 Estandar de compilacion por componente

- Backend:
  - `npm run typecheck`
  - `npm run build`
- Frontend:
  - `npm run build`

### 3.3 Estandar de imagen Docker (objetivo de sprints siguientes)

- Multi-stage build obligatorio para reducir superficie y tamano.
- Imagen runtime sin toolchain de compilacion.
- Tags de imagen con convencion:
  - `v<semver>`
  - `sha-<commit-corto>`
- Metadata OCI minima: repositorio, commit, fecha de build.

### 3.4 Artefactos y evidencia

- Cada build debe registrar:
  - version
  - commit
  - resultado
  - log de ejecucion

## 4) Tecnicas transversales de seguridad

### 4.1 Gestion de secretos

- Secretos fuera del repositorio (`.env` productivo no versionado).
- Variables sensibles deben inyectarse por entorno.
- Rotacion y trazabilidad definidas en matriz de secretos (paso de Dia 4).

### 4.2 Scanning obligatorio

- Trivy: analisis de vulnerabilidades.
- Hadolint: validacion de Dockerfile.
- Syft: generacion/validacion SBOM.

Ejecucion requerida:

- En estacion (VS Code terminal): instalado y verificado.
- En runner CI: instalado y verificado con artifacts de evidencia.

### 4.3 Hardening base para contenedores (objetivo)

- Usuario no root en runtime cuando el servicio lo permita.
- Solo puertos necesarios expuestos.
- Limitar permisos de filesystem y red.

## 5) Tecnicas transversales de calidad

### 5.1 Gates minimos en CI

Para backend (ya presente en workflow):

- `npm ci`
- `npm run typecheck`
- `npm test --silent`
- `npm audit --audit-level=moderate || true`

Para frontend (objetivo de integracion):

- `npm ci`
- `npm run lint`
- `npm run build`

### 5.2 Estandar de codigo

- ESLint y Prettier como base de consistencia.
- TypeScript con chequeo estricto por componente.
- Tests como condicion de avance de cambios criticos.

## 6) Tecnicas transversales de despliegue

### 6.1 Promocion por entornos

Secuencia obligatoria:

1. DEV
2. STAGING
3. PRODUCCION

Sin evidencia en STAGING no se autoriza salida a PRODUCCION.

### 6.2 Healthcheck y smoke tests

- Endpoint de salud backend: `/health`.
- Validaciones minimas por despliegue:
  - respuesta de `/cnp`
  - respuesta de `/api`
  - handshake de `/socket.io`

### 6.3 Rollback

- Mantener imagen previa conocida como estable.
- Si falla smoke o monitoreo inicial:
  - revertir a imagen estable previa
  - registrar incidente y causa raiz

## 7) Estado actual vs objetivo inmediato

Estado actual ya disponible:

- Toolchain base de estacion y runner definida.
- Toolchain de seguridad instalada/verificada con logs.
- WSL2 + Docker Desktop operativos en laptop objetivo.
- CI backend activo con typecheck/test/audit.

Objetivo inmediato para pasos siguientes:

- Completar topologia detallada (`A.2.3.2`).
- Consolidar documento integrado stack + tecnicas + arquitectura (`A.2.3.3`).

## 8) Criterio de cierre del punto `A.2.3.1`

- [x] Tecnicas de build definidas.
- [x] Tecnicas de seguridad definidas.
- [x] Tecnicas de calidad definidas.
- [x] Tecnicas de despliegue definidas.
- [x] Relacion con estado actual y siguiente secuencia documentada.
- [x] `Confirmado` del usuario recibido y `A.2.3.1` marcado en el plan.
