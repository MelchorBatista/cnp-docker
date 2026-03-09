[CmdletBinding()]
param(
    [string]$RutaDirectorioReporte = ".\\docs\\migracion\\ejecucion",
    [string]$HostWebStaging = "c1491",
    [int[]]$PuertosWebRequeridos = @(443),
    [int[]]$PuertosWebOpcionales = @(8443),
    [string]$RutaEnvBackendProduccion = ".\\backend\\.env.production",
    [string]$HostSqlStaging = "",
    [int]$PuertoSqlStaging = 1433,
    [string]$HostRegistry = "",
    [string]$RutaActaVentanaCambio = ".\\docs\\migracion\\operaciones\\Acta_Ventana_Cambio_STAGING.md",
    [switch]$AplicarCorreccionesLocales
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
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
        if (Test-Path (Join-Path $rutaActual ".git")) {
            return $rutaActual
        }

        $rutaPadre = Split-Path -Parent $rutaActual
        if ($rutaPadre -eq $rutaActual) {
            return (Resolve-Path $RutaInicio).Path
        }

        $rutaActual = $rutaPadre
    }
}

function Obtener-ValorEnvArchivo {
    param(
        [Parameter(Mandatory = $true)]
        [string]$RutaArchivo,
        [Parameter(Mandatory = $true)]
        [string]$Clave
    )

    if (-not (Test-Path $RutaArchivo)) {
        return ""
    }

    $linea = Get-Content -Path $RutaArchivo -ErrorAction SilentlyContinue |
        Where-Object { $_ -match "^$Clave=" } |
        Select-Object -First 1

    if (-not $linea) {
        return ""
    }

    return ($linea -split "=", 2)[1].Trim()
}

function Probar-ResolucionDns {
    param(
        [Parameter(Mandatory = $true)]
        [string]$HostObjetivo
    )

    try {
        $resoluciones = Resolve-DnsName -Name $HostObjetivo -ErrorAction Stop |
            Where-Object { $_.IPAddress } |
            Select-Object -ExpandProperty IPAddress -Unique

        return [PSCustomObject]@{
            estado = if (@($resoluciones).Count -gt 0) { "OK" } else { "FALLA" }
            detalle = if (@($resoluciones).Count -gt 0) { ($resoluciones -join ", ") } else { "Sin IP resuelta" }
        }
    }
    catch {
        return [PSCustomObject]@{
            estado = "FALLA"
            detalle = $_.Exception.Message
        }
    }
}

function Probar-ConectividadPuerto {
    param(
        [Parameter(Mandatory = $true)]
        [string]$HostObjetivo,
        [Parameter(Mandatory = $true)]
        [int]$Puerto
    )

    try {
        $prueba = Test-NetConnection -ComputerName $HostObjetivo -Port $Puerto -WarningAction SilentlyContinue
        return [PSCustomObject]@{
            host = $HostObjetivo
            puerto = $Puerto
            estado = if ($prueba.TcpTestSucceeded) { "OK" } else { "FALLA" }
            detalle = if ($prueba.TcpTestSucceeded) { "Conectividad TCP habilitada" } else { "Sin respuesta TCP" }
        }
    }
    catch {
        return [PSCustomObject]@{
            host = $HostObjetivo
            puerto = $Puerto
            estado = "FALLA"
            detalle = $_.Exception.Message
        }
    }
}

function Probar-ConectividadLista {
    param(
        [Parameter(Mandatory = $true)]
        [string]$HostObjetivo,
        [Parameter(Mandatory = $true)]
        [int[]]$Puertos
    )

    $salida = @()
    foreach ($puerto in $Puertos) {
        $salida += Probar-ConectividadPuerto -HostObjetivo $HostObjetivo -Puerto $puerto
    }
    return $salida
}

function Obtener-MetadatosCertificado {
    param(
        [Parameter(Mandatory = $true)]
        [string]$RutaCertificado
    )

    if (-not (Test-Path $RutaCertificado)) {
        return [PSCustomObject]@{
            existe = $false
            detalle = "No encontrado"
        }
    }

    try {
        $cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($RutaCertificado)
        $salida = "subject=$($cert.Subject); issuer=$($cert.Issuer); notBefore=$($cert.NotBefore.ToString('o')); notAfter=$($cert.NotAfter.ToString('o'))"
        return [PSCustomObject]@{
            existe = $true
            detalle = $salida
        }
    }
    catch {
        return [PSCustomObject]@{
            existe = $true
            detalle = "Error inspeccionando certificado: $($_.Exception.Message)"
        }
    }
}

