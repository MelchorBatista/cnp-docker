[CmdletBinding()]
param(
    [string]$RutaDirectorioReporte = ".\\docs\\migracion\\ejecucion"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Obtener-RaizProyecto {
    param(
        [Parameter(Mandatory = $true)]
        [string]$RutaInicio
    )

    $rutaActual = (Resolve-Path $RutaInicio).Path
    while ($true) {
        if (Test-Path (Join-Path $rutaActual ".git")) {
            return $rutaActual
        }

        $rutaPadre = Split-Path -Parent $rutaActual
        if ($rutaPadre -eq $rutaActual) {
            return (Resolve-Path $RutaInicio).Path
        }

        $rutaActual = $rutaPadre
    }
}

function Test-EsAdministrador {
    $identidadActual = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identidadActual)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Refrescar-PathProceso {
    $pathMaquina = [Environment]::GetEnvironmentVariable("Path", "Machine")
    $pathUsuario = [Environment]::GetEnvironmentVariable("Path", "User")
    $env:Path = "$pathMaquina;$pathUsuario"
}

function Limpiar-Salida {
    param(
        [string]$Texto
    )

    if (-not $Texto) {
        return ""
    }

    return ($Texto -replace "`0", "").Trim()
}

function Obtener-EstadoWSL {
    $salida = ""
    $codigo = 0

    try {
        $salida = (& wsl --status 2>&1 | Out-String)
        $codigo = $LASTEXITCODE
    }
    catch {
        $salida = $_.Exception.Message
        $codigo = 1
    }

    $salidaLimpia = Limpiar-Salida -Texto $salida
    $noInstalado = $salidaLimpia -match "(?i)not installed|no esta instalado|no est.*instalad|wsl.*install"

    return [PSCustomObject]@{
        codigo = $codigo
        salida = $salidaLimpia
        instalado = (-not $noInstalado -and $codigo -eq 0)
    }
}

function Obtener-EstadoDocker {
    $version = ""
    $codigo = 0
    $instalado = $false

    try {
        $version = (& docker version 2>&1 | Out-String)
        $codigo = $LASTEXITCODE
        if ($codigo -eq 0) {
            $instalado = $true
        }
    }
    catch {
        $version = $_.Exception.Message
        $codigo = 1
    }

    $versionLimpia = Limpiar-Salida -Texto $version

    return [PSCustomObject]@{
        codigo = $codigo
        salida = $versionLimpia
        instalado = $instalado
    }
}

function Intentar-InstalarWSL {
    $resultado = [PSCustomObject]@{
        metodo = "wsl --install --no-distribution"
        codigo = 1
        salida = ""
    }

    try {
        $salida = (& wsl --install --no-distribution 2>&1 | Out-String)
        $resultado.codigo = $LASTEXITCODE
        $resultado.salida = Limpiar-Salida -Texto $salida
    }
    catch {
        $resultado.codigo = 1
        $resultado.salida = $_.Exception.Message
    }

    return $resultado
}

function Intentar-InstalarDockerWinget {
    $resultado = [PSCustomObject]@{
        metodo = "winget"
        codigo = 1
        salida = ""
    }

    if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
        $resultado.salida = "winget no disponible"
        return $resultado
    }

    try {
        $salida = (& winget install --id Docker.DockerDesktop --exact --silent --accept-package-agreements --accept-source-agreements --disable-interactivity 2>&1 | Out-String)
        $resultado.codigo = $LASTEXITCODE
        $resultado.salida = Limpiar-Salida -Texto $salida
    }
    catch {
        $resultado.codigo = 1
        $resultado.salida = $_.Exception.Message
    }

    return $resultado
}

function Intentar-InstalarDockerChocolatey {
    $resultado = [PSCustomObject]@{
        metodo = "chocolatey"
        codigo = 1
        salida = ""
    }

    if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
        $resultado.salida = "choco no disponible"
        return $resultado
    }

    try {
        $salida = (& choco install docker-desktop -y --no-progress 2>&1 | Out-String)
        $resultado.codigo = $LASTEXITCODE
        $resultado.salida = Limpiar-Salida -Texto $salida
    }
    catch {
        $resultado.codigo = 1
        $resultado.salida = $_.Exception.Message
    }

    return $resultado
}

