[CmdletBinding()]
param(
    [string]$RutaDirectorioReporte = ".\\docs\\migracion\\ejecucion",
    [switch]$SoloVerificacion
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

function Es-ComandoDisponible {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Comando
    )

    return [bool](Obtener-RutaComando -Comando $Comando)
}

function Obtener-VersionHerramienta {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Comando,
        [string]$RutaEjecutable
    )

    try {
        $ejecutable = if ($RutaEjecutable) { $RutaEjecutable } else { $Comando }
        switch ($Comando) {
            "trivy" { return (& $ejecutable --version 2>$null | Select-Object -First 1) }
            "hadolint" {
                $salidaWinget = (& winget list --id hadolint.hadolint 2>$null | Out-String)
                if ($LASTEXITCODE -eq 0 -and $salidaWinget -match "(?im)^.*\bhadolint\.hadolint\s+([0-9][^\s]*)\s+winget\s*$") {
                    return "winget: $($Matches[1])"
                }

                return "Version no disponible"
            }
            "syft" {
                $salidaSyft = (& $ejecutable version 2>$null | Out-String).Trim()
                if ($salidaSyft -match "(?im)^Version:\s*(.+)$") {
                    return "Version: $($Matches[1].Trim())"
                }

                return ($salidaSyft -split "`r?`n" | Select-Object -First 1)
            }
            default { return "Version no configurada para $Comando" }
        }
    }
    catch {
        return "No se pudo leer version: $($_.Exception.Message)"
    }
}

function Refrescar-PathProceso {
    $pathMaquina = [Environment]::GetEnvironmentVariable("Path", "Machine")
    $pathUsuario = [Environment]::GetEnvironmentVariable("Path", "User")
    $env:Path = "$pathMaquina;$pathUsuario"
}

function Obtener-RutaComando {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Comando
    )

    $comandoResuelto = Get-Command $Comando -ErrorAction SilentlyContinue
    if ($comandoResuelto) {
        return $comandoResuelto.Source
    }

    $nombreEjecutable = "$Comando.exe"
    $rutasBusqueda = @(
        "$env:LOCALAPPDATA\\Microsoft\\WinGet\\Packages",
        "$env:ProgramData\\chocolatey\\bin"
    )

    foreach ($rutaBase in $rutasBusqueda) {
        if (-not (Test-Path $rutaBase)) {
            continue
        }

        $archivoEncontrado = Get-ChildItem -Path $rutaBase -Recurse -Filter $nombreEjecutable -ErrorAction SilentlyContinue |
            Select-Object -First 1 -ExpandProperty FullName

        if ($archivoEncontrado) {
            return $archivoEncontrado
        }
    }

    return $null
}

function Agregar-DirectorioAPathUsuario {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Directorio
    )

    if (-not (Test-Path $Directorio)) {
        return $false
    }

    $pathUsuarioActual = [Environment]::GetEnvironmentVariable("Path", "User")
    $segmentosUsuario = @($pathUsuarioActual -split ";") | Where-Object { $_ -and $_.Trim() -ne "" }

    if ($segmentosUsuario -notcontains $Directorio) {
        $nuevoPathUsuario = if ($pathUsuarioActual) { "$pathUsuarioActual;$Directorio" } else { $Directorio }
        [Environment]::SetEnvironmentVariable("Path", $nuevoPathUsuario, "User")
    }

    Refrescar-PathProceso
    if ((@($env:Path -split ";") | Where-Object { $_ -and $_.Trim() -ne "" }) -notcontains $Directorio) {
        $env:Path = "$env:Path;$Directorio"
    }

    return $true
}

function Intentar-InstalacionWinget {
    param(
        [Parameter(Mandatory = $true)]
        [hashtable]$Herramienta
    )

    if (-not (Es-ComandoDisponible -Comando "winget")) {
        return $false
    }

    foreach ($idWinget in $Herramienta.IdsWinget) {
        Write-Host "[winget] Intentando instalar $($Herramienta.Nombre) con id '$idWinget'..."

        & winget install --id $idWinget --exact --silent --accept-package-agreements --accept-source-agreements --disable-interactivity
        $codigoSalida = $LASTEXITCODE

        Refrescar-PathProceso
        if ($codigoSalida -eq 0 -and (Es-ComandoDisponible -Comando $Herramienta.Comando)) {
            return $true
        }
    }

    return $false
}

