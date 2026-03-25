; ============================================================
; G open 智能创作助手 - Windows 安装脚本 (简化版)
; ============================================================

!include "MUI2.nsh"
!include "FileFunc.nsh"

; ==================== 应用信息 ====================

!define APP_NAME "G open"
!define APP_NAME_FULL "G open 智能创作助手"
!define APP_VERSION "1.0.5"
!define APP_PUBLISHER "G open Team"
!define APP_URL "https://woshiguotao.cn"

; ==================== 安装配置 ====================

Name "${APP_NAME_FULL}"
OutFile "..\..\release\windows\gopen-${APP_VERSION}-setup.exe"

RequestExecutionLevel admin
InstallDir "$PROGRAMFILES64\${APP_NAME}"
InstallDirRegKey HKLM "Software\${APP_NAME}" "Install_Dir"

; ==================== 界面设置 ====================

!define MUI_ICON "..\..\client\assets\images\icon.png"
!define MUI_UNICON "..\..\client\assets\images\icon.png"

; 页面配置
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "..\assets\license.txt"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

; 卸载页面
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

; 语言
!insertmacro MUI_LANGUAGE "SimpChinese"
!insertmacro MUI_LANGUAGE "English"

; ==================== 版本信息 ====================

VIProductVersion "${APP_VERSION}.0"
VIAddVersionKey "ProductName" "${APP_NAME_FULL}"
VIAddVersionKey "ProductVersion" "${APP_VERSION}"
VIAddVersionKey "CompanyName" "${APP_PUBLISHER}"
VIAddVersionKey "FileDescription" "${APP_NAME_FULL} 安装程序"
VIAddVersionKey "FileVersion" "${APP_VERSION}"

; ==================== 安装段 ====================

Section "!${APP_NAME} 主程序" SecMain
    SectionIn RO
    
    SetOutPath "$INSTDIR"
    
    ; 添加 Web 文件
    File /r "..\..\dist\web\*.*"
    
    ; 创建启动 HTML
    FileOpen $0 "$INSTDIR\启动 G open.bat" w
    FileWrite $0 "@echo off$\r$\n"
    FileWrite $0 "echo 正在启动 ${APP_NAME_FULL}...$\r$\n"
    FileWrite $0 "start "" "$\"%ProgramFiles%\Internet Explorer\iexplore.exe$\" "$\"$INSTDIR\index.html$\"$\r$\n"
    FileWrite $0 "exit$\r$\n"
    FileClose $0
    
    ; 创建 README
    FileOpen $0 "$INSTDIR\README.txt" w
    FileWrite $0 "${APP_NAME_FULL} v${APP_VERSION}$\r$\n$\r$\n"
    FileWrite $0 "安装目录: $INSTDIR$\r$\n$\r$\n"
    FileWrite $0 "启动方式:$\r$\n"
    FileWrite $0 "1. 双击 '启动 G open.bat'$\r$\n"
    FileWrite $0 "2. 或打开 index.html$\r$\n$\r$\n"
    FileWrite $0 "官方网站: ${APP_URL}$\r$\n"
    FileClose $0
    
    ; 创建启动菜单快捷方式
    CreateDirectory "$SMPROGRAMS\${APP_NAME}"
    CreateShortCut "$SMPROGRAMS\${APP_NAME}\${APP_NAME}.lnk" "$INSTDIR\启动 G open.bat" "" "$INSTDIR\启动 G open.bat" 0
    CreateShortCut "$SMPROGRAMS\${APP_NAME}\卸载 ${APP_NAME}.lnk" "$INSTDIR\uninstall.exe" "" "$INSTDIR\uninstall.exe" 0
    
    ; 创建桌面快捷方式
    CreateShortCut "$DESKTOP\${APP_NAME}.lnk" "$INSTDIR\启动 G open.bat" "" "$INSTDIR\启动 G open.bat" 0
    
    ; 写入注册表
    WriteRegStr HKLM "Software\${APP_NAME}" "Install_Dir" "$INSTDIR"
    WriteRegStr HKLM "Software\${APP_NAME}" "Version" "${APP_VERSION}"
    
    ; 写入卸载信息
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "DisplayName" "${APP_NAME_FULL}"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "DisplayVersion" "${APP_VERSION}"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "Publisher" "${APP_PUBLISHER}"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "UninstallString" "$\"$INSTDIR\uninstall.exe$\""
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "DisplayIcon" "$INSTDIR\favicon.ico"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "URLInfoAbout" "${APP_URL}"
    WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "NoModify" 1
    WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "NoRepair" 1
    
    ; 创建卸载程序
    WriteUninstaller "$INSTDIR\uninstall.exe"
    
    ; 计算安装大小
    ${GetSize} "$INSTDIR" "/S=0K" $0
    IntFmt $0 "0x%08X" $0
    WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "EstimatedSize" "$0"
SectionEnd

; ==================== 卸载段 ====================

Section "Uninstall"
    ; 删除文件
    RMDir /r "$INSTDIR"
    
    ; 删除快捷方式
    Delete "$SMPROGRAMS\${APP_NAME}\*.lnk"
    RMDir "$SMPROGRAMS\${APP_NAME}"
    Delete "$DESKTOP\${APP_NAME}.lnk"
    
    ; 删除注册表
    DeleteRegKey HKLM "Software\${APP_NAME}"
    DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}"
SectionEnd
