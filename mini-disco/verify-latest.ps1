# Get the latest deployment alias
$output = cmd /c "cd /d C:\Users\87931\.qclaw\workspace-ua58rsb93veqtxl7\mini-disco && npx vercel ls --json" 2>&1
$data = $output | ConvertFrom-Json
if ($data) {
    $latest = $data | Where-Object { $_.state -eq 'Ready' } | Select-Object -First 1
    if ($latest) {
        $alias = $latest.alias[0]
        Write-Host "Latest Ready Deployment:"
        Write-Host "  Alias: $alias"
        Write-Host "  State: $($latest.state)"
        Write-Host "  URL: $alias"
        
        # Try to fetch
        try {
            [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
            $r = Invoke-WebRequest -Uri "https://$alias" -Method Head -UseBasicParsing -TimeoutSec 15
            Write-Host "  HTTP Status: $($r.StatusCode)"
            Write-Host "  Content Length: $($r.Content.Length) bytes"
            Write-Host "  Title: $($r.ParsedHtml.title)"
        } catch {
            Write-Host "  Fetch Error: $($_.Exception.Message)"
        }
    }
} else {
    Write-Host "No deployments found"
    Write-Host $output
}
