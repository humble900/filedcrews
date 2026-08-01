Add-Type -AssemblyName System.Drawing

function Compress-Jpeg {
    param (
        [string]$Path,
        [int]$Quality = 80,
        [int]$MaxWidth = 1200
    )
    $fullPath = Resolve-Path $Path -ErrorAction SilentlyContinue
    if (-not $fullPath) { return }
    $imgPath = $fullPath.Path
    
    $img = [System.Drawing.Image]::FromFile($imgPath)
    $w = $img.Width
    $h = $img.Height
    
    if ($w -gt $MaxWidth) {
        $h = [int]($h * ($MaxWidth / $w))
        $w = $MaxWidth
    }
    
    $bmp = new-object System.Drawing.Bitmap $w, $h
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($img, 0, 0, $w, $h)
    $img.Dispose()
    
    $encoder = [System.Drawing.Imaging.Encoder]::Quality
    $encoderParams = new-object System.Drawing.Imaging.EncoderParameters(1)
    $encoderParams.Param[0] = new-object System.Drawing.Imaging.EncoderParameter($encoder, [long]$Quality)
    
    $codecs = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders()
    $jpegCodec = $codecs | Where-Object { $_.MimeType -eq "image/jpeg" }
    
    $tempPath = $imgPath + ".tmp"
    $bmp.Save($tempPath, $jpegCodec, $encoderParams)
    $g.Dispose()
    $bmp.Dispose()
    
    $origSize = (Get-Item $imgPath).Length
    $newSize = (Get-Item $tempPath).Length
    Move-Item -Path $tempPath -Destination $imgPath -Force
    Write-Host "Compressed $Path : $origSize bytes -> $newSize bytes ($w x $h)"
}

Compress-Jpeg -Path "public/field_team_sidebar.jpg" -Quality 75 -MaxWidth 800
Compress-Jpeg -Path "public/ai-agent-logo.jpg" -Quality 75 -MaxWidth 600
Compress-Jpeg -Path "public/og-image.png" -Quality 75 -MaxWidth 1200
