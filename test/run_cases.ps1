param([string]$Py)
# 用 .NET 进程 API 执行每个用例，精确捕获退出码与原始字节输出（UTF-8）
$ErrorActionPreference = 'Stop'
$enc = New-Object System.Text.UTF8Encoding($false)
$dir = Join-Path $PSScriptRoot 'cases'
$res = Join-Path $dir 'results.txt'
Remove-Item $res -ErrorAction SilentlyContinue

Get-ChildItem (Join-Path $dir '*.py') | ForEach-Object {
  $f = $_.FullName
  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = $Py
  $psi.Arguments = '"' + $f + '"'
  $psi.UseShellExecute = $false
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  $psi.StandardOutputEncoding = [System.Text.Encoding]::UTF8
  $psi.StandardErrorEncoding = [System.Text.Encoding]::UTF8
  $psi.CreateNoWindow = $true
  $proc = [System.Diagnostics.Process]::Start($psi)
  $out = $proc.StandardOutput.ReadToEnd()
  $err = $proc.StandardError.ReadToEnd()
  $proc.WaitForExit()
  [System.IO.File]::WriteAllText($f + '.out', $out, $enc)
  [System.IO.File]::WriteAllText($f + '.err', $err, $enc)
  $line = $_.BaseName + '|' + $proc.ExitCode + [char]10
  [System.IO.File]::AppendAllText($res, $line, $enc)
}
Write-Host ('CASES_RUN=' + (Get-ChildItem (Join-Path $dir '*.py')).Count)
