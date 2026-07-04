; ============================================================
; G open 智能创作助手 - Windows 安装脚本 (NSIS)
; 高档安装界面设计
; ============================================================

!include "MUI2.nsh"
!include "FileFunc.nsh"
!include "WinMessages.nsh"

; ==================== 应用信息 ====================

!define APP_NAME "G open"
!define APP_NAME_FULL "G open 智能创作助手"
!define APP_VERSION "1.0.4"
!define APP_PUBLISHER "G open Team"
!define APP_URL "https://woshiguotao.cn"
!define APP_COPYRIGHT "© 2024 G open Team. All rights reserved."

; GUID (唯一标识符)
!define APP_GUID "{{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}"
!define UNINST_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}"

; ==================== 安装配置 ====================

Name "${APP_NAME_FULL}"
OutFile "..\..\release\windows\gopen-${APP_VERSION}-setup.exe"

; 请求管理员权限
RequestExecutionLevel admin

; 安装目录
InstallDir "$PROGRAMFILES64\${APP_NAME}"
InstallDirRegKey HKLM "Software\${APP_NAME}" "Install_Dir"

; 界面设置
!define MUI_ICON "..\..\client\assets\images\icon.ico"
!define MUI_UNICON "..\..\client\assets\images\icon.ico"
!define MUI_WELCOMEFINISHPAGE_BITMAP "..\assets\installer-welcome.bmp"
!define MUI_UNWELCOMEFINISHPAGE_BITMAP "..\assets\installer-welcome.bmp"
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_BITMAP "..\assets\installer-header.bmp"
!define MUI_HEADERIMAGE_UNBITMAP "..\assets\installer-header.bmp"

; 主题颜色 (深色科技风)
!define MUI_INSTFILESPAGE_COLORS "0A0A0F 00F0FF"
!define MUI_BGCOLOR "0A0A0F"
!define MUI_TEXTCOLOR "FFFFFF"
!define MUI_HEADER_TEXT_COLOR "00F0FF"

; 安装完成后的操作
!define MUI_FINISHPAGE_RUN "$INSTDIR\gopen.exe"
!define MUI_FINISHPAGE_RUN_TEXT "立即启动 ${APP_NAME}"
!define MUI_FINISHPAGE_SHOWREADME "$INSTDIR\README.md"
!define MUI_FINISHPAGE_SHOWREADME_TEXT "查看更新日志"
!define MUI_FINISHPAGE_LINK "访问官方网站: ${APP_URL}"
!define MUI_FINISHPAGE_LINK_LOCATION "${APP_URL}"

; 页面配置
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "..\assets\license.rtf"
!insertmacro MUI_PAGE_COMPONENTS
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

; 卸载页面
!insertmacro MUI_UNPAGE_WELCOME
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

; 语言
!insertmacro MUI_LANGUAGE "SimpChinese"
!insertmacro MUI_LANGUAGE "English"

; ==================== 版本信息 ====================

VIProductVersion "${APP_VERSION}.0"
VIAddVersionKey /LANG=${LANG_SIMPCHINESE} "ProductName" "${APP_NAME_FULL}"
VIAddVersionKey /LANG=${LANG_SIMPCHINESE} "ProductVersion" "${APP_VERSION}"
VIAddVersionKey /LANG=${LANG_SIMPCHINESE} "CompanyName" "${APP_PUBLISHER}"
VIAddVersionKey /LANG=${LANG_SIMPCHINESE} "LegalCopyright" "${APP_COPYRIGHT}"
VIAddVersionKey /LANG=${LANG_SIMPCHINESE} "FileDescription" "${APP_NAME_FULL} 安装程序"
VIAddVersionKey /LANG=${LANG_SIMPCHINESE} "FileVersion" "${APP_VERSION}"

; ==================== 安装段 ====================

Section "!${APP_NAME} 主程序" SecMain
    SectionIn RO
    
    SetOutPath "$INSTDIR"
    
    ; 添加文件
    File /r "..\..\dist\electron\*.*"
    
    ; 创建启动菜单快捷方式
    CreateDirectory "$SMPROGRAMS\${APP_NAME}"
    CreateShortCut "$SMPROGRAMS\${APP_NAME}\${APP_NAME}.lnk" "$INSTDIR\gopen.exe" "" "$INSTDIR\gopen.exe" 0
    CreateShortCut "$SMPROGRAMS\${APP_NAME}\卸载 ${APP_NAME}.lnk" "$INSTDIR\uninstall.exe" "" "$INSTDIR\uninstall.exe" 0
    
    ; 创建桌面快捷方式
    CreateShortCut "$DESKTOP\${APP_NAME}.lnk" "$INSTDIR\gopen.exe" "" "$INSTDIR\gopen.exe" 0
    
    ; 写入注册表
    WriteRegStr HKLM "Software\${APP_NAME}" "Install_Dir" "$INSTDIR"
    WriteRegStr HKLM "Software\${APP_NAME}" "Version" "${APP_VERSION}"
    
    ; 写入卸载信息
    WriteRegStr HKLM "${UNINST_KEY}" "DisplayName" "${APP_NAME_FULL}"
    WriteRegStr HKLM "${UNINST_KEY}" "DisplayVersion" "${APP_VERSION}"
    WriteRegStr HKLM "${UNINST_KEY}" "Publisher" "${APP_PUBLISHER}"
    WriteRegStr HKLM "${UNINST_KEY}" "UninstallString" "$\"$INSTDIR\uninstall.exe$\""
    WriteRegStr HKLM "${UNINST_KEY}" "DisplayIcon" "$INSTDIR\gopen.exe"
    WriteRegStr HKLM "${UNINST_KEY}" "HelpLink" "${APP_URL}"
    WriteRegStr HKLM "${UNINST_KEY}" "URLUpdateInfo" "${APP_URL}/updates"
    WriteRegStr HKLM "${UNINST_KEY}" "URLInfoAbout" "${APP_URL}"
    WriteRegDWORD HKLM "${UNINST_KEY}" "NoModify" 1
    WriteRegDWORD HKLM "${UNINST_KEY}" "NoRepair" 1
    
    ; 创建卸载程序
    WriteUninstaller "$INSTDIR\uninstall.exe"
    
    ; 计算安装大小
    ${GetSize} "$INSTDIR" "/S=0K" $0
    IntFmt $0 "0x%08X" $0
    WriteRegDWORD HKLM "${UNINST_KEY}" "EstimatedSize" "$0"
