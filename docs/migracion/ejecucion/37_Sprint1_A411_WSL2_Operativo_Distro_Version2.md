# Paso 37 - Sprint 1 - Cierre DoD `A.4.11` - WSL2 operativo y distro Linux en version 2

Fecha: 2026-03-09  
Estado: Resuelto a nivel documental y tecnico. Pendiente de confirmacion del usuario para marcado en `Migracion_Docker.ini`.

## 1) Objetivo del punto

Demostrar que la laptop objetivo mantiene:

- WSL2 operativo
- distro Linux principal en version `2`

sin mezclar este criterio con la disponibilidad actual del daemon de Docker, que pertenece al punto siguiente `A.4.12`.

## 2) Evidencia historica ya aprobada

Fuentes primarias:

- `docs/migracion/ejecucion/14_Sprint1_Dia2_A225_Instalacion_WSL2_Docker_Laptop.md`
- `docs/migracion/ejecucion/15_Sprint1_Dia2_A226_Evidencia_WSL_Docker_OK.md`

Hallazgos historicos relevantes:

- `wsl --status` ya habia reportado:
  - `Default Distribution: Ubuntu`
  - `Default Version: 2`
- `wsl -l -v` ya habia reportado:
  - `Ubuntu` en `VERSION 2`
  - `docker-desktop` en `VERSION 2`

Conclusion historica:

- el requisito base de WSL2 + distro en version `2` ya habia sido alcanzado durante Sprint 1

## 3) Revalidacion actual ejecutada el 2026-03-09

Comandos ejecutados desde esta estacion:

```powershell
wsl --status
wsl -l -v
```

Salidas observadas:

```text
Default Distribution: Ubuntu

Default Version: 2
```

```text
NAME              STATE           VERSION

* Ubuntu            Stopped         2
  docker-desktop    Stopped         2
```

Adicionalmente se genero una evidencia de verificacion fresca:

- `docs/migracion/ejecucion/14B_Verificacion_WSL_Docker_Laptop_20260309_114055.log`

## 4) Interpretacion tecnica

Resultado de `wsl --status`:

- WSL esta instalado y operativo
- la distribucion por defecto sigue siendo `Ubuntu`
- la version por defecto sigue siendo `2`

Resultado de `wsl -l -v`:

- la distro Linux principal `Ubuntu` permanece en `VERSION 2`
- `docker-desktop` tambien permanece en `VERSION 2`

Nota operativa:

- que las distros aparezcan como `Stopped` no invalida este punto
- el criterio de `A.4.11` exige WSL2 operativo y distro en version `2`, no que la distro este ejecutandose de forma permanente

## 5) Separacion explicita respecto a `A.4.12`

En la misma verificacion del `2026-03-09`, `docker version` fallo porque el daemon no estaba disponible:

- `failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine`

Ese hallazgo:

- no bloquea `A.4.11`
- si impacta la evaluacion de `A.4.12` (Docker Desktop operativo con integracion WSL2 activa)

## 6) Criterio de cierre de `A.4.11`

- [x] `wsl --status` confirma `Default Version: 2`.
- [x] `wsl --status` confirma `Default Distribution: Ubuntu`.
- [x] `wsl -l -v` confirma `Ubuntu` en `VERSION 2`.
- [x] Existe evidencia historica aprobada y revalidacion actual.
- [x] El punto queda desacoplado correctamente del estado actual de Docker Desktop.

## 7) Conclusion

`A.4.11` puede considerarse cumplido.

WSL sigue operativo y la distro Linux principal sigue en version `2` al `2026-03-09`. El siguiente punto debe evaluarse aparte porque hoy Docker Desktop no respondio en `docker version`.
