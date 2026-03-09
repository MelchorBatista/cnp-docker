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

function Refrescar-PathProceso {
    $pathMaquina = [Environment]::GetEnvironmentVariable("Path", "Machine")
    $pathUsuario = [Environment]::GetEnvironmentVariable("Path", "User")
    $env:Path = "$pathMaquina;$pathUsuario"
}

function Verificar-Herramienta {
    param(
        [Parameter(Mandatory = $true)]
        [hashtable]$Herramienta
    )

    $comandoActual = Get-Command $Herramienta.Comando -ErrorAction SilentlyContinue
    $disponibleActual = [bool]$comandoActual
    $rutaComando = if ($disponibleActual) { $comandoActual.Source } else { "No disponible" }
    $rutaDetectada = Obtener-RutaComando -Comando $Herramienta.Comando
    $version = if ($rutaDetectada) {
        Obtener-VersionHerramienta -Comando $Herramienta.Comando -RutaEjecutable $rutaDetectada
    }
    else {
        "No disponible"
    }

    $guionSesionNuevaPlantilla = @'
$env:Path = [Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [Environment]::GetEnvironmentVariable("Path","User")
if (Get-Command "__COMANDO__" -ErrorAction SilentlyContinue) { "SI" } else { "NO" }
'@
    $guionSesionNueva = $guionSesionNuevaPlantilla.Replace("__COMANDO__", $Herramienta.Comando)
    $bytesGuion = [System.Text.Encoding]::Unicode.GetBytes($guionSesionNueva)
    $guionCodificado = [Convert]::ToBase64String($bytesGuion)
    $disponibleSesionNueva = ((& powershell -NoProfile -EncodedCommand $guionCodificado) -join "").Trim()

    $pathActualPartes = ($env:Path -split ";") | Where-Object { $_ -and $_.Trim() -ne "" }
    $pathMaquina = [Environment]::GetEnvironmentVariable("Path", "Machine")
    $pathUsuario = [Environment]::GetEnvironmentVariable("Path", "User")
    $pathSistemaPartes = (($pathMaquina + ";" + $pathUsuario) -split ";") | Where-Object { $_ -and $_.Trim() -ne "" }

    $directorioHerramienta = if ($rutaDetectada) { Split-Path -Parent $rutaDetectada } else { "" }
    $enPathActual = if ($directorioHerramienta) { $pathActualPartes -contains $directorioHerramienta } else { $false }
    $enPathSistema = if ($directorioHerramienta) { $pathSistemaPartes -contains $directorioHerramienta } else { $false }

    $estado = if ($disponibleActual -and $disponibleSesionNueva -eq "SI" -and $enPathActual -and $enPathSistema) {
        "OK"
    }
    else {
        "FALLA"
    }

    return [PSCustomObject]@{
        herramienta = $Herramienta.Nombre
        comando = $Herramienta.Comando
        disponible_sesion_actual = $disponibleActual
        disponible_sesion_nueva = $disponibleSesionNueva
        version = $version
        ruta = $rutaComando
        ruta_detectada = if ($rutaDetectada) { $rutaDetectada } else { "No detectada" }
        en_path_sesion_actual = $enPathActual
        en_path_sistema = $enPathSistema
        estado = $estado
    }
}

$raizProyecto = Obtener-RaizProyecto -RutaInicio $PSScriptRoot
Refrescar-PathProceso
$directorioReporte = if ([System.IO.Path]::IsPathRooted($RutaDirectorioReporte)) {
    $RutaDirectorioReporte
}
else {
    Join-Path $raizProyecto $RutaDirectorioReporte
}
New-Item -ItemType Directory -Path $directorioReporte -Force | Out-Null

$marcaTiempo = Get-Date -Format "yyyyMMdd_HHmmss"
$rutaLog = Join-Path $directorioReporte ("05B_Verificacion_Toolchain_Seguridad_{0}.log" -f $marcaTiempo)

$herramientasObjetivo = @(
    @{ Nombre = "Trivy"; Comando = "trivy" },
    @{ Nombre = "Hadolint"; Comando = "hadolint" },
    @{ Nombre = "Syft"; Comando = "syft" }
)

"Inicio de verificacion: $(Get-Date -Format o)" | Out-File -FilePath $rutaLog -Encoding UTF8
"Directorio de trabajo: $raizProyecto" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
"PATH actual (proceso): $env:Path" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
"PATH maquina: $([Environment]::GetEnvironmentVariable('Path', 'Machine'))" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
"PATH usuario: $([Environment]::GetEnvironmentVariable('Path', 'User'))" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append

$resultados = foreach ($herramienta in $herramientasObjetivo) {
    $resultado = Verificar-Herramienta -Herramienta $herramienta
    ($resultado | ConvertTo-Json -Compress) | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
    $resultado
}

Write-Host ""
Write-Host "Resumen de doble verificacion (sesion actual + sesion nueva + PATH):"
$resultados | Format-Table -AutoSize

$fallas = @($resultados | Where-Object { $_.estado -ne "OK" })
if ($fallas.Count -gt 0) {
    Write-Warning "Se detectaron fallas de verificacion. Revise el log: $rutaLog"
    exit 1
}

Write-Host "Verificacion completada correctamente. Log: $rutaLog"
exit 0