$raizProyecto = Obtener-RaizProyecto -RutaInicio $PSScriptRoot
$directorioReporte = if ([System.IO.Path]::IsPathRooted($RutaDirectorioReporte)) {
    $RutaDirectorioReporte
}
else {
    Join-Path $raizProyecto $RutaDirectorioReporte
}
New-Item -ItemType Directory -Path $directorioReporte -Force | Out-Null

$marcaTiempo = Get-Date -Format "yyyyMMdd_HHmmss"
$rutaLog = Join-Path $directorioReporte ("14A_Instalacion_WSL2_Docker_Laptop_{0}.log" -f $marcaTiempo)

Refrescar-PathProceso
$esAdministrador = Test-EsAdministrador

"Inicio instalacion WSL2 + Docker Desktop: $(Get-Date -Format o)" | Out-File -FilePath $rutaLog -Encoding UTF8
"Directorio de trabajo: $raizProyecto" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
"Usuario: $env:USERNAME" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
"Sesion administrador: $esAdministrador" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append

$estadoWSLInicial = Obtener-EstadoWSL
$estadoDockerInicial = Obtener-EstadoDocker

($estadoWSLInicial | ConvertTo-Json -Compress) | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
($estadoDockerInicial | ConvertTo-Json -Compress) | Out-File -FilePath $rutaLog -Encoding UTF8 -Append

$resultadoWSLInstalacion = $null
if (-not $estadoWSLInicial.instalado) {
    $resultadoWSLInstalacion = Intentar-InstalarWSL
    ($resultadoWSLInstalacion | ConvertTo-Json -Compress) | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
}

$resultadoDockerWinget = $null
$resultadoDockerChoco = $null
if (-not $estadoDockerInicial.instalado) {
    $resultadoDockerWinget = Intentar-InstalarDockerWinget
    ($resultadoDockerWinget | ConvertTo-Json -Compress) | Out-File -FilePath $rutaLog -Encoding UTF8 -Append

    Refrescar-PathProceso
    $estadoDockerDespuesWinget = Obtener-EstadoDocker
    if (-not $estadoDockerDespuesWinget.instalado) {
        $resultadoDockerChoco = Intentar-InstalarDockerChocolatey
        ($resultadoDockerChoco | ConvertTo-Json -Compress) | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
    }
}

Refrescar-PathProceso
$estadoWSLFinal = Obtener-EstadoWSL
$estadoDockerFinal = Obtener-EstadoDocker

($estadoWSLFinal | ConvertTo-Json -Compress) | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
($estadoDockerFinal | ConvertTo-Json -Compress) | Out-File -FilePath $rutaLog -Encoding UTF8 -Append

$resumen = @(
    [PSCustomObject]@{
        componente = "WSL2"
        estado_inicial = if ($estadoWSLInicial.instalado) { "Instalado" } else { "No instalado" }
        accion = if ($resultadoWSLInstalacion) { $resultadoWSLInstalacion.metodo } else { "Sin cambios" }
        estado_final = if ($estadoWSLFinal.instalado) { "Instalado" } else { "No instalado" }
        codigo_final = $estadoWSLFinal.codigo
    },
    [PSCustomObject]@{
        componente = "Docker Desktop"
        estado_inicial = if ($estadoDockerInicial.instalado) { "Instalado" } else { "No instalado" }
        accion = if ($resultadoDockerChoco) { "winget + chocolatey" } elseif ($resultadoDockerWinget) { "winget" } else { "Sin cambios" }
        estado_final = if ($estadoDockerFinal.instalado) { "Instalado" } else { "No instalado" }
        codigo_final = $estadoDockerFinal.codigo
    }
)

Write-Host ""
Write-Host "Resumen instalacion A.2.2.5:"
$resumen | Format-Table -AutoSize
Write-Host ""
Write-Host "Log generado: $rutaLog"

$fallas = @($resumen | Where-Object { $_.estado_final -ne "Instalado" })
if ($fallas.Count -gt 0) {
    Write-Warning "No se logro completar la instalacion de todos los componentes. Revisar log."
    exit 1
}

exit 0
