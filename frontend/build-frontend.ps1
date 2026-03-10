# Copiar y pegar en la terminal para construir el frontend

# Ensure we are in the correct folder
Set-Location -Path "C:\Desarrollo\cnp\frontend"

# Clean previous dist folder completely
$distRoot = "C:\Desarrollo\cnp\frontend\dist"
if (Test-Path $distRoot) {
    Remove-Item "$distRoot" -Recurse -Force -ErrorAction SilentlyContinue
}

# Add portable Node to PATH
$env:PATH = "C:\Desarrollo\cnp\Node;$env:PATH"

# Set environment variables for production build
$env:NODE_ENV = "production"
$env:VITE_BASEPATH = "/cnp/"

# Run build using npm (portable, global, or fallback to node)
$npmCmd = Join-Path "C:\Desarrollo\cnp\Node" "npm.cmd"
if (Test-Path $npmCmd) {
    Write-Host "Running build using npm.cmd from portable Node..."
    & $npmCmd run build
} elseif (Get-Command npm -ErrorAction SilentlyContinue) {
    Write-Host "Running build using globally installed npm..."
    npm run build
} else {
    Write-Host "npm.cmd not found, running build using node + npm-cli.js..."
    node .\node_modules\npm\bin\npm-cli.js run build
}

# After build, ensure output is placed under dist/cnp
$finalPath = Join-Path $distRoot "cnp"
if (-not (Test-Path $finalPath)) {
    New-Item -ItemType Directory -Path $finalPath | Out-Null
}

# Move all generated files into dist/cnp (except the cnp folder itself if present)
Get-ChildItem $distRoot | Where-Object { $_.Name -ne "cnp" } | ForEach-Object {
    Move-Item $_.FullName $finalPath -Force
}

Write-Host "✅ Build completed and placed under $finalPath"
