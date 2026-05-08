# Create desktop shortcut
$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\多AI讨论.lnk")
$Shortcut.TargetPath = "%~dp0start.bat"
$Shortcut.WorkingDirectory = "%~dp0"
$Shortcut.IconLocation = "%SystemRoot%\System32\SHELL32.dll, 14"
$Shortcut.Description = "启动多AI讨论系统"
$Shortcut.Save()

Write-Host "桌面快捷方式已创建: 多AI讨论"
