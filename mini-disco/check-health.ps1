try {
    $r = Invoke-WebRequest -Uri 'http://127.0.0.1:5177/api/health' -UseBasicParsing
    Write-Host "Health OK: $($r.Content)"
} catch {
    Write-Host "Health Error:"
    Write-Host "  Status: $($_.Exception.Response.StatusCode.value__)"
    if ($_.Exception.Response.Content) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.Content.GetResponseStream())
        $reader.BaseStream.Position = 0
        Write-Host "  Body: $($reader.ReadToEnd())"
    } else {
        Write-Host "  No body available"
    }
}
