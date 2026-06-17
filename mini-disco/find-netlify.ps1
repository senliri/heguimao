$base = 'C:\Users\87931\.qclaw\workspace-ua58rsb93veqtxl7\mini-disco'
Write-Host "=== Files containing 'netlify' ==="

# Search all ts/tsx/js/jsx files
$files = Get-ChildItem -Path "$base\src" -Recurse -Include *.ts,*.tsx,*.js,*.jsx
foreach ($f in $files) {
    $content = Get-Content $f.FullName -Raw
    if ($content -match 'netlify') {
        Write-Host "FOUND in: $($f.FullName.Replace($base + '\', ''))"
        Select-String -Path $f.FullName -Pattern 'netlify' -AllMatches | ForEach-Object {
            Write-Host "  Line $($_.LineNumber): $($_.Line.Trim())"
        }
    }
}

# Search api files
$apiFiles = Get-ChildItem -Path "$base\api" -Recurse -Include *.js,*.ts
foreach ($f in $apiFiles) {
    $content = Get-Content $f.FullName -Raw
    if ($content -match 'netlify') {
        Write-Host "FOUND in: $($f.FullName.Replace($base + '\', ''))"
        Select-String -Path $f.FullName -Pattern 'netlify' -AllMatches | ForEach-Object {
            Write-Host "  Line $($_.LineNumber): $($_.Line.Trim())"
        }
    }
}
