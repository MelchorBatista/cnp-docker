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

function Limpiar-Salida {
    param(
        [string]$Texto
    )

    if (-not $Texto) {
        return ""
    }

    return ($Texto -replace "`0", "").Trim()
}

function Ejecutar-Comando {
    param(
        [Parameter(Mandatory = $true)]
        [scriptblock]$Comando
    )

    try {
        $salida = (& $Comando 2>&1 | Out-String)
        return [PSCustomObject]@{
            codigo = $LASTEXITCODE
            salida = Limpiar-Salida -Texto $salida
        }
    }
    catch {
        return [PSCustomObject]@{
            codigo = 1
            salida = $_.Exception.Message
        }
    }
}

function Obtener-ComandoDocker {
    $cmdDocker = Get-Command docker -ErrorAction SilentlyContinue
    if ($cmdDocker) {
        return $cmdDocker.Source
    }

    $rutaDocker = "C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe"
    if (Test-Path $rutaDocker) {
        return $rutaDocker
    }

    return "docker"
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
$rutaLog = Join-Path $directorioReporte ("14B_Verificacion_WSL_Docker_Laptop_{0}.log" -f $marcaTiempo)

$comandoDocker = Obtener-ComandoDocker

$resultadoWslStatus = Ejecutar-Comando -Comando { wsl --status }
$resultadoWslLista = Ejecutar-Comando -Comando { wsl -l -v }
$resultadoDockerVersion = Ejecutar-Comando -Comando { & $comandoDocker version }

$wslOk = (
    $resultadoWslStatus.codigo -eq 0 -and
    $resultadoWslStatus.salida -match "(?i)Default Version:\s*2" -and
    $resultadoWslStatus.salida -notmatch "(?i)not installed|no est.*instalad"
)

$dockerOk = (
    $resultadoDockerVersion.codigo -eq 0 -and
    $resultadoDockerVersion.salida -match "(?i)Client:" -and
    $resultadoDockerVersion.salida -match "(?i)Server:"
)

"Inicio verificacion WSL/Docker: $(Get-Date -Format o)" | Out-File -FilePath $rutaLog -Encoding UTF8
"Directorio de trabajo: $raizProyecto" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
"Comando docker resuelto: $comandoDocker" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
($resultadoWslStatus | ConvertTo-Json -Compress) | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
($resultadoWslLista | ConvertTo-Json -Compress) | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
($resultadoDockerVersion | ConvertTo-Json -Compress) | Out-File -FilePath $rutaLog -Encoding UTF8 -Append

$resumen = @(
    [PSCustomObject]@{
        verificacion = "wsl --status"
        codigo = $resultadoWslStatus.codigo
        estado = if ($wslOk) { "OK" } else { "FALLA" }
    },
    [PSCustomObject]@{
        verificacion = "docker version"
        codigo = $resultadoDockerVersion.codigo
        estado = if ($dockerOk) { "OK" } else { "FALLA" }
    }
)

($resumen | ConvertTo-Json -Compress) | Out-File -FilePath $rutaLog -Encoding UTF8 -Append

Write-Host ""
Write-Host "Resumen verificacion A.2.2.6:"
$resumen | Format-Table -AutoSize
Write-Host ""
Write-Host "Log generado: $rutaLog"

if (-not $wslOk -or -not $dockerOk) {
    Write-Warning "La verificacion no cumple el criterio de estado OK."
    exit 1
}

exit 0
