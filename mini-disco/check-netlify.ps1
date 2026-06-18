$r = Invoke-WebRequest -Uri 'http://127.0.0.1:5176/' -UseBasicParsing
Write-Host "=== Checking for netlify references ==="
if ($r.Content -match 'netlify') {
    $matches = [regex]::Matches($r.Content, 'netlify', 'IgnoreCase')
    Write-Host "FOUND $($matches.Count) netlify reference(s):"
    foreach ($m in $matches) {
        $start = [Math]::Max(0, $m.Index - 50)
        $len = [Math]::Min(200, $r.Content.Length - $m.Index)
        Write-Host "  -> $($r.Content.Substring($start, $len))"
    }
} else {
    Write-Host "No netlify references found"
}
Write-Host ""
Write-Host "=== Checking for vercel.app references ==="
if ($r.Content -match 'mini-disco\.vercel\.app') {
    Write-Host "mini-disco.vercel.app found in main HTML"
} else {
    Write-Host "mini-disco.vercel.app NOT found in main HTML"
}
