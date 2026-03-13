$f = Get-Content src\AgencyApp.js -Raw

$oldText = 'if (res.ok) {
    const link = regLink(email);
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": "Bearer re_JdhLb44p_HL6d92ybg4JKzo8F5ei7QBLa",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Flyck <onboarding@resend.dev>",
        to: email,
        subject: "Your Flyck Registration Link",
        html: "<p>Hi " + first_name + ",</p><p>Please click the link below to complete your pre-employment compliance registration:</p><p><a href=" + link + ">Complete Registration</a></p><p>The Flyck Team</p>"
      })
    });
  }'

$newText = 'if (res.ok) {
    const link = regLink(email);
    await fetch("/api/send-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: first_name + " " + last_name, email, role, link })
    });
  }'

$f = $f.Replace($oldText, $newText)
Set-Content src\AgencyApp.js $f
Write-Host "Done!"