SectionEnd

Section "创建桌面快捷方式" SecDesktop
    CreateShortCut "$DESKTOP\${APP_NAME}.lnk" "$INSTDIR\gopen.exe" "" "$INSTDIR\gopen.exe" 0
SectionEnd

Section "创建快速启动快捷方式" SecQuickLaunch
    CreateShortCut "$QUICKLAUNCH\${APP_NAME}.lnk" "$INSTDIR\gopen.exe" "" "$INSTDIR\gopen.exe" 0
SectionEnd

Section "开机自动启动" SecAutoStart
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "${APP_NAME}" "$INSTDIR\gopen.exe"
SectionEnd

; ==================== 组件描述 ====================

LangString DESC_SecMain ${LANG_SIMPCHINESE} "安装 ${APP_NAME} 主程序（必需）"
LangString DESC_SecDesktop ${LANG_SIMPCHINESE} "在桌面创建快捷方式"
LangString DESC_SecQuickLaunch ${LANG_SIMPCHINESE} "在快速启动栏创建快捷方式"
LangString DESC_SecAutoStart ${LANG_SIMPCHINESE} "开机自动启动 ${APP_NAME}"

LangString DESC_SecMain ${LANG_ENGLISH} "Install ${APP_NAME} main program (Required)"
LangString DESC_SecDesktop ${LANG_ENGLISH} "Create desktop shortcut"
LangString DESC_SecQuickLaunch ${LANG_ENGLISH} "Create quick launch shortcut"
LangString DESC_SecAutoStart ${LANG_ENGLISH} "Launch ${APP_NAME} on startup"

!insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
    !insertmacro MUI_DESCRIPTION_TEXT ${SecMain} $(DESC_SecMain)
    !insertmacro MUI_DESCRIPTION_TEXT ${SecDesktop} $(DESC_SecDesktop)
    !insertmacro MUI_DESCRIPTION_TEXT ${SecQuickLaunch} $(DESC_SecQuickLaunch)
    !insertmacro MUI_DESCRIPTION_TEXT ${SecAutoStart} $(DESC_SecAutoStart)
!insertmacro MUI_FUNCTION_DESCRIPTION_END

; ==================== 卸载段 ====================

Section "Uninstall"
    ; 删除文件
    RMDir /r "$INSTDIR"
    
    ; 删除快捷方式
    Delete "$SMPROGRAMS\${APP_NAME}\*.lnk"
    RMDir "$SMPROGRAMS\${APP_NAME}"
    Delete "$DESKTOP\${APP_NAME}.lnk"
    Delete "$QUICKLAUNCH\${APP_NAME}.lnk"
    
    ; 删除注册表
    DeleteRegKey HKLM "Software\${APP_NAME}"
    DeleteRegKey HKLM "${UNINST_KEY}"
    DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "${APP_NAME}"
    
    ; 显示完成消息
    MessageBox MB_ICONINFORMATION|MB_OK "${APP_NAME} 已成功卸载"
SectionEnd

; ==================== 回调函数 ====================

Function .onInit
    ; 检查是否已安装
    ReadRegStr $0 HKLM "Software\${APP_NAME}" "Install_Dir"
    ${If} $0 != ""
        MessageBox MB_YESNO|MB_ICONQUESTION \
            "${APP_NAME} 已安装在 $0$\n$\n是否覆盖安装？" \
            /SD IDYES IDYES proceed
        Abort
    ${EndIf}
proceed:
    
    ; 初始化安装目录选择
    StrCpy $INSTDIR "$PROGRAMFILES64\${APP_NAME}"
FunctionEnd

Function un.onInit
    MessageBox MB_ICONQUESTION|MB_YESNO|MB_DEFBUTTON2 \
        "确定要卸载 ${APP_NAME} 吗？" \
        /SD IDYES IDYES proceed
    Abort
proceed:
FunctionEnd
