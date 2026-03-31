# Flow Agents — Install Script (Windows PowerShell)
# Usage: .\install.ps1

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$CommandsSrc = Join-Path $ScriptDir "commands"
$CommandsDst = Join-Path $env:USERPROFILE ".claude\commands"

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Flow Agents — Multi-Agent Pipeline" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Check source
if (-not (Test-Path $CommandsSrc)) {
    Write-Host "Error: commands\ directory not found. Run from repo root." -ForegroundColor Red
    exit 1
}

# Create target
if (-not (Test-Path $CommandsDst)) {
    New-Item -ItemType Directory -Path $CommandsDst -Force | Out-Null
}

# Copy files
$files = Get-ChildItem -Path $CommandsSrc -Filter "flow*.md"

if ($files.Count -eq 0) {
    Write-Host "Error: No flow*.md files found in commands\" -ForegroundColor Red
    exit 1
}

Write-Host "Installing $($files.Count) agent commands to $CommandsDst ..."
Write-Host ""

foreach ($file in $files) {
    Copy-Item $file.FullName -Destination $CommandsDst -Force
    Write-Host "  + $($file.Name)" -ForegroundColor Green
}

Write-Host ""
Write-Host "Installation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Available commands:"
Write-Host "  /flow-init      Initialize pipeline in any project"
Write-Host "  /flow           Coordinator: orchestrate the pipeline"
Write-Host "  /flow-analyze   Agent 1: Parse & analyze requirements"
Write-Host "  /flow-plan      Agent 2: Generate PRD & acceptance criteria"
Write-Host "  /flow-build     Agent 3: Implement, deploy & self-test"
Write-Host "  /flow-review    Agent 4: Code review, security scan, QA"
Write-Host "  /flow-research  Agent 5: Deep research & stability audit"
Write-Host ""
Write-Host "Quick start:"
Write-Host "  1. Open Claude Code in any project"
Write-Host "  2. Run /flow-init to create the pipeline workspace"
Write-Host "  3. Drop requirements in .pipeline/inbox/"
Write-Host "  4. Run /flow to start"
Write-Host ""
