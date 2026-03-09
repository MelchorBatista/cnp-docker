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

function Refrescar-PathProceso {
    $pathActual = @($env:Path -split ";") | Where-Object { $_ -and $_.Trim() -ne "" }
    $pathMaquina = [Environment]::GetEnvironmentVariable("Path", "Machine")
    $pathUsuario = [Environment]::GetEnvironmentVariable("Path", "User")
    $pathSistema = @("$pathMaquina;$pathUsuario" -split ";") | Where-Object { $_ -and $_.Trim() -ne "" }
    $pathUnificado = @($pathActual + $pathSistema) | Select-Object -Unique
    $env:Path = ($pathUnificado -join ";")
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

    $nombreArchivo = switch -Regex ($Comando) {
        "\.exe$" { $Comando; break }
        "\.cmd$" { $Comando; break }
        default { "$Comando.exe"; break }
    }

    $rutasBusqueda = @(
        "$env:LOCALAPPDATA\\Microsoft\\WinGet\\Packages",
        "$env:ProgramData\\chocolatey\\bin",
        "$env:ProgramFiles\\nodejs",
        "$env:ProgramFiles\\Git\\cmd",
        "$env:ProgramFiles\\OpenSSL-Win64\\bin",
        "$env:ProgramFiles(x86)\\OpenSSL-Win32\\bin",
        "$env:SystemRoot\\System32"
    ) | Where-Object { $_ -and (Test-Path $_) }

    foreach ($rutaBase in $rutasBusqueda) {
        $archivo = Get-ChildItem -Path $rutaBase -Recurse -Filter $nombreArchivo -ErrorAction SilentlyContinue |
            Select-Object -First 1 -ExpandProperty FullName
        if ($archivo) {
            return $archivo
        }
    }

    return $null
}

function Obtener-VersionHerramienta {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Comando,
        [string]$RutaEjecutable
    )

    try {
        $ejecutable = if ($RutaEjecutable) { $RutaEjecutable } else { $Comando }
        switch ($Comando.ToLowerInvariant()) {
            "git" { return (& $ejecutable --version 2>$null | Select-Object -First 1) }
            "node" { return (& $ejecutable --version 2>$null | Select-Object -First 1) }
            "npm.cmd" { return (& $ejecutable --version 2>$null | Select-Object -First 1) }
            "openssl" { return (& $ejecutable version 2>$null | Select-Object -First 1) }
            "curl.exe" { return (& $ejecutable --version 2>$null | Select-Object -First 1) }
            default { return "Version no configurada para $Comando" }
        }
    }
    catch {
        return "No se pudo leer version: $($_.Exception.Message)"
    }
}

function Verificar-EnSesionNueva {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Comando
    )

    $plantilla = @'
if (Get-Command "__COMANDO__" -ErrorAction SilentlyContinue) { "SI" } else { "NO" }
'@

    $script = $plantilla.Replace("__COMANDO__", $Comando)
    $bytes = [System.Text.Encoding]::Unicode.GetBytes($script)
    $scriptCodificado = [Convert]::ToBase64String($bytes)
    return ((& powershell -NoProfile -EncodedCommand $scriptCodificado) -join "").Trim()
}

function Cumple-ObjetivoVersion {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Version,
        [string]$PatronVersionObjetivo
    )

    if (-not $PatronVersionObjetivo) {
        return $true
    }

    return [bool]($Version -match $PatronVersionObjetivo)
}

