[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$urls = @(
    'https://mini-disco.vercel.app'
    'https://mini-disco.vercel.app/report'
    'https://mini-disco.vercel.app/appeal'
    'https://mini-disco.vercel.app/portfolio'
    'https://mini-disco.vercel.app/dashboard'
    'https://mini-disco.vercel.app/login'
    'https://mini-disco.vercel.app/api/health'
)

foreach ($url in $urls) {
    try {
        $r = Invoke-WebRequest -Uri $url -Method Head -UseBasicParsing -TimeoutSec 10
        Write-Host "  OK [$($r.StatusCode)] $url"
    } catch {
        $code = if ($_.Exception.Response) { $_.Exception.Response.StatusCode.value__ } else { 'unknown' }
        Write-Host "  $code $url"
    }
}
