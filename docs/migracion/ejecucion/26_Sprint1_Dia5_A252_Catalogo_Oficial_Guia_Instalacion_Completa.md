# Paso 26 - Sprint 1 - Dia 5 - Catalogo oficial y guia de instalacion completa (`A.2.5.2`)

Fecha: 2026-03-05  
Estado: Ejecutado - Pendiente de confirmacion del usuario

## 1) Objetivo del paso

Aprobar una referencia oficial unica para el proyecto que incluya:

- catalogo oficial de tecnologias, herramientas y tecnicas
- guia de instalacion completa para estacion de desarrollo, runner CI y laptop Windows 11 con VS Code

## 2) Fuentes consolidadas

1. `docs/migracion/ejecucion/10_Sprint1_Dia2_A221_Inventario_Tecnico.md`
2. `docs/migracion/ejecucion/11_Sprint1_Dia2_A222_Instalacion_Base_Estaciones.md`
3. `docs/migracion/ejecucion/12_Sprint1_Dia2_A223_Instalacion_Base_Runner_CI.md`
4. `docs/migracion/ejecucion/13_Sprint1_Dia2_A224_Checklist_Instalacion_Comandos_Validados.md`
5. `docs/migracion/ejecucion/14_Sprint1_Dia2_A225_Instalacion_WSL2_Docker_Laptop.md`
6. `docs/migracion/ejecucion/15_Sprint1_Dia2_A226_Evidencia_WSL_Docker_OK.md`
7. `docs/migracion/ejecucion/16_Sprint1_Dia2_A227_Instalacion_Toolchain_Seguridad_Estacion_Runner.md`
8. `docs/migracion/ejecucion/17_Sprint1_Dia2_A228_Doble_Verificacion_Toolchain_Seguridad.md`
9. `docs/migracion/ejecucion/18_Sprint1_Dia3_A231_Tecnicas_Transversales.md`
10. `docs/migracion/ejecucion/20_Sprint1_Dia3_A233_Documento_Stack_Tecnicas_Arquitectura.md`
11. `docs/migracion/ejecucion/21_Sprint1_Dia3_A234_Configuracion_VSCode_Docker_WSL.md`
12. `docs/migracion/ejecucion/22_Sprint1_Dia3_A235_Evidencia_Extensiones_VSCode_Apertura_Workspace.md`
13. `backend/package.json`
14. `frontend/package.json`
15. `.github/workflows/ci.yml`
16. `docs/migracion/ejecucion/26A_Catalogo_Oficial_Guia_Instalacion_20260305_092434.log`

## 3) Catalogo oficial aprobado

### 3.1 Tecnologias base del sistema

| Componente | Estandar oficial | Version objetivo |
| --- | --- | --- |
| Runtime backend/frontend | Node.js LTS | 18.x (minimo `>=18.17.0`) |
| Lenguaje backend/frontend | TypeScript | 5.x |
| Frontend | React | 18.x |
| Build frontend | Vite | 6.x |
| API backend | Express | 4.x |
| Tiempo real | Socket.IO | 4.x |
| Proxy reverso | Nginx | estable |
| Base de datos | SQL Server institucional | obligatorio y no reemplazable |

### 3.2 Herramientas operativas oficiales

| Herramienta | Uso oficial |
| --- | --- |
| Git | control de versiones |
| npm | gestion de dependencias y scripts |
| Docker Desktop / Docker Engine | construccion y ejecucion de contenedores |
| Docker Compose v2 | orquestacion local y de entorno |
| WSL2 (Windows) | capa Linux para Docker Desktop |
| OpenSSL | operaciones criptograficas y validaciones |
| curl | pruebas tecnicas de conectividad/endpoints |

### 3.3 Herramientas oficiales de calidad y seguridad

| Herramienta | Proposito |
| --- | --- |
| ESLint | reglas de calidad de codigo |
| Prettier | formato de codigo |
| Jest | pruebas automatizadas backend |
| Trivy | escaneo de vulnerabilidades |
| Hadolint | validacion de Dockerfiles |
| Syft (SBOM) | generacion y trazabilidad SBOM |

