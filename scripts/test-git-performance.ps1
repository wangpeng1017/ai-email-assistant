# Git Performance Testing Script
# Tests various Git operations to measure performance improvements

Write-Host "Git Performance Testing" -ForegroundColor Green
Write-Host "=======================" -ForegroundColor Green

function Measure-GitOperation {
    param(
        [string]$OperationName,
        [scriptblock]$Operation
    )
    
    Write-Host "`nTesting: $OperationName" -ForegroundColor Yellow
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    
    try {
        & $Operation
        $stopwatch.Stop()
        $elapsed = $stopwatch.Elapsed.TotalSeconds
        
        if ($elapsed -lt 5) {
            $color = "Green"
            $status = "EXCELLENT"
        } elseif ($elapsed -lt 15) {
            $color = "Yellow"
            $status = "GOOD"
        } else {
            $color = "Red"
            $status = "NEEDS IMPROVEMENT"
        }
        
        Write-Host "  Time: $([math]::Round($elapsed, 2)) seconds - $status" -ForegroundColor $color
        return $elapsed
    } catch {
        $stopwatch.Stop()
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        return -1
    }
}

function Test-GitStatus {
    git status --porcelain | Out-Null
}

function Test-GitAdd {
    # Create a test file
    "Test content $(Get-Date)" | Out-File -FilePath "test-performance.tmp"
    git add test-performance.tmp
    git reset HEAD test-performance.tmp | Out-Null
    Remove-Item "test-performance.tmp" -ErrorAction SilentlyContinue
}

function Test-GitLog {
    git log --oneline -10 | Out-Null
}

function Test-GitDiff {
    git diff HEAD~1 HEAD | Out-Null
}

function Test-GitBranch {
    git branch -a | Out-Null
}

# Run performance tests
Write-Host "`nRunning Git performance tests..." -ForegroundColor Cyan

$results = @{}
$results["Status Check"] = Measure-GitOperation "git status" { Test-GitStatus }
$results["Add Operation"] = Measure-GitOperation "git add" { Test-GitAdd }
$results["Log History"] = Measure-GitOperation "git log" { Test-GitLog }
$results["Diff Operation"] = Measure-GitOperation "git diff" { Test-GitDiff }
$results["Branch List"] = Measure-GitOperation "git branch" { Test-GitBranch }

# Calculate overall performance
$validResults = $results.Values | Where-Object { $_ -gt 0 }
$averageTime = ($validResults | Measure-Object -Average).Average
$totalTime = ($validResults | Measure-Object -Sum).Sum

Write-Host "`n" + "="*50 -ForegroundColor Green
Write-Host "PERFORMANCE SUMMARY" -ForegroundColor Green
Write-Host "="*50 -ForegroundColor Green

Write-Host "`nIndividual Operations:"
foreach ($result in $results.GetEnumerator()) {
    if ($result.Value -gt 0) {
        Write-Host "  $($result.Key): $([math]::Round($result.Value, 2))s"
    }
}

Write-Host "`nOverall Metrics:"
Write-Host "  Average operation time: $([math]::Round($averageTime, 2)) seconds"
Write-Host "  Total test time: $([math]::Round($totalTime, 2)) seconds"

# Performance rating
if ($averageTime -lt 2) {
    $rating = "EXCELLENT"
    $color = "Green"
    $message = "Git operations are highly optimized!"
} elseif ($averageTime -lt 5) {
    $rating = "GOOD"
    $color = "Yellow"
    $message = "Git performance is acceptable."
} else {
    $rating = "POOR"
    $color = "Red"
    $message = "Git performance needs improvement."
}

Write-Host "`nPerformance Rating: $rating" -ForegroundColor $color
Write-Host "$message" -ForegroundColor $color

# Repository health check
Write-Host "`n" + "="*50 -ForegroundColor Cyan
Write-Host "REPOSITORY HEALTH CHECK" -ForegroundColor Cyan
Write-Host "="*50 -ForegroundColor Cyan

# Check repository size
try {
    $repoSize = (Get-ChildItem .git -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host "Repository size: $([math]::Round($repoSize, 2)) MB"
    
    if ($repoSize -lt 10) {
        Write-Host "  Size status: OPTIMAL" -ForegroundColor Green
    } elseif ($repoSize -lt 50) {
        Write-Host "  Size status: ACCEPTABLE" -ForegroundColor Yellow
    } else {
        Write-Host "  Size status: LARGE - Consider cleanup" -ForegroundColor Red
    }
} catch {
    Write-Host "Could not calculate repository size"
}

# Check object count
$objectInfo = git count-objects -v 2>$null
if ($objectInfo) {
    $objectCount = ($objectInfo | Where-Object { $_ -match "^count " } | ForEach-Object { $_.Split(" ")[1] }) -as [int]
    Write-Host "Object count: $objectCount"
    
    if ($objectCount -lt 1000) {
        Write-Host "  Object status: OPTIMAL" -ForegroundColor Green
    } elseif ($objectCount -lt 5000) {
        Write-Host "  Object status: ACCEPTABLE" -ForegroundColor Yellow
    } else {
        Write-Host "  Object status: HIGH - Consider gc" -ForegroundColor Red
    }
}

# Recommendations
Write-Host "`n" + "="*50 -ForegroundColor Magenta
Write-Host "OPTIMIZATION RECOMMENDATIONS" -ForegroundColor Magenta
Write-Host "="*50 -ForegroundColor Magenta

if ($averageTime -gt 3) {
    Write-Host "- Run 'git gc' to clean up repository"
    Write-Host "- Check for large files in history"
    Write-Host "- Consider using Git LFS for large files"
}

if ($repoSize -gt 20) {
    Write-Host "- Repository is getting large, monitor growth"
    Write-Host "- Review .gitignore for unnecessary files"
}

Write-Host "- Regular maintenance: run git gc monthly"
Write-Host "- Keep commits small and focused"
Write-Host "- Use meaningful commit messages"

Write-Host "`nPerformance testing completed!" -ForegroundColor Green
