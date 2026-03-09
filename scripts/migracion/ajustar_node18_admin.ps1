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

Write-Host "Desinstalando Node.js de maquina (si existe)..."
& winget uninstall --id OpenJS.NodeJS.LTS --silent --disable-interactivity
$codigoLts = $LASTEXITCODE

if ($codigoLts -ne 0) {
    Write-Warning "No se pudo desinstalar OpenJS.NodeJS.LTS o no estaba presente. Codigo: $codigoLts"
}

Write-Host "Instalando Node.js 18 en scope machine..."
& winget install --id OpenJS.NodeJS.18 --exact --scope machine --silent --accept-package-agreements --accept-source-agreements --disable-interactivity
$codigoInstalacion = $LASTEXITCODE

if ($codigoInstalacion -ne 0) {
    Write-Error "Fallo la instalacion de Node.js 18. Codigo: $codigoInstalacion"
    exit 1
}

$env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")

Write-Host ""
Write-Host "Validaciones finales:"
& node --version
& npm.cmd --version

exit 0
