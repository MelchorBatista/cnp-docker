[CmdletBinding()]
param(
    [string]$RutaEntorno = '',
    [string]$RutaLog = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if (-not $RutaEntorno) {
    $RutaEntorno = Join-Path $PSScriptRoot '..\..\backend\.env.local'
}

function Escribir-Log {
    param([string]$Mensaje)
    Write-Host $Mensaje
    if ($script:RutaLogFinal) {
        Add-Content -Path $script:RutaLogFinal -Value $Mensaje -Encoding UTF8
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
            $variables[$partes[0].Trim()] = $partes[1]
        }
    }

    return $variables
}

function Obtener-Valor {
    param(
        [hashtable]$Variables,
        [string]$Clave,
        [string]$Predeterminado = ''
    )

    if ($Variables.ContainsKey($Clave) -and $Variables[$Clave].ToString().Trim() -ne '') {
        return $Variables[$Clave].ToString().Trim()
    }

    return $Predeterminado
}

function Probar-Comando {
    param([string]$Nombre, [scriptblock]$Accion)

    try {
        $salida = & $Accion 2>&1 | Out-String
        return [pscustomobject]@{ Nombre = $Nombre; Estado = 'OK'; Detalle = $salida.Trim() }
    }
    catch {
        return [pscustomobject]@{ Nombre = $Nombre; Estado = 'FALLA'; Detalle = $_.Exception.Message }
    }
}

function Ejecutar-ConsultaSql {
    param(
        [string]$Servidor,
        [string]$BaseDatos,
        [int]$Puerto,
        [ValidateSet('windows', 'sql')]
        [string]$ModoAutenticacion,
        [string]$Usuario,
        [string]$Clave,
        [string]$Consulta
    )

    Add-Type -AssemblyName System.Data
    $builder = New-Object System.Data.SqlClient.SqlConnectionStringBuilder
    $builder['Data Source'] = "${Servidor},${Puerto}"
    $builder['Initial Catalog'] = $BaseDatos
    $builder['Connect Timeout'] = 10
    $builder['Encrypt'] = 'False'
    $builder['TrustServerCertificate'] = 'True'

    if ($ModoAutenticacion -eq 'windows') {
        $builder['Integrated Security'] = 'SSPI'
    }
    else {
        $builder['User ID'] = $Usuario
        $builder['Password'] = $Clave
    }

    $conexion = New-Object System.Data.SqlClient.SqlConnection $builder.ConnectionString
    try {
        $conexion.Open()
        $comando = $conexion.CreateCommand()
        $comando.CommandText = $Consulta
        $adaptador = New-Object System.Data.SqlClient.SqlDataAdapter $comando
        $tabla = New-Object System.Data.DataTable
        [void]$adaptador.Fill($tabla)
        if ($tabla.Rows.Count -eq 0) { throw 'La consulta no devolvio filas.' }
        return $tabla.Rows[0]
    }
    finally {
        if ($conexion.State -ne [System.Data.ConnectionState]::Closed) {
            $conexion.Close()
        }
        $conexion.Dispose()
    }
}

