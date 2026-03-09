[CmdletBinding()]
param(
    [string]$RutaDirectorioReporte = ".\\docs\\migracion\\ejecucion",
    [switch]$SoloVerificacion
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

function Evaluar-Herramienta {
    param(
        [Parameter(Mandatory = $true)]
        [hashtable]$Herramienta
    )

    $ruta = Obtener-RutaComando -Comando $Herramienta.Comando
    $version = if ($ruta) {
        Obtener-VersionHerramienta -Comando $Herramienta.Comando -RutaEjecutable $ruta
    }
    else {
        "No disponible"
    }

    $cumple = if ($ruta) {
        Cumple-ObjetivoVersion -Version $version -PatronVersionObjetivo $Herramienta.PatronVersionObjetivo
    }
    else {
        $false
    }

    return [PSCustomObject]@{
        ruta = if ($ruta) { $ruta } else { "No disponible" }
        version = $version
        cumple = $cumple
    }
}

function Asegurar-Chocolatey {
    if (Get-Command choco -ErrorAction SilentlyContinue) {
        return $true
    }

    if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
        return $false
    }

    & winget install --id Chocolatey.Chocolatey --exact --silent --accept-package-agreements --accept-source-agreements --disable-interactivity
    Refrescar-PathProceso
    return [bool](Get-Command choco -ErrorAction SilentlyContinue)
}

function Intentar-InstalacionWinget {
    param(
        [Parameter(Mandatory = $true)]
        [hashtable]$Herramienta
    )

    if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
        return $false
    }

    foreach ($idWinget in $Herramienta.IdsWinget) {
        if (-not $idWinget) {
            continue
        }

        & winget install --id $idWinget --exact --scope user --silent --accept-package-agreements --accept-source-agreements --disable-interactivity
        $codigo = $LASTEXITCODE
        Refrescar-PathProceso

        $estado = Evaluar-Herramienta -Herramienta $Herramienta
        if ($codigo -eq 0 -and $estado.cumple) {
            return $true
        }
    }

    return $false
}

function Intentar-InstalacionChocolatey {
    param(
        [Parameter(Mandatory = $true)]
        [hashtable]$Herramienta
    )

    if (-not (Asegurar-Chocolatey)) {
        return $false
    }

    foreach ($paquete in $Herramienta.PaquetesChocolatey) {
        if (-not $paquete) {
            continue
        }

        & choco install $paquete -y --no-progress
        $codigo = $LASTEXITCODE
        Refrescar-PathProceso

        $estado = Evaluar-Herramienta -Herramienta $Herramienta
        if ($codigo -eq 0 -and $estado.cumple) {
            return $true
        }
    }

    return $false
}

$raizProyecto = Obtener-RaizProyecto -RutaInicio $PSScriptRoot
$directorioReporte = if ([System.IO.Path]::IsPathRooted($RutaDirectorioReporte)) { $RutaDirectorioReporte } else { Join-Path $raizProyecto $RutaDirectorioReporte }
New-Item -ItemType Directory -Path $directorioReporte -Force | Out-Null
Refrescar-PathProceso

$marcaTiempo = Get-Date -Format "yyyyMMdd_HHmmss"
$rutaLog = Join-Path $directorioReporte ("11C_Instalacion_Herramientas_Base_Runner_CI_{0}.log" -f $marcaTiempo)

$herramientasObjetivo = @(
    @{
        Nombre = "Git"
        Comando = "git"
        PatronVersionObjetivo = "^git version "
        Provision = "Runner base/winget/chocolatey"
        IdsWinget = @("Git.Git")
        PaquetesChocolatey = @("git")
    },
    @{
        Nombre = "Node.js 18 LTS"
        Comando = "node"
        PatronVersionObjetivo = "^v18\."
        Provision = "actions/setup-node@v4"
        IdsWinget = @()
        PaquetesChocolatey = @()
    },
    @{
        Nombre = "npm"
        Comando = "npm.cmd"
        PatronVersionObjetivo = "^\d+\."
        Provision = "actions/setup-node@v4"
        IdsWinget = @()
        PaquetesChocolatey = @()
    },
    @{
        Nombre = "OpenSSL"
        Comando = "openssl"
        PatronVersionObjetivo = "^OpenSSL "
        Provision = "Runner base/winget/chocolatey"
        IdsWinget = @("ShiningLight.OpenSSL.Light", "FireDaemon.OpenSSL")
        PaquetesChocolatey = @("openssl.light")
    },
    @{
        Nombre = "curl"
        Comando = "curl.exe"
        PatronVersionObjetivo = "^curl "
        Provision = "Runner base/winget/chocolatey"
        IdsWinget = @("cURL.cURL")
        PaquetesChocolatey = @("curl")
    }
)

"Inicio de instalacion/verificacion: $(Get-Date -Format o)" | Out-File -FilePath $rutaLog -Encoding UTF8
"Directorio de trabajo: $raizProyecto" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
"Solo verificacion: $SoloVerificacion" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
"Equipo: $env:COMPUTERNAME" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
"SO: $([System.Environment]::OSVersion.VersionString)" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append

$resultados = foreach ($herramienta in $herramientasObjetivo) {
    $estadoInicial = Evaluar-Herramienta -Herramienta $herramienta
    $metodo = "Ninguno"
    $resultado = "Sin cambios"

    if (-not $estadoInicial.cumple -and -not $SoloVerificacion) {
        $instalado = $false

        if ($herramienta.IdsWinget.Count -gt 0) {
            $instalado = Intentar-InstalacionWinget -Herramienta $herramienta
            if ($instalado) {
                $metodo = "winget"
                $resultado = "Instalado/Ajustado"
            }
        }

        if (-not $instalado -and $herramienta.PaquetesChocolatey.Count -gt 0) {
            $instalado = Intentar-InstalacionChocolatey -Herramienta $herramienta
            if ($instalado) {
                $metodo = "chocolatey"
                $resultado = "Instalado/Ajustado"
            }
        }

        if (-not $instalado -and $metodo -eq "Ninguno") {
            $metodo = $herramienta.Provision
            $resultado = "Pendiente/Ajuste requerido"
        }
        elseif (-not $instalado) {
            $resultado = "Fallo"
        }
    }

    $estadoFinal = Evaluar-Herramienta -Herramienta $herramienta
    if (-not $estadoFinal.cumple -and $resultado -eq "Sin cambios") {
        $resultado = "Pendiente/Ajuste requerido"
        $metodo = $herramienta.Provision
    }

    $fila = [PSCustomObject]@{
        herramienta = $herramienta.Nombre
        objetivo = $herramienta.PatronVersionObjetivo
        provision_esperada = $herramienta.Provision
        estado_inicial = if ($estadoInicial.cumple) { "Cumple" } else { "No cumple" }
        version_inicial = $estadoInicial.version
        ruta_inicial = $estadoInicial.ruta
        metodo = $metodo
        resultado = $resultado
        estado_final = if ($estadoFinal.cumple) { "Cumple" } else { "No cumple" }
        version_final = $estadoFinal.version
        ruta_final = $estadoFinal.ruta
    }

    ($fila | ConvertTo-Json -Compress) | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
    $fila
}

Write-Host ""
Write-Host "Resumen instalacion base en runner CI:"
$resultados | Format-Table -AutoSize
Write-Host ""
Write-Host "Log generado: $rutaLog"

$fallas = @($resultados | Where-Object { $_.estado_final -ne "Cumple" })
if ($fallas.Count -gt 0) {
    Write-Warning "Se detectaron fallas o pendientes en herramientas base. Revisar log."
    exit 1
}

exit 0
