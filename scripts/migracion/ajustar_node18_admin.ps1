[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Warning "Este script queda obsoleto por cambio de baseline. Se delega a ajustar_node24_admin.ps1."
$rutaScriptActualizado = Join-Path $PSScriptRoot "ajustar_node24_admin.ps1"
if (-not (Test-Path $rutaScriptActualizado)) {
    Write-Error "No se encontro el script actualizado: $rutaScriptActualizado"
    exit 1
}

& $rutaScriptActualizado
exit $LASTEXITCODE
