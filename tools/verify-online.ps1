# NEXUS 线上资源校验（Windows PowerShell）
# 用法：powershell -ExecutionPolicy Bypass -File tools/verify-online.ps1
$ErrorActionPreference = 'Stop'
$base = 'https://engernages-lab.github.io/02/'
$dist = Join-Path (Split-Path $PSScriptRoot -Parent) 'dist'
$files = @('boss.css', 'cinematic.css', 'global.css', 'vault.css', 'assets/game.js')
$ok = 0; $bad = 0
foreach ($f in $files) {
  $local = Join-Path $dist ($f -replace '/', '\')
  if (-not (Test-Path $local)) { Write-Host "MISSING-LOCAL $f" -ForegroundColor Yellow; $bad++; continue }
  $lh = (Get-FileHash -Algorithm SHA256 $local).Hash
  $tmp = Join-Path $env:TEMP ('nx_' + [guid]::NewGuid().ToString() + '.bin')
  try {
    Invoke-WebRequest -UseBasicParsing -Uri ($base + $f) -OutFile $tmp -TimeoutSec 60 -Headers @{ 'Cache-Control' = 'no-cache' }
    $rh = (Get-FileHash -Algorithm SHA256 $tmp).Hash
    $size = (Get-Item $tmp).Length
    if ($lh -eq $rh) { Write-Host "PASS  $f  sha256=$($lh.Substring(0,16))  bytes=$size" -ForegroundColor Green; $ok++ }
    else { Write-Host "DIFF  $f  local=$($lh.Substring(0,16)) remote=$($rh.Substring(0,16))" -ForegroundColor Red; $bad++ }
  } catch {
    Write-Host "404/ERR $f  -> $($_.Exception.Message)" -ForegroundColor Red; $bad++
  } finally { if (Test-Path $tmp) { Remove-Item $tmp -Force } }
}
Write-Host ""
Write-Host "RESULT: $ok passed, $bad failed (base=$base)" -ForegroundColor Cyan
if ($bad -gt 0) { exit 1 }
