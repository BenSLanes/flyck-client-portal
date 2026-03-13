$f = Get-Content src\AgencyApp.js -Raw

# Add EmailJS script import at the top
$oldImport = 'import React,'
$newImport = 'import emailjs from "@emailjs/browser";
import React,'

$f = $f.Replace($oldImport, $newImport)

# Replace the /api/send-invite fetch with EmailJS
$oldSend = 'await fetch("/api/send-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: first_name + " " + last_name, email, role, link })
    });'

$newSend = 'await emailjs.send("service_eee6ere", "template_bc5a3ba", {
      to_name: first_name,
      to_email: email,
      link: link
    }, "bEvMS3g1h9KQDDqJd");'

$f = $f.Replace($oldSend, $newSend)

Set-Content src\AgencyApp.js $f
Write-Host "Done!"
