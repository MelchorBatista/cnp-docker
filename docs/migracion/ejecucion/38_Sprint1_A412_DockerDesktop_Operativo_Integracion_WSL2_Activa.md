# Paso 38 - Sprint 1 - Cierre DoD `A.4.12` - Docker Desktop operativo con integracion WSL2 activa

Fecha: 2026-03-09  
Estado: Resuelto a nivel documental y tecnico. Pendiente de confirmacion del usuario para marcado en `Migracion_Docker.ini`.

## 1) Objetivo del punto

Demostrar que la laptop objetivo mantiene:

- Docker Desktop operativo
- daemon Docker accesible
- backend Linux activo sobre WSL2
- integracion WSL2 activa con `docker-desktop` en version `2`

## 2) Evidencia historica ya aprobada

Fuentes primarias:

- `docs/migracion/ejecucion/14_Sprint1_Dia2_A225_Instalacion_WSL2_Docker_Laptop.md`
- `docs/migracion/ejecucion/15_Sprint1_Dia2_A226_Evidencia_WSL_Docker_OK.md`

Conclusion historica:

- Docker Desktop ya habia sido instalado y validado durante Sprint 1
- existia evidencia previa de `docker version` en estado `OK`
- existia evidencia previa de `docker-desktop` presente en WSL2

## 3) Incidencia detectada el 2026-03-09

Durante la revision inicial de `A.4.12`, a las `11:40` aprox., se detecto que el estado actual ya no cumplia el criterio.

Evidencia de esa incidencia:

- `docs/migracion/ejecucion/14B_Verificacion_WSL_Docker_Laptop_20260309_114055.log`

Hallazgo clave:

- `docker version` fallo con el mensaje:
  - `failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine`

Interpretacion:

- el cliente Docker existia
- WSL2 seguia instalado
- pero Docker Desktop no estaba corriendo en ese momento, por lo que `A.4.12` no podia darse por cumplido todavia

## 4) Remediacion aplicada el 2026-03-09

Accion ejecutada desde terminal:

```powershell
docker desktop start
```

Resultado inmediato:

- Docker Desktop inicio correctamente
- `docker desktop status` paso a `running`

Observacion adicional:

- en `C:\Users\dionicio.batista\AppData\Roaming\Docker\settings-store.json` se observo `AutoStart: false`
- eso explica por que el entorno pudo aparecer detenido al inicio de la revision de hoy

## 5) Revalidacion posterior exitosa

Tras la remediacion, se repitio la verificacion formal y se genero evidencia fresca:

- `docs/migracion/ejecucion/14B_Verificacion_WSL_Docker_Laptop_20260309_114622.log`

Validaciones confirmadas:

### 5.1 Estado de Docker Desktop

`docker desktop status`:

- `Status: running`

### 5.2 Daemon Docker operativo

`docker version`:

- cliente activo `29.2.1`
- servidor activo `Docker Desktop 4.63.0 (220185)`
- engine `29.2.1`
- `OS/Arch: linux/amd64`

### 5.3 Backend Linux sobre WSL2

`docker context show`:

- `desktop-linux`

`docker info`:

- `Operating System: Docker Desktop`
- `OSType: linux`
- `Kernel Version: 6.6.87.2-microsoft-standard-WSL2`
- `Name: docker-desktop`
- `CPUs: 4`
- `Total Memory: 5.788 GiB` aprox.

### 5.4 Integracion WSL2 activa

`wsl -l -v`:

```text
NAME              STATE           VERSION

* Ubuntu            Running         2
  docker-desktop    Running         2
```

Interpretacion:

- la distro principal sigue operando en WSL2
- la distro interna `docker-desktop` esta levantada y en version `2`
- el backend activo de Docker Desktop esta efectivamente integrado con WSL2

## 6) Nota sobre `com.docker.service`

Durante la validacion se observo que el servicio Windows `com.docker.service` figuraba `Manual/Stopped`.

Eso no invalida este punto porque:

- `docker desktop status` reporto `running`
- `docker version` respondio con cliente y servidor
- `docker info` reporto kernel `WSL2`
- `docker-desktop` aparecio `Running` en `wsl -l -v`

Por tanto, el criterio de aceptacion se basa en la operatividad real del engine y de la integracion WSL2, no en que ese servicio Windows particular permanezca iniciado de forma aislada.

## 7) Criterio de cierre de `A.4.12`

- [x] Docker Desktop arranca correctamente.
- [x] `docker version` responde con cliente y servidor.
- [x] `docker info` confirma backend Linux sobre kernel WSL2.
- [x] `docker context show` confirma `desktop-linux`.
- [x] `wsl -l -v` confirma `docker-desktop` en `Running` y `VERSION 2`.
- [x] Existe evidencia fresca del mismo dia posterior a la remediacion.

## 8) Conclusion

`A.4.12` puede considerarse cumplido al `2026-03-09`.

La incidencia observada mas temprano el mismo dia fue remediada arrancando Docker Desktop. Desde ese momento el daemon responde, el contexto activo es `desktop-linux` y la integracion con WSL2 esta activa nuevamente.