function Buscar-Patrones {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Patron,
        [Parameter(Mandatory = $true)]
        [string[]]$RutasBusqueda
    )

    $resultado = @()
    $rg = Get-Command rg -ErrorAction SilentlyContinue
    if ($rg) {
        foreach ($ruta in $RutasBusqueda) {
            if (Test-Path $ruta) {
                $lineas = (& $rg.Source -n $Patron $ruta 2>$null)
                if ($lineas) {
                    $resultado += $lineas
                }
            }
        }
        return $resultado
    }

    foreach ($ruta in $RutasBusqueda) {
        if (Test-Path $ruta) {
            $lineas = Get-ChildItem -Path $ruta -Recurse -File -ErrorAction SilentlyContinue |
                Select-String -Pattern $Patron -CaseSensitive:$false |
                ForEach-Object { "$($_.Path):$($_.LineNumber):$($_.Line)" }
            if ($lineas) {
                $resultado += $lineas
            }
        }
    }
    return $resultado
}

function Es-ActaVentanaAprobada {
    param(
        [Parameter(Mandatory = $true)]
        [string]$RutaActa
    )

    if (-not (Test-Path $RutaActa)) {
        return [PSCustomObject]@{
            estado = "NO_EXISTE"
            detalle = "No existe acta en ruta esperada"
        }
    }

    $contenido = Get-Content -Path $RutaActa -Raw -ErrorAction SilentlyContinue
    if (-not $contenido) {
        return [PSCustomObject]@{
            estado = "INCOMPLETA"
            detalle = "Acta vacia o ilegible"
        }
    }

    $tieneEstadoAprobada = $contenido -match "(?im)^Estado:\s*APROBADA"
    $tieneFechaVentana = $contenido -match "(?im)^Fecha ventana:\s*.+"
    $tieneAprobadores = $contenido -match "(?im)^Aprobadores:\s*.+"

    if ($tieneEstadoAprobada -and $tieneFechaVentana -and $tieneAprobadores) {
        return [PSCustomObject]@{
            estado = "APROBADA"
            detalle = "Estado, fecha de ventana y aprobadores detectados"
        }
    }

    return [PSCustomObject]@{
        estado = "INCOMPLETA"
        detalle = "Acta presente pero sin datos minimos de aprobacion"
    }
}

function Obtener-ValorCampoActa {
    param(
        [Parameter(Mandatory = $true)]
        [string]$RutaActa,
        [Parameter(Mandatory = $true)]
        [string]$Campo
    )

    if (-not (Test-Path $RutaActa)) {
        return ""
    }

    $linea = Get-Content -Path $RutaActa -ErrorAction SilentlyContinue |
        Where-Object { $_ -match "^(?i)${Campo}:\\s*(.+)$" } |
        Select-Object -First 1

    if (-not $linea) {
        return ""
    }

    return ($linea -split ":", 2)[1].Trim()
}

function Crear-PlantillaActaVentanaCambio {
    param(
        [Parameter(Mandatory = $true)]
        [string]$RutaActa
    )

    $directorio = Split-Path -Parent $RutaActa
    if (-not (Test-Path $directorio)) {
        New-Item -ItemType Directory -Path $directorio -Force | Out-Null
    }

    if (Test-Path $RutaActa) {
        return $false
    }

    $plantilla = @"
# Acta de Ventana de Cambio STAGING

Estado: PENDIENTE_APROBACION
Fecha solicitud: $(Get-Date -Format yyyy-MM-dd)
Fecha ventana:
Horario ventana:
Sistema afectado: CNP - STAGING
Motivo del cambio:
Host registry:
Responsables de ejecucion:
Aprobadores:
Observaciones:
"@

    $plantilla | Out-File -FilePath $RutaActa -Encoding UTF8
    return $true
}

