[CmdletBinding()]
param(
    [string]$DirectorioSalida = '',
    [Parameter(Mandatory = $true)]
    [string]$ImagenBackend,
    [Parameter(Mandatory = $true)]
    [string]$ImagenFrontend,
    [Parameter(Mandatory = $true)]
    [string]$ImagenProxy,
    [string]$RutaDirectorioReportes = '',
    [string]$RutaEntornoEjemplo = '',
    [string]$RutaEstandar = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if (-not $DirectorioSalida) {
    $DirectorioSalida = Join-Path $PSScriptRoot '..\..\evidence\docker_dev_ci\paquete_local'
}
if (-not $RutaEntornoEjemplo) {
    $RutaEntornoEjemplo = Join-Path $PSScriptRoot '..\..\backend\.env.example'
}
if (-not $RutaEstandar) {
    $RutaEstandar = Join-Path $PSScriptRoot '..\..\docs\migracion\operaciones\Estandar_Imagenes_Versionado_Docker.md'
}

$imagenes = @(
    @{ Nombre = 'backend'; Etiqueta = $ImagenBackend },
    @{ Nombre = 'frontend'; Etiqueta = $ImagenFrontend },
    @{ Nombre = 'proxy'; Etiqueta = $ImagenProxy }
)

New-Item -ItemType Directory -Path $DirectorioSalida -Force | Out-Null

function New-ArtifactRecord {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Nombre,
        [Parameter(Mandatory = $true)]
        [string]$RutaArchivo,
        [Parameter(Mandatory = $true)]
        [string]$Categoria,
        [string]$Etiqueta = '',
        [string]$Digest = ''
    )

    $item = Get-Item -LiteralPath $RutaArchivo
    $hash = Get-FileHash -Path $RutaArchivo -Algorithm SHA256

    $registro = [ordered]@{
        nombre = $Nombre
        categoria = $Categoria
        archivo = $item.Name
        sha256 = $hash.Hash
        tamanoBytes = [int64]$item.Length
    }

    if ($Etiqueta) {
        $registro.etiqueta = $Etiqueta
    }

    if ($Digest) {
        $registro.digest = $Digest
    }

    return $registro
}

$manifiesto = [ordered]@{
    fecha = (Get-Date).ToString('s')
    directorioSalida = (Resolve-Path $DirectorioSalida).Path
    algoritmoChecksum = 'SHA256'
    notaChecksums = 'checksums.sha256 incluye imagenes exportadas, reportes y manifest.json; no se auto-firma para evitar referencia circular.'
    imagenes = @()
    archivos = @()
}

foreach ($imagen in $imagenes) {
    $inspectJson = docker image inspect $imagen.Etiqueta 2>$null | Out-String
    if ($LASTEXITCODE -ne 0) {
        throw "No existe la imagen requerida: $($imagen.Etiqueta)"
    }

    $inspect = $inspectJson | ConvertFrom-Json
    $repoDigests = @($inspect[0].RepoDigests)
    $digest = if ($repoDigests.Count -gt 0) {
        ($repoDigests[0] -split '@', 2)[1]
    }
    else {
        $inspect[0].Id
    }

    $rutaTar = Join-Path $DirectorioSalida ("cnp-{0}.tar" -f $imagen.Nombre)
    docker save -o $rutaTar $imagen.Etiqueta
    if ($LASTEXITCODE -ne 0) {
        throw "No se pudo exportar la imagen: $($imagen.Etiqueta)"
    }

    $manifiesto.imagenes += New-ArtifactRecord -Nombre $imagen.Nombre -RutaArchivo $rutaTar -Categoria 'imagen' -Etiqueta $imagen.Etiqueta -Digest $digest
}

if (Test-Path $RutaEntornoEjemplo) {
    $destinoEntorno = Join-Path $DirectorioSalida 'backend.env.example'
    Copy-Item -Path $RutaEntornoEjemplo -Destination $destinoEntorno -Force
    $manifiesto.archivos += New-ArtifactRecord -Nombre 'entorno-ejemplo' -RutaArchivo $destinoEntorno -Categoria 'configuracion'
}

if (Test-Path $RutaEstandar) {
    $destinoEstandar = Join-Path $DirectorioSalida ([System.IO.Path]::GetFileName($RutaEstandar))
    Copy-Item -Path $RutaEstandar -Destination $destinoEstandar -Force
    $manifiesto.archivos += New-ArtifactRecord -Nombre 'estandar-imagenes-versionado' -RutaArchivo $destinoEstandar -Categoria 'documentacion'
}

if ($RutaDirectorioReportes -and (Test-Path $RutaDirectorioReportes)) {
    $directorioReportesDestino = Join-Path $DirectorioSalida 'reportes'
    New-Item -ItemType Directory -Path $directorioReportesDestino -Force | Out-Null

    foreach ($reporte in Get-ChildItem -Path $RutaDirectorioReportes -File) {
        $destinoReporte = Join-Path $directorioReportesDestino $reporte.Name
        Copy-Item -Path $reporte.FullName -Destination $destinoReporte -Force
        $manifiesto.archivos += New-ArtifactRecord -Nombre $reporte.BaseName -RutaArchivo $destinoReporte -Categoria 'reporte'
    }
}

$manifestJson = $manifiesto | ConvertTo-Json -Depth 6
$pathManifest = Join-Path $DirectorioSalida 'manifest.json'
$pathChecksums = Join-Path $DirectorioSalida 'checksums.sha256'

[System.IO.File]::WriteAllText($pathManifest, $manifestJson, [System.Text.UTF8Encoding]::new($false))

$artefactosConChecksum = @($manifiesto.imagenes) + @($manifiesto.archivos)
$artefactosConChecksum += New-ArtifactRecord -Nombre 'manifest' -RutaArchivo $pathManifest -Categoria 'metadata'

$lineasChecksum = foreach ($artefacto in $artefactosConChecksum) {
    "{0} *{1}" -f $artefacto.sha256, $artefacto.archivo
}

[System.IO.File]::WriteAllText($pathChecksums, ($lineasChecksum -join [Environment]::NewLine), [System.Text.UTF8Encoding]::new($false))

Write-Host "Paquete DEV/CI generado en: $DirectorioSalida"
