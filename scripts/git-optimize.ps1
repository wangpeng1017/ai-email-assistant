# Git Performance Optimization Script for AI Email Assistant
param(
    [switch]$Analysis,
    [switch]$Quick,
    [switch]$Full
)

Write-Host "Git Performance Optimization Tool" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

function Show-GitStatus {
    Write-Host "`nGit Repository Analysis:" -ForegroundColor Yellow
    
    # Repository size
    try {
        $gitSize = (Get-ChildItem .git -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB
        Write-Host "Repository size: $([math]::Round($gitSize, 2)) MB"
    } catch {
        Write-Host "Could not calculate repository size"
    }
    
    # Object count
    $objectInfo = git count-objects -v 2>$null
    if ($objectInfo) {
        Write-Host "Git objects:"
        $objectInfo | ForEach-Object { Write-Host "  $_" }
    }
    
    # File status
    $stagedFiles = @(git diff --cached --name-only 2>$null)
    $modifiedFiles = @(git diff --name-only 2>$null)
    $untrackedFiles = @(git ls-files --others --exclude-standard 2>$null)
    
    Write-Host "`nFile Status:"
    Write-Host "  Staged: $($stagedFiles.Count) files"
    Write-Host "  Modified: $($modifiedFiles.Count) files"
    Write-Host "  Untracked: $($untrackedFiles.Count) files"
}

function Optimize-GitConfig {
    Write-Host "`nOptimizing Git Configuration..." -ForegroundColor Yellow
    
    # Performance settings
    git config core.compression 6
    git config core.packedgitlimit 1g
    git config core.packedgitwindowsize 1g
    git config pack.deltacachesize 2g
    git config pack.threads 0
    
    # Garbage collection
    git config gc.auto 6700
    git config gc.autopacklimit 50
    
    # Network optimization
    git config http.postbuffer 524288000
    
    # File system monitoring
    git config core.fsmonitor true
    git config core.preloadindex true
    
    Write-Host "Git configuration optimized" -ForegroundColor Green
}

function Check-LargeFiles {
    Write-Host "`nChecking for large files..." -ForegroundColor Yellow
    
    $largeFiles = Get-ChildItem -Recurse -ErrorAction SilentlyContinue | Where-Object {
        $_.Length -gt 1MB -and 
        $_.FullName -notmatch "node_modules" -and 
        $_.FullName -notmatch "\.git" -and
        $_.FullName -notmatch "\.next"
    } | Sort-Object Length -Descending | Select-Object -First 5
    
    if ($largeFiles) {
        Write-Host "Large files found (>1MB):" -ForegroundColor Red
        $largeFiles | ForEach-Object {
            $sizeMB = [math]::Round($_.Length / 1MB, 2)
            Write-Host "  $($_.Name): $sizeMB MB" -ForegroundColor Red
        }
    } else {
        Write-Host "No large files found" -ForegroundColor Green
    }
}

function Clean-Repository {
    Write-Host "`nCleaning repository..." -ForegroundColor Yellow
    
    # Garbage collection
    Write-Host "Running garbage collection..."
    git gc --auto
    
    # Clean reflog
    Write-Host "Cleaning reflog..."
    git reflog expire --expire=30.days --all
    
    Write-Host "Repository cleaned" -ForegroundColor Green
}

function Show-CommitAdvice {
    Write-Host "`nCommit Optimization:" -ForegroundColor Yellow
    
    $stagedFiles = @(git diff --cached --name-only 2>$null)
    $fileCount = $stagedFiles.Count
    
    if ($fileCount -eq 0) {
        Write-Host "No files staged for commit"
        return
    }
    
    Write-Host "Files staged: $fileCount"
    
    if ($fileCount -gt 20) {
        Write-Host "Consider splitting into smaller commits (max 20 files)" -ForegroundColor Yellow
    } else {
        Write-Host "File count is optimal for commit" -ForegroundColor Green
    }
}

# Main execution
if ($Analysis) {
    Show-GitStatus
    Check-LargeFiles
    Show-CommitAdvice
}
elseif ($Quick) {
    Optimize-GitConfig
    Write-Host "`nQuick optimization completed!" -ForegroundColor Green
}
elseif ($Full) {
    Show-GitStatus
    Optimize-GitConfig
    Clean-Repository
    Check-LargeFiles
    Show-CommitAdvice
    Write-Host "`nFull optimization completed!" -ForegroundColor Green
}
else {
    Write-Host "Usage:"
    Write-Host "  .\git-optimize.ps1 -Analysis   # Analyze repository"
    Write-Host "  .\git-optimize.ps1 -Quick      # Quick optimization"
    Write-Host "  .\git-optimize.ps1 -Full       # Full optimization"
}

Write-Host "`nOptimization complete!" -ForegroundColor Green