function Intentar-LoginRegistry {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Host,
        [Parameter(Mandatory = $true)]
        [string]$Usuario,
        [Parameter(Mandatory = $true)]
        [string]$Password
    )

    $docker = Get-Command docker -ErrorAction SilentlyContinue
    if (-not $docker) {
        return [PSCustomObject]@{
            estado = "FALLA"
            detalle = "No se encontro comando docker"
        }
    }

    try {
        $comando = "`"$($docker.Source)`" login $Host --username `"$Usuario`" --password-stdin"
        $salida = ($Password | & cmd /d /c $comando 2>&1 | Out-String).Trim()
        $codigo = $LASTEXITCODE

        if ($codigo -eq 0) {
            & $docker.Source logout $Host *> $null
            return [PSCustomObject]@{
                estado = "OK"
                detalle = "Login/logout de prueba completado"
            }
        }

        return [PSCustomObject]@{
            estado = "FALLA"
            detalle = $salida
        }
    }
    catch {
        return [PSCustomObject]@{
            estado = "FALLA"
            detalle = $_.Exception.Message
        }
    }
}

$raizProyecto = Obtener-RaizProyecto -RutaInicio $PSScriptRoot
$directorioReporte = if ([System.IO.Path]::IsPathRooted($RutaDirectorioReporte)) { $RutaDirectorioReporte } else { Join-Path $raizProyecto $RutaDirectorioReporte }
New-Item -ItemType Directory -Path $directorioReporte -Force | Out-Null

$marcaTiempo = Get-Date -Format "yyyyMMdd_HHmmss"
$rutaLog = Join-Path $directorioReporte ("27A_Verificacion_Prerequisitos_Externos_STAGING_{0}.log" -f $marcaTiempo)

$rutaEnvProd = if ([System.IO.Path]::IsPathRooted($RutaEnvBackendProduccion)) { $RutaEnvBackendProduccion } else { Join-Path $raizProyecto $RutaEnvBackendProduccion }
$rutaActa = if ([System.IO.Path]::IsPathRooted($RutaActaVentanaCambio)) { $RutaActaVentanaCambio } else { Join-Path $raizProyecto $RutaActaVentanaCambio }

if ([string]::IsNullOrWhiteSpace($HostSqlStaging)) {
    $HostSqlStaging = Obtener-ValorEnvArchivo -RutaArchivo $rutaEnvProd -Clave "DB_SERVER"
}
if ([string]::IsNullOrWhiteSpace($HostRegistry)) {
    $HostRegistry = $env:STAGING_HOST_REGISTRY
}

if ($AplicarCorreccionesLocales) {
    $plantillaCreada = Crear-PlantillaActaVentanaCambio -RutaActa $rutaActa
}
else {
    $plantillaCreada = $false
}

if ([string]::IsNullOrWhiteSpace($HostRegistry)) {
    $HostRegistry = Obtener-ValorCampoActa -RutaActa $rutaActa -Campo "Host registry"
}

$rutaCertStaging = Join-Path $raizProyecto "c1491.crt"
$rutaKeyStaging = Join-Path $raizProyecto "c1491.key"
$certStaging = Obtener-MetadatosCertificado -RutaCertificado $rutaCertStaging
$existeKeyStaging = Test-Path $rutaKeyStaging

$dnsWeb = Probar-ResolucionDns -HostObjetivo $HostWebStaging
$dnsSql = if ($HostSqlStaging) { Probar-ResolucionDns -HostObjetivo $HostSqlStaging } else { [PSCustomObject]@{ estado = "PENDIENTE_EXTERNO"; detalle = "Host SQL no definido" } }

$pruebasWebRequeridas = Probar-ConectividadLista -HostObjetivo $HostWebStaging -Puertos $PuertosWebRequeridos
$pruebasWebOpcionales = if (@($PuertosWebOpcionales).Count -gt 0) { Probar-ConectividadLista -HostObjetivo $HostWebStaging -Puertos $PuertosWebOpcionales } else { @() }
$pruebaSql = if ($HostSqlStaging) { Probar-ConectividadPuerto -HostObjetivo $HostSqlStaging -Puerto $PuertoSqlStaging } else { [PSCustomObject]@{ host = ""; puerto = $PuertoSqlStaging; estado = "PENDIENTE_EXTERNO"; detalle = "Host SQL no definido" } }

$secretosEsperados = @(
    "STAGING_HOST_DESPLIEGUE",
    "STAGING_USUARIO_DESPLIEGUE",
    "STAGING_LLAVE_SSH_DESPLIEGUE",
    "STAGING_HOST_REGISTRY",
    "STAGING_USUARIO_REGISTRY",
    "STAGING_PASSWORD_REGISTRY"
)

