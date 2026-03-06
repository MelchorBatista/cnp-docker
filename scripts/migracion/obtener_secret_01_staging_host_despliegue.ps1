[CmdletBinding()]
param(
    [string]$HostCandidato = "c1491"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Obtener-IpResueltas {
    param(
        [Parameter(Mandatory = $true)]
        [string]$HostObjetivo
    )

    try {
        $ips = Resolve-DnsName -Name $HostObjetivo -ErrorAction Stop |
            Where-Object { $_.IPAddress } |
            Select-Object -ExpandProperty IPAddress -Unique
        return @($ips)
    }
    catch {
        return @()
    }
}

function Probar-Puerto {
    param(
        [Parameter(Mandatory = $true)]
        [string]$HostObjetivo,
        [Parameter(Mandatory = $true)]
        [int]$Puerto
    )

    try {
        $resultado = Test-NetConnection -ComputerName $HostObjetivo -Port $Puerto -WarningAction SilentlyContinue
        return [bool]$resultado.TcpTestSucceeded
    }
    catch {
        return $false
    }
}

$hostLimpio = $HostCandidato.Trim()
if ([string]::IsNullOrWhiteSpace($hostLimpio)) {
    throw "El parametro HostCandidato no puede estar vacio."
}

if ($hostLimpio -match "\s") {
    throw "El host contiene espacios. Usa solo DNS o IP, por ejemplo: c1491 o 10.10.10.25"
}

if ($hostLimpio -match "^(?i)https?://") {
    throw "No incluyas protocolo (http/https). Usa solo el host."
}

if ($hostLimpio -match "/") {
    throw "No incluyas rutas. Usa solo el host."
}

$ipsResueltas = Obtener-IpResueltas -HostObjetivo $hostLimpio
$sshPuerto22 = Probar-Puerto -HostObjetivo $hostLimpio -Puerto 22
$httpsPuerto443 = Probar-Puerto -HostObjetivo $hostLimpio -Puerto 443

Write-Host ""
Write-Host "=== RESULTADO SECRET 1 ==="
Write-Host "SECRET_KEY: STAGING_HOST_DESPLIEGUE"
Write-Host "VALOR_RECOMENDADO: $hostLimpio"
Write-Host "DNS_IPS: $($ipsResueltas -join ', ')"
Write-Host "SSH_22: $sshPuerto22"
Write-Host "HTTPS_443: $httpsPuerto443"
Write-Host ""

if ($sshPuerto22) {
    Write-Host "ESTADO: VALIDO para despliegue SSH"
    exit 0
}

Write-Host "ESTADO: REVISAR (el puerto 22 no responde)"
exit 1
