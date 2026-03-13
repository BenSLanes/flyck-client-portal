$lines = Get-Content src\AgencyApp.js
$newLines = $lines -replace 'service_eee6ere', 'service_98d2hw9'
Set-Content src\AgencyApp.js $newLines
Write-Host "Done!"