$rutaWorkflows = Join-Path $raizProyecto ".github\\workflows"
$archivosWorkflows = if (Test-Path $rutaWorkflows) { Get-ChildItem -Path $rutaWorkflows -Recurse -File -Include *.yml,*.yaml } else { @() }
$contenidoWorkflows = if (@($archivosWorkflows).Count -gt 0) { (($archivosWorkflows | ForEach-Object { Get-Content -Path $_.FullName -Raw }) -join "`n") } else { "" }

$referenciasSecretsCi = @()
if ($contenidoWorkflows) {
    $referenciasSecretsCi = @(
        $secretosEsperados |
            Where-Object { $contenidoWorkflows -match [regex]::Escape("secrets.$_") } |
            ForEach-Object { "secrets.$_" }
    )
}

$faltantesReferenciaSecretos = @()
foreach ($secreto in $secretosEsperados) {
    if (-not ($referenciasSecretsCi -contains "secrets.$secreto")) {
        $faltantesReferenciaSecretos += $secreto
    }
}

$rutaDockerConfig = Join-Path $env:USERPROFILE ".docker\\config.json"
$dockerConfigExiste = Test-Path $rutaDockerConfig
$authsDocker = @()
if ($dockerConfigExiste) {
    try {
        $jsonDocker = Get-Content -Path $rutaDockerConfig -Raw | ConvertFrom-Json
        if ($jsonDocker.auths) {
            $authsDocker = @($jsonDocker.auths.PSObject.Properties.Name)
        }
    }
    catch {
        $authsDocker = @()
    }
}

$loginRegistryResultado = [PSCustomObject]@{ estado = "NO_INTENTADO"; detalle = "Sin intento de login" }
if ($AplicarCorreccionesLocales -and $HostRegistry -and $env:STAGING_USUARIO_REGISTRY -and $env:STAGING_PASSWORD_REGISTRY) {
    $loginRegistryResultado = Intentar-LoginRegistry -Host $HostRegistry -Usuario $env:STAGING_USUARIO_REGISTRY -Password $env:STAGING_PASSWORD_REGISTRY
    if ($loginRegistryResultado.estado -eq "OK") {
        if (Test-Path $rutaDockerConfig) {
            try {
                $jsonDocker = Get-Content -Path $rutaDockerConfig -Raw | ConvertFrom-Json
                if ($jsonDocker.auths) {
                    $authsDocker = @($jsonDocker.auths.PSObject.Properties.Name)
                }
            }
            catch {
                $authsDocker = @()
            }
        }
    }
}

$actaVentana = Es-ActaVentanaAprobada -RutaActa $rutaActa

$estadoPuertosWebRequeridos = if (@($pruebasWebRequeridas | Where-Object { $_.estado -ne "OK" }).Count -eq 0) { "OK" } else { "FALLA" }
$estadoFirewallSql = if ($pruebaSql.estado -eq "OK") { "OK" } elseif ($pruebaSql.estado -eq "PENDIENTE_EXTERNO") { "PENDIENTE_EXTERNO" } else { "FALLA" }

