[CmdletBinding()]
param(
    [string]$RutaDirectorioReporte = ".\\docs\\migracion\\ejecucion"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
if (Get-Variable PSNativeCommandUseErrorActionPreference -ErrorAction SilentlyContinue) {
    $PSNativeCommandUseErrorActionPreference = $false
}

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

function Obtener-RutaCodeCli {
    $comandosPreferidos = @("code.cmd", "code")
    foreach ($nombre in $comandosPreferidos) {
        $comando = Get-Command $nombre -ErrorAction SilentlyContinue
        if ($comando) {
            return $comando.Source
        }
    }

    $rutaCodeCmd = Join-Path ${env:ProgramFiles} "Microsoft VS Code\\bin\\code.cmd"
    if (Test-Path $rutaCodeCmd) {
        return $rutaCodeCmd
    }

    return $null
}

function Ejecutar-CodeComando {
    param(
        [Parameter(Mandatory = $true)]
        [string]$RutaCode,
        [Parameter(Mandatory = $true)]
        [string]$Argumentos
    )

    $comando = "`"$RutaCode`" $Argumentos"
    $preferencia = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        $salida = (& cmd /d /c $comando 2>&1 | Out-String)
        $codigo = $LASTEXITCODE
    }
    finally {
        $ErrorActionPreference = $preferencia
    }

    return [PSCustomObject]@{
        codigo = $codigo
        salida = Limpiar-Salida -Texto $salida
    }
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
$rutaLog = Join-Path $directorioReporte ("40A_Smoke_Herramientas_Base_Local_{0}.log" -f $marcaTiempo)

$rutaCodeCli = Obtener-RutaCodeCli
if (-not $rutaCodeCli) {
    Write-Error "No se encontro el CLI de VS Code."
    exit 1
}

$resultadoWslStatus = Ejecutar-Comando -Comando { wsl --status }
$resultadoWslLista = Ejecutar-Comando -Comando { wsl -l -v }
$resultadoDockerDesktop = Ejecutar-Comando -Comando { docker desktop status }
$resultadoDockerVersion = Ejecutar-Comando -Comando { docker version }
$resultadoDockerInfo = Ejecutar-Comando -Comando { docker info }
$resultadoCodeVersion = Ejecutar-CodeComando -RutaCode $rutaCodeCli -Argumentos "--version"
$resultadoCodeStatus = Ejecutar-CodeComando -RutaCode $rutaCodeCli -Argumentos "--status"

$wslStatusOk = (
    $resultadoWslStatus.codigo -eq 0 -and
    $resultadoWslStatus.salida -match "(?i)Default Distribution:\s*Ubuntu" -and
    $resultadoWslStatus.salida -match "(?i)Default Version:\s*2"
)

$wslListaOk = (
    $resultadoWslLista.codigo -eq 0 -and
    $resultadoWslLista.salida -match "(?im)^\*?\s*Ubuntu\s+\S+\s+2\s*$" -and
    $resultadoWslLista.salida -match "(?im)^\s*docker-desktop\s+\S+\s+2\s*$"
)

$dockerDesktopOk = (
    $resultadoDockerDesktop.codigo -eq 0 -and
    $resultadoDockerDesktop.salida -match "(?i)Status\s+running"
)

$dockerVersionOk = (
    $resultadoDockerVersion.codigo -eq 0 -and
    $resultadoDockerVersion.salida -match "(?im)^Client:" -and
    $resultadoDockerVersion.salida -match "(?im)^Server:"
)

$dockerInfoOk = (
    $resultadoDockerInfo.codigo -eq 0 -and
    $resultadoDockerInfo.salida -match "(?i)Kernel Version:\s*.*WSL2" -and
    $resultadoDockerInfo.salida -match "(?i)OSType:\s*linux"
)

$codeVersionOk = (
    $resultadoCodeVersion.codigo -eq 0 -and
    $resultadoCodeVersion.salida -match "^\d+\.\d+\.\d+"
)

$codeStatusOk = (
    $resultadoCodeStatus.codigo -eq 0 -and
    $resultadoCodeStatus.salida -match "Workspace Stats"
)

"Inicio smoke herramientas base local: $(Get-Date -Format o)" | Out-File -FilePath $rutaLog -Encoding UTF8
"Directorio de trabajo: $raizProyecto" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
"Ruta code CLI: $rutaCodeCli" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
($resultadoWslStatus | ConvertTo-Json -Compress) | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
($resultadoWslLista | ConvertTo-Json -Compress) | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
($resultadoDockerDesktop | ConvertTo-Json -Compress) | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
($resultadoDockerVersion | ConvertTo-Json -Compress) | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
($resultadoDockerInfo | ConvertTo-Json -Compress) | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
($resultadoCodeVersion | ConvertTo-Json -Compress) | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
($resultadoCodeStatus | ConvertTo-Json -Compress) | Out-File -FilePath $rutaLog -Encoding UTF8 -Append

$resumen = @(
    [PSCustomObject]@{
        verificacion = "WSL status"
        estado = if ($wslStatusOk) { "OK" } else { "FALLA" }
        detalle = "wsl --status"
    },
    [PSCustomObject]@{
        verificacion = "WSL distros v2"
        estado = if ($wslListaOk) { "OK" } else { "FALLA" }
        detalle = "wsl -l -v"
    },
    [PSCustomObject]@{
        verificacion = "Docker Desktop"
        estado = if ($dockerDesktopOk) { "OK" } else { "FALLA" }
        detalle = "docker desktop status"
    },
    [PSCustomObject]@{
        verificacion = "Docker daemon"
        estado = if ($dockerVersionOk) { "OK" } else { "FALLA" }
        detalle = "docker version"
    },
    [PSCustomObject]@{
        verificacion = "Docker WSL2 backend"
        estado = if ($dockerInfoOk) { "OK" } else { "FALLA" }
        detalle = "docker info"
    },
    [PSCustomObject]@{
        verificacion = "VS Code CLI"
        estado = if ($codeVersionOk) { "OK" } else { "FALLA" }
        detalle = "code --version"
    },
    [PSCustomObject]@{
        verificacion = "VS Code workspace"
        estado = if ($codeStatusOk) { "OK" } else { "FALLA" }
        detalle = "code --status"
    }
)

($resumen | ConvertTo-Json -Compress) | Out-File -FilePath $rutaLog -Encoding UTF8 -Append

Write-Host ""
Write-Host "Resumen smoke A.4.14:"
$resumen | Format-Table -AutoSize
Write-Host ""
Write-Host "Log generado: $rutaLog"

$fallas = @($resumen | Where-Object { $_.estado -ne "OK" })
if ($fallas.Count -gt 0) {
    Write-Warning "La smoke test local no cumple completamente. Revisar log."
    exit 1
}

exit 0
