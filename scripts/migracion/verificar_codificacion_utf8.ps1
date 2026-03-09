param(
    [Parameter(Position = 0)]
    [string]$Path = (Join-Path $PSScriptRoot "..\\..\\Migracion_Docker.ini")
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$resolvedPath = (Resolve-Path -LiteralPath $Path).Path
$bytes = [System.IO.File]::ReadAllBytes($resolvedPath)
$utf8Strict = [System.Text.UTF8Encoding]::new($false, $true)
$bomLength = 0

if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
    $bomLength = 3
}

try {
    $text = $utf8Strict.GetString($bytes, $bomLength, $bytes.Length - $bomLength)
} catch {
    Write-Error "El archivo '$resolvedPath' no es UTF-8 valido."
    exit 1
}

$replacementChar = [string][char]0xFFFD
$checks = @(
    @{ Pattern = "Ã"; Reason = "doble codificacion UTF-8/Windows-1252" }
    @{ Pattern = "Â"; Reason = "doble codificacion UTF-8/Windows-1252" }
    @{ Pattern = "Æ"; Reason = "doble codificacion UTF-8/Windows-1252" }
    @{ Pattern = "â"; Reason = "secuencia comun de mojibake" }
    @{ Pattern = $replacementChar; Reason = "caracter de reemplazo U+FFFD" }
)

$findings = @(foreach ($check in $checks) {
    $count = ([regex]::Matches($text, [regex]::Escape($check.Pattern))).Count
    if ($count -gt 0) {
        [pscustomobject]@{
            Pattern = $check.Pattern
            Count = $count
            Reason = $check.Reason
        }
    }
})

if ($findings.Count -gt 0) {
    Write-Error "El archivo '$resolvedPath' contiene patrones incompatibles con el texto esperado en UTF-8."
    foreach ($finding in $findings) {
        Write-Host ("  patron '{0}' encontrado {1} vez/veces ({2})" -f $finding.Pattern, $finding.Count, $finding.Reason)
    }
    exit 1
}

Write-Host "OK: '$resolvedPath' es UTF-8 valido y no presenta mojibake comun."