function Evaluar-Conexion {
    param(
        [string]$NombreConexion,
        [string]$Servidor,
        [int]$Puerto,
        [string]$BaseDatos,
        [string]$ModoAutenticacion,
        [string]$Usuario,
        [string]$Clave,
        [bool]$DebePoderEscribir
    )

    $resultado = [ordered]@{
        Red = $false
        Estado = 'FALLA'
        Detalle = ''
        PuedeLeer = $false
        PuedeEscribir = $false
    }

    $pruebaRed = Test-NetConnection -ComputerName $Servidor -Port $Puerto -WarningAction SilentlyContinue
    $resultado.Red = [bool]$pruebaRed.TcpTestSucceeded

    if (-not $resultado.Red) {
        $resultado.Detalle = "No se pudo abrir el puerto SQL de ${NombreConexion}."
        return [pscustomobject]$resultado
    }

    $consultaPermisos = "SELECT`r`n    DB_NAME() AS BaseActual,`r`n    HAS_PERMS_BY_NAME(DB_NAME(), 'DATABASE', 'SELECT') AS PuedeLeer,`r`n    HAS_PERMS_BY_NAME(DB_NAME(), 'DATABASE', 'INSERT') AS PuedeInsertar,`r`n    HAS_PERMS_BY_NAME(DB_NAME(), 'DATABASE', 'UPDATE') AS PuedeActualizar,`r`n    HAS_PERMS_BY_NAME(DB_NAME(), 'DATABASE', 'DELETE') AS PuedeEliminar;"

    try {
        $fila = Ejecutar-ConsultaSql -Servidor $Servidor -BaseDatos $BaseDatos -Puerto $Puerto -ModoAutenticacion $ModoAutenticacion -Usuario $Usuario -Clave $Clave -Consulta $consultaPermisos
        $resultado.PuedeLeer = [int]$fila.PuedeLeer -ge 1
        $resultado.PuedeEscribir = ([int]$fila.PuedeInsertar -ge 1) -or ([int]$fila.PuedeActualizar -ge 1) -or ([int]$fila.PuedeEliminar -ge 1)
        $resultado.Estado = if ($resultado.PuedeLeer -and ($resultado.PuedeEscribir -eq $DebePoderEscribir)) { 'OK' } else { 'REVISAR' }
        $resultado.Detalle = "Base=$($fila.BaseActual) Leer=$($fila.PuedeLeer) Insertar=$($fila.PuedeInsertar) Actualizar=$($fila.PuedeActualizar) Eliminar=$($fila.PuedeEliminar)"
    }
    catch {
        $resultado.Detalle = $_.Exception.Message
    }

    return [pscustomobject]$resultado
}

$script:RutaLogFinal = $RutaLog
if (-not $script:RutaLogFinal) {
    $marca = Get-Date -Format 'yyyyMMdd_HHmmss'
    $script:RutaLogFinal = Join-Path $PSScriptRoot "..\..\docs\migracion\ejecucion\29A_Verificacion_Prerequisitos_Locales_Dual_SQL_${marca}.log"
}

$variables = Cargar-Entorno -Ruta $RutaEntorno

$hostValidacion = Obtener-Valor -Variables $variables -Clave 'DB_SERVER_VALIDACION'
$puertoValidacion = [int](Obtener-Valor -Variables $variables -Clave 'DB_PORT_VALIDACION' -Predeterminado '1433')
$baseValidacion = Obtener-Valor -Variables $variables -Clave 'VALIDACION_DATABASE'
$modoValidacion = Obtener-Valor -Variables $variables -Clave 'DB_AUTH_VALIDACION' -Predeterminado 'sql'
$usuarioValidacion = Obtener-Valor -Variables $variables -Clave 'DB_USER_VALIDACION'
$claveValidacion = Obtener-Valor -Variables $variables -Clave 'DB_PASSWORD_VALIDACION'

$hostConsulta = Obtener-Valor -Variables $variables -Clave 'DB_SERVER_CONSULTA' -Predeterminado (Obtener-Valor -Variables $variables -Clave 'DB_SERVER_RECEPCION')
$puertoConsulta = [int](Obtener-Valor -Variables $variables -Clave 'DB_PORT_CONSULTA' -Predeterminado (Obtener-Valor -Variables $variables -Clave 'DB_PORT_RECEPCION' -Predeterminado '1433'))
$baseConsulta = Obtener-Valor -Variables $variables -Clave 'CONSULTA_DATABASE' -Predeterminado (Obtener-Valor -Variables $variables -Clave 'RECEPCION_DATABASE')
$modoConsulta = Obtener-Valor -Variables $variables -Clave 'DB_AUTH_CONSULTA' -Predeterminado 'sql'
$usuarioConsulta = Obtener-Valor -Variables $variables -Clave 'DB_USER_CONSULTA' -Predeterminado (Obtener-Valor -Variables $variables -Clave 'DB_USER_RECEPCION')
$claveConsulta = Obtener-Valor -Variables $variables -Clave 'DB_PASSWORD_CONSULTA' -Predeterminado (Obtener-Valor -Variables $variables -Clave 'DB_PASSWORD_RECEPCION')