$checklist = @(
    [PSCustomObject]@{
        prerequisito = "TLS (certificado y llave staging disponibles localmente)"
        estado = if ($certStaging.existe -and $existeKeyStaging) { "PARCIAL" } else { "FALLA" }
        detalle = "certificado=$($certStaging.existe); llave=$existeKeyStaging; pendiente validacion institucional de uso"
    },
    [PSCustomObject]@{
        prerequisito = "TLS (metadatos del certificado staging)"
        estado = if ($certStaging.existe) { "OK" } else { "FALLA" }
        detalle = $certStaging.detalle
    },
    [PSCustomObject]@{
        prerequisito = "DNS host web staging"
        estado = $dnsWeb.estado
        detalle = $dnsWeb.detalle
    },
    [PSCustomObject]@{
        prerequisito = "DNS host SQL staging"
        estado = $dnsSql.estado
        detalle = if ($HostSqlStaging) { "$HostSqlStaging => $($dnsSql.detalle)" } else { $dnsSql.detalle }
    },
    [PSCustomObject]@{
        prerequisito = "Firewall/red host web (puertos requeridos)"
        estado = $estadoPuertosWebRequeridos
        detalle = ($pruebasWebRequeridas | ForEach-Object { "$($_.host):$($_.puerto)=$($_.estado)" }) -join "; "
    },
    [PSCustomObject]@{
        prerequisito = "Firewall/red host web (puertos opcionales)"
        estado = if (@($pruebasWebOpcionales).Count -eq 0) { "NO_APLICA" } elseif (@($pruebasWebOpcionales | Where-Object { $_.estado -eq "OK" }).Count -gt 0) { "PARCIAL" } else { "OBSERVACION" }
        detalle = if (@($pruebasWebOpcionales).Count -eq 0) { "Sin puertos opcionales definidos" } else { ($pruebasWebOpcionales | ForEach-Object { "$($_.host):$($_.puerto)=$($_.estado)" }) -join "; " }
    },
    [PSCustomObject]@{
        prerequisito = "Firewall/red host SQL (puerto 1433)"
        estado = $estadoFirewallSql
        detalle = "$($pruebaSql.host):$($pruebaSql.puerto)=$($pruebaSql.estado)"
    },
    [PSCustomObject]@{
        prerequisito = "Credenciales CI/CD de despliegue (referencias de secretos en workflows)"
        estado = if ($faltantesReferenciaSecretos.Count -eq 0) { "PARCIAL" } else { "PENDIENTE_EXTERNO" }
        detalle = if ($faltantesReferenciaSecretos.Count -eq 0) { "Referencias de secretos detectadas en workflows" } else { "Faltan referencias: " + ($faltantesReferenciaSecretos -join ", ") }
    },
    [PSCustomObject]@{
        prerequisito = "Acceso a registry privado"
        estado = if ($HostRegistry -and @($authsDocker | Where-Object { $_ -match [regex]::Escape($HostRegistry) }).Count -gt 0) { "OK" } elseif ($HostRegistry) { "PENDIENTE_EXTERNO" } else { "PENDIENTE_EXTERNO" }
        detalle = "host registry=$HostRegistry; auths locales=$($authsDocker.Count); login_local=$($loginRegistryResultado.estado)"
    },
    [PSCustomObject]@{
        prerequisito = "Ventana de cambio autorizada"
        estado = if ($actaVentana.estado -eq "APROBADA") { "OK" } elseif ($actaVentana.estado -eq "INCOMPLETA") { "PARCIAL" } else { "PENDIENTE_EXTERNO" }
        detalle = "$($actaVentana.detalle); plantilla_creada=$plantillaCreada"
    }
)

$bloqueadores = @(
    $checklist | Where-Object {
        $_.estado -in @("FALLA", "PENDIENTE_EXTERNO", "PARCIAL") -and
        $_.prerequisito -ne "Firewall/red host web (puertos opcionales)"
    }
)
$resultadoGeneral = if ($bloqueadores.Count -eq 0) { "OK" } else { "BLOQUEADO" }

"Inicio verificacion prerequisitos externos STAGING: $(Get-Date -Format o)" | Out-File -FilePath $rutaLog -Encoding UTF8
"Proyecto: $raizProyecto" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
"Host web staging: $HostWebStaging" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
"Host SQL staging: $HostSqlStaging" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
"Puerto SQL staging: $PuertoSqlStaging" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
"Host registry: $HostRegistry" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
"Ruta acta ventana: $rutaActa" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
"Aplicar correcciones locales: $AplicarCorreccionesLocales" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
"Resultado general: $resultadoGeneral" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
"" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
"[Checklist]" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
($checklist | ConvertTo-Json -Compress) | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
"" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
"[Puertos Web Requeridos]" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
($pruebasWebRequeridas | ConvertTo-Json -Compress) | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
"" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
"[Puertos Web Opcionales]" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
($pruebasWebOpcionales | ConvertTo-Json -Compress) | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
"" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
"[Puerto SQL]" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
($pruebaSql | ConvertTo-Json -Compress) | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
"" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
"[Referencias secretos en CI]" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
$referenciasSecretsCi | Out-File -FilePath $rutaLog -Encoding UTF8 -Append

Write-Host ""
Write-Host "Resumen verificacion A.2.5.3:"
$checklist | Format-Table -AutoSize
Write-Host ""
Write-Host "Resultado general: $resultadoGeneral"
Write-Host "Log generado: $rutaLog"

if ($resultadoGeneral -eq "OK") {
    exit 0
}

exit 1
