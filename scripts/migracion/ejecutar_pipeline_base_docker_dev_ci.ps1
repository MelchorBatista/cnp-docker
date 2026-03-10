[CmdletBinding()]
param(
    [string]$DirectorioReporte = '.\docs\migracion\ejecucion',
    [string]$DirectorioArtefactos = '.\evidence\docker_dev_ci',
    [string]$TagEntorno = 'dev',
    [string]$TagInmutable = '',
    [string]$SeveridadTrivy = 'HIGH,CRITICAL',
    [switch]$ExigirHerramientasLocales
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

function Limpiar-Salida {
    param([string]$Texto)

    if (-not $Texto) {
        return ''
    }

    return ($Texto -replace "`0", '').Trim()
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
        $salida = (& $Script 2>&1 | Out-String)
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
    finally {
        $ErrorActionPreference = $preferencia
    }
}

function Es-Windows {
    return [System.Runtime.InteropServices.RuntimeInformation]::IsOSPlatform([System.Runtime.InteropServices.OSPlatform]::Windows)
}

function Escribir-Log {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Ruta,
        [string]$Contenido
    )

    if ($null -eq $Contenido) {
        $Contenido = ''
    }

    [System.IO.File]::WriteAllText($Ruta, $Contenido, [System.Text.UTF8Encoding]::new($false))
}

function Obtener-GitDato {
    param(
        [string[]]$Argumentos,
        [string]$Predeterminado = ''
    )

    $resultado = Ejecutar-Comando -Comando { git -C $script:RaizProyecto @Argumentos }
    if ($resultado.codigo -eq 0 -and $resultado.salida) {
        return $resultado.salida
    }

    return $Predeterminado
}

function Obtener-InfoHerramienta {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Nombre,
        [Parameter(Mandatory = $true)]
        [string[]]$VersionArgumentos,
        [string]$ImagenFallback = ''
    )

    $comando = Get-Command $Nombre -ErrorAction SilentlyContinue
    if ($comando) {
        $version = Ejecutar-Comando -Comando { & $Nombre @VersionArgumentos }
        return [PSCustomObject]@{
            nombre = $Nombre
            estrategia = 'local'
            version = $version.salida
            ubicacion = $comando.Source
        }
    }

    if ($ExigirHerramientasLocales) {
        throw "No se encontro la herramienta requerida en PATH local: $Nombre"
    }

    if ($ImagenFallback -and -not (Es-Windows)) {
        $version = Ejecutar-Comando -Comando { docker run --rm $ImagenFallback @VersionArgumentos }
        if ($version.codigo -ne 0) {
            throw "No se pudo obtener version de $Nombre usando imagen fallback $ImagenFallback. $($version.salida)"
        }

        return [PSCustomObject]@{
            nombre = $Nombre
            estrategia = 'docker-fallback'
            version = $version.salida
            ubicacion = "docker://$ImagenFallback"
        }
    }

    throw "No se encontro la herramienta requerida: $Nombre"
}

function Invocar-Hadolint {
    param(
        [Parameter(Mandatory = $true)]
        [pscustomobject]$Herramienta,
        [Parameter(Mandatory = $true)]
        [string]$DockerfileRelativo
    )

    if ($Herramienta.estrategia -eq 'local') {
        return Ejecutar-Comando -Comando { hadolint --failure-threshold error $DockerfileRelativo }
    }

    return Ejecutar-Comando -Comando { docker run --rm -v "${script:RaizProyecto}:/workspace" -w /workspace hadolint/hadolint:v2.14.0 hadolint --failure-threshold error $DockerfileRelativo }
}

