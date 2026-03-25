# G open 智能创作助手 - Windows GUI 安装程序
# PowerShell GUI 版本

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# 应用信息
$AppName = "G open 智能创作助手"
$Version = "1.0.1"
$Publisher = "G Open Team"

# 创建主窗口
$form = New-Object System.Windows.Forms.Form
$form.Text = "$AppName v$Version 安装程序"
$form.Size = New-Object System.Drawing.Size(600, 500)
$form.StartPosition = "CenterScreen"
$form.FormBorderStyle = "FixedDialog"
$form.MaximizeBox = $false
$form.MinimizeBox = $false
$form.BackColor = [System.Drawing.Color]::FromArgb(240, 240, 243)

# 标题
$titleLabel = New-Object System.Windows.Forms.Label
$titleLabel.Text = $AppName
$titleLabel.Font = New-Object System.Drawing.Font("Microsoft YaHei", 20, [System.Drawing.FontStyle]::Bold)
$titleLabel.ForeColor = [System.Drawing.Color]::FromArgb(79, 70, 229)
$titleLabel.AutoSize = $true
$titleLabel.Location = New-Object System.Drawing.Point(150, 30)
$form.Controls.Add($titleLabel)

# 版本标签
$versionLabel = New-Object System.Windows.Forms.Label
$versionLabel.Text = "v$Version"
$versionLabel.Font = New-Object System.Drawing.Font("Microsoft YaHei", 10)
$versionLabel.ForeColor = [System.Drawing.Color]::Gray
$versionLabel.AutoSize = $true
$versionLabel.Location = New-Object System.Drawing.Point(250, 70)
$form.Controls.Add($versionLabel)

# 分隔线
$separator = New-Object System.Windows.Forms.Label
$separator.Text = ""
$separator.BorderStyle = "Fixed3D"
$separator.Size = New-Object System.Drawing.Size(550, 2)
$separator.Location = New-Object System.Drawing.Point(25, 100)
$form.Controls.Add($separator)

# 安装路径标签
$pathLabel = New-Object System.Windows.Forms.Label
$pathLabel.Text = "安装目录:"
$pathLabel.Font = New-Object System.Drawing.Font("Microsoft YaHei", 10)
$pathLabel.Location = New-Object System.Drawing.Point(30, 130)
$pathLabel.Size = New-Object System.Drawing.Size(80, 25)
$form.Controls.Add($pathLabel)

# 安装路径文本框
$installPathTextBox = New-Object System.Windows.Forms.TextBox
$installPathTextBox.Text = "$env:LOCALAPPDATA\GOpen"
$installPathTextBox.Font = New-Object System.Drawing.Font("Microsoft YaHei", 10)
$installPathTextBox.Location = New-Object System.Drawing.Point(120, 130)
$installPathTextBox.Size = New-Object System.Drawing.Size(350, 25)
$form.Controls.Add($installPathTextBox)

# 浏览按钮
$browseButton = New-Object System.Windows.Forms.Button
$browseButton.Text = "浏览..."
$browseButton.Font = New-Object System.Drawing.Font("Microsoft YaHei", 9)
$browseButton.Location = New-Object System.Drawing.Point(480, 128)
$browseButton.Size = New-Object System.Drawing.Size(80, 28)
$browseButton.FlatStyle = "Flat"
$browseButton.BackColor = [System.Drawing.Color]::White
$browseButton.Add_Click({
    $folderBrowser = New-Object System.Windows.Forms.FolderBrowserDialog
    $folderBrowser.Description = "选择安装目录"
    $folderBrowser.SelectedPath = $installPathTextBox.Text
    if ($folderBrowser.ShowDialog() -eq "OK") {
        $installPathTextBox.Text = $folderBrowser.SelectedPath
    }
})
$form.Controls.Add($browseButton)

# 选项组框
$optionsGroup = New-Object System.Windows.Forms.GroupBox
$optionsGroup.Text = "安装选项"
$optionsGroup.Font = New-Object System.Drawing.Font("Microsoft YaHei", 10)
$optionsGroup.Location = New-Object System.Drawing.Point(30, 180)
$optionsGroup.Size = New-Object System.Drawing.Size(530, 100)
$form.Controls.Add($optionsGroup)

