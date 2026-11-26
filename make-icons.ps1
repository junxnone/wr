# 生成 PWA 图标。用法：powershell -ExecutionPolicy Bypass -File make-icons.ps1
#  - icons/icon-<size>.png        通用图标（蓝底 + 白色翻开的书），书架应用用
#  - icons/<书id>-<size>.png      每本书一个：纯色底 + 白色文字（books.json 里的 icon / color 字段）
# 文字限制在中间约 58% 宽度内，可直接作为 maskable 图标。
Add-Type -AssemblyName System.Drawing
$root = $PSScriptRoot
$dir = Join-Path $root 'icons'
New-Item -ItemType Directory -Force -Path $dir | Out-Null
$sizes = 180, 192, 512

foreach ($s in $sizes) {
  $bmp = New-Object System.Drawing.Bitmap $s, $s
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'
  $g.Clear([System.Drawing.Color]::FromArgb(37, 99, 235))
  $white = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
  $w = $s * 0.27; $h = $s * 0.36; $gap = $s * 0.02
  $y = ($s - $h) / 2
  $g.FillRectangle($white, ($s / 2 - $gap - $w), $y, $w, $h)
  $g.FillRectangle($white, ($s / 2 + $gap), $y, $w, $h)
  $bmp.Save((Join-Path $dir "icon-$s.png"), [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
}

$books = Get-Content (Join-Path $root 'books.json') -Raw -Encoding UTF8 | ConvertFrom-Json
foreach ($b in $books) {
  if ($b.id -notmatch '^[\w-]+$') { Write-Warning "skip invalid id: $($b.id)"; continue }
  $text = if ($b.icon) { [string]$b.icon } else { $b.title.Substring(0, [Math]::Min(2, $b.title.Length)) }
  $color = if ($b.color) { [System.Drawing.ColorTranslator]::FromHtml($b.color) } else { [System.Drawing.Color]::FromArgb(37, 99, 235) }
  foreach ($s in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap $s, $s
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = 'AntiAlias'
    $g.TextRenderingHint = 'AntiAliasGridFit'
    $g.Clear($color)
    # 字号从大到小试，直到文字宽度不超过图标的 58%
    $px = $s * 0.42
    do {
      $font = New-Object System.Drawing.Font('Microsoft YaHei', $px, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
      $tw = $g.MeasureString($text, $font).Width
      if ($tw -le $s * 0.58) { break }
      $px = $px * 0.94
      $font.Dispose()
    } while ($px -gt 8)
    $fmt = New-Object System.Drawing.StringFormat
    $fmt.Alignment = 'Center'; $fmt.LineAlignment = 'Center'
    $g.DrawString($text, $font, [System.Drawing.Brushes]::White, (New-Object System.Drawing.RectangleF 0, 0, $s, $s), $fmt)
    $bmp.Save((Join-Path $dir "$($b.id)-$s.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $font.Dispose(); $g.Dispose(); $bmp.Dispose()
  }
}
Write-Host "icons written to $dir"
