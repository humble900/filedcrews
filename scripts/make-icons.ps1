Add-Type -AssemblyName System.Drawing

$logoPath = 'C:\Users\USER\.gemini\antigravity-ide\brain\395c5158-7511-478c-998c-44fb412e2f30\ocrem_logo_icon_1781180399428.png'
$logo = [System.Drawing.Image]::FromFile($logoPath)

# ---- 1. favicon.ico (multi-size PNG-in-ICO) --------------------------------
function Make-IcoBytes([System.Drawing.Image]$src) {
  $sizes = @(16, 32, 48)
  $bitmaps = @()
  foreach ($sz in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap($sz, $sz, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g2 = [System.Drawing.Graphics]::FromImage($bmp)
    $g2.InterpolationMode = 'HighQualityBicubic'
    $g2.DrawImage($src, 0, 0, $sz, $sz)
    $g2.Dispose()
    $ms = New-Object System.IO.MemoryStream
    $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $bitmaps += @{ sz=$sz; data=$ms.ToArray() }
    $ms.Dispose()
    $bmp.Dispose()
  }
  $n = $bitmaps.Count
  $headerSz = 6 + $n * 16
  $offsets = @()
  $cur = $headerSz
  foreach ($b in $bitmaps) { $offsets += $cur; $cur += $b.data.Length }
  $ico = New-Object System.IO.MemoryStream
  $bw = New-Object System.IO.BinaryWriter($ico)
  $bw.Write([uint16]0)
  $bw.Write([uint16]1)
  $bw.Write([uint16]$n)
  for ($i = 0; $i -lt $n; $i++) {
    $sz = $bitmaps[$i].sz
    $bw.Write([byte]$sz)
    $bw.Write([byte]$sz)
    $bw.Write([byte]0)
    $bw.Write([byte]0)
    $bw.Write([uint16]1)
    $bw.Write([uint16]32)
    $bw.Write([uint32]$bitmaps[$i].data.Length)
    $bw.Write([uint32]$offsets[$i])
  }
  foreach ($b in $bitmaps) { $bw.Write($b.data) }
  $bw.Flush()
  return $ico.ToArray()
}

$icoBytes = Make-IcoBytes $logo
[System.IO.File]::WriteAllBytes('c:\Users\USER\staff-coordinator\public\favicon.ico', $icoBytes)
Write-Host 'favicon.ico written (16x16, 32x32, 48x48)'

# ---- 2. og-image.png (1200x630 branded card) -------------------------------
$W = 1200; $H = 630
$og = New-Object System.Drawing.Bitmap($W, $H)
$g  = [System.Drawing.Graphics]::FromImage($og)
$g.SmoothingMode = 'AntiAlias'
$g.InterpolationMode = 'HighQualityBicubic'
$g.TextRenderingHint = 'AntiAliasGridFit'

# Dark background gradient
$bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  (New-Object System.Drawing.Point(0, 0)),
  (New-Object System.Drawing.Point($W, $H)),
  [System.Drawing.ColorTranslator]::FromHtml('#0f172a'),
  [System.Drawing.ColorTranslator]::FromHtml('#1e293b')
)
$g.FillRectangle($bgBrush, 0, 0, $W, $H)
$bgBrush.Dispose()

# Blue glow
$glowPath = New-Object System.Drawing.Drawing2D.GraphicsPath
$glowPath.AddEllipse(0, ($H/2 - 280), 560, 560)
$glowBrush = New-Object System.Drawing.Drawing2D.PathGradientBrush($glowPath)
$glowBrush.CenterColor = [System.Drawing.Color]::FromArgb(60, 59, 130, 246)
$glowBrush.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 59, 130, 246))
$g.FillPath($glowBrush, $glowPath)
$glowBrush.Dispose()
$glowPath.Dispose()

# Logo (circle-clipped, 240x240)
$iconSz = 240; $iconX = 80; $iconY = [int](($H - $iconSz) / 2)
$clipPath = New-Object System.Drawing.Drawing2D.GraphicsPath
$clipPath.AddEllipse($iconX, $iconY, $iconSz, $iconSz)
$g.SetClip($clipPath)
$g.DrawImage($logo, $iconX, $iconY, $iconSz, $iconSz)
$g.ResetClip()
$clipPath.Dispose()

# Divider line
$divX = $iconX + $iconSz + 60
$divPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(80, 59, 130, 246), 1)
$g.DrawLine($divPen, $divX, 80, $divX, ($H - 80))
$divPen.Dispose()

# Text
$textX = $divX + 40
$white  = [System.Drawing.Brushes]::White
$muted  = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 148, 163, 184))
$accent = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 59, 130, 246))
$tagBg  = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(50, 59, 130, 246))

$titleFont    = New-Object System.Drawing.Font('Segoe UI', 58, [System.Drawing.FontStyle]::Bold)
$subtitleFont = New-Object System.Drawing.Font('Segoe UI', 24)
$tagFont      = New-Object System.Drawing.Font('Segoe UI', 20, [System.Drawing.FontStyle]::Bold)

$g.DrawString('OnSite Crew', $titleFont, $white, $textX, ([int]($H/2) - 115))
$g.DrawString('Manager', $titleFont, $white, $textX, ([int]($H/2) - 30))
$g.DrawString('Real-time GPS  ·  Geofencing  ·  Face Verification', $subtitleFont, $muted, $textX, ([int]($H/2) + 75))

$g.FillRectangle($tagBg, $textX, ([int]($H/2) + 130), 148, 38)
$g.DrawString('Ocrem', $tagFont, $accent, ($textX + 14), ([int]($H/2) + 138))

$g.Dispose(); $og.Save('c:\Users\USER\staff-coordinator\public\og-image.png', [System.Drawing.Imaging.ImageFormat]::Png)
$og.Dispose(); $logo.Dispose()
$muted.Dispose(); $accent.Dispose(); $tagBg.Dispose()
$titleFont.Dispose(); $subtitleFont.Dispose(); $tagFont.Dispose()

Write-Host 'og-image.png written (1200x630)'