function Asegurar-Chocolatey {
    if (Es-ComandoDisponible -Comando "choco") {
        return $true
    }

    if (-not (Es-ComandoDisponible -Comando "winget")) {
        return $false
    }

    Write-Host "[winget] Chocolatey no encontrado. Intentando instalar Chocolatey..."
    & winget install --id Chocolatey.Chocolatey --exact --silent --accept-package-agreements --accept-source-agreements --disable-interactivity
    $codigoSalida = $LASTEXITCODE

    Refrescar-PathProceso
    if ($codigoSalida -ne 0) {
        return $false
    }

    return (Es-ComandoDisponible -Comando "choco")
}

function Intentar-InstalacionChocolatey {
    param(
        [Parameter(Mandatory = $true)]
        [hashtable]$Herramienta
    )

    if (-not (Asegurar-Chocolatey)) {
        return $false
    }

    foreach ($paqueteChoco in $Herramienta.PaquetesChocolatey) {
        Write-Host "[choco] Intentando instalar $($Herramienta.Nombre) con paquete '$paqueteChoco'..."

        & choco install $paqueteChoco -y --no-progress
        $codigoSalida = $LASTEXITCODE

        Refrescar-PathProceso
        if ($codigoSalida -eq 0 -and (Es-ComandoDisponible -Comando $Herramienta.Comando)) {
            return $true
        }
    }

    return $false
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
$rutaLog = Join-Path $directorioReporte ("05A_Instalacion_Toolchain_Seguridad_{0}.log" -f $marcaTiempo)

$herramientasObjetivo = @(
    @{
        Nombre = "Trivy"
        Comando = "trivy"
        IdsWinget = @("AquaSecurity.Trivy", "Aquasecurity.Trivy")
        PaquetesChocolatey = @("trivy")
    },
    @{
        Nombre = "Hadolint"
        Comando = "hadolint"
        IdsWinget = @("Hadolint.Hadolint", "hadolint.hadolint")
        PaquetesChocolatey = @("hadolint")
    },
    @{
        Nombre = "Syft"
        Comando = "syft"
        IdsWinget = @("Anchore.Syft", "anchore.syft")
        PaquetesChocolatey = @("syft")
    }
)

$resultados = @()

"Inicio de instalacion/verificacion: $(Get-Date -Format o)" | Out-File -FilePath $rutaLog -Encoding UTF8
"Directorio de trabajo: $raizProyecto" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
"Solo verificacion: $SoloVerificacion" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
"winget disponible: $(Es-ComandoDisponible -Comando 'winget')" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
"choco disponible: $(Es-ComandoDisponible -Comando 'choco')" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append

foreach ($herramienta in $herramientasObjetivo) {
    $estadoInicial = if (Es-ComandoDisponible -Comando $herramienta.Comando) { "Instalado" } else { "No instalado" }
    $metodo = "Ninguno"
    $resultado = "Sin cambios"

    if ($estadoInicial -eq "No instalado" -and -not $SoloVerificacion) {
        $instaladoConWinget = Intentar-InstalacionWinget -Herramienta $herramienta
        if ($instaladoConWinget) {
            $metodo = "winget"
            $resultado = "Instalado"
        }
        else {
            $instaladoConChoco = Intentar-InstalacionChocolatey -Herramienta $herramienta
            if ($instaladoConChoco) {
                $metodo = "chocolatey"
                $resultado = "Instalado"
            }
            else {
                $metodo = "No disponible o fallo"
                $resultado = "Fallo"
            }
        }
    }

    $rutaComando = Obtener-RutaComando -Comando $herramienta.Comando
    if ($rutaComando) {
        [void](Agregar-DirectorioAPathUsuario -Directorio (Split-Path -Parent $rutaComando))
        $rutaComando = Obtener-RutaComando -Comando $herramienta.Comando
    }

    $estadoFinal = if ($rutaComando) { "Instalado" } else { "No instalado" }
    $version = if ($estadoFinal -eq "Instalado") {
        Obtener-VersionHerramienta -Comando $herramienta.Comando -RutaEjecutable $rutaComando
    }
    else {
        "No aplica"
    }
    if (-not $rutaComando) {
        $rutaComando = "No disponible"
    }

    $fila = [PSCustomObject]@{
        herramienta = $herramienta.Nombre
        estado_inicial = $estadoInicial
        metodo = $metodo
        estado_final = $estadoFinal
        version = $version
        ruta = $rutaComando
        resultado = $resultado
    }

    $resultados += $fila
    ($fila | ConvertTo-Json -Compress) | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
}

Write-Host ""
Write-Host "Resumen de instalacion/verificacion:"
$resultados | Format-Table -AutoSize

$fallas = @($resultados | Where-Object { $_.estado_final -ne "Instalado" })
if ($fallas.Count -gt 0) {
    Write-Warning "Existen herramientas no instaladas. Revise el log: $rutaLog"
    exit 1
}

Write-Host "Instalacion/verificacion completada correctamente. Log: $rutaLog"
exit 0
