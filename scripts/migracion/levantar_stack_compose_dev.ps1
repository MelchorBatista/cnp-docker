[CmdletBinding()]
param(
    [string]$ArchivoCompose = '',
    [string]$Proyecto = 'cnp-dev',
    [switch]$RecrearLimpio,
    [switch]$SinBuild
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

Ejecutar-Paso -Descripcion 'Verificar Docker Compose' -Script {
    docker compose version
}

Ejecutar-Paso -Descripcion 'Validar configuracion docker-compose.dev.yml' -Script {
    docker compose @argumentosCompose config
}

if ($RecrearLimpio) {
    Ejecutar-Paso -Descripcion 'Detener stack DEV previo' -Script {
        docker compose @argumentosCompose down --remove-orphans
    }
}

$argumentosUp = $argumentosCompose + @('up', '-d')
if (-not $SinBuild) {
    $argumentosUp += '--build'
}

Ejecutar-Paso -Descripcion 'Levantar stack DEV' -Script {
    docker compose @argumentosUp
}

Start-Sleep -Seconds 5

Ejecutar-Paso -Descripcion 'Listar estado del stack DEV' -Script {
    docker compose @argumentosCompose ps
}

Write-Host "Stack DEV levantado para el proyecto '$Proyecto'."
