# G Open AI助手 - Windows 安装程序构建脚本
# PowerShell 5.1+ 兼容

param(
    [switch]$SkipDeps,      # 跳过依赖安装
    [switch]$PortableOnly,  # 仅构建便携版
    [switch]$NSISOnly,      # 仅构建安装版
    [switch]$Help           # 显示帮助
)

$ErrorActionPreference = "Stop"
$Host.UI.RawUI.WindowTitle = "G Open AI助手 - 构建工具"

# 颜色输出函数
function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Write-Step {
    param([string]$Step, [string]$Message)
    Write-ColorOutput "[$Step] $Message" "Cyan"
}

function Write-Success {
    param([string]$Message)
    Write-ColorOutput "✓ $Message" "Green"
}

function Write-Error {
    param([string]$Message)
    Write-ColorOutput "✗ $Message" "Red"
}

# 显示帮助
if ($Help) {
    Write-Host @"

G Open AI助手 - Windows 安装程序构建工具
==========================================

用法: .\build-installer.ps1 [选项]

选项:
    -SkipDeps      跳过依赖安装
    -PortableOnly  仅构建便携版 (无需安装)
    -NSISOnly      仅构建安装版 (Setup.exe)
    -Help          显示此帮助信息

示例:
    .\build-installer.ps1              # 构建所有版本
    .\build-installer.ps1 -PortableOnly # 仅构建便携版

"@
    exit 0
}

# 显示标题
Write-Host @"
╔════════════════════════════════════════════════════════════╗
║     G Open AI助手 - Windows 安装程序构建工具              ║
╠════════════════════════════════════════════════════════════╣
║  一键生成 Windows 安装程序                                 ║
╚════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

# 1. 检查 Node.js
Write-Step "1/4" "检查 Node.js 环境..."
try {
    $nodeVersion = node -v
    Write-Success "Node.js 版本: $nodeVersion"
} catch {
    Write-Error "未安装 Node.js！"
    Write-Host "`n请先安装 Node.js: " -NoNewline
    Write-Host "https://nodejs.org/" -ForegroundColor Blue -Underline
    Write-Host "建议安装 LTS 版本 (18.x 或更高)`n"
    Read-Host "按回车键退出"
    exit 1
}

# 2. 检查/安装 pnpm
Write-Step "2/4" "检查 pnpm..."
try {
    $pnpmVersion = pnpm -v
    Write-Success "pnpm 版本: $pnpmVersion"
} catch {
    Write-Host "正在安装 pnpm..." -ForegroundColor Yellow
    npm install -g pnpm
    Write-Success "pnpm 安装完成"
}

# 3. 安装依赖
if (-not $SkipDeps) {
    Write-Step "3/4" "安装项目依赖..."
    if (Test-Path "node_modules") {
        Write-Host "依赖已存在，跳过安装" -ForegroundColor DarkGray
    } else {
        pnpm install
        Write-Success "依赖安装完成"
    }
} else {
    Write-Step "3/4" "跳过依赖安装"
}

# 4. 构建安装程序
Write-Step "4/4" "构建 Windows 安装程序..."
Write-Host ""

if ($PortableOnly) {
    Write-Host "构建便携版..." -ForegroundColor Yellow
    pnpm run build:portable
} elseif ($NSISOnly) {
    Write-Host "构建安装版..." -ForegroundColor Yellow
    pnpm run build:nsis
} else {
    Write-Host "构建所有版本..." -ForegroundColor Yellow
    pnpm run build:all
}

if ($LASTEXITCODE -ne 0) {
    Write-Error "构建失败！"
    Read-Host "`n按回车键退出"
    exit 1
}

# 显示结果
Write-Host "`n════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "`n构建完成！输出文件:`n" -ForegroundColor Green

$releaseDir = "release"
if (Test-Path $releaseDir) {
    Get-ChildItem $releaseDir -Filter "*.exe" | ForEach-Object {
        $sizeMB = [math]::Round($_.Length / 1MB, 2)
        if ($_.Name -like "*Setup*") {
            Write-Host "  📦 安装程序: " -NoNewline
            Write-Host "$($_.Name)" -ForegroundColor Green
            Write-Host "     大小: $sizeMB MB`n"
        } elseif ($_.Name -like "*Portable*") {
            Write-Host "  📦 便携版: " -NoNewline
            Write-Host "$($_.Name)" -ForegroundColor Cyan
            Write-Host "     大小: $sizeMB MB`n"
        } else {
            Write-Host "  📦 $($_.Name) ($sizeMB MB)`n"
        }
    }
}

Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "`n使用说明:" -ForegroundColor Yellow
Write-Host "  • 安装程序: 双击 Setup.exe 即可一键安装"
Write-Host "  • 便携版: 双击 Portable.exe 无需安装直接运行`n"

# 打开输出目录
Start-Process "explorer" -ArgumentList $releaseDir

Read-Host "按回车键退出"
