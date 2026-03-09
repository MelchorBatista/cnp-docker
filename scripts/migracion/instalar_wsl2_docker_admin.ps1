[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Test-EsAdministrador {
    $identidadActual = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identidadActual)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Refrescar-PathProceso {
    $pathMaquina = [Environment]::GetEnvironmentVariable("Path", "Machine")
    $pathUsuario = [Environment]::GetEnvironmentVariable("Path", "User")
    $env:Path = "$pathMaquina;$pathUsuario"
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

if (Get-Command winget -ErrorAction SilentlyContinue) {
    Write-Host "Instalando Docker Desktop con winget..."
    & winget install --id Docker.DockerDesktop --exact --silent --accept-package-agreements --accept-source-agreements --disable-interactivity
    $codigoDocker = $LASTEXITCODE
}
else {
    $codigoDocker = 1
    Write-Warning "winget no esta disponible. Se intentara fallback con chocolatey."
}

if ($codigoDocker -ne 0) {
    Write-Warning "La instalacion de Docker Desktop con winget devolvio codigo $codigoDocker."

    if (Asegurar-Chocolatey) {
        Write-Host "Instalando Docker Desktop con chocolatey..."
        & choco install docker-desktop -y --no-progress
        $codigoDocker = $LASTEXITCODE
        if ($codigoDocker -ne 0) {
            Write-Warning "La instalacion de Docker Desktop con chocolatey devolvio codigo $codigoDocker."
        }
    }
    else {
        Write-Warning "No fue posible preparar Chocolatey para el fallback de Docker Desktop."
    }
}

Write-Host ""
Write-Host "Si el sistema solicita reinicio, reinicie Windows antes de validar."
Write-Host "Luego ejecute: wsl --status, wsl -l -v, docker version"

if ($codigoWSL -eq 0 -and $codigoDocker -eq 0) {
    exit 0
}

exit 1
