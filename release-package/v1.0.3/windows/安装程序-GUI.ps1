#Requires -Version 5.1
# G open 智能创作助手 - Windows 图形界面安装程序
# 版本: v1.0.3

param(
    [string]$InstallPath = "",
    [switch]$Silent = $false
)

# ============================================================
# 配置
# ============================================================
$AppVersion = "1.0.3"
$AppName = "G open"
$Publisher = "G Open Team"
$GithubRepo = "https://github.com/a912454361/gopen"

# ============================================================
# 主程序
# ============================================================

# 加载必要的程序集
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# 检查管理员权限
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# 显示欢迎界面
function Show-WelcomeForm {
    $form = New-Object System.Windows.Forms.Form
    $form.Text = "$AppName v$AppVersion 安装向导"
    $form.Size = New-Object System.Drawing.Size(600, 450)
    $form.StartPosition = "CenterScreen"
    $form.FormBorderStyle = "FixedDialog"
    $form.MaximizeBox = $false
    $form.MinimizeBox = $false
    $form.BackColor = [System.Drawing.Color]::FromArgb(10, 10, 15)
    $form.ForeColor = [System.Drawing.Color]::White

    # Logo
    $logoLabel = New-Object System.Windows.Forms.Label
    $logoLabel.Text = "🚀"
    $logoLabel.Font = New-Object System.Drawing.Font("Segoe UI", 48)
    $logoLabel.Size = New-Object System.Drawing.Size(100, 80)
    $logoLabel.Location = New-Object System.Drawing.Point(250, 30)
    $logoLabel.TextAlign = "MiddleCenter"
    $form.Controls.Add($logoLabel)

    # 标题
    $titleLabel = New-Object System.Windows.Forms.Label
    $titleLabel.Text = "$AppName 智能创作助手"
    $titleLabel.Font = New-Object System.Drawing.Font("Segoe UI", 20, [System.Drawing.FontStyle]::Bold)
    $titleLabel.Size = New-Object System.Drawing.Size(500, 40)
    $titleLabel.Location = New-Object System.Drawing.Point(50, 110)
    $titleLabel.TextAlign = "MiddleCenter"
    $titleLabel.ForeColor = [System.Drawing.Color]::FromArgb(79, 70, 229)
    $form.Controls.Add($titleLabel)

    # 版本
    $versionLabel = New-Object System.Windows.Forms.Label
    $versionLabel.Text = "版本 $AppVersion"
    $versionLabel.Font = New-Object System.Drawing.Font("Segoe UI", 12)
    $versionLabel.Size = New-Object System.Drawing.Size(500, 30)
    $versionLabel.Location = New-Object System.Drawing.Point(50, 150)
    $versionLabel.TextAlign = "MiddleCenter"
    $versionLabel.ForeColor = [System.Drawing.Color]::FromArgb(161, 161, 170)
    $form.Controls.Add($versionLabel)

    # 功能列表
    $featuresLabel = New-Object System.Windows.Forms.Label
    $featuresLabel.Text = @"
✅ AI辅助创作 - 多模型支持
✅ 动漫极速制作 - 24小时出品
✅ 游戏开发支持 - UE5自动化
✅ 用户账号系统 - 多端同步
✅ 第三方登录 - 微信/GitHub等
"@
    $featuresLabel.Font = New-Object System.Drawing.Font("Segoe UI", 11)
    $featuresLabel.Size = New-Object System.Drawing.Size(400, 120)
    $featuresLabel.Location = New-Object System.Drawing.Point(100, 190)
    $featuresLabel.ForeColor = [System.Drawing.Color]::FromArgb(212, 212, 216)
    $form.Controls.Add($featuresLabel)

    # 安装路径
    $pathLabel = New-Object System.Windows.Forms.Label
    $pathLabel.Text = "安装路径:"
    $pathLabel.Font = New-Object System.Drawing.Font("Segoe UI", 10)
    $pathLabel.Size = New-Object System.Drawing.Size(80, 25)
    $pathLabel.Location = New-Object System.Drawing.Point(50, 320)
    $pathLabel.ForeColor = [System.Drawing.Color]::White
    $form.Controls.Add($pathLabel)

    $pathTextBox = New-Object System.Windows.Forms.TextBox
    $pathTextBox.Text = if ($InstallPath) { $InstallPath } else { "$env:LOCALAPPDATA\$AppName" }
    $pathTextBox.Size = New-Object System.Drawing.Size(350, 25)
    $pathTextBox.Location = New-Object System.Drawing.Point(130, 320)
    $pathTextBox.BackColor = [System.Drawing.Color]::FromArgb(30, 30, 40)
    $pathTextBox.ForeColor = [System.Drawing.Color]::White
    $pathTextBox.BorderStyle = "FixedSingle"
    $form.Controls.Add($pathTextBox)

    $browseButton = New-Object System.Windows.Forms.Button
    $browseButton.Text = "浏览..."
    $browseButton.Size = New-Object System.Drawing.Size(80, 25)
    $browseButton.Location = New-Object System.Drawing.Point(490, 320)
    $browseButton.BackColor = [System.Drawing.Color]::FromArgb(50, 50, 60)
    $browseButton.ForeColor = [System.Drawing.Color]::White
    $browseButton.FlatStyle = "Flat"
    $browseButton.Add_Click({
        $folderDialog = New-Object System.Windows.Forms.FolderBrowserDialog
        $folderDialog.Description = "选择安装路径"
        if ($folderDialog.ShowDialog() -eq "OK") {
            $pathTextBox.Text = $folderDialog.SelectedPath
        }
    })
    $form.Controls.Add($browseButton)

    # 按钮
    $installButton = New-Object System.Windows.Forms.Button
    $installButton.Text = "立即安装"
    $installButton.Size = New-Object System.Drawing.Size(150, 40)
    $installButton.Location = New-Object System.Drawing.Point(220, 370)
    $installButton.BackColor = [System.Drawing.Color]::FromArgb(79, 70, 229)
    $installButton.ForeColor = [System.Drawing.Color]::White
    $installButton.FlatStyle = "Flat"
    $installButton.Font = New-Object System.Drawing.Font("Segoe UI", 12, [System.Drawing.FontStyle]::Bold)
    $installButton.Add_Click({
        $form.Tag = $pathTextBox.Text
        $form.Close()
    })
    $form.Controls.Add($installButton)

    $cancelButton = New-Object System.Windows.Forms.Button
    $cancelButton.Text = "取消"
    $cancelButton.Size = New-Object System.Drawing.Size(100, 40)
    $cancelButton.Location = New-Object System.Drawing.Point(400, 370)
    $cancelButton.BackColor = [System.Drawing.Color]::FromArgb(50, 50, 60)
    $cancelButton.ForeColor = [System.Drawing.Color]::White
    $cancelButton.FlatStyle = "Flat"
    $cancelButton.Add_Click({
        $form.Tag = $null
        $form.Close()
    })
    $form.Controls.Add($cancelButton)

    $form.ShowDialog() | Out-Null
    return $form.Tag
}

