[CmdletBinding()]
param(
    [string]$ArchivoCompose = '',
    [string]$Proyecto = 'cnp-dev'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Obtener-RaizProyecto {
    param(
        [Parameter(Mandatory = $true)]
        [string]$RutaInicio
    )

    $rutaActual = (Resolve-Path $RutaInicio).Path
    while ($true) {
        if (Test-Path (Join-Path $rutaActual '.git')) {
            return $rutaActual
        }

        $rutaPadre = Split-Path -Parent $rutaActual
        if ($rutaPadre -eq $rutaActual) {
            return (Resolve-Path $RutaInicio).Path
        }

        $rutaActual = $rutaPadre
    }
}

function Ejecutar-Paso {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Descripcion,
        [Parameter(Mandatory = $true)]
        [scriptblock]$Script
    )

    Write-Host "==> $Descripcion"
    & $Script
    if ($LASTEXITCODE -ne 0) {
        throw "Fallo el paso: $Descripcion"
    }
}

function Verificar-ArchivosObligatorios {
    param(
        [Parameter(Mandatory = $true)]
        [string]$RaizProyecto
    )

    $rutasObligatorias = @(
        'docker-compose.dev.yml',
        'scripts/migracion/levantar_stack_compose_dev.ps1',
        'scripts/migracion/verificar_healthchecks_stack_dev.ps1',
        'scripts/migracion/verificar_rutas_publicas_stack_dev.ps1',
        'docs/migracion/operaciones/Estandar_Imagenes_Versionado_Docker.md',
        'docs/migracion/operaciones/Matriz_Variables_Entorno_Docker_CNP.md',
        'docs/migracion/operaciones/Runbook_Validacion_Rutas_DEV.md',
        'docs/migracion/ejecucion/42_Sprint2_B211_Estandar_Imagenes_Versionado.md',
        'docs/migracion/ejecucion/43_Sprint2_B221_Dockerfiles_Backend_Frontend_Proxy.md',
        'docs/migracion/ejecucion/44_Sprint2_B222_Pipeline_CI_Base_Docker_DEV.md',
        'docs/migracion/ejecucion/45_Sprint2_B223_Toolchain_Seguridad_Runner_CI_Docker.md',
        'docs/migracion/ejecucion/46_Sprint2_B224_Evidencia_Build_Local_Pipeline_Integracion_Artefactos.md',
        'docs/migracion/ejecucion/47_Sprint2_B231_Externalizar_Variables_Eliminar_Localhost_Critico.md',
        'docs/migracion/ejecucion/48_Sprint2_B232_Matriz_Variables_Validada.md',
        'docs/migracion/ejecucion/49_Sprint2_B241_Stack_DEV_Compose_Definido_Levantado.md',
        'docs/migracion/ejecucion/50_Sprint2_B242_Servicios_Arriba_Healthchecks_OK.md',
        'docs/migracion/ejecucion/51_Sprint2_B251_Validacion_Rutas_DEV_Runbook_Publicado.md'
    )

    foreach ($rutaRelativa in $rutasObligatorias) {
        $rutaAbsoluta = Join-Path $RaizProyecto $rutaRelativa
        if (-not (Test-Path $rutaAbsoluta)) {
            throw "No existe el archivo obligatorio del checklist DEV: $rutaRelativa"
        }

        Write-Host "Archivo OK: $rutaRelativa"
    }
}

function Mostrar-MetadataImagen {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Imagen
    )

    $salida = docker image inspect $Imagen --format '{{json .RepoTags}}|{{.Id}}|{{.Created}}'
    if ($LASTEXITCODE -ne 0) {
        throw "No se pudo inspeccionar la imagen requerida: $Imagen"
    }

    foreach ($linea in ($salida -split "\r?\n" | Where-Object { $_ -and $_.Trim() })) {
        $partes = $linea.Split('|')
        Write-Host "Imagen: $($partes[0])"
        Write-Host "  Id: $($partes[1])"
        Write-Host "  Created: $($partes[2])"
    }
}

$raizProyecto = Obtener-RaizProyecto -RutaInicio $PSScriptRoot

if (-not $ArchivoCompose) {
    $ArchivoCompose = Join-Path $raizProyecto 'docker-compose.dev.yml'
}
elseif (-not [System.IO.Path]::IsPathRooted($ArchivoCompose)) {
    $ArchivoCompose = Join-Path $raizProyecto $ArchivoCompose
}

if (-not (Test-Path $ArchivoCompose)) {
    throw "No existe el archivo compose DEV: $ArchivoCompose"
}

$argumentosCompose = @('-p', $Proyecto, '-f', $ArchivoCompose)
$scriptHealthchecks = Join-Path $raizProyecto 'scripts/migracion/verificar_healthchecks_stack_dev.ps1'
$scriptRutas = Join-Path $raizProyecto 'scripts/migracion/verificar_rutas_publicas_stack_dev.ps1'

Ejecutar-Paso -Descripcion 'Verificar Docker Compose' -Script {
    docker compose version
}

Ejecutar-Paso -Descripcion 'Verificar archivos obligatorios del checklist DEV' -Script {
    Verificar-ArchivosObligatorios -RaizProyecto $raizProyecto
}

Ejecutar-Paso -Descripcion 'Validar configuracion docker-compose.dev.yml' -Script {
    docker compose @argumentosCompose config
}

Ejecutar-Paso -Descripcion 'Inspeccionar imagenes DEV requeridas' -Script {
    Mostrar-MetadataImagen -Imagen 'cnp-backend:dev'
    Mostrar-MetadataImagen -Imagen 'cnp-frontend:dev'
    Mostrar-MetadataImagen -Imagen 'cnp-proxy:dev'
}

Ejecutar-Paso -Descripcion 'Verificar healthchecks del stack DEV' -Script {
    powershell -NoProfile -ExecutionPolicy Bypass -File $scriptHealthchecks -ArchivoCompose $ArchivoCompose -Proyecto $Proyecto -VerificarProxyPublicado
}

Ejecutar-Paso -Descripcion 'Verificar rutas publicas del stack DEV' -Script {
    powershell -NoProfile -ExecutionPolicy Bypass -File $scriptRutas -ArchivoCompose $ArchivoCompose -Proyecto $Proyecto -VerificarSocketCompat
}

Write-Host 'Resultado: OK. Checklist DEV completo validado.'
