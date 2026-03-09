# Paso 4 - Sprint 1 - Validacion de secuencia prerequisito -> requisito

Fecha: 2026-03-04  
Estado: Ejecutado - Confirmado por el usuario (2026-03-04)

## 1) Objetivo del paso

Verificar y corregir el orden del plan para asegurar que todo prerequisito tecnico, operativo y de seguridad quede antes del requisito que depende de el, evitando bloqueos de software o configuracion.

## 2) Cambios aplicados al plan

- Reordenamiento de Sprint 2 para ejecutar externalizacion de variables antes de levantar compose DEV.
- Reordenamiento de Sprint 3 para desplegar STAGING antes de validar SQL Server/SMTP desde STAGING.
- Inclusiones explicitas de prerequisitos externos previos a STAGING (TLS, DNS/firewall, credenciales CI/CD, registry y ventana de cambio).
- Inclusiones explicitas de pipeline CI/CD base antes de la primera publicacion en STAGING.
- Inclusiones explicitas de instalacion/validacion de toolchain de seguridad (Trivy, Hadolint, SBOM) con scripts PowerShell (`winget` y fallback `chocolatey`) y doble verificacion de version/PATH.

## 3) Verificaciones ejecutadas

- Auditoria de orden por dependencias con reglas `prerequisito < requisito`.
- Confirmacion de secuencias criticas:
  - Fase 0 -> inicio Sprint 1.
  - Variables -> compose DEV.
  - Prerequisitos externos -> despliegue STAGING.
  - Despliegue STAGING -> validaciones SQL/SMTP desde STAGING.
  - Toolchain de seguridad validada -> escaneo/SBOM.
  - Readiness + rollback probado -> despliegue en PRODUCCION.

Resultado: sin fallas bloqueantes de secuencia.

## 4) Evidencia tecnica

- Archivo actualizado: `C:\Desarrollo\cnp-docker\Migracion_Docker.js`.
- Resultado de validacion de orden: todas las reglas evaluadas en estado `OK`.
- Confirmacion del usuario recibida con la palabra `Confirmado`.

## 5) Checklist de cierre del paso

- [x] Analisis completo de dependencias del plan.
- [x] Reordenamiento aplicado donde habia riesgo de secuencia.
- [x] Prerequisitos de seguridad y CI/CD explicitados antes de su uso.
- [x] Evidencia registrada en `docs/migracion/ejecucion`.
- [x] Confirmado del usuario recibido; bloque marcado con `//` en el plan.