# 显示进度界面
function Show-ProgressForm {
    param([string]$Status)

    $form = New-Object System.Windows.Forms.Form
    $form.Text = "正在安装..."
    $form.Size = New-Object System.Drawing.Size(500, 200)
    $form.StartPosition = "CenterScreen"
    $form.FormBorderStyle = "FixedDialog"
    $form.MaximizeBox = $false
    $form.MinimizeBox = $false
    $form.ControlBox = $false
    $form.BackColor = [System.Drawing.Color]::FromArgb(10, 10, 15)

    $statusLabel = New-Object System.Windows.Forms.Label
    $statusLabel.Text = $Status
    $statusLabel.Font = New-Object System.Drawing.Font("Segoe UI", 12)
    $statusLabel.Size = New-Object System.Drawing.Size(450, 30)
    $statusLabel.Location = New-Object System.Drawing.Point(25, 50)
    $statusLabel.TextAlign = "MiddleCenter"
    $statusLabel.ForeColor = [System.Drawing.Color]::White
    $form.Controls.Add($statusLabel)

    $progressBar = New-Object System.Windows.Forms.ProgressBar
    $progressBar.Style = "Marquee"
    $progressBar.Size = New-Object System.Drawing.Size(450, 30)
    $progressBar.Location = New-Object System.Drawing.Point(25, 100)
    $form.Controls.Add($progressBar)

    $form.Show() | Out-Null
    return $form
}

# 执行安装
function Install-GOpen {
    param([string]$TargetPath)

    $progressForm = Show-ProgressForm "正在安装 $AppName v$AppVersion..."

    try {
        # 创建安装目录
        if (-not (Test-Path $TargetPath)) {
            New-Item -ItemType Directory -Path $TargetPath -Force | Out-Null
        }

        # 复制应用文件
        Update-ProgressForm $progressForm "复制应用文件..."
        $sourcePath = $PSScriptRoot
        Copy-Item -Path "$sourcePath\*" -Destination $TargetPath -Recurse -Force -Exclude @("安装程序.ps1", "安装程序.bat")

        # 创建桌面快捷方式
        Update-ProgressForm $progressForm "创建快捷方式..."
        $WshShell = New-Object -ComObject WScript.Shell
        $Shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\$AppName.lnk")
        $Shortcut.TargetPath = "$TargetPath\启动服务.bat"
        $Shortcut.WorkingDirectory = $TargetPath
        $Shortcut.Description = "$AppName 智能创作助手"
        $Shortcut.Save()

        # 创建开始菜单快捷方式
        $startMenuPath = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs"
        if (-not (Test-Path $startMenuPath)) {
            New-Item -ItemType Directory -Path $startMenuPath -Force | Out-Null
        }
        $Shortcut = $WshShell.CreateShortcut("$startMenuPath\$AppName.lnk")
        $Shortcut.TargetPath = "$TargetPath\启动服务.bat"
        $Shortcut.WorkingDirectory = $TargetPath
        $Shortcut.Save()

        # 写入安装信息
        $installInfo = @{
            Version = $AppVersion
            InstallPath = $TargetPath
            InstallDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        }
        $installInfo | ConvertTo-Json | Out-File "$TargetPath\install-info.json" -Encoding UTF8

        # 安装完成
        $progressForm.Close()

        [System.Windows.Forms.MessageBox]::Show(
            "安装完成！`n`n安装路径: $TargetPath`n`n点击确定启动 $AppName",
            "安装成功",
            "OK",
            "Information"
        )

        # 启动应用
        Start-Process "$TargetPath\启动服务.bat"

        return $true
    }
    catch {
        $progressForm.Close()
        [System.Windows.Forms.MessageBox]::Show(
            "安装失败: $_",
            "错误",
            "OK",
            "Error"
        )
        return $false
    }
}

function Update-ProgressForm {
    param($Form, [string]$Status)
    foreach ($control in $Form.Controls) {
        if ($control -is [System.Windows.Forms.Label]) {
            $control.Text = $Status
        }
    }
    [System.Windows.Forms.Application]::DoEvents()
}

# ============================================================
# 入口
# ============================================================

if (-not $Silent) {
    $installPath = Show-WelcomeForm
    if ($installPath) {
        Install-GOpen -TargetPath $installPath
    }
} else {
    $targetPath = if ($InstallPath) { $InstallPath } else { "$env:LOCALAPPDATA\$AppName" }
    Install-GOpen -TargetPath $targetPath
}
