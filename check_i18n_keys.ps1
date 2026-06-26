param([string]$url)
$r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 10
$js = $r.Content
$sections = @("home.", "nav.", "pricing.", "common.", "auth.", "report.", "appeal.", "profile.", "market.", "layout.")
foreach ($sec in $sections) {
    $pattern = '"' + $sec + '[^"]*"'
    $count = ([regex]::Matches($js, $pattern)).Count
    Write-Host "$sec -> $count keys"
}
