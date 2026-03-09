[CmdletBinding()]
param(
    [string]$DirectorioSalida = '',
    [string]$ImagenBackend = 'cnp-backend:staging',
    [string]$ImagenFrontend = 'cnp-frontend:staging',
    [string]$ImagenProxy = 'cnp-proxy:staging',
    [string]$RutaCompose = '',
    [string]$RutaEntorno = '',
    [string]$RutaRunbook = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if (-not $DirectorioSalida) {
    $DirectorioSalida = Join-Path $PSScriptRoot '..\..\evidence\paquete_staging_local'
}
if (-not $RutaCompose) {
    $RutaCompose = Join-Path $PSScriptRoot '..\..\docker-compose.staging.yml'
}
if (-not $RutaEntorno) {
    $RutaEntorno = Join-Path $PSScriptRoot '..\..\backend\.env.example'
}
if (-not $RutaRunbook) {
    $RutaRunbook = Join-Path $PSScriptRoot '..\..\docs\migracion\operaciones\Runbook_Entrega_Local_Infraestructura_STAGING.md'
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
        [string]$Etiqueta = ''
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

    return $registro
}

$manifiesto = [ordered]@{
    fecha = (Get-Date).ToString('s')
    directorioSalida = (Resolve-Path $DirectorioSalida).Path
    algoritmoChecksum = 'SHA256'
    notaChecksums = 'checksums.sha256 incluye imagenes, archivos de soporte y manifest.json; no se auto-firma para evitar referencia circular.'
    imagenes = @()
    archivos = @()
}

foreach ($imagen in $imagenes) {
    docker image inspect $imagen.Etiqueta *> $null
    if ($LASTEXITCODE -ne 0) {
        throw "No existe la imagen requerida: $($imagen.Etiqueta)"
    }

    $rutaTar = Join-Path $DirectorioSalida ("cnp-{0}.tar" -f $imagen.Nombre)
    docker save -o $rutaTar $imagen.Etiqueta
    if ($LASTEXITCODE -ne 0) {
        throw "No se pudo exportar la imagen: $($imagen.Etiqueta)"
    }

    $manifiesto.imagenes += New-ArtifactRecord -Nombre $imagen.Nombre -RutaArchivo $rutaTar -Categoria 'imagen' -Etiqueta $imagen.Etiqueta
}

if (Test-Path $RutaCompose) {
    $destinoCompose = Join-Path $DirectorioSalida ([System.IO.Path]::GetFileName($RutaCompose))
    Copy-Item -Path $RutaCompose -Destination $destinoCompose -Force
    $manifiesto.archivos += New-ArtifactRecord -Nombre 'compose' -RutaArchivo $destinoCompose -Categoria 'configuracion'
}
else {
    Write-Warning "No se encontro el archivo compose esperado: $RutaCompose"
}

if (Test-Path $RutaEntorno) {
    $destinoEntorno = Join-Path $DirectorioSalida 'backend.env.example'
    Copy-Item -Path $RutaEntorno -Destination $destinoEntorno -Force
    $manifiesto.archivos += New-ArtifactRecord -Nombre 'entorno' -RutaArchivo $destinoEntorno -Categoria 'configuracion'
}
else {
    Write-Warning "No se encontro la plantilla de entorno esperada: $RutaEntorno"
}

if (Test-Path $RutaRunbook) {
    $destinoRunbook = Join-Path $DirectorioSalida ([System.IO.Path]::GetFileName($RutaRunbook))
    Copy-Item -Path $RutaRunbook -Destination $destinoRunbook -Force
    $manifiesto.archivos += New-ArtifactRecord -Nombre 'runbook' -RutaArchivo $destinoRunbook -Categoria 'documentacion'
}
else {
    Write-Warning "No se encontro el runbook esperado: $RutaRunbook"
}

$manifestJson = $manifiesto | ConvertTo-Json -Depth 5
$pathManifest = Join-Path $DirectorioSalida 'manifest.json'
$pathChecksums = Join-Path $DirectorioSalida 'checksums.sha256'

[System.IO.File]::WriteAllText($pathManifest, $manifestJson, [System.Text.UTF8Encoding]::new($false))

$artefactosConChecksum = @($manifiesto.imagenes) + @($manifiesto.archivos)
$artefactosConChecksum += New-ArtifactRecord -Nombre 'manifest' -RutaArchivo $pathManifest -Categoria 'metadata'

$lineasChecksum = foreach ($artefacto in $artefactosConChecksum) {
    "{0} *{1}" -f $artefacto.sha256, $artefacto.archivo
}

[System.IO.File]::WriteAllText($pathChecksums, ($lineasChecksum -join [Environment]::NewLine), [System.Text.UTF8Encoding]::new($false))

Write-Host "Paquete de entrega generado en: $DirectorioSalida"
