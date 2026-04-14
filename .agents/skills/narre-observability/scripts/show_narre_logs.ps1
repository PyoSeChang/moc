param(
  [ValidateSet('latest', 'runtime', 'packaged')]
  [string]$Scope = 'runtime',

  [ValidateSet('both', 'main', 'narre')]
  [string]$Target = 'both',

  [int]$Tail = 80,

  [switch]$Wait
)

$root = Join-Path $env:APPDATA 'netior'
$runtimeRoot = Join-Path $root 'runtime'
$packagedLogs = Join-Path $root 'data\\logs'

function Get-LogTimestamp {
  param([string]$Path)

  if (Test-Path -LiteralPath $Path) {
    return (Get-Item -LiteralPath $Path).LastWriteTimeUtc
  }

  return [datetime]::MinValue
}

function New-LogCandidate {
  param(
    [string]$Kind,
    [string]$Name,
    [string]$LogsDir
  )

  $mainPath = Join-Path $LogsDir 'desktop-main.log'
  $narrePath = Join-Path $LogsDir 'narre-server.log'
  $updatedAt = (Get-LogTimestamp -Path $mainPath)
  $narreUpdatedAt = Get-LogTimestamp -Path $narrePath
  if ($narreUpdatedAt -gt $updatedAt) {
    $updatedAt = $narreUpdatedAt
  }

  [pscustomobject]@{
    Kind = $Kind
    Name = $Name
    LogsDir = $LogsDir
    MainPath = $mainPath
    NarrePath = $narrePath
    UpdatedAt = $updatedAt
  }
}

function Get-LogCandidates {
  $candidates = @()

  if (Test-Path -LiteralPath $packagedLogs) {
    $candidates += New-LogCandidate -Kind 'packaged' -Name 'packaged' -LogsDir $packagedLogs
  }

  if (Test-Path -LiteralPath $runtimeRoot) {
    Get-ChildItem -LiteralPath $runtimeRoot -Directory -ErrorAction SilentlyContinue | ForEach-Object {
      $logsDir = Join-Path $_.FullName 'data\\logs'
      if (Test-Path -LiteralPath $logsDir) {
        $candidates += New-LogCandidate -Kind 'runtime' -Name $_.Name -LogsDir $logsDir
      }
    }
  }

  return $candidates | Where-Object {
    (Test-Path -LiteralPath $_.MainPath) -or (Test-Path -LiteralPath $_.NarrePath)
  }
}

function Show-Log {
  param(
    [string]$Label,
    [string]$Path
  )

  if (-not (Test-Path -LiteralPath $Path)) {
    Write-Host "[missing] $Label -> $Path"
    return
  }

  Write-Host ""
  Write-Host "=== $Label ==="
  Write-Host $Path
  Get-Content -LiteralPath $Path -Tail $Tail
}

$candidates = Get-LogCandidates
if (-not $candidates -or $candidates.Count -eq 0) {
  Write-Error "No Netior log files found under $root"
  exit 1
}

$selected = switch ($Scope) {
  'packaged' {
    $candidates | Where-Object { $_.Kind -eq 'packaged' } | Sort-Object UpdatedAt -Descending | Select-Object -First 1
  }
  'runtime' {
    $candidates | Where-Object { $_.Kind -eq 'runtime' } | Sort-Object UpdatedAt -Descending | Select-Object -First 1
  }
  default {
    $candidates | Sort-Object UpdatedAt -Descending | Select-Object -First 1
  }
}

if (-not $selected) {
  Write-Error "No matching log scope found for '$Scope'"
  exit 1
}

Write-Host "Selected scope: $($selected.Name) [$($selected.Kind)]"
Write-Host "Logs dir: $($selected.LogsDir)"

if ($Wait) {
  if ($Target -eq 'both') {
    Write-Error "Use -Wait with -Target main or -Target narre"
    exit 1
  }

  $path = if ($Target -eq 'main') { $selected.MainPath } else { $selected.NarrePath }
  if (-not (Test-Path -LiteralPath $path)) {
    Write-Error "Log file not found: $path"
    exit 1
  }

  Write-Host "Following: $path"
  Get-Content -LiteralPath $path -Tail $Tail -Wait
  exit 0
}

switch ($Target) {
  'main' {
    Show-Log -Label 'desktop-main.log' -Path $selected.MainPath
  }
  'narre' {
    Show-Log -Label 'narre-server.log' -Path $selected.NarrePath
  }
  default {
    Show-Log -Label 'desktop-main.log' -Path $selected.MainPath
    Show-Log -Label 'narre-server.log' -Path $selected.NarrePath
  }
}
