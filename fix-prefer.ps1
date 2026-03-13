$f = Get-Content src\AgencyApp.js -Raw
$f = $f -replace 'Prefer: "return=representation",', 'Prefer: "return=representation,resolution=merge-duplicates",'
Set-Content src\AgencyApp.js $f
Write-Host "Done!"