# 桌面快捷方式复选框
$desktopShortcutCheckbox = New-Object System.Windows.Forms.CheckBox
$desktopShortcutCheckbox.Text = "创建桌面快捷方式"
$desktopShortcutCheckbox.Font = New-Object System.Drawing.Font("Microsoft YaHei", 10)
$desktopShortcutCheckbox.Location = New-Object System.Drawing.Point(20, 25)
$desktopShortcutCheckbox.Size = New-Object System.Drawing.Size(200, 25)
$desktopShortcutCheckbox.Checked = $true
$optionsGroup.Controls.Add($desktopShortcutCheckbox)

# 开始菜单复选框
$startMenuCheckbox = New-Object System.Windows.Forms.CheckBox
$startMenuCheckbox.Text = "创建开始菜单快捷方式"
$startMenuCheckbox.Font = New-Object System.Drawing.Font("Microsoft YaHei", 10)
$startMenuCheckbox.Location = New-Object System.Drawing.Point(20, 55)
$startMenuCheckbox.Size = New-Object System.Drawing.Size(200, 25)
$startMenuCheckbox.Checked = $true
$optionsGroup.Controls.Add($startMenuCheckbox)

# 自动安装依赖复选框
$installDepsCheckbox = New-Object System.Windows.Forms.CheckBox
$installDepsCheckbox.Text = "自动安装依赖 (需要 Node.js)"
$installDepsCheckbox.Font = New-Object System.Drawing.Font("Microsoft YaHei", 10)
$installDepsCheckbox.Location = New-Object System.Drawing.Point(250, 25)
$installDepsCheckbox.Size = New-Object System.Drawing.Size(250, 25)
$installDepsCheckbox.Checked = $true
$optionsGroup.Controls.Add($installDepsCheckbox)

# 启动应用复选框
$launchCheckbox = New-Object System.Windows.Forms.CheckBox
$launchCheckbox.Text = "安装完成后启动应用"
$launchCheckbox.Font = New-Object System.Drawing.Font("Microsoft YaHei", 10)
$launchCheckbox.Location = New-Object System.Drawing.Point(250, 55)
$launchCheckbox.Size = New-Object System.Drawing.Size(200, 25)
$launchCheckbox.Checked = $true
$optionsGroup.Controls.Add($launchCheckbox)

# 进度条
$progressBar = New-Object System.Windows.Forms.ProgressBar
$progressBar.Location = New-Object System.Drawing.Point(30, 300)
$progressBar.Size = New-Object System.Drawing.Size(530, 25)
$progressBar.Style = "Continuous"
$form.Controls.Add($progressBar)

# 状态标签
$statusLabel = New-Object System.Windows.Forms.Label
$statusLabel.Text = "准备安装..."
$statusLabel.Font = New-Object System.Drawing.Font("Microsoft YaHei", 10)
$statusLabel.Location = New-Object System.Drawing.Point(30, 335)
$statusLabel.Size = New-Object System.Drawing.Size(530, 25)
$form.Controls.Add($statusLabel)

