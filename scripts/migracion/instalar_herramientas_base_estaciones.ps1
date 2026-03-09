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
    $pathActual = @($env:Path -split ";") | Where-Object { $_ -and $_.Trim() -ne "" }
    if ($pathActual -notcontains $Directorio) {
        $env:Path = "$env:Path;$Directorio"
    }

    return $true
}

function Probar-Cumplimiento {
    param(
        [Parameter(Mandatory = $true)]
        [hashtable]$Herramienta
    )

    $ruta = Obtener-RutaComando -Comando $Herramienta.Comando
    if ($ruta) {
        [void](Agregar-DirectorioAPathUsuario -Directorio (Split-Path -Parent $ruta))
        $ruta = Obtener-RutaComando -Comando $Herramienta.Comando
    }

    $version = if ($ruta) {
        Obtener-VersionHerramienta -Comando $Herramienta.Comando -RutaEjecutable $ruta
    }
    else {
        "No disponible"
    }

    $cumple = $false
    if ($ruta) {
        if ($Herramienta.PatronVersionObjetivo) {
            $cumple = [bool]($version -match $Herramienta.PatronVersionObjetivo)
        }
        else {
            $cumple = $true
        }
    }

    return [PSCustomObject]@{
        ruta = if ($ruta) { $ruta } else { "No disponible" }
        version = $version
        cumple = $cumple
    }
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

        foreach ($scope in @("user", "machine")) {
            Write-Host "[winget] Intentando instalar/ajustar $($Herramienta.Nombre) con id '$idWinget' y scope '$scope'..."
            & winget install --id $idWinget --exact --scope $scope --silent --accept-package-agreements --accept-source-agreements --disable-interactivity
            $codigo = $LASTEXITCODE
            Refrescar-PathProceso

            $verificacion = Probar-Cumplimiento -Herramienta $Herramienta
            if ($codigo -eq 0 -and $verificacion.cumple) {
                return $true
            }
        }
    }

    return $false
}

function Asegurar-Chocolatey {
    if (Get-Command choco -ErrorAction SilentlyContinue) {
        return $true
    }

    if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
        return $false
    }

    Write-Host "[winget] Chocolatey no encontrado. Intentando instalar Chocolatey..."
    & winget install --id Chocolatey.Chocolatey --exact --silent --accept-package-agreements --accept-source-agreements --disable-interactivity
    $codigo = $LASTEXITCODE
    Refrescar-PathProceso

    if ($codigo -ne 0) {
        return $false
    }

    return [bool](Get-Command choco -ErrorAction SilentlyContinue)
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

        Write-Host "[choco] Intentando instalar/ajustar $($Herramienta.Nombre) con paquete '$paquete'..."
        & choco install $paquete -y --no-progress
        $codigo = $LASTEXITCODE
        Refrescar-PathProceso

        $verificacion = Probar-Cumplimiento -Herramienta $Herramienta
        if ($codigo -eq 0 -and $verificacion.cumple) {
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
Refrescar-PathProceso

$marcaTiempo = Get-Date -Format "yyyyMMdd_HHmmss"
$rutaLog = Join-Path $directorioReporte ("11A_Instalacion_Herramientas_Base_Estaciones_{0}.log" -f $marcaTiempo)

$herramientasObjetivo = @(
    @{
        Nombre = "Git"
        Comando = "git"
        PatronVersionObjetivo = ""
        DescripcionObjetivo = "Disponible en PATH."
        IdsWinget = @("Git.Git")
        PaquetesChocolatey = @("git")
    },
    @{
        Nombre = "Node.js 18 LTS"
        Comando = "node"
        PatronVersionObjetivo = "^v18\."
        DescripcionObjetivo = "Version principal 18.x"
        IdsWinget = @("OpenJS.NodeJS.18")
        PaquetesChocolatey = @("nodejs-lts")
    },
    @{
        Nombre = "npm"
        Comando = "npm.cmd"
        PatronVersionObjetivo = ""
        DescripcionObjetivo = "Disponible en PATH."
        IdsWinget = @("OpenJS.NodeJS.18")
        PaquetesChocolatey = @("nodejs-lts")
    },
    @{
        Nombre = "OpenSSL"
        Comando = "openssl"
        PatronVersionObjetivo = "^OpenSSL "
        DescripcionObjetivo = "Comando funcional en PATH."
        IdsWinget = @("ShiningLight.OpenSSL.Light", "FireDaemon.OpenSSL")
        PaquetesChocolatey = @("openssl.light")
    },
    @{
        Nombre = "curl"
        Comando = "curl.exe"
        PatronVersionObjetivo = "^curl "
        DescripcionObjetivo = "Comando funcional en PATH."
        IdsWinget = @("cURL.cURL")
        PaquetesChocolatey = @("curl")
    }
)

"Inicio de instalacion/verificacion: $(Get-Date -Format o)" | Out-File -FilePath $rutaLog -Encoding UTF8
"Directorio de trabajo: $raizProyecto" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
"Solo verificacion: $SoloVerificacion" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
"winget disponible: $([bool](Get-Command winget -ErrorAction SilentlyContinue))" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
"choco disponible (inicio): $([bool](Get-Command choco -ErrorAction SilentlyContinue))" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append

$resultados = foreach ($herramienta in $herramientasObjetivo) {
    $estadoInicial = Probar-Cumplimiento -Herramienta $herramienta
    $metodo = "Ninguno"
    $resultadoInstalacion = "Sin cambios"

    if (-not $estadoInicial.cumple -and -not $SoloVerificacion) {
        $instaladoWinget = Intentar-InstalacionWinget -Herramienta $herramienta
        if ($instaladoWinget) {
            $metodo = "winget"
            $resultadoInstalacion = "Instalado/Ajustado"
        }
        else {
            $instaladoChoco = Intentar-InstalacionChocolatey -Herramienta $herramienta
            if ($instaladoChoco) {
                $metodo = "chocolatey"
                $resultadoInstalacion = "Instalado/Ajustado"
            }
            else {
                $metodo = "Fallo winget/chocolatey"
                $resultadoInstalacion = "Fallo"
            }
        }
    }

    $estadoFinal = Probar-Cumplimiento -Herramienta $herramienta
    if (-not $estadoFinal.cumple) {
        if ($metodo -eq "Ninguno") {
            $resultadoInstalacion = "Pendiente/Ajuste requerido"
        }
        else {
            $resultadoInstalacion = "Fallo"
        }
    }

    $fila = [PSCustomObject]@{
        herramienta = $herramienta.Nombre
        comando = $herramienta.Comando
        objetivo = $herramienta.DescripcionObjetivo
        estado_inicial = if ($estadoInicial.cumple) { "Cumple" } else { "No cumple" }
        version_inicial = $estadoInicial.version
        ruta_inicial = $estadoInicial.ruta
        metodo = $metodo
        resultado = $resultadoInstalacion
        estado_final = if ($estadoFinal.cumple) { "Cumple" } else { "No cumple" }
        version_final = $estadoFinal.version
        ruta_final = $estadoFinal.ruta
    }

    ($fila | ConvertTo-Json -Compress) | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
    $fila
}

Write-Host ""
Write-Host "Resumen instalacion/verificacion herramientas base:"
$resultados | Format-Table -AutoSize
Write-Host ""
Write-Host "Log generado: $rutaLog"

$fallas = @($resultados | Where-Object { $_.estado_final -ne "Cumple" })
if ($fallas.Count -gt 0) {
    Write-Warning "Se detectaron herramientas pendientes o con falla. Revise el log para detalle."
    exit 1
}

exit 0
