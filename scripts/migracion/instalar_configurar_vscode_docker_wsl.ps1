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

function Obtener-RutaCodeCli {
    $comandosPreferidos = @("code.cmd", "code")
    foreach ($nombre in $comandosPreferidos) {
        $comando = Get-Command $nombre -ErrorAction SilentlyContinue
        if ($comando) {
            return $comando.Source
        }
    }

    $rutaCodeCmd = Join-Path ${env:ProgramFiles} "Microsoft VS Code\\bin\\code.cmd"
    if (Test-Path $rutaCodeCmd) {
        return $rutaCodeCmd
    }

    return $null
}

function Es-ExtensionInstalada {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Identificador
    )

    $ejecucionLista = Ejecutar-CodeComando -Argumentos "--list-extensions"
    if ($ejecucionLista.codigo -ne 0) {
        return $false
    }

    $lista = $ejecucionLista.salida -split "`r?`n" | Where-Object { $_ -match "^[a-zA-Z0-9\.-]+\.[a-zA-Z0-9\.-]+$" }
    return [bool]($lista | Where-Object { $_.Trim().ToLowerInvariant() -eq $Identificador.ToLowerInvariant() })
}

function Ejecutar-CodeComando {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Argumentos
    )

    if (-not $script:RutaCodeCli) {
        throw "No se definio la ruta del CLI de VS Code."
    }

    $comando = "`"$script:RutaCodeCli`" $Argumentos"
    $preferenciaAnterior = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        $salida = (& cmd /d /c $comando 2>&1 | Out-String)
        $codigo = $LASTEXITCODE
    }
    finally {
        $ErrorActionPreference = $preferenciaAnterior
    }

    return [PSCustomObject]@{
        codigo = $codigo
        salida = $salida.Trim()
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

$marcaTiempo = Get-Date -Format "yyyyMMdd_HHmmss"
$rutaLog = Join-Path $directorioReporte ("21A_Instalacion_Config_VSCode_Docker_WSL_{0}.log" -f $marcaTiempo)

$extensionesObjetivo = @(
    @{ id = "ms-azuretools.vscode-docker"; nombre = "Docker" },
    @{ id = "ms-vscode-remote.remote-wsl"; nombre = "Remote - WSL" },
    @{ id = "dbaeumer.vscode-eslint"; nombre = "ESLint" },
    @{ id = "esbenp.prettier-vscode"; nombre = "Prettier" },
    @{ id = "github.vscode-github-actions"; nombre = "GitHub Actions" }
)

"Inicio instalacion/configuracion VS Code Docker/WSL: $(Get-Date -Format o)" | Out-File -FilePath $rutaLog -Encoding UTF8
"Directorio de trabajo: $raizProyecto" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append

$rutaCodeCli = Obtener-RutaCodeCli
if (-not $rutaCodeCli) {
    "CLI de VS Code no encontrado (code)." | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
    Write-Error "No se encontro el comando 'code'."
    exit 1
}

$script:RutaCodeCli = $rutaCodeCli
"CLI VS Code detectado: $rutaCodeCli" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append

$resultados = foreach ($extension in $extensionesObjetivo) {
    $instaladaInicial = Es-ExtensionInstalada -Identificador $extension.id
    $metodo = "Ninguno"
    $resultado = "Sin cambios"
    $codigo = 0
    $detalle = ""

    if (-not $instaladaInicial) {
        $metodo = "code --install-extension"
        $ejecucionInstalacion = Ejecutar-CodeComando -Argumentos "--install-extension $($extension.id) --force"
        $codigo = $ejecucionInstalacion.codigo
        $detalle = $ejecucionInstalacion.salida

        if ($codigo -ne 0 -and $detalle -match "(?i)self signed certificate") {
            $metodo = "code --install-extension + fallback TLS"
            $valorPrevioTls = $env:NODE_TLS_REJECT_UNAUTHORIZED
            $env:NODE_TLS_REJECT_UNAUTHORIZED = "0"

            $ejecucionFallback = Ejecutar-CodeComando -Argumentos "--install-extension $($extension.id) --force"
            $codigo = $ejecucionFallback.codigo

            if ($null -eq $valorPrevioTls) {
                Remove-Item Env:NODE_TLS_REJECT_UNAUTHORIZED -ErrorAction SilentlyContinue
            }
            else {
                $env:NODE_TLS_REJECT_UNAUTHORIZED = $valorPrevioTls
            }

            $detalle = ($detalle + "`n--- fallback tls ---`n" + $ejecucionFallback.salida).Trim()
        }

        $resultado = if ($codigo -eq 0) { "Instalada/Ajustada" } else { "Fallo" }
    }

    $instaladaFinal = Es-ExtensionInstalada -Identificador $extension.id

    $fila = [PSCustomObject]@{
        extension = $extension.nombre
        id = $extension.id
        estado_inicial = if ($instaladaInicial) { "Instalada" } else { "No instalada" }
        metodo = $metodo
        resultado = $resultado
        codigo = $codigo
        estado_final = if ($instaladaFinal) { "Instalada" } else { "No instalada" }
        detalle = $detalle
    }

    ($fila | ConvertTo-Json -Compress) | Out-File -FilePath $rutaLog -Encoding UTF8 -Append
    $fila
}

# Configuracion de workspace: recomendaciones de extensiones
$directorioVSCode = Join-Path $raizProyecto ".vscode"
New-Item -ItemType Directory -Path $directorioVSCode -Force | Out-Null

$rutaExtensiones = Join-Path $directorioVSCode "extensions.json"
$contenidoExtensiones = @'
{
  "recommendations": [
    "ms-azuretools.vscode-docker",
    "ms-vscode-remote.remote-wsl",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "github.vscode-github-actions"
  ]
}
'@
Set-Content -Path $rutaExtensiones -Value $contenidoExtensiones -Encoding UTF8

"Archivo de recomendaciones actualizado: $rutaExtensiones" | Out-File -FilePath $rutaLog -Encoding UTF8 -Append

Write-Host ""
Write-Host "Resumen instalacion/configuracion VS Code Docker/WSL:"
$resultados | Format-Table -AutoSize
Write-Host ""
Write-Host "Log generado: $rutaLog"

$faltantes = @($resultados | Where-Object { $_.estado_final -ne "Instalada" })
if ($faltantes.Count -gt 0) {
    Write-Warning "Hay extensiones pendientes o con fallo. Revise el log."
    exit 1
}

exit 0
