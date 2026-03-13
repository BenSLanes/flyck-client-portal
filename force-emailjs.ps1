$f = Get-Content src\AgencyApp.js -Raw

# Remove any remaining send-invite fetch calls
$f = $f -replace '(?s)await fetch\("/api/send-invite".*?\}\);', ''

# Check if emailjs.send is already there
if ($f -notmatch 'emailjs\.send') {
    $f = $f -replace 'if \(res\.ok\) \{(\r?\n)\s*const link = regLink\(email\);', 'if (res.ok) {$1    const link = regLink(email);$1    await emailjs.send("service_eee6ere", "template_bc5a3ba", { to_name: first_name, to_email: email, link: link }, "bEvMS3g1h9KQDDqJd");'
    Write-Host "EmailJS added"
} else {
    Write-Host "EmailJS already present"
}

Set-Content src\AgencyApp.js $f
Write-Host "Done!"
