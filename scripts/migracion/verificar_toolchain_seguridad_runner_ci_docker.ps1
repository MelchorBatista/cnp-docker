[CmdletBinding()]
param(
    [string]$RutaDirectorioReporte = '.\docs\migracion\ejecucion'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
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

function Ejecutar-Comando {
    param(
        [Alias('Comando')]
        [Parameter(Mandatory = $true)]
        [scriptblock]$Script
    )

    $preferencia = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $salida = (& $Script 2>&1 | Out-String).Trim()
        return [PSCustomObject]@{
            codigo = $LASTEXITCODE
            salida = $salida
        }
    }
    catch {
        return [PSCustomObject]@{
            codigo = 1
            salida = $_.Exception.Message
        }
    }
    finally {
        $ErrorActionPreference = $preferencia
    }
}

function Obtener-HostPowerShellHijo {
    foreach ($nombre in @('pwsh', 'powershell', 'powershell.exe')) {
        $resuelto = Get-Command $nombre -ErrorAction SilentlyContinue
        if ($resuelto) {
            return $resuelto.Source
        }
    }

    throw 'No se encontro un host PowerShell para la doble verificacion.'
}

function Ejecutar-DobleVerificacion {
    param(
        [Parameter(Mandatory = $true)]
        [string]$HostPowerShell,
        [Parameter(Mandatory = $true)]
        [string]$Comando,
        [Parameter(Mandatory = $true)]
        [string[]]$ArgumentosVersion
    )

    $argumentosLiteral = ($ArgumentosVersion | ForEach-Object { "'{0}'" -f $_.Replace("'", "''") }) -join ', '
    $scriptHijo = @"
`$resuelto = Get-Command '$Comando' -ErrorAction SilentlyContinue
`$disponible = [bool]`$resuelto
`$ruta = if (`$disponible) { `$resuelto.Source } else { 'No disponible' }
`$version = ''
if (`$disponible) {
    try {
        `$version = (& '$Comando' @($argumentosLiteral) 2>&1 | Out-String).Trim()
    }
    catch {
        `$version = `$_.Exception.Message
    }
}
[PSCustomObject]@{
    disponible = `$disponible
    ruta = `$ruta
    version = `$version
} | ConvertTo-Json -Compress
"@

    $bytes = [System.Text.Encoding]::Unicode.GetBytes($scriptHijo)
    $comandoCodificado = [Convert]::ToBase64String($bytes)
    $resultado = Ejecutar-Comando -Comando { & $HostPowerShell -NoProfile -EncodedCommand $comandoCodificado }
    if ($resultado.codigo -ne 0 -or -not $resultado.salida) {
        throw "Fallo la doble verificacion hija de $Comando. $($resultado.salida)"
    }

    return ($resultado.salida | ConvertFrom-Json)
}

$raizProyecto = Obtener-RaizProyecto -RutaInicio $PSScriptRoot
$directorioReporte = if ([System.IO.Path]::IsPathRooted($RutaDirectorioReporte)) {
    $RutaDirectorioReporte
}
else {
    Join-Path $raizProyecto $RutaDirectorioReporte
}
New-Item -ItemType Directory -Path $directorioReporte -Force | Out-Null

$hostPowerShell = Obtener-HostPowerShellHijo
$marcaTiempo = Get-Date -Format 'yyyyMMdd_HHmmss'
$rutaLog = Join-Path $directorioReporte ("45B_Verificacion_Toolchain_Seguridad_Runner_CI_Docker_{0}.log" -f $marcaTiempo)
$separador = [System.IO.Path]::PathSeparator
$pathPartes = ($env:PATH -split [regex]::Escape($separador)) | Where-Object { $_ -and $_.Trim() -ne '' }

$herramientas = @(
    @{ nombre = 'Trivy'; comando = 'trivy'; argumentosVersion = @('version') },
    @{ nombre = 'Hadolint'; comando = 'hadolint'; argumentosVersion = @('--version') },
    @{ nombre = 'Syft'; comando = 'syft'; argumentosVersion = @('version') }
)

$resultados = foreach ($herramienta in $herramientas) {
    $resueltoActual = Get-Command $herramienta.comando -ErrorAction SilentlyContinue
    $disponibleActual = [bool]$resueltoActual
    $rutaActual = if ($disponibleActual) { $resueltoActual.Source } else { 'No disponible' }

    $versionActual = if ($disponibleActual) {
        (Ejecutar-Comando -Comando { & $herramienta.comando @($herramienta.argumentosVersion) }).salida
    }
    else {
        'No disponible'
    }

    $resultadoHijo = Ejecutar-DobleVerificacion -HostPowerShell $hostPowerShell -Comando $herramienta.comando -ArgumentosVersion $herramienta.argumentosVersion
    $directorioHerramienta = if ($disponibleActual) { Split-Path -Parent $rutaActual } else { '' }
    $enPathActual = if ($directorioHerramienta) { $pathPartes -contains $directorioHerramienta } else { $false }

    [PSCustomObject]@{
        herramienta = $herramienta.nombre
        comando = $herramienta.comando
        disponible_sesion_actual = $disponibleActual
        disponible_sesion_hija = [bool]$resultadoHijo.disponible
        ruta_sesion_actual = $rutaActual
        ruta_sesion_hija = $resultadoHijo.ruta
        en_path_sesion_actual = $enPathActual
        version_sesion_actual = $versionActual
        version_sesion_hija = $resultadoHijo.version
        estado = if ($disponibleActual -and [bool]$resultadoHijo.disponible -and $enPathActual) { 'OK' } else { 'FALLA' }
    }
}

"Inicio verificacion toolchain runner CI Docker: $(Get-Date -Format o)" | Out-File -FilePath $rutaLog -Encoding UTF8
"Host PowerShell hijo: $hostPowerShell" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
"PATH actual: $env:PATH" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
($resultados | ConvertTo-Json -Depth 5) | Out-File -FilePath $rutaLog -Encoding UTF8 -Append

Write-Host ''
Write-Host 'Resumen de doble verificacion runner CI Docker:'
$resultados | Format-Table -AutoSize
Write-Host ''
Write-Host "Log generado: $rutaLog"

$fallas = @($resultados | Where-Object { $_.estado -ne 'OK' })
if ($fallas.Count -gt 0) {
    exit 1
}

exit 0
