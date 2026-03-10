[CmdletBinding()]
param(
    [string]$ArchivoCompose = '',
    [string]$Proyecto = 'cnp-dev',
    [switch]$VerificarProxyPublicado
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

function Obtener-IdContenedor {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$ArgumentosCompose,
        [Parameter(Mandatory = $true)]
        [string]$Servicio
    )

    $salida = docker compose @ArgumentosCompose ps -q $Servicio
    if ($LASTEXITCODE -ne 0) {
        throw "No se pudo consultar el contenedor del servicio '$Servicio'."
    }

    $ids = @($salida -split "\r?\n" | Where-Object { $_ -and $_.Trim() })
    if ($ids.Count -eq 0) {
        throw "No existe contenedor activo para el servicio '$Servicio'."
    }

    return $ids[0].Trim()
}

function Obtener-ResumenServicio {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Servicio,
        [Parameter(Mandatory = $true)]
        [string]$ContenedorId
    )

    $inspeccion = docker inspect $ContenedorId | ConvertFrom-Json
    if ($LASTEXITCODE -ne 0) {
        throw "No se pudo inspeccionar el contenedor '$ContenedorId'."
    }

    $contenedor = $inspeccion[0]
    $healthStatus = 'sin-healthcheck'
    $healthCmd = ''
    $ultimoInicio = ''
    $ultimoFin = ''
    $ultimoExitCode = ''
    $ultimaSalida = ''

    if ($contenedor.Config.Healthcheck -and $contenedor.Config.Healthcheck.Test) {
        $healthCmd = ($contenedor.Config.Healthcheck.Test -join ' ')
    }

    if ($contenedor.State.Health) {
        $healthStatus = [string]$contenedor.State.Health.Status
        if ($contenedor.State.Health.Log -and $contenedor.State.Health.Log.Count -gt 0) {
            $ultimoLog = $contenedor.State.Health.Log[-1]
            $ultimoInicio = [string]$ultimoLog.Start
            $ultimoFin = [string]$ultimoLog.End
            $ultimoExitCode = [string]$ultimoLog.ExitCode
            $ultimaSalida = ([string]$ultimoLog.Output).Trim()
        }
    }

    return [pscustomobject]@{
        Servicio           = $Servicio
        Contenedor         = $contenedor.Name.TrimStart('/')
        Imagen             = $contenedor.Config.Image
        Estado             = [string]$contenedor.State.Status
        Running            = [bool]$contenedor.State.Running
        HealthStatus       = $healthStatus
        HealthcheckCommand = $healthCmd
        UltimoInicio       = $ultimoInicio
        UltimoFin          = $ultimoFin
        UltimoExitCode     = $ultimoExitCode
        UltimaSalida       = $ultimaSalida
    }
}

function Verificar-ProxyPublicado {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$ArgumentosCompose
    )

    $salidaPuerto = docker compose @ArgumentosCompose port proxy 80
    if ($LASTEXITCODE -ne 0) {
        throw 'No se pudo resolver el puerto publicado del servicio proxy.'
    }

    $lineaPuerto = ($salidaPuerto -split "\r?\n" | Where-Object { $_ -and $_.Trim() } | Select-Object -First 1)
    if (-not $lineaPuerto) {
        throw 'El servicio proxy no publica el puerto 80 hacia el host.'
    }

    if ($lineaPuerto -notmatch ':(\d+)$') {
        throw "No se pudo extraer el puerto host desde '$lineaPuerto'."
    }

    $puertoHost = $Matches[1]
    $url = "http://127.0.0.1:$puertoHost/healthz"

    Write-Host "Proxy publicado: $url"
    $respuesta = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 15
    if ($respuesta.Content -is [byte[]]) {
        $contenido = [System.Text.Encoding]::UTF8.GetString($respuesta.Content)
    }
    else {
        $contenido = [string]$respuesta.Content
    }
    Write-Host "Proxy status code: $($respuesta.StatusCode)"
    Write-Host "Proxy body: $contenido"

    if ($respuesta.StatusCode -ne 200) {
        throw "El proxy devolvio status code inesperado: $($respuesta.StatusCode)."
    }

    if ($contenido.Trim() -ne 'ok') {
        throw "El proxy devolvio un cuerpo inesperado en /healthz: '$contenido'."
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
$servicios = @(
    'backend',
    'frontend',
    'proxy'
)

Ejecutar-Paso -Descripcion 'Verificar Docker Compose' -Script {
    docker compose version
}

Ejecutar-Paso -Descripcion 'Listar estado general del stack DEV' -Script {
    docker compose @argumentosCompose ps
}

$resumenes = @()
$errores = New-Object System.Collections.Generic.List[string]

foreach ($servicio in $servicios) {
    Write-Host "==> Inspeccionar servicio '$servicio'"
    $contenedorId = Obtener-IdContenedor -ArgumentosCompose $argumentosCompose -Servicio $servicio
    $resumen = Obtener-ResumenServicio -Servicio $servicio -ContenedorId $contenedorId
    $resumenes += $resumen

    Write-Host "Servicio: $($resumen.Servicio)"
    Write-Host "Contenedor: $($resumen.Contenedor)"
    Write-Host "Imagen: $($resumen.Imagen)"
    Write-Host "Estado: $($resumen.Estado)"
    Write-Host "Running: $($resumen.Running)"
    Write-Host "Healthcheck: $($resumen.HealthStatus)"
    Write-Host "Healthcheck command: $($resumen.HealthcheckCommand)"
    Write-Host "Ultimo inicio: $($resumen.UltimoInicio)"
    Write-Host "Ultimo fin: $($resumen.UltimoFin)"
    Write-Host "Ultimo exit code: $($resumen.UltimoExitCode)"
    if ($resumen.UltimaSalida) {
        Write-Host "Ultima salida: $($resumen.UltimaSalida)"
    }
    else {
        Write-Host 'Ultima salida: <vacia>'
    }

    if ($resumen.Estado -ne 'running') {
        $errores.Add("El servicio '$servicio' no esta running (estado actual: $($resumen.Estado)).")
    }

    if ($resumen.HealthStatus -ne 'healthy') {
        $errores.Add("El servicio '$servicio' no esta healthy (estado actual: $($resumen.HealthStatus)).")
    }
}

Write-Host '==> Resumen tabular'
$resumenes |
    Select-Object Servicio, Contenedor, Imagen, Estado, HealthStatus, UltimoExitCode |
    Format-Table -AutoSize

if ($VerificarProxyPublicado) {
    Ejecutar-Paso -Descripcion 'Verificar /healthz publicado por proxy' -Script {
        Verificar-ProxyPublicado -ArgumentosCompose $argumentosCompose
    }
}

if ($errores.Count -gt 0) {
    foreach ($errorDetectado in $errores) {
        Write-Host "ERROR: $errorDetectado"
    }

    throw 'Se detectaron servicios sin estado running/healthy.'
}

Write-Host 'Resultado: OK. Todos los servicios del stack DEV estan running y healthy.'
