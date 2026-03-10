[CmdletBinding()]
param(
    [string]$RutaInstalacion = '',
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

function Assert-Linux {
    $esLinux = [System.Runtime.InteropServices.RuntimeInformation]::IsOSPlatform([System.Runtime.InteropServices.OSPlatform]::Linux)
    if (-not $esLinux) {
        throw 'Este script esta diseñado para ejecutarse en runner CI Linux/ubuntu-latest.'
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

function Descargar-Archivo {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Uri,
        [Parameter(Mandatory = $true)]
        [string]$Destino
    )

    Invoke-WebRequest -Uri $Uri -OutFile $Destino
}

function Extraer-BinarioDesdeTarGz {
    param(
        [Parameter(Mandatory = $true)]
        [string]$RutaTarGz,
        [Parameter(Mandatory = $true)]
        [string]$NombreBinario,
        [Parameter(Mandatory = $true)]
        [string]$RutaDestino
    )

    $directorioTemporal = Join-Path ([System.IO.Path]::GetDirectoryName($RutaTarGz)) ([System.IO.Path]::GetFileNameWithoutExtension([System.IO.Path]::GetFileNameWithoutExtension($RutaTarGz)))
    if (Test-Path $directorioTemporal) {
        Remove-Item -Path $directorioTemporal -Recurse -Force
    }
    New-Item -ItemType Directory -Path $directorioTemporal -Force | Out-Null

    $resultado = Ejecutar-Comando -Comando { tar -xzf $RutaTarGz -C $directorioTemporal }
    if ($resultado.codigo -ne 0) {
        throw "No se pudo extraer $RutaTarGz. $($resultado.salida)"
    }

    $archivoBinario = Get-ChildItem -Path $directorioTemporal -Recurse -File | Where-Object { $_.Name -eq $NombreBinario } | Select-Object -First 1
    if (-not $archivoBinario) {
        throw "No se encontro el binario $NombreBinario en $RutaTarGz"
    }

    Copy-Item -Path $archivoBinario.FullName -Destination $RutaDestino -Force
}

function Marcar-Ejecutable {
    param([string]$RutaArchivo)

    $resultado = Ejecutar-Comando -Comando { chmod +x $RutaArchivo }
    if ($resultado.codigo -ne 0) {
        throw "No se pudo marcar como ejecutable: $RutaArchivo. $($resultado.salida)"
    }
}

function Obtener-Version {
    param(
        [Parameter(Mandatory = $true)]
        [string]$RutaBinario,
        [Parameter(Mandatory = $true)]
        [string[]]$ArgumentosVersion
    )

    $resultado = Ejecutar-Comando -Comando { & $RutaBinario @ArgumentosVersion }
    if ($resultado.codigo -ne 0) {
        throw "No se pudo obtener la version de $RutaBinario. $($resultado.salida)"
    }

    return $resultado.salida
}

Assert-Linux

$raizProyecto = Obtener-RaizProyecto -RutaInicio $PSScriptRoot
$directorioReporte = if ([System.IO.Path]::IsPathRooted($RutaDirectorioReporte)) {
    $RutaDirectorioReporte
}
else {
    Join-Path $raizProyecto $RutaDirectorioReporte
}
New-Item -ItemType Directory -Path $directorioReporte -Force | Out-Null

if (-not $RutaInstalacion) {
    if ($env:RUNNER_TEMP) {
        $RutaInstalacion = Join-Path $env:RUNNER_TEMP 'toolchain-security-bin'
    }
    else {
        $RutaInstalacion = Join-Path $raizProyecto '.tmp/toolchain-security-bin'
    }
}

New-Item -ItemType Directory -Path $RutaInstalacion -Force | Out-Null

$directorioDescargas = Join-Path $RutaInstalacion '.downloads'
New-Item -ItemType Directory -Path $directorioDescargas -Force | Out-Null

$marcaTiempo = Get-Date -Format 'yyyyMMdd_HHmmss'
$rutaLog = Join-Path $directorioReporte ("45A_Provision_Toolchain_Seguridad_Runner_CI_Docker_{0}.log" -f $marcaTiempo)

$herramientas = @(
    @{
        nombre = 'Trivy'
        version = '0.69.3'
        uri = 'https://github.com/aquasecurity/trivy/releases/download/v0.69.3/trivy_0.69.3_Linux-64bit.tar.gz'
        rutaDescarga = Join-Path $directorioDescargas 'trivy_0.69.3_Linux-64bit.tar.gz'
        binario = 'trivy'
        rutaBinario = Join-Path $RutaInstalacion 'trivy'
        argumentosVersion = @('version')
        tipo = 'targz'
    },
    @{
        nombre = 'Hadolint'
        version = '2.14.0'
        uri = 'https://github.com/hadolint/hadolint/releases/download/v2.14.0/hadolint-Linux-x86_64'
        rutaDescarga = Join-Path $directorioDescargas 'hadolint-Linux-x86_64'
        binario = 'hadolint'
        rutaBinario = Join-Path $RutaInstalacion 'hadolint'
        argumentosVersion = @('--version')
        tipo = 'binario'
    },
    @{
        nombre = 'Syft'
        version = '1.42.1'
        uri = 'https://github.com/anchore/syft/releases/download/v1.42.1/syft_1.42.1_linux_amd64.tar.gz'
        rutaDescarga = Join-Path $directorioDescargas 'syft_1.42.1_linux_amd64.tar.gz'
        binario = 'syft'
        rutaBinario = Join-Path $RutaInstalacion 'syft'
        argumentosVersion = @('version')
        tipo = 'targz'
    }
)

$resultados = foreach ($herramienta in $herramientas) {
    Descargar-Archivo -Uri $herramienta.uri -Destino $herramienta.rutaDescarga

    if ($herramienta.tipo -eq 'targz') {
        Extraer-BinarioDesdeTarGz -RutaTarGz $herramienta.rutaDescarga -NombreBinario $herramienta.binario -RutaDestino $herramienta.rutaBinario
    }
    else {
        Copy-Item -Path $herramienta.rutaDescarga -Destination $herramienta.rutaBinario -Force
    }

    Marcar-Ejecutable -RutaArchivo $herramienta.rutaBinario
    $versionDetectada = Obtener-Version -RutaBinario $herramienta.rutaBinario -ArgumentosVersion $herramienta.argumentosVersion

    [PSCustomObject]@{
        herramienta = $herramienta.nombre
        version_objetivo = $herramienta.version
        ruta = $herramienta.rutaBinario
        descargado_desde = $herramienta.uri
        version_detectada = $versionDetectada
        estado = 'OK'
    }
}

$separador = [System.IO.Path]::PathSeparator
if (-not (($env:PATH -split [regex]::Escape($separador)) -contains $RutaInstalacion)) {
    $env:PATH = "$RutaInstalacion$separador$env:PATH"
}

if ($env:GITHUB_PATH) {
    Add-Content -Path $env:GITHUB_PATH -Value $RutaInstalacion
}

"Inicio provision toolchain runner CI Docker: $(Get-Date -Format o)" | Out-File -FilePath $rutaLog -Encoding UTF8
"Directorio instalacion: $RutaInstalacion" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
"PATH actual: $env:PATH" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
($resultados | ConvertTo-Json -Depth 5) | Out-File -FilePath $rutaLog -Encoding UTF8 -Append

Write-Host "Provision de toolchain seguridad Docker runner CI completada. Log: $rutaLog"
