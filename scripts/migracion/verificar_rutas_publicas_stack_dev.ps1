[CmdletBinding()]
param(
    [string]$ArchivoCompose = '',
    [string]$Proyecto = 'cnp-dev',
    [switch]$VerificarSocketCompat
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

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

function Ejecutar-Paso {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Descripcion,
        [Parameter(Mandatory = $true)]
        [scriptblock]$Script
    )

    Write-Host "==> $Descripcion"
    & $Script
    if ($LASTEXITCODE -ne 0) {
        throw "Fallo el paso: $Descripcion"
    }
}

function Obtener-ProxyUrlBase {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$ArgumentosCompose
    )

    $salidaPuerto = docker compose @ArgumentosCompose port proxy 80
    if ($LASTEXITCODE -ne 0) {
        throw 'No se pudo resolver el puerto publicado del servicio proxy.'
    }

    $lineaPuerto = ($salidaPuerto -split "\r?\n" | Where-Object { $_ -and $_.Trim() } | Select-Object -First 1)
    if (-not $lineaPuerto) {
        throw 'El servicio proxy no publica el puerto 80 hacia el host.'
    }

    if ($lineaPuerto -notmatch ':(\d+)$') {
        throw "No se pudo extraer el puerto host desde '$lineaPuerto'."
    }

    return "http://127.0.0.1:$($Matches[1])"
}

function Convertir-ContenidoAString {
    param(
        [Parameter(Mandatory = $true)]
        [AllowNull()]
        [object]$Contenido
    )

    if ($null -eq $Contenido) {
        return ''
    }

    if ($Contenido -is [byte[]]) {
        return [System.Text.Encoding]::UTF8.GetString($Contenido)
    }

    return [string]$Contenido
}

function Obtener-RespuestaSinSeguirRedirect {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Url
    )

    $request = [System.Net.HttpWebRequest]::Create($Url)
    $request.Method = 'GET'
    $request.AllowAutoRedirect = $false
    $request.Timeout = 15000

    try {
        $resp = [System.Net.HttpWebResponse]$request.GetResponse()
    }
    catch [System.Net.WebException] {
        if (-not $_.Exception.Response) {
            throw
        }

        $resp = [System.Net.HttpWebResponse]$_.Exception.Response
    }

    $stream = $resp.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $body = $reader.ReadToEnd()
    $reader.Dispose()
    $stream.Dispose()

    return [pscustomobject]@{
        StatusCode  = [int]$resp.StatusCode
        Headers     = $resp.Headers
        Content     = $body
        FinalUri    = [string]$resp.ResponseUri.AbsoluteUri
        RedirectUri = [string]$resp.Headers['Location']
    }
}

function Obtener-Respuesta {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Url
    )

    $respuesta = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 15
    return [pscustomobject]@{
        StatusCode = [int]$respuesta.StatusCode
        Headers    = $respuesta.Headers
        Content    = Convertir-ContenidoAString -Contenido $respuesta.Content
        FinalUri   = [string]$respuesta.BaseResponse.ResponseUri.AbsoluteUri
    }
}

function Validar-RedirectCnp {
    param(
        [Parameter(Mandatory = $true)]
        [string]$BaseUrl
    )

    $respuesta = Obtener-RespuestaSinSeguirRedirect -Url "$BaseUrl/cnp"
    Write-Host "GET /cnp -> status $($respuesta.StatusCode)"
    Write-Host "Location: $($respuesta.RedirectUri)"

    if ($respuesta.StatusCode -ne 301 -and $respuesta.StatusCode -ne 302) {
        throw "La ruta /cnp no devolvio redireccion esperada. Status actual: $($respuesta.StatusCode)."
    }

    $location = [string]$respuesta.RedirectUri
    $location = $location.Trim()
    if (-not $location) {
        throw 'La ruta /cnp devolvio redireccion sin header Location.'
    }

    if ($location -eq '/cnp/') {
        return
    }

    $uri = [Uri]$location
    if ($uri.AbsolutePath -ne '/cnp/') {
        throw "La redireccion de /cnp no apunta a /cnp/. Location actual: '$location'."
    }

    if ($uri.IsAbsoluteUri -and $uri.Port -ne ([Uri]$BaseUrl).Port) {
        throw "La redireccion de /cnp perdio el puerto publicado del proxy. Location actual: '$location'."
    }
}

