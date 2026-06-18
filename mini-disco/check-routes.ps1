$routes = @('', '/auth', '/report', '/portfolio', '/dashboard', '/appeal', '/category', '/market', '/settings')
foreach ($route in $routes) {
    try {
        $uri = "http://127.0.0.1:5176$route"
        $r = Invoke-WebRequest -Uri $uri -UseBasicParsing -ErrorAction Stop
        Write-Host "$route -> $($r.StatusCode) ($(($r.Content.Length) / 1024).ToString('F1')KB)"
    } catch {
        Write-Host "$route -> ERROR: $_"
    }
}
