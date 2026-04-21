$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add('http://127.0.0.1:5500/')
$listener.Start()

function Get-ContentType($path) {
    switch ([System.IO.Path]::GetExtension($path).ToLowerInvariant()) {
        '.html' { 'text/html; charset=utf-8' }
        '.css' { 'text/css; charset=utf-8' }
        '.js' { 'application/javascript; charset=utf-8' }
        '.json' { 'application/json; charset=utf-8' }
        '.png' { 'image/png' }
        '.jpg' { 'image/jpeg' }
        '.jpeg' { 'image/jpeg' }
        '.webp' { 'image/webp' }
        '.svg' { 'image/svg+xml' }
        '.gif' { 'image/gif' }
        '.ico' { 'image/x-icon' }
        '.pdf' { 'application/pdf' }
        '.xml' { 'application/xml; charset=utf-8' }
        '.txt' { 'text/plain; charset=utf-8' }
        default { 'application/octet-stream' }
    }
}

while ($listener.IsListening) {
    $context = $listener.GetContext()
    try {
        $requestPath = [System.Uri]::UnescapeDataString($context.Request.Url.AbsolutePath.TrimStart('/'))
        if ([string]::IsNullOrWhiteSpace($requestPath)) {
            $requestPath = 'index.html'
        }

        $localPath = Join-Path $root $requestPath
        $resolvedRoot = [System.IO.Path]::GetFullPath($root)
        $resolvedPath = [System.IO.Path]::GetFullPath($localPath)

        if (-not $resolvedPath.StartsWith($resolvedRoot, [System.StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path -LiteralPath $resolvedPath -PathType Leaf)) {
            $context.Response.StatusCode = 404
            $bytes = [System.Text.Encoding]::UTF8.GetBytes('404 Not Found')
            $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
            $context.Response.Close()
            continue
        }

        $bytes = [System.IO.File]::ReadAllBytes($resolvedPath)
        $context.Response.StatusCode = 200
        $context.Response.ContentType = Get-ContentType $resolvedPath
        $context.Response.ContentLength64 = $bytes.Length
        $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
        $context.Response.Close()
    } catch {
        $context.Response.StatusCode = 500
        $bytes = [System.Text.Encoding]::UTF8.GetBytes('500 Server Error')
        $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
        $context.Response.Close()
    }
}