### 3.4 Tecnicas oficiales de trabajo

1. Multi-stage builds para imagenes.
2. Configuracion por entorno (12-factor).
3. Healthchecks tecnicos obligatorios.
4. Versionado semantico y trazabilidad por commit.
5. PR gates en CI para calidad/seguridad.
6. Promocion por entornos: DEV -> STAGING -> PRODUCCION.

## 4) Guia de instalacion completa aprobada

## 4.1 Estacion de desarrollo (Windows)

### 4.1.1 Instalacion base

Comandos:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\migracion\instalar_herramientas_base_estaciones.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\migracion\verificar_herramientas_base_estaciones.ps1
```

Validaciones minimas:

```powershell
git --version
node --version
npm --version
openssl version
curl --version
```

Nota operativa:

- Si `node --version` no devuelve `v18.x`, ejecutar remediacion administrativa:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\migracion\ajustar_node18_admin.ps1
```

### 4.1.2 Toolchain de seguridad

Comandos:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\migracion\instalar_toolchain_seguridad.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\migracion\verificar_toolchain_seguridad.ps1
```

## 4.2 Runner de CI (Windows-latest)

Ejecucion oficial en workflow:

- `.github/workflows/ci.yml`
- Job `baseline-toolchain-runner-ci`
- Job `security-toolchain-runner-ci`

Scripts ejecutados por CI:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\migracion\instalar_herramientas_base_runner_ci.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\migracion\verificar_herramientas_base_runner_ci.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\migracion\instalar_toolchain_seguridad.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\migracion\verificar_toolchain_seguridad.ps1
```

Artifacts de evidencia:

- `evidencia-a223-herramientas-base-runner-ci`
- `evidencia-a227-toolchain-seguridad-runner-ci`

## 4.3 Laptop Windows 11 + WSL2 + Docker + VS Code

### 4.3.1 WSL2 y Docker Desktop

Comandos:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\migracion\instalar_wsl2_docker_laptop.ps1
```

Si se requiere elevacion:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\migracion\instalar_wsl2_docker_admin.ps1
```

Verificacion:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\migracion\verificar_wsl_docker_laptop.ps1
```

### 4.3.2 VS Code para Docker/WSL

Comandos:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\migracion\instalar_configurar_vscode_docker_wsl.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\migracion\verificar_vscode_extensiones_workspace.ps1
```

Extensiones obligatorias:

- `ms-azuretools.vscode-docker`
- `ms-vscode-remote.remote-wsl`
- `dbaeumer.vscode-eslint`
- `esbenp.prettier-vscode`
- `github.vscode-github-actions`

## 4.4 Reglas de doble verificacion obligatoria

1. Versiones y PATH en sesion actual.
2. Versiones y PATH en sesion nueva.
3. Logs de evidencia en `docs/migracion/ejecucion`.
4. Uso prioritario de `winget` con fallback `chocolatey` segun scripts oficiales.

## 5) Criterios de aprobacion del catalogo y la guia

1. Cobertura completa de instalacion para estacion, CI y laptop.
2. Coherencia con stack real del repositorio y con workflow CI.
3. Definicion explicita de herramientas base, calidad y seguridad.
4. Trazabilidad por documentos y logs de evidencia del Sprint 1.

Resultado de evaluacion:

- Catalogo oficial: `APROBADO`.
- Guia de instalacion completa: `APROBADA`.
- Nota de cumplimiento: el ajuste local a Node 18 en estaciones con Node 24 se mantiene como remediacion operativa obligatoria.

## 6) Resultado del punto `A.2.5.2`

- [x] Catalogo oficial consolidado y aprobado.
- [x] Guia de instalacion completa consolidada y aprobada.
- [x] Trazabilidad de fuentes y evidencia registrada.
- [ ] Pendiente `Confirmado` del usuario para comentar `A.2.5.2`.

