# AI Email Assistant - Git Performance Optimization Script
# PowerShell script for optimizing Git repository performance

param(
    [switch]$Full,
    [switch]$Quick,
    [switch]$Analysis
)

Write-Host "Git Performance Optimization Tool" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

function Show-GitStatus {
    Write-Host "`nGit Repository Status Analysis:" -ForegroundColor Yellow

    # Check repository size
    $gitSize = (Get-ChildItem .git -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host "Git repository size: $([math]::Round($gitSize, 2)) MB"

    # Check object count
    $objectInfo = git count-objects -v
    Write-Host "Git object information:"
    $objectInfo | ForEach-Object { Write-Host "  $_" }

    # Check pending files
    $stagedFiles = git diff --cached --name-only
    $modifiedFiles = git diff --name-only
    $untrackedFiles = git ls-files --others --exclude-standard

    Write-Host "`nFile Status:"
    Write-Host "  Staged: $($stagedFiles.Count) files"
    Write-Host "  Modified: $($modifiedFiles.Count) files"
    Write-Host "  Untracked: $($untrackedFiles.Count) files"
}

function Optimize-GitConfig {
    Write-Host "`n⚙️ 优化Git配置..." -ForegroundColor Yellow
    
    # 性能配置
    git config core.compression 6
    git config core.packedgitlimit 1g
    git config core.packedgitwindowsize 1g
    git config pack.deltacachesize 2g
    git config pack.threads 0
    
    # 垃圾回收配置
    git config gc.auto 6700
    git config gc.autopacklimit 50
    git config gc.reflogexpire "90 days"
    git config gc.reflogexpireunreachable "30 days"
    
    # 网络优化
    git config http.postbuffer 524288000
    git config http.lowspeedlimit 1000
    git config http.lowspeedtime 300
    
    # 文件系统监控
    git config core.fsmonitor true
    git config core.preloadindex true
    
    Write-Host "✅ Git配置优化完成"
}

function Clean-Repository {
    Write-Host "`n🧹 清理Git仓库..." -ForegroundColor Yellow
    
    # 运行垃圾回收
    Write-Host "运行垃圾回收..."
    git gc --aggressive --prune=now
    
    # 清理引用日志
    Write-Host "清理引用日志..."
    git reflog expire --expire=30.days --all
    
    # 重新打包对象
    Write-Host "重新打包对象..."
    git repack -ad
    
    Write-Host "✅ 仓库清理完成"
}

function Check-LargeFiles {
    Write-Host "`n📏 检查大文件..." -ForegroundColor Yellow
    
    # 检查工作目录中的大文件
    $largeFiles = Get-ChildItem -Recurse | Where-Object {
        $_.Length -gt 1MB -and 
        $_.FullName -notmatch "node_modules" -and 
        $_.FullName -notmatch "\.git" -and
        $_.FullName -notmatch "\.next"
    } | Sort-Object Length -Descending | Select-Object -First 10
    
    if ($largeFiles) {
        Write-Host "发现大文件 (>1MB):" -ForegroundColor Red
        $largeFiles | ForEach-Object {
            $sizeMB = [math]::Round($_.Length / 1MB, 2)
            Write-Host "  $($_.Name): $sizeMB MB" -ForegroundColor Red
        }
        Write-Host "建议将这些文件添加到.gitignore或使用Git LFS"
    } else {
        Write-Host "✅ 未发现大文件"
    }
}

function Optimize-Commits {
    Write-Host "`n📝 提交优化建议:" -ForegroundColor Yellow
    
    $stagedFiles = git diff --cached --name-only
    $fileCount = $stagedFiles.Count
    
    if ($fileCount -eq 0) {
        Write-Host "没有待提交的文件"
        return
    }
    
    Write-Host "当前待提交文件数: $fileCount"
    
    if ($fileCount -gt 20) {
        Write-Host "⚠️  建议分批提交，每次不超过20个文件" -ForegroundColor Yellow
        
        # 按文件类型分组建议
        $groups = @{
            "配置文件" = $stagedFiles | Where-Object { $_ -match "\.(json|js|ts|yml|yaml|config)$" }
            "组件文件" = $stagedFiles | Where-Object { $_ -match "\.(tsx|jsx)$" }
            "样式文件" = $stagedFiles | Where-Object { $_ -match "\.(css|scss|sass)$" }
            "文档文件" = $stagedFiles | Where-Object { $_ -match "\.(md|txt|doc)$" }
            "其他文件" = $stagedFiles | Where-Object { $_ -notmatch "\.(json|js|ts|yml|yaml|config|tsx|jsx|css|scss|sass|md|txt|doc)$" }
        }
        
        Write-Host "`n建议的提交分组:"
        foreach ($group in $groups.GetEnumerator()) {
            if ($group.Value.Count -gt 0) {
                Write-Host "  $($group.Key): $($group.Value.Count) 个文件"
            }
        }
    } else {
        Write-Host "✅ 文件数量合适，可以一次性提交"
    }
}

function Show-PerformanceTips {
    Write-Host "`n💡 性能优化建议:" -ForegroundColor Cyan
    Write-Host "1. 定期运行 'git gc' 清理仓库"
    Write-Host "2. 避免提交大文件，使用Git LFS"
    Write-Host "3. 保持.gitignore文件更新"
    Write-Host "4. 分批提交，避免一次性提交过多文件"
    Write-Host "5. 使用有意义的提交消息"
    Write-Host "6. 定期清理不需要的分支"
}

# 主执行逻辑
if ($Analysis) {
    Show-GitStatus
    Check-LargeFiles
    Optimize-Commits
    Show-PerformanceTips
}
elseif ($Quick) {
    Optimize-GitConfig
    Write-Host "✅ 快速优化完成"
}
elseif ($Full) {
    Show-GitStatus
    Optimize-GitConfig
    Clean-Repository
    Check-LargeFiles
    Optimize-Commits
    Show-PerformanceTips
    Write-Host "`n🎉 完整优化完成！"
}
else {
    Write-Host "使用方法:"
    Write-Host "  .\optimize-git.ps1 -Analysis   # 分析仓库状态"
    Write-Host "  .\optimize-git.ps1 -Quick      # 快速优化配置"
    Write-Host "  .\optimize-git.ps1 -Full       # 完整优化"
}

Write-Host "`n🚀 Git性能优化完成！" -ForegroundColor Green
