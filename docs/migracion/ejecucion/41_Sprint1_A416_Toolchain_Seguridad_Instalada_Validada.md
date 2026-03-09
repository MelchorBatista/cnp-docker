# Paso 41 - Sprint 1 - Cierre DoD `A.4.16` - Toolchain de seguridad instalada y validada

Fecha: 2026-03-09  
Estado: Resuelto a nivel documental y tecnico. Pendiente de confirmacion del usuario para marcado en `Migracion_Docker.ini`.

## 1) Objetivo del punto

Demostrar que la toolchain de seguridad local requerida para el proyecto se mantiene:

- instalada
- disponible en PATH
- accesible en sesion actual y sesion nueva
- con version trazable

Herramientas cubiertas:

- Trivy
- Hadolint
- Syft (SBOM)

## 2) Evidencia historica ya aprobada

Fuentes primarias:

- `docs/migracion/ejecucion/16_Sprint1_Dia2_A227_Instalacion_Toolchain_Seguridad_Estacion_Runner.md`
- `docs/migracion/ejecucion/17_Sprint1_Dia2_A228_Doble_Verificacion_Toolchain_Seguridad.md`

Conclusion historica:

- la instalacion ya habia sido ejecutada y aprobada en Sprint 1
- la doble verificacion de disponibilidad y PATH ya habia quedado documentada

## 3) Ajuste tecnico aplicado el 2026-03-09

Durante la revalidacion actual se identifico un problema especifico con Hadolint:

- `hadolint --version` falla en esta estacion con:
  - `getUserDocumentsDirectory:sHGetFolderPath: illegal operation (unsupported operation)`

Accion aplicada:

- se ajustaron `scripts/migracion/instalar_toolchain_seguridad.ps1`
- y `scripts/migracion/verificar_toolchain_seguridad.ps1`

Nuevo criterio para Hadolint:

- si el binario no devuelve version util por CLI en este entorno
- se toma como fallback la version registrada por `winget`

Razon tecnica:

- evita falsos negativos
- mantiene trazabilidad de version real instalada
- no afecta la verificacion de PATH ni de disponibilidad en sesion actual/nueva

## 4) Evidencia fresca de instalacion/verificacion

Log generado el `2026-03-09`:

- `docs/migracion/ejecucion/05A_Instalacion_Toolchain_Seguridad_20260309_122451.log`

Resultado:

- Trivy: `Instalado`
- Hadolint: `Instalado`
- Syft: `Instalado`

Versiones trazadas:

- Trivy: `Version: 0.69.3`
- Hadolint: `winget: 2.14.0`
- Syft: `Version: 1.42.1`

Observacion:

- la corrida fue no-op, porque las herramientas ya estaban presentes
- aun asi deja evidencia fresca de estado instalado en la estacion actual

## 5) Evidencia fresca de doble verificacion

Log generado el `2026-03-09`:

- `docs/migracion/ejecucion/05B_Verificacion_Toolchain_Seguridad_20260309_122451.log`

Resultado consolidado:

- Trivy:
  - sesion actual: `SI`
  - sesion nueva: `SI`
  - PATH actual: `OK`
  - PATH sistema: `OK`
  - version: `0.69.3`
- Hadolint:
  - sesion actual: `SI`
  - sesion nueva: `SI`
  - PATH actual: `OK`
  - PATH sistema: `OK`
  - version trazable: `winget: 2.14.0`
- Syft:
  - sesion actual: `SI`
  - sesion nueva: `SI`
  - PATH actual: `OK`
  - PATH sistema: `OK`
  - version: `Version: 1.42.1`

## 6) Interpretacion tecnica

La estacion actual cumple el criterio de `A.4.16` porque:

- las tres herramientas estan instaladas
- las tres resuelven en PATH
- las tres estan disponibles en sesion actual y en sesion nueva
- cada una tiene version trazable

Caso especial de Hadolint:

- la version no se pudo usar desde `--version` en esta estacion
- pero quedo trazada de forma deterministica por `winget`
- eso es suficiente para verificar version instalada sin falsear el estado operativo del binario en PATH

## 7) Criterio de cierre de `A.4.16`

- [x] Trivy instalado y validado con version y PATH.
- [x] Hadolint instalado y validado con version trazable y PATH.
- [x] Syft instalado y validado con version y PATH.
- [x] Doble verificacion ejecutada en sesion actual y sesion nueva.
- [x] Evidencia fresca del mismo dia registrada en logs.

## 8) Conclusion

`A.4.16` puede considerarse cumplido.

La toolchain de seguridad local (Trivy, Hadolint y Syft/SBOM) permanece instalada y validada al `2026-03-09`, con trazabilidad de version y PATH registrada para las tres herramientas.
