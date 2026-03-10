# Paso 46 - Sprint 2 - Evidencia de build local, pipeline de integracion y artefactos (`B.2.2.4`)

Fecha: `2026-03-10`

## Objetivo

Cerrar `B.2.2.4` con evidencia trazable de:

- build local exitoso de imagenes
- ejecucion exitosa del workflow en rama de integracion
- artefactos locales exportables
- registros de verificacion de herramientas

## Correccion estructural necesaria

Antes de este cierre, el workflow remoto no podia ejecutarse correctamente en GitHub Actions porque el repo raiz publicaba `backend` y `frontend` como gitlinks vacios.

Evidencia historica del fallo:

- run `22724948485` (`push`, `2026-03-05`)
- run `22725120648` (`pull_request`, `2026-03-05`)
- ambos fallaban en `build-and-test` con `cd: backend: No such file or directory`

Correccion aplicada para habilitar la rama de integracion:

- `backend` y `frontend` pasaron a quedar versionados como arboles normales dentro del repo raiz
- se mantuvo el respaldo local de los `.git` anidados fuera del arbol de trabajo
- se ajusto [ci.yml](c:\Desarrollo\cnp-docker\.github\workflows\ci.yml) para ejecutar `npm test --silent -- --passWithNoTests`

## Validacion local final

Se revalido el pipeline Docker base desde el repo raiz ya corregido:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\migracion\ejecutar_pipeline_base_docker_dev_ci.ps1 -ExigirHerramientasLocales
```

Resultado:

- `OK`
- tag inmutable local: `sha-c03d6c7`
- paquete local generado en [pipeline_20260310_095352\paquete](c:\Desarrollo\cnp-docker\evidence\docker_dev_ci\pipeline_20260310_095352\paquete)

Registros locales asociados:

- [44A_Toolchain_Pipeline_Base_Docker_DEV_CI_20260310_095352.log](c:\Desarrollo\cnp-docker\docs\migracion\ejecucion\44A_Toolchain_Pipeline_Base_Docker_DEV_CI_20260310_095352.log)
- [44B_Docker_Build_BACKEND_20260310_095352.log](c:\Desarrollo\cnp-docker\docs\migracion\ejecucion\44B_Docker_Build_BACKEND_20260310_095352.log)
- [44B_Docker_Build_FRONTEND_20260310_095352.log](c:\Desarrollo\cnp-docker\docs\migracion\ejecucion\44B_Docker_Build_FRONTEND_20260310_095352.log)
- [44B_Docker_Build_PROXY_20260310_095352.log](c:\Desarrollo\cnp-docker\docs\migracion\ejecucion\44B_Docker_Build_PROXY_20260310_095352.log)
- [44C_Hadolint_BACKEND_20260310_095352.log](c:\Desarrollo\cnp-docker\docs\migracion\ejecucion\44C_Hadolint_BACKEND_20260310_095352.log)
- [44D_Trivy_BACKEND_20260310_095352.log](c:\Desarrollo\cnp-docker\docs\migracion\ejecucion\44D_Trivy_BACKEND_20260310_095352.log)
- [44E_Syft_BACKEND_20260310_095352.log](c:\Desarrollo\cnp-docker\docs\migracion\ejecucion\44E_Syft_BACKEND_20260310_095352.log)
- [44F_Paquete_Docker_DEV_CI_20260310_095352.log](c:\Desarrollo\cnp-docker\docs\migracion\ejecucion\44F_Paquete_Docker_DEV_CI_20260310_095352.log)
- [44G_Resumen_Pipeline_Base_Docker_DEV_CI_20260310_095352.log](c:\Desarrollo\cnp-docker\docs\migracion\ejecucion\44G_Resumen_Pipeline_Base_Docker_DEV_CI_20260310_095352.log)

## Ejecucion remota en rama de integracion

Workflow remoto validado:

- repo: `MelchorBatista/cnp-docker`
- branch: `feature/staging-prerequisitos`
- commit: `6508960fc4570c0d06bf157eb06dbc2e80af489a`
- run id: `22906227699`
- evento: `push`
- inicio: `2026-03-10T14:00:24Z`
- fin: `2026-03-10T14:03:19Z`
- URL: <https://github.com/MelchorBatista/cnp-docker/actions/runs/22906227699>

Jobs completados en `success`:

1. `build-and-test`
   - job id: `66465526996`
   - ventana: `2026-03-10T14:00:27Z` -> `2026-03-10T14:00:52Z`
2. `Baseline Toolchain Runner CI (A.2.2.3)`
   - job id: `66465527314`
   - ventana: `2026-03-10T14:00:27Z` -> `2026-03-10T14:00:51Z`
3. `Security Toolchain Runner CI (A.2.2.7-A.2.2.8)`
   - job id: `66465603094`
   - ventana: `2026-03-10T14:00:55Z` -> `2026-03-10T14:02:25Z`
4. `Docker Build Scan Package DEV (B.2.2.2)`
   - job id: `66465606126`
   - ventana: `2026-03-10T14:00:55Z` -> `2026-03-10T14:03:18Z`

Hechos relevantes extraidos de logs remotos:

- `build-and-test` ejecuto `cd backend`, `npm ci`, `npm run typecheck`, `npm test --silent -- --passWithNoTests` y `npm audit`
- `Run tests` termino con `No tests found, exiting with code 0`
- `Docker Build Scan Package DEV` provisiono y verifico Trivy, Hadolint y Syft
- el pipeline Docker remoto reporto:
  - `Pipeline base Docker DEV/CI ejecutado correctamente.`
  - `Tag inmutable: sha-6508960`
  - `Paquete DEV/CI generado en: /home/runner/work/cnp-docker/cnp-docker/./evidence/docker_dev_ci/pipeline_20260310_140118/paquete`

## Artefactos remotos publicados

Artefactos confirmados por la API y por los logs del job Docker:

1. `evidencia-b223-toolchain-seguridad-runner-docker-ci`
   - artifact id: `5850697484`
   - size: `3087` bytes
   - digest: `1693969b607c3b56fafcf1f9143c5247dcb6262136832e4edfa9debe6f845a6c`
   - creado: `2026-03-10T14:02:54Z`
   - URL: <https://github.com/MelchorBatista/cnp-docker/actions/runs/22906227699/artifacts/5850697484>

2. `evidencia-b222-pipeline-base-docker-dev-ci`
   - artifact id: `5850704364`
   - size: `420543746` bytes
   - digest: `b41063a2128eeea3cb7afeab20d1942a0d0be74a3960e29deb9819086b9dc888`
   - creado: `2026-03-10T14:03:15Z`
   - URL: <https://github.com/MelchorBatista/cnp-docker/actions/runs/22906227699/artifacts/5850704364>

El job remoto reporto adicionalmente:

- `evidencia-b223...`: `3` archivos subidos
- `evidencia-b222...`: `102` archivos subidos

## Registro resumen adicional

Se agrego el resumen estructurado:

- [46A_Integracion_GitHubActions_B224_20260310_140319.log](c:\Desarrollo\cnp-docker\docs\migracion\ejecucion\46A_Integracion_GitHubActions_B224_20260310_140319.log)

## Conclusion

`B.2.2.4` puede considerarse resuelto a nivel tecnico y documental:

- el build local de imagenes fue revalidado sobre el arbol corregido
- la rama de integracion ejecuto el workflow `CI` con resultado global `success`
- el pipeline Docker remoto genero y publico artifacts verificables
- los registros de verificacion de herramientas quedaron trazados tanto localmente como en la corrida remota
