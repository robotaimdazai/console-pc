# PC Console - Setup Script
# Run this as Administrator for best results

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PC Console - Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# --- 1. Create Startup Shortcut ---
Write-Host "[1/2] Creating startup shortcut..." -ForegroundColor Yellow

$startupFolder = [System.IO.Path]::Combine(
    [System.Environment]::GetFolderPath('Startup'),
    ''
)
$shortcutPath = Join-Path $startupFolder "PC Console.lnk"
$targetPath = Join-Path $PSScriptRoot "node_modules\electron\dist\electron.exe"
$arguments = "."
$workingDir = $PSScriptRoot

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $targetPath
$shortcut.Arguments = $arguments
$shortcut.WorkingDirectory = $workingDir
$shortcut.Description = "PC Console Gaming Launcher"
$shortcut.Save()

Write-Host "  Startup shortcut created at:" -ForegroundColor Green
Write-Host "  $shortcutPath" -ForegroundColor White
Write-Host ""

# --- 2. JoyXoff Configuration Guide ---
Write-Host "[2/2] JoyXoff Configuration Guide" -ForegroundColor Yellow
Write-Host ""
Write-Host "  SIGN-IN SCREEN (login with controller):" -ForegroundColor Cyan
Write-Host "  1. Open JoyXoff" -ForegroundColor White
Write-Host "  2. Go to Settings > Initial Setup" -ForegroundColor White
Write-Host "  3. Enable 'Run on UAC prompts and sign-in screen'" -ForegroundColor White
Write-Host "  4. At sign-in, press Y to open virtual keyboard" -ForegroundColor White
Write-Host "  5. Type your password and press Enter" -ForegroundColor White
Write-Host ""
Write-Host "  XBOX BUTTON -> SHOW PC CONSOLE (Ctrl+Alt+G hotkey):" -ForegroundColor Cyan
Write-Host "  1. Open JoyXoff" -ForegroundColor White
Write-Host "  2. Go to Settings > Profiles > Edit bindings" -ForegroundColor White
Write-Host "  3. Right-click the Xbox/Guide button" -ForegroundColor White
Write-Host "  4. Bind it to keyboard shortcut: Ctrl+Alt+G" -ForegroundColor White
Write-Host "     (This hotkey brings PC Console to the front)" -ForegroundColor White
Write-Host "" 
Write-Host "  ALTERNATIVE: Bind Xbox button to 'Open shortcut':" -ForegroundColor Cyan
Write-Host "  - Point it to: $shortcutPath" -ForegroundColor White
Write-Host "    (This works too via single-instance detection)" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup complete! Restart your PC to test." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