function Validar-Frontend {
    param(
        [Parameter(Mandatory = $true)]
        [string]$BaseUrl
    )

    $respuesta = Obtener-Respuesta -Url "$BaseUrl/cnp/"
    Write-Host "GET /cnp/ -> status $($respuesta.StatusCode)"
    Write-Host "Content-Type: $($respuesta.Headers['Content-Type'])"

    if ($respuesta.StatusCode -ne 200) {
        throw "La ruta /cnp/ no devolvio 200. Status actual: $($respuesta.StatusCode)."
    }

    if ($respuesta.Content -notmatch '<!DOCTYPE html>') {
        throw 'La ruta /cnp/ no devolvio un documento HTML valido.'
    }

    if ($respuesta.Content -notmatch '/cnp/') {
        throw 'La ruta /cnp/ no contiene referencias esperadas al base path /cnp/.'
    }
}

function Validar-Api {
    param(
        [Parameter(Mandatory = $true)]
        [string]$BaseUrl
    )

    $respuesta = Obtener-Respuesta -Url "$BaseUrl/api/health"
    Write-Host "GET /api/health -> status $($respuesta.StatusCode)"
    Write-Host "Body: $($respuesta.Content)"

    if ($respuesta.StatusCode -ne 200) {
        throw "La ruta /api/health no devolvio 200. Status actual: $($respuesta.StatusCode)."
    }

    $payload = $respuesta.Content | ConvertFrom-Json
    if (-not $payload.ok) {
        throw 'La ruta /api/health no devolvio ok=true.'
    }
}

function Validar-SocketIo {
    param(
        [Parameter(Mandatory = $true)]
        [string]$BaseUrl,
        [Parameter(Mandatory = $true)]
        [string]$PathEtiqueta,
        [Parameter(Mandatory = $true)]
        [string]$PathUrl
    )

    $respuesta = Obtener-Respuesta -Url "$BaseUrl${PathUrl}?EIO=4&transport=polling"
    Write-Host "GET ${PathEtiqueta}?EIO=4&transport=polling -> status $($respuesta.StatusCode)"
    Write-Host "Body: $($respuesta.Content)"

    if ($respuesta.StatusCode -ne 200) {
        throw "La ruta $PathEtiqueta no devolvio 200 en handshake polling. Status actual: $($respuesta.StatusCode)."
    }

    if ($respuesta.Content -notmatch '^0\{') {
        throw "La ruta $PathEtiqueta no devolvio el paquete de apertura esperado de Engine.IO."
    }

    if ($respuesta.Content -notmatch '"sid":"' -or
        $respuesta.Content -notmatch '"pingInterval":' -or
        $respuesta.Content -notmatch '"pingTimeout":') {
        throw "La ruta $PathEtiqueta no devolvio los campos esperados de apertura Socket.IO."
    }
}

$raizProyecto = Obtener-RaizProyecto -RutaInicio $PSScriptRoot

if (-not $ArchivoCompose) {
    $ArchivoCompose = Join-Path $raizProyecto 'docker-compose.dev.yml'
}
elseif (-not [System.IO.Path]::IsPathRooted($ArchivoCompose)) {
    $ArchivoCompose = Join-Path $raizProyecto $ArchivoCompose
}

if (-not (Test-Path $ArchivoCompose)) {
    throw "No existe el archivo compose DEV: $ArchivoCompose"
}

$argumentosCompose = @('-p', $Proyecto, '-f', $ArchivoCompose)

Ejecutar-Paso -Descripcion 'Verificar Docker Compose' -Script {
    docker compose version
}

Ejecutar-Paso -Descripcion 'Verificar estado del stack DEV' -Script {
    docker compose @argumentosCompose ps
}

$baseUrl = Obtener-ProxyUrlBase -ArgumentosCompose $argumentosCompose
Write-Host "Proxy publicado en: $baseUrl"

Validar-RedirectCnp -BaseUrl $baseUrl
Validar-Frontend -BaseUrl $baseUrl
Validar-Api -BaseUrl $baseUrl
Validar-SocketIo -BaseUrl $baseUrl -PathEtiqueta '/socket.io/' -PathUrl '/socket.io/'

if ($VerificarSocketCompat) {
    Validar-SocketIo -BaseUrl $baseUrl -PathEtiqueta '/cnp/socket.io/' -PathUrl '/cnp/socket.io/'
}

Write-Host 'Resultado: OK. Las rutas publicas DEV /cnp, /api y /socket.io quedaron validadas.'
