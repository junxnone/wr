# 本地静态服务器（无需 Node / Python）。用法：powershell -File serve.ps1 [端口]
# localhost 属于"安全上下文"，Service Worker 和"安装应用"可以直接测试。
param([int]$Port = 8080)
$root = [IO.Path]::GetFullPath($PSScriptRoot).TrimEnd('\') + '\'   # 带分隔符，避免 ...\wr-other 这样同前缀的目录通过检查
$types = @{ '.html' = 'text/html; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'; '.webmanifest' = 'application/manifest+json'; '.png' = 'image/png'; '.json' = 'application/json'; '.css' = 'text/css' }
$l = New-Object System.Net.HttpListener
$l.Prefixes.Add("http://localhost:$Port/")
$l.Start()
Write-Host "serving $root at http://localhost:$Port/  (Ctrl+C 停止)"
try {
  while ($l.IsListening) {
    $c = $l.GetContext()
    # 单个请求出错（比如浏览器中途取消）不能让整个服务器退出
    try {
      $p = [Uri]::UnescapeDataString($c.Request.Url.AbsolutePath).TrimStart('/')
      if ($p -eq '') { $p = 'index.html' }
      $f = [IO.Path]::GetFullPath((Join-Path $root $p))
      if ($f.StartsWith($root) -and (Test-Path $f -PathType Leaf)) {
        $b = [IO.File]::ReadAllBytes($f)
        $c.Response.ContentType = $types[[IO.Path]::GetExtension($f)]
        $c.Response.Headers.Add('Cache-Control', 'no-cache')
        $c.Response.OutputStream.Write($b, 0, $b.Length)
      } else { $c.Response.StatusCode = 404 }
    } catch { Write-Host "request failed: $($_.Exception.Message)" }
    finally { try { $c.Response.Close() } catch {} }
  }
} finally { $l.Stop() }
