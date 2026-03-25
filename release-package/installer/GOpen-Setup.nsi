; G open 智能创作助手 - Windows 安装程序
; 使用 NSIS (Nullsoft Scriptable Install System) 编译
; 下载 NSIS: https://nsis.sourceforge.io/

!include "MUI2.nsh"
!include "FileFunc.nsh"
!include "LogicLib.nsh"

; 应用信息
Name "G open 智能创作助手"
OutFile "GOpen-Setup-v1.0.1.exe"
InstallDir "$LOCALAPPDATA\GOpen"
InstallDirRegKey HKCU "Software\GOpen" "Install_Dir"
RequestExecutionLevel admin

; 界面设置
!define MUI_ICON "assets\icon.ico"
!define MUI_UNICON "assets\icon.ico"
!define MUI_WELCOMEFINISHPAGE_BITMAP "assets\welcome.bmp"
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_BITMAP "assets\header.bmp"
!define MUI_ABORTWARNING

; 版本信息
VIProductVersion "1.0.1.0"
VIAddVersionKey /LANG=2052 "ProductName" "G open 智能创作助手"
VIAddVersionKey /LANG=2052 "CompanyName" "G Open Team"
VIAddVersionKey /LANG=2052 "LegalCopyright" "Copyright (c) 2024"
VIAddVersionKey /LANG=2052 "FileDescription" "G open 智能创作助手安装程序"
VIAddVersionKey /LANG=2052 "FileVersion" "1.0.1.0"
VIAddVersionKey /LANG=2052 "ProductVersion" "1.0.1.0"

; 页面
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "LICENSE.txt"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

; 语言
!insertmacro MUI_LANGUAGE "SimpChinese"
!insertmacro MUI_LANGUAGE "English"

; 安装部分
Section "主程序" SecMain
  SectionIn RO
  
  ; 设置输出路径
  SetOutPath $INSTDIR
  
  ; 复制文件
  File /r "client\*.*"
  File /r "server\*.*"
  File /r "assets\*.*"
  File /r ".cozeproj\*.*"
  File "package.json"
  File "pnpm-workspace.yaml"
  File "README.md"
  File "BUILD_WINDOWS.md"
  
  ; 创建启动脚本
  FileOpen $0 "$INSTDIR\启动服务.bat" w
  FileWrite $0 "@echo off$\r$\n"
  FileWrite $0 "chcp 65001 >nul$\r$\n"
  FileWrite $0 "cd /d `$INSTDIR`$\r$\n"
  FileWrite $0 "start `G open 服务端` cmd /c `cd server && pnpm run dev`$\r$\n"
  FileWrite $0 "timeout /t 3 /nobreak >nul$\r$\n"
  FileWrite $0 "start `G open 客户端` cmd /c `cd client && pnpm run start`$\r$\n"
  FileWrite $0 "timeout /t 5 /nobreak >nul$\r$\n"
  FileWrite $0 "start http://localhost:5000$\r$\n"
  FileClose $0
  
  ; 创建停止脚本
  FileOpen $0 "$INSTDIR\停止服务.bat" w
  FileWrite $0 "@echo off$\r$\n"
  FileWrite $0 "taskkill /f /im node.exe 2>nul$\r$\n"
  FileWrite $0 "echo 服务已停止$\r$\n"
  FileWrite $0 "pause$\r$\n"
  FileClose $0
  
  ; 创建卸载程序
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  
  ; 写入注册表
  WriteRegStr HKCU "Software\GOpen" "Install_Dir" $INSTDIR
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\GOpen" "DisplayName" "G open 智能创作助手"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\GOpen" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\GOpen" "DisplayVersion" "1.0.1"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\GOpen" "Publisher" "G Open Team"
  
  ; 计算安装大小
  ${GetSize} "$INSTDIR" "/S=0K" $0
  IntFmt $0 "0x%08X" $0
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\GOpen" "EstimatedSize" "$0"
  
SectionEnd

Section "桌面快捷方式" SecDesktop
  CreateShortCut "$DESKTOP\G open 智能创作助手.lnk" "$INSTDIR\启动服务.bat" "" "$INSTDIR\assets\icon.ico"
