# Quick icon generator for Chrome extension
# Creates simple placeholder icons

Add-Type -AssemblyName System.Drawing

$iconColor = [System.Drawing.Color]::FromArgb(37, 99, 235)  # #2563eb blue
$textColor = [System.Drawing.Color]::White

function Create-Icon {
    param(
        [int]$size,
        [string]$outputPath
    )
    
    $bitmap = New-Object System.Drawing.Bitmap($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    
    # Enable high quality rendering
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias
    
    # Fill background
    $brush = New-Object System.Drawing.SolidBrush($iconColor)
    $graphics.FillRectangle($brush, 0, 0, $size, $size)
    
    # Draw shopping cart emoji/text
    if ($size -ge 32) {
        $fontSize = [math]::Floor($size * 0.6)
        $font = New-Object System.Drawing.Font("Segoe UI Emoji", $fontSize, [System.Drawing.FontStyle]::Regular)
        $textBrush = New-Object System.Drawing.SolidBrush($textColor)
        
        $text = [char]0x1F6D2  # Shopping cart emoji
        $textSize = $graphics.MeasureString($text, $font)
        $x = ($size - $textSize.Width) / 2
        $y = ($size - $textSize.Height) / 2
        
        $graphics.DrawString($text, $font, $textBrush, $x, $y)
    }
    
    # Save
    $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    # Cleanup
    $graphics.Dispose()
    $bitmap.Dispose()
    $brush.Dispose()
    
    Write-Host "Created: $outputPath" -ForegroundColor Green
}

# Create icons directory if it doesn't exist
$iconsDir = Join-Path $PSScriptRoot "icons"
if (-not (Test-Path $iconsDir)) {
    New-Item -ItemType Directory -Path $iconsDir | Out-Null
}

# Generate all three sizes
Create-Icon -size 16 -outputPath (Join-Path $iconsDir "icon16.png")
Create-Icon -size 48 -outputPath (Join-Path $iconsDir "icon48.png")
Create-Icon -size 128 -outputPath (Join-Path $iconsDir "icon128.png")

Write-Host "`nAll icons created successfully!" -ForegroundColor Cyan
Write-Host "You can now load the extension in Chrome." -ForegroundColor Cyan
