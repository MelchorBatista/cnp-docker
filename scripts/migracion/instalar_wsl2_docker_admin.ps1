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

Write-Host "Instalando WSL2 sin distribucion por defecto..."
& wsl --install --no-distribution
$codigoWSL = $LASTEXITCODE
if ($codigoWSL -ne 0) {
    Write-Warning "La instalacion de WSL2 devolvio codigo $codigoWSL. Revise salida anterior."
}

Write-Host "Instalando Docker Desktop con winget..."
& winget install --id Docker.DockerDesktop --exact --silent --accept-package-agreements --accept-source-agreements --disable-interactivity
$codigoDocker = $LASTEXITCODE
if ($codigoDocker -ne 0) {
    Write-Warning "La instalacion de Docker Desktop devolvio codigo $codigoDocker."
}

Write-Host ""
Write-Host "Si el sistema solicita reinicio, reinicie Windows antes de validar."
Write-Host "Luego ejecute: wsl --status, wsl -l -v, docker version"

if ($codigoWSL -eq 0 -and $codigoDocker -eq 0) {
    exit 0
}

exit 1
