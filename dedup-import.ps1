$lines = Get-Content src\AgencyApp.js
$seen = $false
$newLines = @()
foreach ($line in $lines) {
    if ($line -match 'import emailjs from') {
        if (-not $seen) {
            $newLines += 'import emailjs from "@emailjs/browser";'
            $seen = $true
        }
    } else {
        $newLines += $line
    }
}
Set-Content src\AgencyApp.js $newLines
Write-Host "Done! emailjs import count: $(($newLines | Select-String 'import emailjs').Count)"
