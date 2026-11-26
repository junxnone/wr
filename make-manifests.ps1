# 按 books.json 为每本书生成专属 manifest（manifests/<id>.webmanifest）。增删书之后运行一次：
#   powershell -ExecutionPolicy Bypass -File make-manifests.ps1
# 每个 manifest 的 start_url 指向 reader.html?id=<id>，所以在读这本书时点"安装"，装好的应用默认就打开这本书；
# id 各不相同，浏览器会把它们当作彼此独立的应用。
$root = $PSScriptRoot
$books = Get-Content (Join-Path $root 'books.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$dir = Join-Path $root 'manifests'
New-Item -ItemType Directory -Force -Path $dir | Out-Null
# 清掉已不在书单里的旧 manifest（只处理本目录里的 .webmanifest）
$ids = $books | ForEach-Object { $_.id }
Get-ChildItem $dir -Filter *.webmanifest | Where-Object { $ids -notcontains $_.BaseName } | Remove-Item
foreach ($b in $books) {
  if ($b.id -notmatch '^[\w-]+$') { Write-Warning "跳过非法 id: $($b.id)"; continue }
  # 优先用这本书自己的图标（make-icons.ps1 生成），没有就用通用图标
  $prefix = if (Test-Path (Join-Path $root "icons/$($b.id)-192.png")) { $b.id } else { 'icon' }
  $m = [ordered]@{
    name = $b.title
    short_name = $b.title
    description = $b.desc
    start_url = "../reader.html?id=$($b.id)"
    scope = '../'
    id = "../reader.html?id=$($b.id)"
    display = 'standalone'
    display_override = @('fullscreen', 'standalone')   # 支持的浏览器用全屏（隐藏状态栏），否则退回独立窗口
    orientation = 'any'
    background_color = '#ffffff'
    theme_color = '#2563eb'
    lang = 'zh-CN'
    icons = @(
      [ordered]@{ src = "../icons/$prefix-192.png"; sizes = '192x192'; type = 'image/png'; purpose = 'any' },
      [ordered]@{ src = "../icons/$prefix-512.png"; sizes = '512x512'; type = 'image/png'; purpose = 'any' },
      [ordered]@{ src = "../icons/$prefix-192.png"; sizes = '192x192'; type = 'image/png'; purpose = 'maskable' },
      [ordered]@{ src = "../icons/$prefix-512.png"; sizes = '512x512'; type = 'image/png'; purpose = 'maskable' }
    )
  }
  $json = $m | ConvertTo-Json -Depth 5
  [IO.File]::WriteAllText((Join-Path $dir "$($b.id).webmanifest"), $json, (New-Object System.Text.UTF8Encoding $false))
}
Write-Host "manifests written to $dir"
