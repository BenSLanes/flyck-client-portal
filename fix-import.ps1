$lines = Get-Content src\AgencyApp.js
$lines[0] = 'import emailjs from "@emailjs/browser";'
Set-Content src\AgencyApp.js $lines
Write-Host "Fixed! First line is now: $($lines[0])"
