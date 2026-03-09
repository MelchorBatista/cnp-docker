[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Test-EsAdministrador {
    $identidadActual = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identidadActual)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Test-EsAdministrador)) {
    Write-Error "Este script requiere PowerShell ejecutado como Administrador."
    exit 1
}

Write-Host "Ajustando baseline local a Node.js 24.x (LTS aprobada actual)..."

$desinstalaciones = @(
    "OpenJS.NodeJS.18",
    "OpenJS.NodeJS",
    "OpenJS.NodeJS.LTS"
)

foreach ($idPaquete in $desinstalaciones) {
    Write-Host "Intentando desinstalar $idPaquete (si existe)..."
    & winget uninstall --id $idPaquete --silent --disable-interactivity
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "No se pudo desinstalar $idPaquete o no estaba presente. Codigo: $LASTEXITCODE"
    }
}

Write-Host "Instalando Node.js LTS en scope machine..."
& winget install --id OpenJS.NodeJS.LTS --exact --scope machine --silent --accept-package-agreements --accept-source-agreements --disable-interactivity
$codigoInstalacion = $LASTEXITCODE

if ($codigoInstalacion -ne 0) {
    Write-Error "Fallo la instalacion de Node.js LTS. Codigo: $codigoInstalacion"
    exit 1
}

$env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")

$versionNode = (& node --version).Trim()
$versionNpm = (& npm.cmd --version).Trim()

Write-Host ""
Write-Host "Validaciones finales:"
Write-Host "node --version => $versionNode"
Write-Host "npm --version => $versionNpm"

if ($versionNode -notmatch "^v24\.") {
    Write-Error "La version activa de Node no cumple el baseline 24.x. Valor detectado: $versionNode"
    exit 1
}

exit 0