$hostRecepcion = Obtener-Valor -Variables $variables -Clave 'DB_SERVER_RECEPCION'
$puertoRecepcion = [int](Obtener-Valor -Variables $variables -Clave 'DB_PORT_RECEPCION' -Predeterminado '1433')
$baseRecepcion = Obtener-Valor -Variables $variables -Clave 'RECEPCION_DATABASE'
$modoRecepcion = Obtener-Valor -Variables $variables -Clave 'DB_AUTH_RECEPCION' -Predeterminado 'sql'
$usuarioRecepcion = Obtener-Valor -Variables $variables -Clave 'DB_USER_RECEPCION'
$claveRecepcion = Obtener-Valor -Variables $variables -Clave 'DB_PASSWORD_RECEPCION'

Escribir-Log '=== PREREQUISITOS LOCALES SQL ==='
Escribir-Log "Archivo entorno: $RutaEntorno"
Escribir-Log "Host VALIDACION: ${hostValidacion}:$puertoValidacion"
Escribir-Log "Host CONSULTA: ${hostConsulta}:$puertoConsulta"
Escribir-Log "Host RECEPCION: ${hostRecepcion}:$puertoRecepcion"
Escribir-Log "Auth VALIDACION: $modoValidacion"
Escribir-Log "Auth CONSULTA: $modoConsulta"
Escribir-Log "Auth RECEPCION: $modoRecepcion"
Escribir-Log ''

$resultadoWsl = Probar-Comando -Nombre 'WSL' -Accion { wsl.exe --status }
$resultadoDockerVersion = Probar-Comando -Nombre 'DockerVersion' -Accion { docker version }
$resultadoDockerInfo = Probar-Comando -Nombre 'DockerInfo' -Accion { docker info }

$estadoValidacion = Evaluar-Conexion -NombreConexion 'VALIDACION' -Servidor $hostValidacion -Puerto $puertoValidacion -BaseDatos $baseValidacion -ModoAutenticacion $modoValidacion -Usuario $usuarioValidacion -Clave $claveValidacion -DebePoderEscribir $false
$estadoConsulta = Evaluar-Conexion -NombreConexion 'CONSULTA' -Servidor $hostConsulta -Puerto $puertoConsulta -BaseDatos $baseConsulta -ModoAutenticacion $modoConsulta -Usuario $usuarioConsulta -Clave $claveConsulta -DebePoderEscribir $false
$estadoRecepcion = Evaluar-Conexion -NombreConexion 'RECEPCION' -Servidor $hostRecepcion -Puerto $puertoRecepcion -BaseDatos $baseRecepcion -ModoAutenticacion $modoRecepcion -Usuario $usuarioRecepcion -Clave $claveRecepcion -DebePoderEscribir $true

Escribir-Log "WSL: $($resultadoWsl.Estado)"
Escribir-Log "Docker version: $($resultadoDockerVersion.Estado)"
Escribir-Log "Docker info: $($resultadoDockerInfo.Estado)"
Escribir-Log "VALIDACION red: $($estadoValidacion.Red)"
Escribir-Log "VALIDACION permisos: $($estadoValidacion.Estado)"
Escribir-Log "VALIDACION detalle: $($estadoValidacion.Detalle)"
Escribir-Log "CONSULTA red: $($estadoConsulta.Red)"
Escribir-Log "CONSULTA permisos: $($estadoConsulta.Estado)"
Escribir-Log "CONSULTA detalle: $($estadoConsulta.Detalle)"
Escribir-Log "RECEPCION red: $($estadoRecepcion.Red)"
Escribir-Log "RECEPCION permisos: $($estadoRecepcion.Estado)"
Escribir-Log "RECEPCION detalle: $($estadoRecepcion.Detalle)"
Escribir-Log "Log: $script:RutaLogFinal"

if (
    $resultadoWsl.Estado -ne 'OK' -or
    $resultadoDockerVersion.Estado -ne 'OK' -or
    $resultadoDockerInfo.Estado -ne 'OK' -or
    $estadoValidacion.Estado -ne 'OK' -or
    $estadoConsulta.Estado -ne 'OK' -or
    $estadoRecepcion.Estado -ne 'OK'
) {
    exit 1
}

exit 0