function Verificar-Herramienta {
    param(
        [Parameter(Mandatory = $true)]
        [hashtable]$Herramienta
    )

    $ruta = Obtener-RutaComando -Comando $Herramienta.Comando
    $disponibleActual = [bool]$ruta
    $version = if ($ruta) { Obtener-VersionHerramienta -Comando $Herramienta.Comando -RutaEjecutable $ruta } else { "No disponible" }
    $cumpleVersion = if ($ruta) { Cumple-ObjetivoVersion -Version $version -PatronVersionObjetivo $Herramienta.PatronVersionObjetivo } else { $false }
    $disponibleNueva = Verificar-EnSesionNueva -Comando $Herramienta.Comando

    $pathActual = ($env:Path -split ";") | Where-Object { $_ -and $_.Trim() -ne "" }
    $pathSistema = (
        ([Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")) -split ";"
    ) | Where-Object { $_ -and $_.Trim() -ne "" }

    $directorio = if ($ruta) { Split-Path -Parent $ruta } else { "" }
    $enPathActual = if ($directorio) { $pathActual -contains $directorio } else { $false }
    $enPathSistemaReal = if ($directorio) { $pathSistema -contains $directorio } else { $false }
    $enPathSistema = if ($Herramienta.ValidarPathSistema) { $enPathSistemaReal } else { $true }

    $estado = if ($disponibleActual -and $disponibleNueva -eq "SI" -and $enPathActual -and $enPathSistema -and $cumpleVersion) {
        "OK"
    }
    else {
        "FALLA"
    }

    return [PSCustomObject]@{
        herramienta = $Herramienta.Nombre
        comando = $Herramienta.Comando
        objetivo = $Herramienta.PatronVersionObjetivo
        version = $version
        cumple_version_objetivo = $cumpleVersion
        ruta = if ($ruta) { $ruta } else { "No disponible" }
        disponible_sesion_actual = $disponibleActual
        disponible_sesion_nueva = $disponibleNueva
        en_path_sesion_actual = $enPathActual
        en_path_sistema = $enPathSistemaReal
        requiere_path_sistema = $Herramienta.ValidarPathSistema
        estado = $estado
    }
}

$raizProyecto = Obtener-RaizProyecto -RutaInicio $PSScriptRoot
Refrescar-PathProceso

$directorioReporte = if ([System.IO.Path]::IsPathRooted($RutaDirectorioReporte)) { $RutaDirectorioReporte } else { Join-Path $raizProyecto $RutaDirectorioReporte }
New-Item -ItemType Directory -Path $directorioReporte -Force | Out-Null

$marcaTiempo = Get-Date -Format "yyyyMMdd_HHmmss"
$rutaLog = Join-Path $directorioReporte ("11D_Verificacion_Herramientas_Base_Runner_CI_{0}.log" -f $marcaTiempo)

$herramientasObjetivo = @(
    @{ Nombre = "Git"; Comando = "git"; PatronVersionObjetivo = "^git version "; ValidarPathSistema = $true },
    @{ Nombre = "Node.js 24.x"; Comando = "node"; PatronVersionObjetivo = "^v24\."; ValidarPathSistema = $false },
    @{ Nombre = "npm"; Comando = "npm.cmd"; PatronVersionObjetivo = "^\d+\."; ValidarPathSistema = $false },
    @{ Nombre = "OpenSSL"; Comando = "openssl"; PatronVersionObjetivo = "^OpenSSL "; ValidarPathSistema = $true },
    @{ Nombre = "curl"; Comando = "curl.exe"; PatronVersionObjetivo = "^curl "; ValidarPathSistema = $true }
)

"Inicio de verificacion: $(Get-Date -Format o)" | Out-File -FilePath $rutaLog -Encoding UTF8
"Directorio de trabajo: $raizProyecto" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
"Equipo: $env:COMPUTERNAME" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
"SO: $([System.Environment]::OSVersion.VersionString)" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
"PATH actual (proceso): $env:Path" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
"PATH maquina: $([Environment]::GetEnvironmentVariable('Path', 'Machine'))" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
"PATH usuario: $([Environment]::GetEnvironmentVariable('Path', 'User'))" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append

$resultados = foreach ($herramienta in $herramientasObjetivo) {
    $resultado = Verificar-Herramienta -Herramienta $herramienta
    ($resultado | ConvertTo-Json -Compress) | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
    $resultado
}

Write-Host ""
Write-Host "Resumen de doble verificacion en runner CI:"
$resultados | Format-Table -AutoSize
Write-Host ""
Write-Host "Log generado: $rutaLog"

$fallas = @($resultados | Where-Object { $_.estado -ne "OK" })
if ($fallas.Count -gt 0) {
    Write-Warning "Se detectaron fallas de verificacion. Revisar log: $rutaLog"
    exit 1
}

exit 0
