[CmdletBinding()]
param(
    [string]$RutaDirectorioReporte = ".\\docs\\migracion\\ejecucion",
    [string]$HostRegistry = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($HostRegistry)) {
    $HostRegistry = $env:STAGING_HOST_REGISTRY
}

$marcaTiempo = Get-Date -Format "yyyyMMdd_HHmmss"
$rutaLog = Join-Path $RutaDirectorioReporte ("27B_Verificacion_Secretos_CI_Registry_STAGING_{0}.log" -f $marcaTiempo)
New-Item -ItemType Directory -Path $RutaDirectorioReporte -Force | Out-Null

$secretosRequeridos = @(
    "STAGING_HOST_DESPLIEGUE",
    "STAGING_USUARIO_DESPLIEGUE",
    "STAGING_LLAVE_SSH_DESPLIEGUE",
    "STAGING_HOST_REGISTRY",
    "STAGING_USUARIO_REGISTRY",
    "STAGING_PASSWORD_REGISTRY"
)

$faltantes = @()
$presentes = @()
foreach ($nombre in $secretosRequeridos) {
    $valor = [Environment]::GetEnvironmentVariable($nombre)
    if ([string]::IsNullOrWhiteSpace($valor)) {
        $faltantes += $nombre
    }
    else {
        $presentes += $nombre
    }
}

$loginEstado = "NO_EJECUTADO"
$loginDetalle = "Sin verificacion de login"
if ($faltantes.Count -eq 0) {
    try {
        $docker = Get-Command docker -ErrorAction Stop
        $password = [Environment]::GetEnvironmentVariable("STAGING_PASSWORD_REGISTRY")
        $usuario = [Environment]::GetEnvironmentVariable("STAGING_USUARIO_REGISTRY")

        if ([string]::IsNullOrWhiteSpace($HostRegistry)) {
            throw "Host de registry vacio"
        }

        $comando = "`"$($docker.Source)`" login $HostRegistry --username `"$usuario`" --password-stdin"
        $salida = ($password | & cmd /d /c $comando 2>&1 | Out-String).Trim()
        if ($LASTEXITCODE -ne 0) {
            throw "Login a registry fallo: $salida"
        }

        & $docker.Source logout $HostRegistry *> $null
        $loginEstado = "OK"
        $loginDetalle = "Login/logout de prueba exitoso"
    }
    catch {
        $loginEstado = "FALLA"
        $loginDetalle = $_.Exception.Message
    }
}

$estadoGeneral = if ($faltantes.Count -eq 0 -and $loginEstado -eq "OK") { "OK" } else { "FALLA" }

"Inicio verificacion secretos CI/registry STAGING: $(Get-Date -Format o)" | Out-File -FilePath $rutaLog -Encoding UTF8
"Host registry: $HostRegistry" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
"Secretos presentes: $($presentes -join ', ')" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
"Secretos faltantes: $($faltantes -join ', ')" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
"Estado login registry: $loginEstado" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
"Detalle login registry: $loginDetalle" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
"Estado general: $estadoGeneral" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append

Write-Host ""
Write-Host "Resumen secretos CI/registry STAGING:"
Write-Host "Estado general: $estadoGeneral"
Write-Host "Presentes: $($presentes -join ', ')"
Write-Host "Faltantes: $($faltantes -join ', ')"
Write-Host "Login registry: $loginEstado"
Write-Host "Log: $rutaLog"

if ($estadoGeneral -eq "OK") {
    exit 0
}

exit 1
