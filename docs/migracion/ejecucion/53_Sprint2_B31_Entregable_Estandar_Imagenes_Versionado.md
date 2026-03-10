# Paso 53 - Sprint 2 - Entregable obligatorio: estandar de imagenes y versionado (`B.3.1`)

Fecha: 2026-03-10
Estado: Ejecutado - Pendiente de confirmacion del usuario

## 1) Objetivo del paso

Cerrar `B.3.1` como entregable obligatorio del Sprint 2, verificando que el repositorio ya contiene un estandar versionado y que ese estandar sigue alineado con la implementacion actual de:

- Dockerfiles
- pipeline Docker DEV/CI
- CI del repositorio

## 2) Entregable obligatorio identificado

El entregable requerido por `B.3.1` queda materializado en:

- `docs/migracion/operaciones/Estandar_Imagenes_Versionado_Docker.md`

En este paso se actualizo su encabezado para dejarlo explicitamente vigente tanto para:

- `B.2.1.1`
- `B.3.1`

## 3) Base documental ya aprobada

El trabajo de definicion del estandar ya habia quedado resuelto en:

- `docs/migracion/ejecucion/42_Sprint2_B211_Estandar_Imagenes_Versionado.md`

Ese paso dejo fijados:

- nombres canonicos `cnp-backend`, `cnp-frontend`, `cnp-proxy`
- prohibicion de `latest`
- tag inmutable `sha-<gitsha7>`
- tags de entorno `dev`, `staging`, `prod`
- familias `node:24-bookworm-slim` y `nginx:1.27-alpine`
- metadata OCI obligatoria

`B.3.1` no redefine ese estandar; valida que ya existe como entregable obligatorio y que sigue siendo consistente con el estado real del repositorio.

## 4) Revalidacion tecnica ejecutada

Se genero una evidencia nueva de conformance:

- `docs/migracion/ejecucion/53A_Validacion_Entregable_Estandar_Imagenes_20260310_141125.log`

La validacion cubrio:

1. presencia y contenido del documento normativo
2. base images y metadata OCI en:
   - `backend/Dockerfile`
   - `frontend/Dockerfile`
   - `proxy/Dockerfile`
3. tagging y nombres canonicos en:
   - `scripts/migracion/ejecutar_pipeline_base_docker_dev_ci.ps1`
   - `.github/workflows/ci.yml`

## 5) Resultado observado

La evidencia actual confirma:

- `backend/Dockerfile` usa `node:24-bookworm-slim` y etiquetas OCI para `cnp-backend`
- `frontend/Dockerfile` usa `node:24-bookworm-slim` + `nginx:1.27-alpine` y etiquetas OCI para `cnp-frontend`
- `proxy/Dockerfile` usa `nginx:1.27-alpine` y etiquetas OCI para `cnp-proxy`
- `ejecutar_pipeline_base_docker_dev_ci.ps1` genera `TagInmutable = sha-<gitsha7>`
- el pipeline sigue construyendo con los repositorios canonicos:
  - `cnp-backend`
  - `cnp-frontend`
  - `cnp-proxy`
- la CI del repositorio sigue alineada al baseline `Node 24`

## 6) Resultado del paso

`B.3.1` puede considerarse resuelto.

El Sprint 2 ya tiene el entregable obligatorio de estandar de imagenes y versionado:

- versionado
- trazable
- reutilizable
- consistente con Dockerfiles y pipeline vigentes

## 7) Conclusion

El siguiente pendiente en secuencia dentro de `B.3` es `B.3.2`.
