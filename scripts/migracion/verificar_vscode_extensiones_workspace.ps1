[CmdletBinding()]
param(
    [string]$RutaDirectorioReporte = ".\\docs\\migracion\\ejecucion"
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

function Ejecutar-CodeComando {
    param(
        [Parameter(Mandatory = $true)]
        [string]$RutaCode,
        [Parameter(Mandatory = $true)]
        [string]$Argumentos
    )

    $comando = "`"$RutaCode`" $Argumentos"
    $preferencia = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        $salida = (& cmd /d /c $comando 2>&1 | Out-String)
        $codigo = $LASTEXITCODE
    }
    finally {
        $ErrorActionPreference = $preferencia
    }

    return [PSCustomObject]@{
        codigo = $codigo
        salida = $salida.Trim()
    }
}

$raizProyecto = Obtener-RaizProyecto -RutaInicio $PSScriptRoot
$directorioReporte = if ([System.IO.Path]::IsPathRooted($RutaDirectorioReporte)) { $RutaDirectorioReporte } else { Join-Path $raizProyecto $RutaDirectorioReporte }
New-Item -ItemType Directory -Path $directorioReporte -Force | Out-Null

$marcaTiempo = Get-Date -Format "yyyyMMdd_HHmmss"
$rutaLog = Join-Path $directorioReporte ("21B_Verificacion_VSCode_Extensiones_Workspace_{0}.log" -f $marcaTiempo)

$comandoCode = Get-Command code -ErrorAction SilentlyContinue
if (-not $comandoCode) {
    Write-Error "No se encontro el comando 'code'."
    exit 1
}

$rutaCode = $comandoCode.Source

$extensionesRequeridas = @(
    "ms-azuretools.vscode-docker",
    "ms-vscode-remote.remote-wsl",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "github.vscode-github-actions"
)

$resultadoVersion = Ejecutar-CodeComando -RutaCode $rutaCode -Argumentos "--version"
$resultadoLista = Ejecutar-CodeComando -RutaCode $rutaCode -Argumentos "--list-extensions"
$resultadoApertura = Ejecutar-CodeComando -RutaCode $rutaCode -Argumentos "-n . --verbose"
Start-Sleep -Seconds 2
$resultadoStatus = Ejecutar-CodeComando -RutaCode $rutaCode -Argumentos "--status"

$extensionesInstaladas = $resultadoLista.salida -split "`r?`n" | Where-Object { $_ -match "^[a-zA-Z0-9\.-]+\.[a-zA-Z0-9\.-]+$" }
$faltantes = @($extensionesRequeridas | Where-Object { $extensionesInstaladas -notcontains $_ })

$patronErroresApertura = "(?im)error while|failed to|cannot find|not recognized|command not found|enoent|self signed certificate"
$aperturaOk = (
    $resultadoApertura.codigo -eq 0 -and
    $resultadoApertura.salida -notmatch $patronErroresApertura
)

$statusOk = (
    $resultadoStatus.codigo -eq 0 -and
    $resultadoStatus.salida -match "Workspace Stats"
)

$resultadoGeneral = ($faltantes.Count -eq 0 -and $aperturaOk -and $statusOk)

"Inicio verificacion VS Code extensiones/workspace: $(Get-Date -Format o)" | Out-File -FilePath $rutaLog -Encoding UTF8
"Directorio de trabajo: $raizProyecto" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
"Ruta code CLI: $rutaCode" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
($resultadoVersion | ConvertTo-Json -Compress) | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
($resultadoLista | ConvertTo-Json -Compress) | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
($resultadoApertura | ConvertTo-Json -Compress) | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
($resultadoStatus | ConvertTo-Json -Compress) | Out-File -FilePath $rutaLog -Encoding UTF8 -Append

$resumen = @(
    [PSCustomObject]@{
        verificacion = "Extensiones requeridas instaladas"
        estado = if ($faltantes.Count -eq 0) { "OK" } else { "FALLA" }
        detalle = if ($faltantes.Count -eq 0) { "Sin faltantes" } else { "Faltan: " + ($faltantes -join ", ") }
    },
    [PSCustomObject]@{
        verificacion = "Apertura de workspace por CLI"
        estado = if ($aperturaOk) { "OK" } else { "FALLA" }
        detalle = "code -n . --verbose"
    },
    [PSCustomObject]@{
        verificacion = "Estado de instancia VS Code"
        estado = if ($statusOk) { "OK" } else { "FALLA" }
        detalle = "code --status"
    }
)

($resumen | ConvertTo-Json -Compress) | Out-File -FilePath $rutaLog -Encoding UTF8 -Append

Write-Host ""
Write-Host "Resumen verificacion A.2.3.5:"
$resumen | Format-Table -AutoSize
Write-Host ""
Write-Host "Log generado: $rutaLog"

if (-not $resultadoGeneral) {
    Write-Warning "La verificacion de VS Code no cumple completamente. Revisar log."
    exit 1
}

exit 0
