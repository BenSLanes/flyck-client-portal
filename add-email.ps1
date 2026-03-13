$f = Get-Content src\AgencyApp.js -Raw

$oldText = 'return res.ok;
}'

$newText = 'if (res.ok) {
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
  }
  return res.ok;
}'

$f = $f -replace [regex]::Escape($oldText), $newText
Set-Content src\AgencyApp.js $f
Write-Host "Done!"