function Invocar-Trivy {
    param(
        [Parameter(Mandatory = $true)]
        [pscustomobject]$Herramienta,
        [Parameter(Mandatory = $true)]
        [string]$Imagen,
        [Parameter(Mandatory = $true)]
        [string]$RutaSalidaJson
    )

    if ($Herramienta.estrategia -eq 'local') {
        return Ejecutar-Comando -Comando { trivy image --quiet --exit-code 0 --ignore-unfixed --severity $SeveridadTrivy --format json --output $RutaSalidaJson $Imagen }
    }

    $directorioSalida = Split-Path -Parent $RutaSalidaJson
    $nombreSalida = Split-Path -Leaf $RutaSalidaJson
    $cacheDir = Join-Path $script:DirectorioTrabajo '.trivy-cache'
    New-Item -ItemType Directory -Path $cacheDir -Force | Out-Null

    return Ejecutar-Comando -Comando {
        docker run --rm `
            -v /var/run/docker.sock:/var/run/docker.sock `
            -v "${directorioSalida}:/work" `
            -v "${cacheDir}:/root/.cache/trivy" `
            aquasec/trivy:0.69.3 `
            image --quiet --exit-code 0 --ignore-unfixed --severity $SeveridadTrivy --format json --output "/work/$nombreSalida" $Imagen
    }
}

function Invocar-Syft {
    param(
        [Parameter(Mandatory = $true)]
        [pscustomobject]$Herramienta,
        [Parameter(Mandatory = $true)]
        [string]$Imagen,
        [Parameter(Mandatory = $true)]
        [string]$RutaSalidaJson
    )

    if ($Herramienta.estrategia -eq 'local') {
        return Ejecutar-Comando -Comando { syft $Imagen -o "spdx-json=$RutaSalidaJson" }
    }

    $directorioSalida = Split-Path -Parent $RutaSalidaJson
    $nombreSalida = Split-Path -Leaf $RutaSalidaJson

    return Ejecutar-Comando -Comando {
        docker run --rm `
            -v /var/run/docker.sock:/var/run/docker.sock `
            -v "${directorioSalida}:/work" `
            anchore/syft:v1.42.1 `
            $Imagen -o "spdx-json=/work/$nombreSalida"
    }
}

$script:RaizProyecto = Obtener-RaizProyecto -RutaInicio $PSScriptRoot
$directorioReporteAbs = if ([System.IO.Path]::IsPathRooted($DirectorioReporte)) {
    $DirectorioReporte
}
else {
    Join-Path $script:RaizProyecto $DirectorioReporte
}
$directorioArtefactosAbs = if ([System.IO.Path]::IsPathRooted($DirectorioArtefactos)) {
    $DirectorioArtefactos
}
else {
    Join-Path $script:RaizProyecto $DirectorioArtefactos
}

New-Item -ItemType Directory -Path $directorioReporteAbs -Force | Out-Null
New-Item -ItemType Directory -Path $directorioArtefactosAbs -Force | Out-Null

$marcaTiempo = Get-Date -Format 'yyyyMMdd_HHmmss'
$script:DirectorioTrabajo = Join-Path $directorioArtefactosAbs ("pipeline_{0}" -f $marcaTiempo)
$script:DirectorioReportesPipeline = Join-Path $script:DirectorioTrabajo 'reportes'
$script:DirectorioPaquete = Join-Path $script:DirectorioTrabajo 'paquete'
New-Item -ItemType Directory -Path $script:DirectorioTrabajo -Force | Out-Null
New-Item -ItemType Directory -Path $script:DirectorioReportesPipeline -Force | Out-Null
New-Item -ItemType Directory -Path $script:DirectorioPaquete -Force | Out-Null

$shaCorto = Obtener-GitDato -Argumentos @('rev-parse', '--short=7', 'HEAD')
$revisionCompleta = Obtener-GitDato -Argumentos @('rev-parse', 'HEAD') -Predeterminado $shaCorto
$origenGit = Obtener-GitDato -Argumentos @('config', '--get', 'remote.origin.url') -Predeterminado $script:RaizProyecto

if (-not $TagInmutable) {
    $TagInmutable = "sha-$shaCorto"
}

$creadoEn = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')

$herramientas = @(
    (Obtener-InfoHerramienta -Nombre 'hadolint' -VersionArgumentos @('--version') -ImagenFallback 'hadolint/hadolint:v2.14.0')
    (Obtener-InfoHerramienta -Nombre 'trivy' -VersionArgumentos @('version') -ImagenFallback 'aquasec/trivy:0.69.3')
    (Obtener-InfoHerramienta -Nombre 'syft' -VersionArgumentos @('version') -ImagenFallback 'anchore/syft:v1.42.1')
)

$rutaLogHerramientas = Join-Path $directorioReporteAbs ("44A_Toolchain_Pipeline_Base_Docker_DEV_CI_{0}.log" -f $marcaTiempo)
Escribir-Log -Ruta $rutaLogHerramientas -Contenido (($herramientas | ConvertTo-Json -Depth 4))

$imagenes = @(
    @{
        Nombre = 'backend'
        Repositorio = 'cnp-backend'
        Dockerfile = 'backend/Dockerfile'
        Contexto = 'backend'
        ExtraBuildArgs = @()
    },
    @{
        Nombre = 'frontend'
        Repositorio = 'cnp-frontend'
        Dockerfile = 'frontend/Dockerfile'
        Contexto = 'frontend'
        ExtraBuildArgs = @()
    },
    @{
        Nombre = 'proxy'
        Repositorio = 'cnp-proxy'
        Dockerfile = 'proxy/Dockerfile'
        Contexto = 'proxy'
        ExtraBuildArgs = @()
    }
)

$resumen = [ordered]@{
    fecha = (Get-Date).ToString('s')
    tagEntorno = $TagEntorno
    tagInmutable = $TagInmutable
    revision = $revisionCompleta
    origen = $origenGit
    herramientas = $herramientas
    imagenes = @()
    paquete = $script:DirectorioPaquete
}

foreach ($imagen in $imagenes) {
    $etiquetaInmutable = "{0}:{1}" -f $imagen.Repositorio, $TagInmutable
    $etiquetaEntorno = "{0}:{1}" -f $imagen.Repositorio, $TagEntorno
    $rutaLogBuild = Join-Path $directorioReporteAbs ("44B_Docker_Build_{0}_{1}.log" -f ($imagen.Nombre.ToUpperInvariant()), $marcaTiempo)
    $rutaLogHadolint = Join-Path $directorioReporteAbs ("44C_Hadolint_{0}_{1}.log" -f ($imagen.Nombre.ToUpperInvariant()), $marcaTiempo)
    $rutaLogTrivy = Join-Path $directorioReporteAbs ("44D_Trivy_{0}_{1}.log" -f ($imagen.Nombre.ToUpperInvariant()), $marcaTiempo)
    $rutaLogSyft = Join-Path $directorioReporteAbs ("44E_Syft_{0}_{1}.log" -f ($imagen.Nombre.ToUpperInvariant()), $marcaTiempo)
    $rutaReporteTrivy = Join-Path $script:DirectorioReportesPipeline ("{0}-trivy.json" -f $imagen.Nombre)
    $rutaReporteSyft = Join-Path $script:DirectorioReportesPipeline ("{0}-sbom.spdx.json" -f $imagen.Nombre)

    $argumentosBuild = @(
        'build',
        '-f', $imagen.Dockerfile,
        '-t', $etiquetaInmutable,
        '-t', $etiquetaEntorno,
        '--build-arg', "OCI_TITLE=$($imagen.Repositorio)",
        '--build-arg', "OCI_VERSION=$TagInmutable",
        '--build-arg', "OCI_REVISION=$revisionCompleta",
        '--build-arg', "OCI_SOURCE=$origenGit",
        '--build-arg', "OCI_CREATED=$creadoEn"
    ) + $imagen.ExtraBuildArgs + @($imagen.Contexto)

    $resultadoBuild = Ejecutar-Comando -Comando { docker @argumentosBuild }
    Escribir-Log -Ruta $rutaLogBuild -Contenido $resultadoBuild.salida
    if ($resultadoBuild.codigo -ne 0) {
        throw "Fallo el build Docker de $($imagen.Nombre). Revisar $rutaLogBuild"
    }

    $hadolint = $herramientas | Where-Object { $_.nombre -eq 'hadolint' } | Select-Object -First 1
    $resultadoHadolint = Invocar-Hadolint -Herramienta $hadolint -DockerfileRelativo $imagen.Dockerfile
    Escribir-Log -Ruta $rutaLogHadolint -Contenido $resultadoHadolint.salida
    if ($resultadoHadolint.codigo -ne 0) {
        throw "Fallo Hadolint para $($imagen.Dockerfile). Revisar $rutaLogHadolint"
    }

    $trivy = $herramientas | Where-Object { $_.nombre -eq 'trivy' } | Select-Object -First 1
    $resultadoTrivy = Invocar-Trivy -Herramienta $trivy -Imagen $etiquetaInmutable -RutaSalidaJson $rutaReporteTrivy
    Escribir-Log -Ruta $rutaLogTrivy -Contenido $resultadoTrivy.salida
    if ($resultadoTrivy.codigo -ne 0) {
        throw "Fallo Trivy para $etiquetaInmutable. Revisar $rutaLogTrivy"
    }

    $syft = $herramientas | Where-Object { $_.nombre -eq 'syft' } | Select-Object -First 1
    $resultadoSyft = Invocar-Syft -Herramienta $syft -Imagen $etiquetaInmutable -RutaSalidaJson $rutaReporteSyft
    Escribir-Log -Ruta $rutaLogSyft -Contenido $resultadoSyft.salida
    if ($resultadoSyft.codigo -ne 0) {
        throw "Fallo Syft para $etiquetaInmutable. Revisar $rutaLogSyft"
    }

    $resumen.imagenes += [ordered]@{
        nombre = $imagen.Nombre
        etiquetaInmutable = $etiquetaInmutable
        etiquetaEntorno = $etiquetaEntorno
        logBuild = $rutaLogBuild
        logHadolint = $rutaLogHadolint
        logTrivy = $rutaLogTrivy
        logSyft = $rutaLogSyft
        reporteTrivy = $rutaReporteTrivy
        reporteSyft = $rutaReporteSyft
    }
}

$rutaScriptPaquete = Join-Path (Join-Path (Join-Path $script:RaizProyecto 'scripts') 'migracion') 'preparar_paquete_artefactos_docker_dev_ci.ps1'
$rutaLogPaquete = Join-Path $directorioReporteAbs ("44F_Paquete_Docker_DEV_CI_{0}.log" -f $marcaTiempo)
$resultadoPaquete = Ejecutar-Comando -Comando {
    & $rutaScriptPaquete `
        -DirectorioSalida $script:DirectorioPaquete `
        -ImagenBackend ("cnp-backend:{0}" -f $TagInmutable) `
        -ImagenFrontend ("cnp-frontend:{0}" -f $TagInmutable) `
        -ImagenProxy ("cnp-proxy:{0}" -f $TagInmutable) `
        -RutaDirectorioReportes $script:DirectorioReportesPipeline
}
Escribir-Log -Ruta $rutaLogPaquete -Contenido $resultadoPaquete.salida
if ($resultadoPaquete.codigo -ne 0) {
    throw "Fallo el empaquetado local de artefactos Docker. Revisar $rutaLogPaquete"
}

$rutaLogResumen = Join-Path $directorioReporteAbs ("44G_Resumen_Pipeline_Base_Docker_DEV_CI_{0}.log" -f $marcaTiempo)
Escribir-Log -Ruta $rutaLogResumen -Contenido (($resumen | ConvertTo-Json -Depth 6))

Write-Host "Pipeline base Docker DEV/CI ejecutado correctamente."
Write-Host "Tag inmutable: $TagInmutable"
Write-Host "Paquete generado: $script:DirectorioPaquete"
