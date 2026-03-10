# Paso 44 - Sprint 2 - Pipeline CI base Docker DEV (`B.2.2.2`)

Fecha: `2026-03-09`

## Objetivo

Configurar el pipeline CI/CD base del Sprint 2 para cubrir, sobre las imagenes Docker del proyecto:

- build reproducible por servicio
- lint de Dockerfiles con Hadolint
- scan de imagenes con Trivy
- generacion de SBOM con Syft
- empaquetado local exportable de artefactos Docker

## Cambios implementados

### 1. Workflow CI

Se actualizo [ci.yml](c:\Desarrollo\cnp-docker\.github\workflows\ci.yml) con un job nuevo:

- `docker-build-scan-package-dev`

Caracteristicas del job:

- corre en `ubuntu-latest`
- depende de `build-and-test`
- ejecuta el pipeline base Docker del Sprint 2
- publica artifacts con logs `44*` y el directorio `evidence/docker_dev_ci`

## 2. Script de pipeline base

Se agrego [ejecutar_pipeline_base_docker_dev_ci.ps1](c:\Desarrollo\cnp-docker\scripts\migracion\ejecutar_pipeline_base_docker_dev_ci.ps1).

Responsabilidades:

- determinar `sha-<gitsha7>` y tag `dev`
- construir `cnp-backend`, `cnp-frontend` y `cnp-proxy`
- registrar metadata OCI
- ejecutar Hadolint
- ejecutar Trivy
- generar SBOM con Syft
- delegar el empaquetado local a un script dedicado
- producir logs `44A` a `44G`

Detalle importante:

- si `hadolint`, `trivy` o `syft` existen en PATH local, el script los usa directamente
- si no existen y el pipeline corre en Linux, el script puede caer a contenedores oficiales versionados
- en Windows local no se fuerza fallback por contenedor para Trivy/Syft, porque el acceso al daemon por socket no es equivalente al de Linux

## 3. Script de empaquetado DEV/CI

Se agrego [preparar_paquete_artefactos_docker_dev_ci.ps1](c:\Desarrollo\cnp-docker\scripts\migracion\preparar_paquete_artefactos_docker_dev_ci.ps1).

El paquete generado incluye:

- `cnp-backend.tar`
- `cnp-frontend.tar`
- `cnp-proxy.tar`
- `manifest.json`
- `checksums.sha256`
- `backend.env.example`
- `Estandar_Imagenes_Versionado_Docker.md`
- reportes `trivy` y `sbom`

## 4. Metadata OCI incorporada

Se ajustaron los runtime Dockerfiles:

- [backend/Dockerfile](c:\Desarrollo\cnp-docker\backend\Dockerfile)
- [frontend/Dockerfile](c:\Desarrollo\cnp-docker\frontend\Dockerfile)
- [proxy/Dockerfile](c:\Desarrollo\cnp-docker\proxy\Dockerfile)

Ahora aceptan y publican:

- `org.opencontainers.image.title`
- `org.opencontainers.image.version`
- `org.opencontainers.image.revision`
- `org.opencontainers.image.source`
- `org.opencontainers.image.created`

## Validacion local ejecutada

Se ejecuto:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\migracion\ejecutar_pipeline_base_docker_dev_ci.ps1
```

Resultado:

- `OK`
- tag inmutable generado: `sha-97e66a7`
- tags de entorno generados: `dev`
- paquete exportado en [pipeline_20260309_152028\paquete](c:\Desarrollo\cnp-docker\evidence\docker_dev_ci\pipeline_20260309_152028\paquete)

Logs principales:

- [44A_Toolchain_Pipeline_Base_Docker_DEV_CI_20260309_152028.log](c:\Desarrollo\cnp-docker\docs\migracion\ejecucion\44A_Toolchain_Pipeline_Base_Docker_DEV_CI_20260309_152028.log)
- [44B_Docker_Build_BACKEND_20260309_152028.log](c:\Desarrollo\cnp-docker\docs\migracion\ejecucion\44B_Docker_Build_BACKEND_20260309_152028.log)
- [44B_Docker_Build_FRONTEND_20260309_152028.log](c:\Desarrollo\cnp-docker\docs\migracion\ejecucion\44B_Docker_Build_FRONTEND_20260309_152028.log)
- [44B_Docker_Build_PROXY_20260309_152028.log](c:\Desarrollo\cnp-docker\docs\migracion\ejecucion\44B_Docker_Build_PROXY_20260309_152028.log)
- [44C_Hadolint_BACKEND_20260309_152028.log](c:\Desarrollo\cnp-docker\docs\migracion\ejecucion\44C_Hadolint_BACKEND_20260309_152028.log)
- [44D_Trivy_BACKEND_20260309_152028.log](c:\Desarrollo\cnp-docker\docs\migracion\ejecucion\44D_Trivy_BACKEND_20260309_152028.log)
- [44E_Syft_BACKEND_20260309_152028.log](c:\Desarrollo\cnp-docker\docs\migracion\ejecucion\44E_Syft_BACKEND_20260309_152028.log)
- [44F_Paquete_Docker_DEV_CI_20260309_152028.log](c:\Desarrollo\cnp-docker\docs\migracion\ejecucion\44F_Paquete_Docker_DEV_CI_20260309_152028.log)
- [44G_Resumen_Pipeline_Base_Docker_DEV_CI_20260309_152028.log](c:\Desarrollo\cnp-docker\docs\migracion\ejecucion\44G_Resumen_Pipeline_Base_Docker_DEV_CI_20260309_152028.log)

Reportes generados en el paquete:

- `backend-trivy.json`
- `frontend-trivy.json`
- `proxy-trivy.json`
- `backend-sbom.spdx.json`
- `frontend-sbom.spdx.json`
- `proxy-sbom.spdx.json`

## Observaciones

1. Hadolint emitio una advertencia en backend por `DL3008`:
   - `apt-get install` sin version pinneada
2. El pipeline no falla por warnings de Hadolint; el umbral actual es `error`
3. El paso `B.2.2.2` queda cubierto por configuracion y validacion local
4. La evidencia de ejecucion del workflow en rama de integracion se reserva para `B.2.2.4`

## Conclusion

`B.2.2.2` puede considerarse resuelto:

- existe pipeline base para build, lint, scan, SBOM y empaquetado
- la logica esta versionada en el repositorio
- la corrida local completa fue satisfactoria
- el workflow CI ya tiene el job correspondiente listo para publicar artifacts
