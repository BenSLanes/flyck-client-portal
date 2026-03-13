export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { name, email, role, link } = req.body;
  const firstName = name.trim().split(" ")[0];

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": "Bearer re_JdhLb44p_HL6d92ybg4JKzo8F5ei7QBLa",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: "Flyck <onboarding@resend.dev>",
      to: email,
      subject: "Your Flyck Registration Link",
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;">
          <h2 style="color:#1A1208;">Hi ${firstName},</h2>
          <p>You've been invited to complete your pre-employment compliance registration.</p>
          <p><strong>Role:</strong> ${role || "Candidate"}</p>
          <p>Click the button below to get started — it takes around 10 minutes.</p>
          <a href="${link}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#1A6B5A;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">
            Complete Registration
          </a>
          <p style="margin-top:32px;color:#9A8F7E;font-size:13px;">Flyck.ai · Pre-Employment Compliance</p>
        </div>
      `
    })
  });

  const data = await r.json();
  if (!r.ok) return res.status(500).json({ error: data });
  return res.status(200).json({ ok: true });
}
