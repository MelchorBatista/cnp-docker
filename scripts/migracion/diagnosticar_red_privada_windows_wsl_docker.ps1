[CmdletBinding()]
param(
    [ValidateSet('VALIDACION', 'CONSULTA', 'RECEPCION')]
    [string]$Conexion = 'VALIDACION',
    [string]$HostObjetivo = '',
    [int]$PuertoObjetivo = 0,
    [string]$RutaEntorno = '',
    [string]$DistroWsl = 'Ubuntu',
    [string]$ImagenDocker = 'busybox:1.36',
    [string]$RutaDirectorioReporte = '.\docs\migracion\ejecucion'
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

function Escribir-Log {
    param([string]$Mensaje)

    Write-Host $Mensaje
    if ($script:RutaLogFinal) {
        Add-Content -Path $script:RutaLogFinal -Value $Mensaje -Encoding UTF8
    }
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

function Cargar-Entorno {
    param([string]$Ruta)

    if (-not (Test-Path $Ruta)) {
        throw "No se encontro el archivo de entorno: $Ruta"
    }

    $variables = @{}
    foreach ($linea in Get-Content -Path $Ruta -Encoding UTF8) {
        $texto = $linea.Trim()
        if (-not $texto -or $texto.StartsWith('#')) {
            continue
        }

        $partes = $texto -split '=', 2
        if ($partes.Count -eq 2) {
            $variables[$partes[0].Trim()] = $partes[1].Trim()
        }
    }

    return $variables
}

function Obtener-Valor {
    param(
        [hashtable]$Variables,
        [string[]]$Claves,
        [string]$Predeterminado = ''
    )

    foreach ($clave in $Claves) {
        if ($Variables.ContainsKey($clave) -and $Variables[$clave].ToString().Trim() -ne '') {
            return $Variables[$clave].ToString().Trim()
        }
    }

    return $Predeterminado
}

function Escape-BashSimple {
    param([string]$Texto)

    if (-not $Texto) {
        return ''
    }

    if ($Texto.Contains("'")) {
        throw "El valor '$Texto' contiene apostrofes y no es compatible con este diagnostico."
    }

    return $Texto
}

function Probar-ResolucionWindows {
    param([string]$HostDestino)

    try {
        $ips = Resolve-DnsName -Name $HostDestino -ErrorAction Stop |
            Where-Object { $_.IPAddress } |
            Select-Object -ExpandProperty IPAddress -Unique

        return [PSCustomObject]@{
            estado = if (@($ips).Count -gt 0) { 'OK' } else { 'FALLA' }
            detalle = if (@($ips).Count -gt 0) { ($ips -join ', ') } else { 'Sin IP resuelta' }
            ips = @($ips)
        }
    }
    catch {
        return [PSCustomObject]@{
            estado = 'FALLA'
            detalle = $_.Exception.Message
            ips = @()
        }
    }
}

function Probar-PuertoWindows {
    param(
        [string]$HostDestino,
        [int]$Puerto
    )

    try {
        $prueba = Test-NetConnection -ComputerName $HostDestino -Port $Puerto -WarningAction SilentlyContinue
        return [PSCustomObject]@{
            estado = if ($prueba.TcpTestSucceeded) { 'OK' } else { 'FALLA' }
            detalle = if ($prueba.TcpTestSucceeded) { 'Conectividad TCP habilitada' } else { 'Sin respuesta TCP' }
        }
    }
    catch {
        return [PSCustomObject]@{
            estado = 'FALLA'
            detalle = $_.Exception.Message
        }
    }
}

function Probar-DistroWsl {
    param([string]$Distro)

    $resultado = Ejecutar-Comando -Comando { wsl -l -q }
    if ($resultado.codigo -ne 0) {
        return [PSCustomObject]@{
            estado = 'FALLA'
            detalle = $resultado.salida
        }
    }

    $distros = @(
        $resultado.salida -split "`r?`n" |
            ForEach-Object { $_.Trim() } |
            Where-Object { $_ }
    )

    return [PSCustomObject]@{
        estado = if ($distros -contains $Distro) { 'OK' } else { 'FALLA' }
        detalle = if ($distros -contains $Distro) { "Distro disponible: $Distro" } else { "No se encontro la distro '$Distro'. Disponibles: $($distros -join ', ')" }
    }
}

function Probar-ResolucionWsl {
    param(
        [string]$Distro,
        [string]$HostDestino
    )

    $hostEscapado = Escape-BashSimple -Texto $HostDestino
    $comando = "getent ahosts '$hostEscapado' || getent hosts '$hostEscapado'"
    $resultado = Ejecutar-Comando -Comando { wsl -d $Distro -- bash -lc $comando }

    return [PSCustomObject]@{
        estado = if ($resultado.codigo -eq 0 -and $resultado.salida) { 'OK' } else { 'FALLA' }
        detalle = if ($resultado.salida) { $resultado.salida } else { 'No hubo salida de resolucion DNS en WSL.' }
    }
}

function Probar-PuertoWsl {
    param(
        [string]$Distro,
        [string]$HostDestino,
        [int]$Puerto
    )

    $hostEscapado = Escape-BashSimple -Texto $HostDestino
    $comando = "timeout 5 bash -c 'exec 3<>/dev/tcp/$hostEscapado/$Puerto' >/dev/null 2>&1 && echo TCP_OK || echo TCP_FAIL"
    $resultado = Ejecutar-Comando -Comando { wsl -d $Distro -- bash -lc $comando }

    return [PSCustomObject]@{
        estado = if ($resultado.codigo -eq 0 -and $resultado.salida -match 'TCP_OK') { 'OK' } else { 'FALLA' }
        detalle = if ($resultado.salida) { $resultado.salida } else { 'No hubo salida de prueba TCP en WSL.' }
    }
}

function Probar-ResolucionDocker {
    param(
        [string]$Imagen,
        [string]$HostDestino
    )

    $hostEscapado = Escape-BashSimple -Texto $HostDestino
    $resultado = Ejecutar-Comando -Comando { docker run --rm --entrypoint sh $Imagen -lc "nslookup '$hostEscapado'" }

    return [PSCustomObject]@{
        estado = if ($resultado.codigo -eq 0 -and $resultado.salida) { 'OK' } else { 'FALLA' }
        detalle = if ($resultado.salida) { $resultado.salida } else { 'No hubo salida de resolucion DNS en Docker.' }
    }
}

function Probar-PuertoDocker {
    param(
        [string]$Imagen,
        [string]$HostDestino,
        [int]$Puerto
    )

    $hostEscapado = Escape-BashSimple -Texto $HostDestino
    $resultado = Ejecutar-Comando -Comando { docker run --rm --entrypoint sh $Imagen -lc "nc -vz -w 5 '$hostEscapado' $Puerto" }

    return [PSCustomObject]@{
        estado = if ($resultado.codigo -eq 0) { 'OK' } else { 'FALLA' }
        detalle = if ($resultado.salida) { $resultado.salida } else { 'No hubo salida de prueba TCP en Docker.' }
    }
}

function Obtener-Diagnostico {
    param(
        [string]$EstadoWindowsTcp,
        [string]$EstadoWslTcpHost,
        [string]$EstadoDockerDns,
        [string]$EstadoDockerTcpHost,
        [string]$EstadoDockerTcpIp
    )

    if ($EstadoWindowsTcp -ne 'OK') {
        return 'Windows host no llega al destino. El bloqueo probable esta en VPN/firewall/ruta/politica corporativa del equipo, no en Docker.'
    }

    if ($EstadoWindowsTcp -eq 'OK' -and $EstadoWslTcpHost -ne 'OK') {
        return 'Windows llega pero WSL no. El problema probable esta en el modo de red de WSL, DNS interno de WSL o una politica corporativa sobre trafico virtualizado.'
    }

    if ($EstadoWindowsTcp -eq 'OK' -and $EstadoWslTcpHost -eq 'OK' -and $EstadoDockerDns -ne 'OK' -and $EstadoDockerTcpIp -eq 'OK') {
        return 'Docker llega por IP pero no por nombre. El problema probable es DNS dentro de Docker/WSL.'
    }

    if ($EstadoWindowsTcp -eq 'OK' -and $EstadoWslTcpHost -eq 'OK' -and $EstadoDockerTcpHost -ne 'OK') {
        return 'Windows y WSL llegan, pero Docker no. El problema probable esta en Docker Desktop/bridge/politica de red para contenedores.'
    }

    return 'No se detecto un patron bloqueante unico. Revisar detalle de DNS y TCP por capa.'
}

function Test-ImagenDockerLocal {
    param([string]$Imagen)

    if (-not $Imagen) {
        return $false
    }

    $resultado = Ejecutar-Comando -Comando { docker image inspect $Imagen }
    return ($resultado.codigo -eq 0)
}

function Resolver-ImagenDockerDiagnostico {
    param([string]$ImagenPreferida)

    $candidatas = New-Object System.Collections.Generic.List[string]
    foreach ($imagen in @($ImagenPreferida, 'cnp-proxy:b221', 'cnp-frontend:b221', 'alpine:3.20', 'nginx:alpine', 'cnp-backend:b221')) {
        if ($imagen -and -not $candidatas.Contains($imagen)) {
            [void]$candidatas.Add($imagen)
        }
    }

    foreach ($imagen in $candidatas) {
        if (Test-ImagenDockerLocal -Imagen $imagen) {
            return [PSCustomObject]@{
                imagen = $imagen
                origen = if ($imagen -eq $ImagenPreferida) { 'parametro' } else { 'fallback_local' }
            }
        }
    }

    return [PSCustomObject]@{
        imagen = $ImagenPreferida
        origen = 'pull_remoto'
    }
}

$raizProyecto = Obtener-RaizProyecto -RutaInicio $PSScriptRoot
$directorioReporte = if ([System.IO.Path]::IsPathRooted($RutaDirectorioReporte)) {
    $RutaDirectorioReporte
}
else {
    Join-Path $raizProyecto $RutaDirectorioReporte
}
New-Item -ItemType Directory -Path $directorioReporte -Force | Out-Null

$marcaTiempo = Get-Date -Format 'yyyyMMdd_HHmmss'
$script:RutaLogFinal = Join-Path $directorioReporte ("43F_Diagnostico_Red_Privada_Windows_WSL_Docker_{0}.log" -f $marcaTiempo)
$imagenDockerResuelta = Resolver-ImagenDockerDiagnostico -ImagenPreferida $ImagenDocker
$ImagenDocker = $imagenDockerResuelta.imagen

if (-not $RutaEntorno) {
    $RutaEntorno = Join-Path $raizProyecto 'backend\.env.local'
}
elseif (-not [System.IO.Path]::IsPathRooted($RutaEntorno)) {
    $RutaEntorno = Join-Path $raizProyecto $RutaEntorno
}

$nombreObjetivo = $Conexion
if (-not $HostObjetivo) {
    $variables = Cargar-Entorno -Ruta $RutaEntorno
    switch ($Conexion) {
        'VALIDACION' {
            $HostObjetivo = Obtener-Valor -Variables $variables -Claves @('DB_SERVER_VALIDACION', 'DB_SERVER')
            if ($PuertoObjetivo -le 0) {
                $PuertoObjetivo = [int](Obtener-Valor -Variables $variables -Claves @('DB_PORT_VALIDACION', 'DB_PORT') -Predeterminado '1433')
            }
        }
        'CONSULTA' {
            $HostObjetivo = Obtener-Valor -Variables $variables -Claves @('DB_SERVER_CONSULTA', 'DB_SERVER_RECEPCION', 'DB_SERVER')
            if ($PuertoObjetivo -le 0) {
                $PuertoObjetivo = [int](Obtener-Valor -Variables $variables -Claves @('DB_PORT_CONSULTA', 'DB_PORT_RECEPCION', 'DB_PORT') -Predeterminado '1433')
            }
        }
        'RECEPCION' {
            $HostObjetivo = Obtener-Valor -Variables $variables -Claves @('DB_SERVER_RECEPCION', 'DB_SERVER')
            if ($PuertoObjetivo -le 0) {
                $PuertoObjetivo = [int](Obtener-Valor -Variables $variables -Claves @('DB_PORT_RECEPCION', 'DB_PORT') -Predeterminado '1433')
            }
        }
    }
}
else {
    $nombreObjetivo = $HostObjetivo
    if ($PuertoObjetivo -le 0) {
        $PuertoObjetivo = 1433
    }
}

if (-not $HostObjetivo) {
    throw 'No se pudo determinar el host objetivo.'
}

if ($PuertoObjetivo -le 0) {
    throw 'No se pudo determinar el puerto objetivo.'
}

$estadoDistro = Probar-DistroWsl -Distro $DistroWsl
$resolucionWindows = Probar-ResolucionWindows -HostDestino $HostObjetivo
$ipPrincipal = if (@($resolucionWindows.ips).Count -gt 0) { $resolucionWindows.ips[0] } else { '' }

$tcpWindowsHost = Probar-PuertoWindows -HostDestino $HostObjetivo -Puerto $PuertoObjetivo
$tcpWindowsIp = if ($ipPrincipal) {
    Probar-PuertoWindows -HostDestino $ipPrincipal -Puerto $PuertoObjetivo
}
else {
    [PSCustomObject]@{ estado = 'NO_APLICA'; detalle = 'Sin IP resuelta en Windows.' }
}

$resultadoWslVersion = Ejecutar-Comando -Comando { wsl --version }
$resultadoWslStatus = Ejecutar-Comando -Comando { wsl --status }
$resultadoDockerVersion = Ejecutar-Comando -Comando { docker version }
$resultadoDockerContext = Ejecutar-Comando -Comando { docker context show }

$resolucionWsl = if ($estadoDistro.estado -eq 'OK') {
    Probar-ResolucionWsl -Distro $DistroWsl -HostDestino $HostObjetivo
}
else {
    [PSCustomObject]@{ estado = 'FALLA'; detalle = $estadoDistro.detalle }
}

$tcpWslHost = if ($estadoDistro.estado -eq 'OK') {
    Probar-PuertoWsl -Distro $DistroWsl -HostDestino $HostObjetivo -Puerto $PuertoObjetivo
}
else {
    [PSCustomObject]@{ estado = 'FALLA'; detalle = $estadoDistro.detalle }
}

$tcpWslIp = if ($estadoDistro.estado -eq 'OK' -and $ipPrincipal) {
    Probar-PuertoWsl -Distro $DistroWsl -HostDestino $ipPrincipal -Puerto $PuertoObjetivo
}
elseif (-not $ipPrincipal) {
    [PSCustomObject]@{ estado = 'NO_APLICA'; detalle = 'Sin IP resuelta en Windows.' }
}
else {
    [PSCustomObject]@{ estado = 'FALLA'; detalle = $estadoDistro.detalle }
}

$resolucionDocker = Probar-ResolucionDocker -Imagen $ImagenDocker -HostDestino $HostObjetivo
$tcpDockerHost = Probar-PuertoDocker -Imagen $ImagenDocker -HostDestino $HostObjetivo -Puerto $PuertoObjetivo
$tcpDockerIp = if ($ipPrincipal) {
    Probar-PuertoDocker -Imagen $ImagenDocker -HostDestino $ipPrincipal -Puerto $PuertoObjetivo
}
else {
    [PSCustomObject]@{ estado = 'NO_APLICA'; detalle = 'Sin IP resuelta en Windows.' }
}

$diagnostico = Obtener-Diagnostico `
    -EstadoWindowsTcp $tcpWindowsHost.estado `
    -EstadoWslTcpHost $tcpWslHost.estado `
    -EstadoDockerDns $resolucionDocker.estado `
    -EstadoDockerTcpHost $tcpDockerHost.estado `
    -EstadoDockerTcpIp $tcpDockerIp.estado

$resumen = @(
    [PSCustomObject]@{ capa = 'Windows'; verificacion = 'DNS host'; estado = $resolucionWindows.estado; detalle = $resolucionWindows.detalle },
    [PSCustomObject]@{ capa = 'Windows'; verificacion = 'TCP host'; estado = $tcpWindowsHost.estado; detalle = $tcpWindowsHost.detalle },
    [PSCustomObject]@{ capa = 'Windows'; verificacion = 'TCP IP'; estado = $tcpWindowsIp.estado; detalle = $tcpWindowsIp.detalle },
    [PSCustomObject]@{ capa = 'WSL'; verificacion = 'Distro'; estado = $estadoDistro.estado; detalle = $estadoDistro.detalle },
    [PSCustomObject]@{ capa = 'WSL'; verificacion = 'DNS host'; estado = $resolucionWsl.estado; detalle = $resolucionWsl.detalle },
    [PSCustomObject]@{ capa = 'WSL'; verificacion = 'TCP host'; estado = $tcpWslHost.estado; detalle = $tcpWslHost.detalle },
    [PSCustomObject]@{ capa = 'WSL'; verificacion = 'TCP IP'; estado = $tcpWslIp.estado; detalle = $tcpWslIp.detalle },
    [PSCustomObject]@{ capa = 'Docker'; verificacion = 'DNS host'; estado = $resolucionDocker.estado; detalle = $resolucionDocker.detalle },
    [PSCustomObject]@{ capa = 'Docker'; verificacion = 'TCP host'; estado = $tcpDockerHost.estado; detalle = $tcpDockerHost.detalle },
    [PSCustomObject]@{ capa = 'Docker'; verificacion = 'TCP IP'; estado = $tcpDockerIp.estado; detalle = $tcpDockerIp.detalle }
)

"Inicio diagnostico red privada: $(Get-Date -Format o)" | Out-File -FilePath $script:RutaLogFinal -Encoding UTF8
"Proyecto: $raizProyecto" | Out-File -FilePath $script:RutaLogFinal -Encoding UTF8 -Append
"Objetivo: $nombreObjetivo" | Out-File -FilePath $script:RutaLogFinal -Encoding UTF8 -Append
"Host: $HostObjetivo" | Out-File -FilePath $script:RutaLogFinal -Encoding UTF8 -Append
"Puerto: $PuertoObjetivo" | Out-File -FilePath $script:RutaLogFinal -Encoding UTF8 -Append
"Ruta entorno: $RutaEntorno" | Out-File -FilePath $script:RutaLogFinal -Encoding UTF8 -Append
"Distro WSL: $DistroWsl" | Out-File -FilePath $script:RutaLogFinal -Encoding UTF8 -Append
"Imagen Docker: $ImagenDocker" | Out-File -FilePath $script:RutaLogFinal -Encoding UTF8 -Append
"Origen imagen Docker: $($imagenDockerResuelta.origen)" | Out-File -FilePath $script:RutaLogFinal -Encoding UTF8 -Append
"IP principal resuelta en Windows: $ipPrincipal" | Out-File -FilePath $script:RutaLogFinal -Encoding UTF8 -Append
"" | Out-File -FilePath $script:RutaLogFinal -Encoding UTF8 -Append
"[WSL VERSION]" | Out-File -FilePath $script:RutaLogFinal -Encoding UTF8 -Append
$resultadoWslVersion.salida | Out-File -FilePath $script:RutaLogFinal -Encoding UTF8 -Append
"" | Out-File -FilePath $script:RutaLogFinal -Encoding UTF8 -Append
"[WSL STATUS]" | Out-File -FilePath $script:RutaLogFinal -Encoding UTF8 -Append
$resultadoWslStatus.salida | Out-File -FilePath $script:RutaLogFinal -Encoding UTF8 -Append
"" | Out-File -FilePath $script:RutaLogFinal -Encoding UTF8 -Append
"[DOCKER VERSION]" | Out-File -FilePath $script:RutaLogFinal -Encoding UTF8 -Append
$resultadoDockerVersion.salida | Out-File -FilePath $script:RutaLogFinal -Encoding UTF8 -Append
"" | Out-File -FilePath $script:RutaLogFinal -Encoding UTF8 -Append
"[DOCKER CONTEXT]" | Out-File -FilePath $script:RutaLogFinal -Encoding UTF8 -Append
$resultadoDockerContext.salida | Out-File -FilePath $script:RutaLogFinal -Encoding UTF8 -Append
"" | Out-File -FilePath $script:RutaLogFinal -Encoding UTF8 -Append
"[RESUMEN]" | Out-File -FilePath $script:RutaLogFinal -Encoding UTF8 -Append
($resumen | ConvertTo-Json -Compress) | Out-File -FilePath $script:RutaLogFinal -Encoding UTF8 -Append
"" | Out-File -FilePath $script:RutaLogFinal -Encoding UTF8 -Append
"[DIAGNOSTICO]" | Out-File -FilePath $script:RutaLogFinal -Encoding UTF8 -Append
$diagnostico | Out-File -FilePath $script:RutaLogFinal -Encoding UTF8 -Append

Escribir-Log ''
Escribir-Log "Resumen diagnostico red privada:"
$resumen | Format-Table -AutoSize | Out-String | ForEach-Object { Escribir-Log $_.TrimEnd() }
Escribir-Log ''
Escribir-Log "Diagnostico: $diagnostico"
Escribir-Log "Log generado: $script:RutaLogFinal"

$fallas = @($resumen | Where-Object { $_.estado -eq 'FALLA' })
if ($fallas.Count -gt 0) {
    exit 1
}

exit 0
