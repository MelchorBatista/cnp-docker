[CmdletBinding()]
param(
    [string]$DirectorioSalida = '',
    [string]$ImagenBackend = 'cnp-backend:staging',
    [string]$ImagenFrontend = 'cnp-frontend:staging',
    [string]$ImagenProxy = 'cnp-proxy:staging',
    [string]$RutaCompose = '',
    [string]$RutaEntorno = ''
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

$imagenes = @(
    @{ Nombre = 'backend'; Etiqueta = $ImagenBackend },
    @{ Nombre = 'frontend'; Etiqueta = $ImagenFrontend },
    @{ Nombre = 'proxy'; Etiqueta = $ImagenProxy }
)

New-Item -ItemType Directory -Path $DirectorioSalida -Force | Out-Null

$manifiesto = [ordered]@{
    fecha = (Get-Date).ToString('s')
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

    $hash = Get-FileHash -Path $rutaTar -Algorithm SHA256
    $manifiesto.imagenes += [ordered]@{
        nombre = $imagen.Nombre
        etiqueta = $imagen.Etiqueta
        archivo = [System.IO.Path]::GetFileName($rutaTar)
        sha256 = $hash.Hash
    }
}

if (Test-Path $RutaCompose) {
    $destinoCompose = Join-Path $DirectorioSalida ([System.IO.Path]::GetFileName($RutaCompose))
    Copy-Item -Path $RutaCompose -Destination $destinoCompose -Force
    $manifiesto.archivos += [ordered]@{ nombre = 'compose'; archivo = [System.IO.Path]::GetFileName($destinoCompose) }
}
else {
    Write-Warning "No se encontro el archivo compose esperado: $RutaCompose"
}

if (Test-Path $RutaEntorno) {
    $destinoEntorno = Join-Path $DirectorioSalida 'backend.env.example'
    Copy-Item -Path $RutaEntorno -Destination $destinoEntorno -Force
    $manifiesto.archivos += [ordered]@{ nombre = 'entorno'; archivo = [System.IO.Path]::GetFileName($destinoEntorno) }
}
else {
    Write-Warning "No se encontro la plantilla de entorno esperada: $RutaEntorno"
}

$manifestJson = $manifiesto | ConvertTo-Json -Depth 5
$pathManifest = Join-Path $DirectorioSalida 'manifest.json'
$pathChecksums = Join-Path $DirectorioSalida 'checksums.sha256'

[System.IO.File]::WriteAllText($pathManifest, $manifestJson, [System.Text.UTF8Encoding]::new($false))

$lineasChecksum = foreach ($imagen in $manifiesto.imagenes) {
    "{0} *{1}" -f $imagen.sha256, $imagen.archivo
}
[System.IO.File]::WriteAllText($pathChecksums, ($lineasChecksum -join [Environment]::NewLine), [System.Text.UTF8Encoding]::new($false))

Write-Host "Paquete de entrega generado en: $DirectorioSalida"