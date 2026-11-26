# 生成 PWA 图标（蓝底 + 白色翻开的书）。用法：powershell -File make-icons.ps1
Add-Type -AssemblyName System.Drawing
$dir = Join-Path $PSScriptRoot 'icons'
New-Item -ItemType Directory -Force -Path $dir | Out-Null
foreach ($s in 180, 192, 512) {
  $bmp = New-Object System.Drawing.Bitmap $s, $s
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'
  $g.Clear([System.Drawing.Color]::FromArgb(37, 99, 235))
  $white = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
  # 图形限制在中间 60%，可直接作为 maskable 图标
  $w = $s * 0.27; $h = $s * 0.36; $gap = $s * 0.02
  $y = ($s - $h) / 2
  $g.FillRectangle($white, ($s / 2 - $gap - $w), $y, $w, $h)
  $g.FillRectangle($white, ($s / 2 + $gap), $y, $w, $h)
  $bmp.Save((Join-Path $dir "icon-$s.png"), [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
}
Write-Host "icons written to $dir"
