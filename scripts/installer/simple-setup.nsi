; G open Windows Installer - Simple Version

Name "G open"
OutFile "..\..\release\windows\gopen-1.0.5-setup.exe"
InstallDir "$PROGRAMFILES64\G open"
RequestExecutionLevel admin

Page directory
Page instfiles
UninstPage uninstConfirm
UninstPage instfiles

Section ""
    SetOutPath "$INSTDIR"
    File /r "..\..\dist\web\*.*"
    
    ; Create uninstaller
    WriteUninstaller "$INSTDIR\uninstall.exe"
    
    ; Create shortcuts
    CreateDirectory "$SMPROGRAMS\G open"
    CreateShortCut "$SMPROGRAMS\G open\Uninstall.lnk" "$INSTDIR\uninstall.exe"
    CreateShortCut "$DESKTOP\G open.lnk" "$INSTDIR\index.html"
    
    ; Registry
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\G open" "DisplayName" "G open"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\G open" "UninstallString" "$INSTDIR\uninstall.exe"
SectionEnd

Section "Uninstall"
    RMDir /r "$INSTDIR"
    Delete "$SMPROGRAMS\G open\*.lnk"
    RMDir "$SMPROGRAMS\G open"
    Delete "$DESKTOP\G open.lnk"
    DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\G open"
SectionEnd