# 安装按钮
$installButton = New-Object System.Windows.Forms.Button
$installButton.Text = "开始安装"
$installButton.Font = New-Object System.Drawing.Font("Microsoft YaHei", 12, [System.Drawing.FontStyle]::Bold)
$installButton.ForeColor = [System.Drawing.Color]::White
$installButton.BackColor = [System.Drawing.Color]::FromArgb(79, 70, 229)
$installButton.FlatStyle = "Flat"
$installButton.Location = New-Object System.Drawing.Point(150, 380)
$installButton.Size = New-Object System.Drawing.Size(140, 45)
$installButton.Cursor = "Hand"
$installButton.Add_Click({
    # 检查 Node.js
    $statusLabel.Text = "检查环境..."
    try {
        $nodeVersion = node --version 2>$null
        if (-not $nodeVersion) {
            [System.Windows.Forms.MessageBox]::Show(
                "未检测到 Node.js，请先安装 Node.js 20.x`n`n下载地址: https://nodejs.org/",
                "环境检查失败",
                "OK",
                "Error"
            )
            return
        }
    } catch {
        [System.Windows.Forms.MessageBox]::Show(
            "未检测到 Node.js，请先安装 Node.js 20.x`n`n下载地址: https://nodejs.org/",
            "环境检查失败",
            "OK",
            "Error"
        )
        return
    }

    $installPath = $installPathTextBox.Text
    $scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Definition
    
    # 禁用按钮
    $installButton.Enabled = $false
    $cancelButton.Enabled = $false
    $form.Cursor = "WaitCursor"
    
    try {
        # 创建安装目录
        $statusLabel.Text = "创建安装目录..."
        $progressBar.Value = 5
        if (-not (Test-Path $installPath)) {
            New-Item -ItemType Directory -Path $installPath -Force | Out-Null
        }
        
        # 复制文件
        $statusLabel.Text = "复制前端代码..."
        $progressBar.Value = 15
        if (Test-Path "$scriptPath\client") {
            Copy-Item -Path "$scriptPath\client" -Destination "$installPath\client" -Recurse -Force
        }
        
        $statusLabel.Text = "复制后端代码..."
        $progressBar.Value = 30
        if (Test-Path "$scriptPath\server") {
            Copy-Item -Path "$scriptPath\server" -Destination "$installPath\server" -Recurse -Force
        }
        
        $statusLabel.Text = "复制静态资源..."
        $progressBar.Value = 40
        if (Test-Path "$scriptPath\assets") {
            Copy-Item -Path "$scriptPath\assets" -Destination "$installPath\assets" -Recurse -Force
        }
        
        $statusLabel.Text = "复制配置文件..."
        $progressBar.Value = 50
        Copy-Item -Path "$scriptPath\package.json" -Destination "$installPath\" -Force -ErrorAction SilentlyContinue
        Copy-Item -Path "$scriptPath\pnpm-workspace.yaml" -Destination "$installPath\" -Force -ErrorAction SilentlyContinue
        Copy-Item -Path "$scriptPath\.gitignore" -Destination "$installPath\" -Force -ErrorAction SilentlyContinue
        
        # 创建启动脚本
        $statusLabel.Text = "创建启动脚本..."
        $progressBar.Value = 55
        $startScript = @"
@echo off
chcp 65001 >nul
title G open 智能创作助手
cd /d "$installPath"
echo 正在启动 G open 智能创作助手...
start "G open 服务端" cmd /c "cd server && pnpm run dev"
timeout /t 3 /nobreak >nul
start "G open 客户端" cmd /c "cd client && pnpm run start"
timeout /t 5 /nobreak >nul
start http://localhost:5000
echo.
echo 服务已启动！
echo 前端地址: http://localhost:5000
echo 后端地址: http://localhost:9091
pause
"@
        Set-Content -Path "$installPath\启动服务.bat" -Value $startScript -Encoding UTF8
        
        # 创建停止脚本
        $stopScript = @"
@echo off
chcp 65001 >nul
echo 正在停止 G open 服务...
taskkill /f /im node.exe 2>nul
echo 服务已停止
pause
"@
        Set-Content -Path "$installPath\停止服务.bat" -Value $stopScript -Encoding UTF8
        
        # 创建卸载脚本
        $uninstallScript = @"
@echo off
chcp 65001 >nul
title 卸载 G open 智能创作助手
echo 正在卸载 G open 智能创作助手...
taskkill /f /im node.exe 2>nul
rmdir /s /q "$installPath" 2>nul
del "%USERPROFILE%\Desktop\G open 智能创作助手.lnk" 2>nul
rmdir /s /q "%APPDATA%\Microsoft\Windows\Start Menu\Programs\G open" 2>nul
reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\GOpen" /f >nul 2>&1
echo 卸载完成！
pause
"@
        Set-Content -Path "$installPath\卸载.bat" -Value $uninstallScript -Encoding UTF8
        
        # 创建快捷方式
        if ($desktopShortcutCheckbox.Checked) {
            $statusLabel.Text = "创建桌面快捷方式..."
            $progressBar.Value = 60
            $WshShell = New-Object -ComObject WScript.Shell
            $Shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\$AppName.lnk")
            $Shortcut.TargetPath = "$installPath\启动服务.bat"
            $Shortcut.WorkingDirectory = $installPath
            $Shortcut.Description = $AppName
            $Shortcut.Save()
        }
        
        if ($startMenuCheckbox.Checked) {
            $statusLabel.Text = "创建开始菜单快捷方式..."
            $progressBar.Value = 65
            $startMenuPath = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\$AppName"
            New-Item -ItemType Directory -Path $startMenuPath -Force | Out-Null
            
            $WshShell = New-Object -ComObject WScript.Shell
            $Shortcut = $WshShell.CreateShortcut("$startMenuPath\启动 $AppName.lnk")
            $Shortcut.TargetPath = "$installPath\启动服务.bat"
            $Shortcut.Save()
            
            $Shortcut = $WshShell.CreateShortcut("$startMenuPath\停止服务.lnk")
            $Shortcut.TargetPath = "$installPath\停止服务.bat"
            $Shortcut.Save()
            
            $Shortcut = $WshShell.CreateShortcut("$startMenuPath\卸载.lnk")
            $Shortcut.TargetPath = "$installPath\卸载.bat"
            $Shortcut.Save()
        }
        
        # 注册到控制面板
        $statusLabel.Text = "注册应用程序..."
        $progressBar.Value = 70
        Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\GOpen" -Name "DisplayName" -Value $AppName -Force -ErrorAction SilentlyContinue
        Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\GOpen" -Name "DisplayVersion" -Value $Version -Force -ErrorAction SilentlyContinue
        Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\GOpen" -Name "Publisher" -Value $Publisher -Force -ErrorAction SilentlyContinue
        Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\GOpen" -Name "UninstallString" -Value "$installPath\卸载.bat" -Force -ErrorAction SilentlyContinue
        
        # 安装依赖
        if ($installDepsCheckbox.Checked) {
            $statusLabel.Text = "安装 pnpm..."
            $progressBar.Value = 75
            $pnpmVersion = pnpm --version 2>$null
            if (-not $pnpmVersion) {
                npm install -g pnpm 2>$null
            }
            
            $statusLabel.Text = "安装根目录依赖..."
            $progressBar.Value = 80
            Push-Location $installPath
            pnpm install 2>$null
            Pop-Location
            
            $statusLabel.Text = "安装前端依赖..."
            $progressBar.Value = 88
            Push-Location "$installPath\client"
            pnpm install 2>$null
            Pop-Location
            
            $statusLabel.Text = "安装后端依赖..."
            $progressBar.Value = 95
            Push-Location "$installPath\server"
            pnpm install 2>$null
            Pop-Location
        }
        
        $progressBar.Value = 100
        $statusLabel.Text = "安装完成！"
        
        # 显示完成对话框
        $result = [System.Windows.Forms.MessageBox]::Show(
            "安装完成！`n`n安装目录: $installPath`n`n是否立即启动应用？",
            "安装完成",
            "YesNo",
            "Information"
        )
        
        if ($result -eq "Yes" -or $launchCheckbox.Checked) {
            Start-Process "$installPath\启动服务.bat"
        }
        
        $form.Close()
        
    } catch {
        [System.Windows.Forms.MessageBox]::Show(
            "安装过程中发生错误: $_",
            "安装错误",
            "OK",
            "Error"
        )
    } finally {
        $installButton.Enabled = $true
        $cancelButton.Enabled = $true
        $form.Cursor = "Default"
    }
})
$form.Controls.Add($installButton)

# 取消按钮
$cancelButton = New-Object System.Windows.Forms.Button
$cancelButton.Text = "取消"
$cancelButton.Font = New-Object System.Drawing.Font("Microsoft YaHei", 12)
$cancelButton.BackColor = [System.Drawing.Color]::White
$cancelButton.FlatStyle = "Flat"
$cancelButton.Location = New-Object System.Drawing.Point(310, 380)
$cancelButton.Size = New-Object System.Drawing.Size(140, 45)
$cancelButton.Cursor = "Hand"
$cancelButton.Add_Click({ $form.Close() })
$form.Controls.Add($cancelButton)

# 版权信息
$copyrightLabel = New-Object System.Windows.Forms.Label
$copyrightLabel.Text = "© 2024 $Publisher. All rights reserved."
$copyrightLabel.Font = New-Object System.Drawing.Font("Microsoft YaHei", 8)
$copyrightLabel.ForeColor = [System.Drawing.Color]::Gray
$copyrightLabel.AutoSize = $true
$copyrightLabel.Location = New-Object System.Drawing.Point(200, 440)
$form.Controls.Add($copyrightLabel)

# 显示窗口
$form.ShowDialog()