SectionEnd

Section "开始菜单快捷方式" SecStartMenu
  CreateDirectory "$SMPROGRAMS\G open"
  CreateShortCut "$SMPROGRAMS\G open\启动 G open.lnk" "$INSTDIR\启动服务.bat" "" "$INSTDIR\assets\icon.ico"
  CreateShortCut "$SMPROGRAMS\G open\停止服务.lnk" "$INSTDIR\停止服务.bat"
  CreateShortCut "$SMPROGRAMS\G open\卸载.lnk" "$INSTDIR\Uninstall.exe"
SectionEnd

Section "依赖安装脚本" SecDeps
  ; 创建依赖安装脚本
  FileOpen $0 "$INSTDIR\安装依赖.bat" w
  FileWrite $0 "@echo off$\r$\n"
  FileWrite $0 "chcp 65001 >nul$\r$\n"
  FileWrite $0 "echo ==========================================$\r$\n"
  FileWrite $0 "echo   G open 智能创作助手 - 依赖安装$\r$\n"
  FileWrite $0 "echo ==========================================%\r$\n"
  FileWrite $0 "echo.$\r$\n"
  FileWrite $0 "cd /d `$INSTDIR`$\r$\n"
  FileWrite $0 "echo [1/4] 检查 Node.js...$\r$\n"
  FileWrite $0 "node --version >nul 2>&1$\r$\n"
  FileWrite $0 "if errorlevel 1 ($\r$\n"
  FileWrite $0 "  echo [错误] 请先安装 Node.js 20.x$\r$\n"
  FileWrite $0 "  echo 下载地址: https://nodejs.org/$\r$\n"
  FileWrite $0 "  pause$\r$\n"
  FileWrite $0 "  exit /b 1$\r$\n"
  FileWrite $0 ")$\r$\n"
  FileWrite $0 "echo Node.js 已安装$\r$\n"
  FileWrite $0 "echo.$\r$\n"
  FileWrite $0 "echo [2/4] 安装 pnpm...$\r$\n"
  FileWrite $0 "pnpm --version >nul 2>&1 || npm install -g pnpm$\r$\n"
  FileWrite $0 "echo.$\r$\n"
  FileWrite $0 "echo [3/4] 安装根目录依赖...$\r$\n"
  FileWrite $0 "call pnpm install$\r$\n"
  FileWrite $0 "echo.$\r$\n"
  FileWrite $0 "echo [4/4] 安装客户端依赖...$\r$\n"
  FileWrite $0 "cd client && call pnpm install && cd ..$\r$\n"
  FileWrite $0 "echo.$\r$\n"
  FileWrite $0 "echo [5/4] 安装服务端依赖...$\r$\n"
  FileWrite $0 "cd server && call pnpm install && cd ..$\r$\n"
  FileWrite $0 "echo.$\r$\n"
  FileWrite $0 "echo ==========================================%\r$\n"
  FileWrite $0 "echo   依赖安装完成！$\r$\n"
  FileWrite $0 "echo ==========================================%\r$\n"
  FileWrite $0 "pause$\r$\n"
  FileClose $0
SectionEnd

; 卸载部分
Section "Uninstall"
  ; 删除文件
  RMDir /r "$INSTDIR\client"
  RMDir /r "$INSTDIR\server"
  RMDir /r "$INSTDIR\assets"
  RMDir /r "$INSTDIR\.cozeproj"
  Delete "$INSTDIR\*.*"
  
  ; 删除快捷方式
  Delete "$DESKTOP\G open 智能创作助手.lnk"
  RMDir /r "$SMPROGRAMS\G open"
  
  ; 删除注册表
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\GOpen"
  DeleteRegKey HKCU "Software\GOpen"
  
  ; 删除安装目录
  RMDir "$INSTDIR"
SectionEnd

; 安装完成后检查依赖
Function .onInstSuccess
  MessageBox MB_YESNO "安装完成！是否立即安装依赖？$\n$\n注意：需要先安装 Node.js 20.x" IDYES InstallDeps
  Goto End
  
  InstallDeps:
    ExecWait '"$INSTDIR\安装依赖.bat"'
  
  End:
FunctionEnd
