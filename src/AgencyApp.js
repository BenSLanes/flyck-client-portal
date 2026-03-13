import { NotificationBell } from "./components/NotificationBell";
/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";

// ══════════════════════════════════════════
// SUPABASE CONFIG
// ══════════════════════════════════════════
const SUPABASE_URL = "https://dvalaiouqrvwtvdcqkiz.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2YWxhaW91cXJ2d3R2ZGNxa2l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwOTg1MjIsImV4cCI6MjA4ODY3NDUyMn0.xvCccRZHLTtgFDoU9lE5Gql64wRSE8fQwtW6ubGp9yg";

// This agency's ID — in production this would come from auth
const THIS_AGENCY_ID = "flyck-agency";
const THIS_AGENCY_NAME = "Flyck Agency";

// ── Fetch only candidates belonging to this agency ──
async function fetchAgencyCandidates() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/candidates?agency_id=eq.${THIS_AGENCY_ID}&select=*&order=submitted_at.desc`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    if (!res.ok) return [];
    const rows = await res.json();
    return rows.map(mapRow);
  } catch (e) {
    console.error("Fetch error:", e);
    return [];
  }
}

function mapRow(r) {
  let rawData = {};
  try { rawData = r.raw_data ? JSON.parse(r.raw_data) : {}; } catch (e) {}
  const idV = rawData.idVerified || false;
  const hmrcV = rawData.hmrcVerified || false;
  const dbsV = rawData.dbsVerified || false;
  const checks = [idV, hmrcV, dbsV].filter(Boolean).length;
  const pct = r.status === "Fully Cleared" ? 100
    : checks === 3 ? 90
    : checks === 2 ? 60
    : checks === 1 ? 35
    : r.status === "Submitted" ? 25 : 10;

  const agencyStatus = r.agency_status || "pending";
  const submittedToClient = r.submitted_to_client || false;

  const statusLabel = agencyStatus === "cleared" ? "Agency Cleared"
    : agencyStatus === "rejected" ? "Rejected"
    : r.status || "Submitted";
  const statusColor = agencyStatus === "cleared" ? C.green
    : agencyStatus === "rejected" ? C.red
    : C.blue;

  return {
    id: r.id,
    supabaseId: r.id,
    rawData,
    name: `${r.first_name || ""} ${r.last_name || ""}`.trim() || r.email,
    initials: `${(r.first_name || "?")[0]}${(r.last_name || "?")[0]}`.toUpperCase(),
    role: r.role || "Candidate",
    email: r.email || "",
    phone: r.phone || "",
    status: statusLabel,
    statusColor,
    pct,
    dob: r.dob || "",
    ni: r.ni_number || "",
    city: r.city || "",
    address: r.address || "",
    postcode: r.postcode || "",
    nationality: r.nationality || "",
    idVerified: idV,
    hmrcVerified: hmrcV,
    dbsVerified: dbsV,
    gaps: rawData.gaps || 0,
    registered: true,
    docs: rawData.docs || [],
    submittedAt: r.submitted_at,
    agencyStatus,
    submittedToClient,
  };
}

// ── Update agency_status on a candidate ──
async function updateAgencyStatus(candidateId, agencyStatus) {
  await fetch(`${SUPABASE_URL}/rest/v1/candidates?id=eq.${candidateId}`, {
    method: "PATCH",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ agency_status: agencyStatus }),
  });
}

// ── Submit candidate to client portal ──
async function submitToClient(candidateId) {
  await fetch(`${SUPABASE_URL}/rest/v1/candidates?id=eq.${candidateId}`, {
    method: "PATCH",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ submitted_to_client: true }),
  });
}

// ── Registration link URL ──
const CANDIDATE_PORTAL_URL = "https://flyck-portal.vercel.app";
const regLink = (email) => `${CANDIDATE_PORTAL_URL}?email=${encodeURIComponent(email)}`;

// ── Send registration link (creates stub candidate row with agency_id) ──
async function sendRegistrationLink(name, email, role) {
  const [first_name, ...rest] = name.trim().split(" ");
  const last_name = rest.join(" ");
  const res = await fetch(`${SUPABASE_URL}/rest/v1/candidates`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      first_name,
      last_name,
      email,
      role: role || "Candidate",
      agency_id: THIS_AGENCY_ID,
      agency_status: "pending",
      submitted_to_client: false,
      status: "Invite Sent",
      submitted_at: new Date().toISOString(),
    }),
  });
  return res.ok;
}

// ══════════════════════════════════════════
// DESIGN TOKENS
// ══════════════════════════════════════════
const C = {
  bg: "#FAF8F4",
  bgCard: "#FFFFFF",
  bgPanel: "#F4F1EB",
  bgInput: "#F9F7F3",
  border: "#E2DDD5",
  borderDk: "#C8C0B0",
  text: "#1A1208",
  textMid: "#5A5040",
  textFaint: "#9A8F7E",
  green: "#3A7055",
  greenBg: "#3A705514",
  amber: "#A0700A",
  amberBg: "#A0700A14",
  red: "#A03030",
  redBg: "#A0303014",
  blue: "#2A5A8A",
  blueBg: "#2A5A8A14",
  purple: "#6A4A8A",
  purpleBg: "#6A4A8A14",
  teal: "#1A6A6A",
  tealBg: "#1A6A6A14",
};
const BODY_FONT = "'Figtree', 'DM Sans', sans-serif";
const MONO_FONT = "'DM Mono', monospace";
const LOGO_SERIF = "'DM Serif Display', serif";
const AGENCY_COLOR = C.teal;

// ══════════════════════════════════════════
// SHARED UI
// ══════════════════════════════════════════
function Badge({ label, color }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 10px", borderRadius: 4, background: color + "14", border: `1px solid ${color}40`, color, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", fontFamily: BODY_FONT }}>
      {label}
    </span>
  );
}
function Card({ children, style = {}, onClick }) {
  return (
    <div onClick={onClick} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, padding: "18px 20px", cursor: onClick ? "pointer" : "default", ...style }}>
      {children}
    </div>
  );
}
function Label({ children }) {
  return <label style={{ fontSize: 12, color: C.textMid, fontFamily: BODY_FONT, fontWeight: 500, display: "block", marginBottom: 5 }}>{children}</label>;
}
function Input({ placeholder, value, onChange, type = "text", readOnly }) {
  const [f, setF] = useState(false);
  return (
    <input readOnly={readOnly} type={type} placeholder={placeholder} value={value || ""} onChange={onChange || (() => {})} onFocus={() => setF(true)} onBlur={() => setF(false)}
      style={{ width: "100%", background: readOnly ? C.bgPanel : C.bgInput, border: `1px solid ${f && !readOnly ? C.text : C.border}`, borderRadius: 6, color: C.text, fontSize: 14, padding: "9px 12px", outline: "none", fontFamily: BODY_FONT }}
    />
  );
}
function Btn({ children, onClick, primary, danger, small, disabled, style: ex = {} }) {
  const bg = primary ? C.text : danger ? C.red : "transparent";
  const col = primary || danger ? "#FAF8F4" : C.textMid;
  const border = primary ? C.text : danger ? C.red : C.border;
  return (
    <button onClick={onClick} disabled={disabled} style={{ padding: small ? "5px 14px" : "9px 20px", borderRadius: 6, border: `1px solid ${border}`, background: bg, color: col, fontSize: small ? 12 : 13, fontWeight: primary || danger ? 600 : 500, cursor: disabled ? "not-allowed" : "pointer", fontFamily: BODY_FONT, opacity: disabled ? 0.4 : 1, ...ex }}>
      {children}
    </button>
  );
}
function Divider({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0 14px" }}>
      <div style={{ flex: 1, height: 1, background: C.border }} />
      {label && <span style={{ fontSize: 10, color: C.textFaint, fontFamily: MONO_FONT, letterSpacing: "0.08em" }}>{label}</span>}
      <div style={{ flex: 1, height: 1, background: C.border }} />
    </div>
  );
}
function StatCard({ label, value, color, sub }) {
  return (
    <Card style={{ padding: "14px 18px" }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: color || C.text, fontFamily: BODY_FONT, letterSpacing: "-0.02em" }}>{value}</div>
      <div style={{ fontSize: 12, color: C.textFaint, fontFamily: BODY_FONT, fontWeight: 500, marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: C.green, fontFamily: BODY_FONT, marginTop: 3 }}>{sub}</div>}
    </Card>
  );
}
function ProgressBar({ pct }) {
  const col = pct === 100 ? C.green : pct >= 70 ? C.amber : C.red;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 52, height: 4, background: C.bgPanel, borderRadius: 2, overflow: "hidden", border: `1px solid ${C.border}` }}>
        <div style={{ height: "100%", width: `${pct}%`, background: col, borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 12, color: pct === 100 ? C.green : C.textMid, fontFamily: MONO_FONT, fontWeight: pct === 100 ? 700 : 400 }}>{pct}%</span>
    </div>
  );
}

// ══════════════════════════════════════════
// SIDEBAR
// ══════════════════════════════════════════
function Sidebar({ activeSection, onSection }) {
  const items = [
    { id: "dashboard", icon: "◈", label: "Dashboard" },
    { id: "candidates", icon: "👤", label: "Candidates" },
    { id: "cleared", icon: "✅", label: "Cleared" },
    { id: "submitted", icon: "📤", label: "Submitted to Client" },
    { id: "alerts", icon: "⏰", label: "Alerts" },
    { id: "reports", icon: "📊", label: "Reports" },
  ];
  return (
    <div style={{ width: 220, minHeight: "100vh", background: C.bgCard, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
      <div style={{ padding: "20px 20px 16px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontFamily: LOGO_SERIF, fontSize: "1.2rem", color: C.text, letterSpacing: "-0.01em", marginBottom: 2 }}>
          flyck<span style={{ color: AGENCY_COLOR }}>.</span>ai
        </div>
        <div style={{ fontSize: 10, color: C.textFaint, fontFamily: MONO_FONT, letterSpacing: "0.08em", textTransform: "uppercase" }}>Agency Portal</div>
      </div>
      <nav style={{ flex: 1, padding: "12px 10px" }}>
        {items.map((item) => {
          const active = activeSection === item.id;
          return (
            <div key={item.id} onClick={() => onSection(item.id)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 7, marginBottom: 2, cursor: "pointer", background: active ? AGENCY_COLOR + "12" : "transparent", border: active ? `1px solid ${AGENCY_COLOR}30` : "1px solid transparent", color: active ? AGENCY_COLOR : C.textMid, fontSize: 13, fontFamily: BODY_FONT, fontWeight: active ? 600 : 400, transition: "all 0.12s" }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = C.bgPanel; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{ fontSize: 14, width: 18, textAlign: "center" }}>{item.icon}</span>
              {item.label}
            </div>
          );
        })}
      </nav>
      <div style={{ padding: "14px 16px", borderTop: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: AGENCY_COLOR + "18", border: `1px solid ${AGENCY_COLOR}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: AGENCY_COLOR, fontFamily: MONO_FONT }}>FA</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: BODY_FONT }}>{THIS_AGENCY_NAME}</div>
            <div style={{ fontSize: 10, color: C.textFaint, fontFamily: MONO_FONT }}>Agency Account</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// CANDIDATE DRAWER
// ══════════════════════════════════════════
function CandidateDrawer({ candidate, onClose, onStatusChange, onSubmitToClient }) {
  const [working, setWorking] = useState(false);
  const [submitDone, setSubmitDone] = useState(candidate.submittedToClient);

  const handleClear = async () => {
    setWorking(true);
    await updateAgencyStatus(candidate.id, "cleared");
    onStatusChange(candidate.id, "cleared");
    setWorking(false);
  };

  const handleReject = async () => {
    setWorking(true);
    await updateAgencyStatus(candidate.id, "rejected");
    onStatusChange(candidate.id, "rejected");
    setWorking(false);
  };

  const handleSubmit = async () => {
    setWorking(true);
    await submitToClient(candidate.id);
    setSubmitDone(true);
    onSubmitToClient(candidate.id);
    setWorking(false);
  };

  const isCleared = candidate.agencyStatus === "cleared";
  const isRejected = candidate.agencyStatus === "rejected";

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 200, display: "flex", alignItems: "flex-start", justifyContent: "flex-end" }} onClick={onClose}>
      <div style={{ width: 580, height: "100vh", background: C.bgCard, borderLeft: `1px solid ${C.border}`, display: "flex", flexDirection: "column", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: "18px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: C.bgCard, zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: candidate.statusColor + "18", border: `2px solid ${candidate.statusColor}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: candidate.statusColor, fontFamily: MONO_FONT }}>{candidate.initials}</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.text, fontFamily: BODY_FONT }}>{candidate.name}</div>
              <div style={{ fontSize: 12, color: C.textFaint, fontFamily: MONO_FONT }}>{candidate.role}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 6, width: 32, height: 32, cursor: "pointer", color: C.textMid, fontSize: 14 }}>✕</button>
        </div>

        <div style={{ padding: 24, flex: 1 }}>
          {/* Status row */}
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 20 }}>
            <Badge label={candidate.status} color={candidate.statusColor} />
            <ProgressBar pct={candidate.pct} />
            {submitDone && <span style={{ fontSize: 11, color: C.teal, fontFamily: MONO_FONT, background: C.tealBg, border: `1px solid ${C.teal}30`, borderRadius: 4, padding: "2px 8px" }}>✓ Sent to Client</span>}
          </div>

          {/* Verification checks */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
            {[
              { label: "ID Check", ok: candidate.idVerified },
              { label: "HMRC", ok: candidate.hmrcVerified },
              { label: "DBS", ok: candidate.dbsVerified },
            ].map(({ label, ok }) => (
              <div key={label} style={{ padding: "10px 12px", borderRadius: 7, background: ok ? C.greenBg : C.bgPanel, border: `1px solid ${ok ? C.green + "40" : C.border}`, textAlign: "center" }}>
                <div style={{ fontSize: 16, marginBottom: 3 }}>{ok ? "✓" : "—"}</div>
                <div style={{ fontSize: 11, color: ok ? C.green : C.textFaint, fontFamily: MONO_FONT, fontWeight: 600 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Personal details */}
          <Divider label="PERSONAL DETAILS" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
            {[
              ["Email", candidate.email],
              ["Phone", candidate.phone],
              ["Date of Birth", candidate.dob || "—"],
              ["NI Number", candidate.ni || "—"],
              ["City", candidate.city || "—"],
              ["Nationality", candidate.nationality || "—"],
            ].map(([label, val]) => (
              <div key={label} style={{ padding: "10px 12px", background: C.bgPanel, borderRadius: 6, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 10, color: C.textFaint, fontFamily: MONO_FONT, letterSpacing: "0.05em", marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 13, color: C.text, fontFamily: BODY_FONT, fontWeight: 500 }}>{val || "—"}</div>
              </div>
            ))}
          </div>

          {/* Documents */}
          {candidate.docs && candidate.docs.length > 0 && (
            <>
              <Divider label="DOCUMENTS" />
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                {candidate.docs.map((doc, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 7 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 16 }}>{doc.icon}</span>
                      <div>
                        <div style={{ fontSize: 13, color: C.text, fontFamily: BODY_FONT, fontWeight: 500 }}>{doc.name}</div>
                        <div style={{ fontSize: 11, color: C.textFaint, fontFamily: MONO_FONT }}>{doc.date}</div>
                      </div>
                    </div>
                    <Badge label={doc.status} color={doc.status === "Verified" ? C.green : doc.status === "Under Review" ? C.amber : C.red} />
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Agency Actions */}
          <Divider label="AGENCY ACTIONS" />
          {isRejected ? (
            <div style={{ background: C.redBg, border: `1px solid ${C.red}40`, borderRadius: 8, padding: "12px 16px", fontSize: 13, color: C.red, fontFamily: BODY_FONT, fontWeight: 600 }}>
              ✕ This candidate has been rejected
            </div>
          ) : submitDone ? (
            <div style={{ background: C.greenBg, border: `1px solid ${C.green}40`, borderRadius: 8, padding: "14px 16px" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.green, fontFamily: BODY_FONT, marginBottom: 4 }}>✓ Submitted to Client Portal</div>
              <div style={{ fontSize: 12, color: C.textMid, fontFamily: BODY_FONT }}>This candidate is now visible in the client portal.</div>
            </div>
          ) : isCleared ? (
            <div>
              <div style={{ background: C.greenBg, border: `1px solid ${C.green}40`, borderRadius: 8, padding: "12px 16px", marginBottom: 12, fontSize: 13, color: C.green, fontFamily: BODY_FONT, fontWeight: 600 }}>
                ✓ Cleared by agency — ready to submit to client
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={handleSubmit} disabled={working}
                  style={{ flex: 1, padding: "11px 20px", borderRadius: 6, border: "none", background: AGENCY_COLOR, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: BODY_FONT }}>
                  {working ? "Submitting…" : "📤 Submit to Client Portal"}
                </button>
                <Btn danger onClick={handleReject} disabled={working}>Reject</Btn>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 13, color: C.textMid, fontFamily: BODY_FONT, marginBottom: 14, lineHeight: 1.6 }}>
                Review this candidate's compliance record then clear them for submission to the client, or reject.
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={handleClear} disabled={working}
                  style={{ flex: 1, padding: "11px 20px", borderRadius: 6, border: "none", background: C.green, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: BODY_FONT }}>
                  {working ? "Saving…" : "✓ Clear Candidate"}
                </button>
                <Btn danger onClick={handleReject} disabled={working}>Reject</Btn>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// INVITE MODAL
// ══════════════════════════════════════════
function InviteModal({ onClose, onSent }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const doSend = async () => {
    if (!name.trim() || !email.trim()) return;
    setSending(true);
    const ok = await sendRegistrationLink(name, email, role);
    setSending(false);
    if (ok) {
      setSent(true);
      setTimeout(() => { onSent(); onClose(); }, 1800);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ width: 480, background: C.bgCard, borderRadius: 12, overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ background: AGENCY_COLOR, padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", fontFamily: BODY_FONT }}>Invite Candidate</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontFamily: BODY_FONT }}>Send a CAP 2330 registration link</div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 6, width: 28, height: 28, cursor: "pointer", color: "#fff", fontSize: 14 }}>✕</button>
        </div>
        <div style={{ padding: 24 }}>
          {sent ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.green, fontFamily: BODY_FONT }}>Registration link sent!</div>
              <div style={{ fontSize: 13, color: C.textFaint, fontFamily: BODY_FONT, marginTop: 6 }}>Candidate record created. They'll appear here once they register.</div>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
                <div><Label>Full Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sam Peters" /></div>
                <div><Label>Email Address *</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="candidate@email.com" type="email" /></div>
                <div><Label>Role (optional)</Label><Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Ground Staff" /></div>
              </div>
              <div style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 14px", marginBottom: 18, fontSize: 13, fontFamily: BODY_FONT, color: C.textMid, lineHeight: 1.7 }}>
                <div style={{ fontWeight: 600, color: C.text, marginBottom: 4 }}>Email preview</div>
                Hi {name.split(" ")[0] || "there"},<br />
                You've been invited to complete your CAP 2330 compliance registration for <strong>{THIS_AGENCY_NAME}</strong>.<br />
                Click the link below to get started — it takes around 10 minutes.<br /><br />
                <span style={{ color: C.blue, textDecoration: "underline", fontSize: 11, wordBreak: "break-all" }}>
                  {regLink(email || "candidate@email.com")}
                </span>
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <Btn onClick={onClose}>Cancel</Btn>
                <button onClick={doSend} disabled={sending || !name.trim() || !email.trim()}
                  style={{ padding: "9px 22px", borderRadius: 6, border: "none", background: name.trim() && email.trim() ? AGENCY_COLOR : "#ccc", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: BODY_FONT }}>
                  {sending ? "Sending…" : "Send Registration Link"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════
function DashboardView({ candidates, onSelectCandidate, onSection }) {
  const total = candidates.length;
  const cleared = candidates.filter((c) => c.agencyStatus === "cleared").length;
  const pending = candidates.filter((c) => c.agencyStatus === "pending" && c.pct > 15).length;
  const submitted = candidates.filter((c) => c.submittedToClient).length;
  const rejected = candidates.filter((c) => c.agencyStatus === "rejected").length;
  const recent = candidates.slice(0, 5);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 32 }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: LOGO_SERIF, fontSize: "1.6rem", color: C.text, letterSpacing: "-0.02em", marginBottom: 4 }}>Agency Dashboard</div>
        <div style={{ fontSize: 13, color: C.textFaint, fontFamily: BODY_FONT }}>Compliance overview for {THIS_AGENCY_NAME}</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
        <StatCard label="Total Candidates" value={total} />
        <StatCard label="Agency Cleared" value={cleared} color={C.green} sub={total > 0 ? `${Math.round((cleared / total) * 100)}% of your pool` : ""} />
        <StatCard label="Awaiting Review" value={pending} color={C.amber} />
        <StatCard label="Sent to Client" value={submitted} color={C.teal} />
      </div>

      {/* Pipeline */}
      <Card style={{ marginBottom: 20, padding: "18px 24px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: BODY_FONT, marginBottom: 14 }}>Candidate Pipeline</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr auto 1fr auto 1fr", alignItems: "center", gap: 8 }}>
          {[
            { label: "Registered", count: total, color: C.blue },
            null,
            { label: "Agency Cleared", count: cleared, color: C.green },
            null,
            { label: "Sent to Client", count: submitted, color: C.teal },
            null,
            { label: "Rejected", count: rejected, color: C.red },
          ].map((step, i) =>
            step === null ? (
              <div key={i} style={{ textAlign: "center", color: C.textFaint, fontSize: 16 }}>→</div>
            ) : (
              <div key={step.label} style={{ textAlign: "center", padding: "12px 8px", background: step.color + "10", border: `1px solid ${step.color}30`, borderRadius: 8 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: step.color, fontFamily: BODY_FONT }}>{step.count}</div>
                <div style={{ fontSize: 11, color: C.textFaint, fontFamily: MONO_FONT, marginTop: 2 }}>{step.label}</div>
              </div>
            )
          )}
        </div>
      </Card>

      {/* Recent */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: BODY_FONT }}>Recent Candidates</div>
          <button onClick={() => onSection("candidates")} style={{ fontSize: 12, color: AGENCY_COLOR, fontFamily: BODY_FONT, fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>View all →</button>
        </div>
        {recent.length === 0 ? (
          <div style={{ padding: "32px 20px", textAlign: "center", color: C.textFaint, fontFamily: BODY_FONT, fontSize: 13 }}>No candidates yet — invite one to get started</div>
        ) : recent.map((c, i) => (
          <div key={c.id} onClick={() => onSelectCandidate(c)}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: i < recent.length - 1 ? `1px solid ${C.border}` : "none", cursor: "pointer" }}
            onMouseEnter={(e) => e.currentTarget.style.background = C.bgPanel}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: c.statusColor + "15", border: `1px solid ${c.statusColor}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: c.statusColor, fontFamily: MONO_FONT }}>{c.initials}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: BODY_FONT }}>{c.name}</div>
                <div style={{ fontSize: 11, color: C.textFaint, fontFamily: MONO_FONT }}>{c.role}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <ProgressBar pct={c.pct} />
              <Badge label={c.status} color={c.statusColor} />
              {c.submittedToClient && <span style={{ fontSize: 10, color: C.teal, fontFamily: MONO_FONT }}>📤 Sent</span>}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════
// CANDIDATES VIEW (reused for Cleared + Submitted tabs too)
// ══════════════════════════════════════════
function CandidatesView({ candidates, onSelectCandidate, onInvite, title, subtitle, emptyMsg }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const filtered = candidates.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.role.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "All" ? true :
      filter === "Cleared" ? c.agencyStatus === "cleared" :
      filter === "Pending" ? c.agencyStatus === "pending" :
      filter === "Sent" ? c.submittedToClient : true;
    return matchSearch && matchFilter;
  });

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: LOGO_SERIF, fontSize: "1.4rem", color: C.text, marginBottom: 4 }}>{title || "Candidates"}</div>
          <div style={{ fontSize: 13, color: C.textFaint, fontFamily: BODY_FONT }}>{subtitle || `${filtered.length} of ${candidates.length} candidates`}</div>
        </div>
        {onInvite && (
          <button onClick={onInvite} style={{ padding: "9px 18px", borderRadius: 6, border: "none", background: AGENCY_COLOR, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: BODY_FONT }}>
            + Invite Candidate
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: C.textFaint }}>🔍</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search candidates…"
            style={{ width: "100%", background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 7, padding: "9px 12px 9px 36px", fontSize: 13, fontFamily: BODY_FONT, color: C.text, outline: "none", boxSizing: "border-box" }} />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["All", "Cleared", "Pending", "Sent"].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: "7px 14px", borderRadius: 6, fontSize: 12, fontFamily: BODY_FONT, cursor: "pointer", fontWeight: filter === f ? 600 : 400, background: filter === f ? C.text : C.bgCard, color: filter === f ? "#FAF8F4" : C.textMid, border: `1px solid ${filter === f ? C.text : C.border}` }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: C.bgPanel, borderBottom: `1px solid ${C.border}` }}>
              {["Candidate", "Status", "ID", "HMRC", "DBS", "Completion", "Agency Status", "Action"].map((h) => (
                <th key={h} style={{ padding: "10px 14px", fontSize: 11, fontWeight: 600, color: C.textFaint, fontFamily: MONO_FONT, textAlign: "left", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => (
              <tr key={c.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none" }}
                onMouseEnter={(e) => e.currentTarget.style.background = C.bgPanel}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <td style={{ padding: "12px 14px", cursor: "pointer" }} onClick={() => onSelectCandidate(c)}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: c.statusColor + "15", border: `1px solid ${c.statusColor}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: c.statusColor, fontFamily: MONO_FONT }}>{c.initials}</div>
                    <div>
                      <div style={{ fontSize: 13, color: C.text, fontWeight: 600, fontFamily: BODY_FONT }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: C.textFaint, fontFamily: MONO_FONT }}>{c.role}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "12px 14px" }}><Badge label={c.status} color={c.statusColor} /></td>
                <td style={{ padding: "12px 14px" }}><span style={{ fontSize: 12, color: c.idVerified ? C.green : C.textFaint, fontFamily: MONO_FONT }}>{c.idVerified ? "✓" : "—"}</span></td>
                <td style={{ padding: "12px 14px" }}><span style={{ fontSize: 12, color: c.hmrcVerified ? C.green : C.textFaint, fontFamily: MONO_FONT }}>{c.hmrcVerified ? "✓" : "—"}</span></td>
                <td style={{ padding: "12px 14px" }}><span style={{ fontSize: 12, color: c.dbsVerified ? C.green : C.textFaint, fontFamily: MONO_FONT }}>{c.dbsVerified ? "✓" : "—"}</span></td>
                <td style={{ padding: "12px 14px" }}><ProgressBar pct={c.pct} /></td>
                <td style={{ padding: "12px 14px" }}>
                  {c.submittedToClient ? <Badge label="📤 Sent to Client" color={C.teal} />
                    : c.agencyStatus === "cleared" ? <Badge label="✓ Cleared" color={C.green} />
                    : c.agencyStatus === "rejected" ? <Badge label="✕ Rejected" color={C.red} />
                    : <Badge label="Pending Review" color={C.amber} />}
                </td>
                <td style={{ padding: "12px 14px" }}>
                  <button onClick={() => onSelectCandidate(c)}
                    style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${AGENCY_COLOR}50`, background: AGENCY_COLOR + "12", color: AGENCY_COLOR, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: BODY_FONT }}>
                    Review
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} style={{ padding: "32px 20px", textAlign: "center", color: C.textFaint, fontFamily: BODY_FONT, fontSize: 13 }}>
                {emptyMsg || "No candidates found"}
              </td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════
// ALERTS VIEW
// ══════════════════════════════════════════
function AlertsView({ candidates }) {
  const readyToSubmit = candidates.filter((c) => c.agencyStatus === "cleared" && !c.submittedToClient);
  const incomplete = candidates.filter((c) => c.pct < 100 && c.agencyStatus === "pending");

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 32 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: LOGO_SERIF, fontSize: "1.4rem", color: C.text, marginBottom: 4 }}>Alerts</div>
        <div style={{ fontSize: 13, color: C.textFaint, fontFamily: BODY_FONT }}>Candidates requiring your attention</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 24 }}>
        <StatCard label="Ready to Submit to Client" value={readyToSubmit.length} color={C.green} />
        <StatCard label="Incomplete Registrations" value={incomplete.length} color={C.amber} />
      </div>

      {readyToSubmit.length > 0 && (
        <>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.textFaint, fontFamily: MONO_FONT, letterSpacing: "0.08em", marginBottom: 10 }}>✅ CLEARED — AWAITING CLIENT SUBMISSION</div>
          <Card style={{ padding: 0, overflow: "hidden", marginBottom: 20, border: `1px solid ${C.green}40` }}>
            {readyToSubmit.map((c, i) => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: i < readyToSubmit.length - 1 ? `1px solid ${C.border}` : "none", background: C.greenBg }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.green + "15", border: `1px solid ${C.green}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: C.green, fontFamily: MONO_FONT }}>{c.initials}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: BODY_FONT }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: C.textFaint, fontFamily: MONO_FONT }}>{c.role}</div>
                  </div>
                </div>
                <Badge label="Ready to Submit →" color={C.green} />
              </div>
            ))}
          </Card>
        </>
      )}

      {incomplete.length > 0 && (
        <>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.textFaint, fontFamily: MONO_FONT, letterSpacing: "0.08em", marginBottom: 10 }}>⏳ INCOMPLETE REGISTRATIONS</div>
          <Card style={{ padding: 0, overflow: "hidden" }}>
            {incomplete.map((c, i) => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: i < incomplete.length - 1 ? `1px solid ${C.border}` : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: c.statusColor + "15", border: `1px solid ${c.statusColor}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: c.statusColor, fontFamily: MONO_FONT }}>{c.initials}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: BODY_FONT }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: C.textFaint, fontFamily: MONO_FONT }}>{c.role}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <ProgressBar pct={c.pct} />
                  <Badge label={c.status} color={c.statusColor} />
                </div>
              </div>
            ))}
          </Card>
        </>
      )}

      {readyToSubmit.length === 0 && incomplete.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 0", color: C.textFaint, fontFamily: BODY_FONT, fontSize: 14 }}>No alerts right now — all good ✓</div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════
// REPORTS VIEW
// ══════════════════════════════════════════
function ReportsView({ candidates }) {
  const [exported, setExported] = useState(null);
  const total = candidates.length;
  const cleared = candidates.filter((c) => c.agencyStatus === "cleared").length;
  const submitted = candidates.filter((c) => c.submittedToClient).length;
  const rate = total > 0 ? Math.round((cleared / total) * 100) : 0;

  const reports = [
    { id: "full", label: "Full Agency Report", desc: "All candidates with compliance status and agency review outcome", icon: "📋" },
    { id: "cleared", label: "Cleared Candidates", desc: "All agency-cleared candidates ready for or sent to clients", icon: "✅" },
    { id: "pending", label: "Pending Review", desc: "Candidates awaiting agency review", icon: "⏳" },
    { id: "submitted", label: "Submitted to Client", desc: "All candidates sent through to the client portal", icon: "📤" },
    { id: "audit", label: "Audit Pack", desc: "Full audit-ready export of all compliance records", icon: "🔒" },
  ];

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 32 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: LOGO_SERIF, fontSize: "1.4rem", color: C.text, marginBottom: 4 }}>Reports</div>
        <div style={{ fontSize: 13, color: C.textFaint, fontFamily: BODY_FONT }}>Export compliance reports for your agency and clients</div>
      </div>
      <Card style={{ marginBottom: 24, background: C.bgPanel }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, textAlign: "center" }}>
          {[
            { label: "Total", val: total, color: C.text },
            { label: "Cleared", val: cleared, color: C.green },
            { label: "Sent to Client", val: submitted, color: C.teal },
            { label: "Clearance Rate", val: `${rate}%`, color: rate >= 80 ? C.green : rate >= 50 ? C.amber : C.red },
          ].map(({ label, val, color }) => (
            <div key={label}>
              <div style={{ fontSize: 26, fontWeight: 700, color, fontFamily: BODY_FONT, letterSpacing: "-0.02em" }}>{val}</div>
              <div style={{ fontSize: 11, color: C.textFaint, fontFamily: MONO_FONT, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {reports.map((r) => (
          <Card key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ fontSize: 24, flexShrink: 0 }}>{r.icon}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: BODY_FONT, marginBottom: 3 }}>{r.label}</div>
                <div style={{ fontSize: 12, color: C.textFaint, fontFamily: BODY_FONT, lineHeight: 1.5 }}>{r.desc}</div>
              </div>
            </div>
            {exported === r.id ? (
              <span style={{ fontSize: 12, color: C.green, fontFamily: BODY_FONT, fontWeight: 600, whiteSpace: "nowrap" }}>✓ Exported</span>
            ) : (
              <button onClick={() => { setExported(r.id); setTimeout(() => setExported(null), 2500); }}
                style={{ padding: "6px 14px", borderRadius: 6, border: `1px solid ${AGENCY_COLOR}50`, background: AGENCY_COLOR + "12", color: AGENCY_COLOR, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: BODY_FONT, whiteSpace: "nowrap", flexShrink: 0 }}>
                Export CSV
              </button>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// ASK FLYCK
// ══════════════════════════════════════════
function AskFlyck() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi! I'm your Flyck compliance assistant. Ask me anything about CAP 2330, candidate clearance, or compliance requirements." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", text: userMsg }]);
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are a compliance assistant for Flyck.ai, used by recruitment agencies. Expert knowledge of CAP 2330, right to work, DBS, HMRC employment history verification, UK aviation staffing compliance. Be concise and practical.`,
          messages: [{ role: "user", content: userMsg }],
        }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", text: data.content?.[0]?.text || "Sorry, couldn't get a response." }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", text: "Connection error. Please try again." }]);
    }
    setLoading(false);
  };

  return (
    <>
      <button onClick={() => setOpen(!open)} style={{ position: "fixed", bottom: 24, right: 24, zIndex: 500, width: 48, height: 48, borderRadius: "50%", background: AGENCY_COLOR, border: "none", color: "#fff", fontSize: 20, cursor: "pointer", boxShadow: "0 4px 20px rgba(0,0,0,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {open ? "✕" : "✦"}
      </button>
      {open && (
        <div style={{ position: "fixed", bottom: 84, right: 24, zIndex: 500, width: 380, height: 520, background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, boxShadow: "0 20px 60px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}`, background: AGENCY_COLOR, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 16 }}>✦</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: BODY_FONT }}>Ask Flyck</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontFamily: BODY_FONT }}>CAP 2330 compliance assistant</div>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 8px" }}>
            {messages.map((m, i) => (
              <div key={i} style={{ marginBottom: 12, display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{ maxWidth: "80%", padding: "9px 13px", borderRadius: 8, background: m.role === "user" ? C.text : C.bgPanel, border: `1px solid ${m.role === "user" ? C.text : C.border}`, color: m.role === "user" ? "#fff" : C.text, fontSize: 13, fontFamily: BODY_FONT, lineHeight: 1.6 }}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && <div style={{ display: "flex", gap: 6, padding: "6px 0" }}>{[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: C.textFaint, animation: `bounce 1.2s ${i*0.2}s infinite` }} />)}</div>}
          </div>
          <div style={{ padding: "10px 12px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 8 }}>
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Ask about compliance…"
              style={{ flex: 1, background: C.bgInput, border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 12px", fontSize: 13, fontFamily: BODY_FONT, color: C.text, outline: "none" }} />
            <button onClick={send} disabled={!input.trim() || loading} style={{ padding: "8px 14px", borderRadius: 6, border: "none", background: AGENCY_COLOR, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: BODY_FONT, opacity: !input.trim() || loading ? 0.5 : 1 }}>→</button>
          </div>
        </div>
      )}
      <style>{`@keyframes bounce{0%,80%,100%{transform:scale(0.6);opacity:0.4}40%{transform:scale(1);opacity:1}}`}</style>
    </>
  );
}

// ══════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════
export default function AgencyPortal() {
  const [section, setSection] = useState("dashboard");
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showInvite, setShowInvite] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetchAgencyCandidates().then((rows) => {
      setCandidates(rows);
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = (id, agencyStatus) => {
    const statusLabel = agencyStatus === "cleared" ? "Agency Cleared" : "Rejected";
    const statusColor = agencyStatus === "cleared" ? C.green : C.red;
    setCandidates((prev) => prev.map((c) => c.id !== id ? c : { ...c, agencyStatus, status: statusLabel, statusColor }));
    if (selectedCandidate?.id === id) setSelectedCandidate((prev) => ({ ...prev, agencyStatus, status: statusLabel, statusColor }));
  };

  const handleSubmitToClient = (id) => {
    setCandidates((prev) => prev.map((c) => c.id === id ? { ...c, submittedToClient: true } : c));
    if (selectedCandidate?.id === id) setSelectedCandidate((prev) => ({ ...prev, submittedToClient: true }));
  };

  const allCandidates = candidates;
  const pendingCandidates = candidates.filter((c) => c.agencyStatus !== "rejected");
  const clearedCandidates = candidates.filter((c) => c.agencyStatus === "cleared");
  const submittedCandidates = candidates.filter((c) => c.submittedToClient);

  const renderMain = () => {
    if (loading) return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 14, color: C.textFaint, fontFamily: BODY_FONT }}>Loading candidates…</div>
      </div>
    );
    if (section === "candidates") return <CandidatesView candidates={pendingCandidates} onSelectCandidate={setSelectedCandidate} onInvite={() => setShowInvite(true)} />;
    if (section === "cleared") return <CandidatesView candidates={clearedCandidates} onSelectCandidate={setSelectedCandidate} title="Cleared Candidates" subtitle="Agency-cleared and ready to submit to client" emptyMsg="No cleared candidates yet" />;
    if (section === "submitted") return <CandidatesView candidates={submittedCandidates} onSelectCandidate={setSelectedCandidate} title="Submitted to Client" subtitle="These candidates are now visible in the client portal" emptyMsg="No candidates submitted to client yet" />;
    if (section === "alerts") return <AlertsView candidates={allCandidates} />;
    if (section === "reports") return <ReportsView candidates={allCandidates} />;
    return <DashboardView candidates={allCandidates} onSelectCandidate={setSelectedCandidate} onSection={setSection} />;
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex" }}><NotificationBell portalTarget="agency" />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Figtree:wght@300;400;500;600;700&family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Figtree','DM Sans',sans-serif;}
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-thumb{background:#D4C9B0;border-radius:4px;}
        input::placeholder{color:#9A8F7E;}
        button{transition:all 0.12s;}
        button:hover{opacity:0.84;}
      `}</style>

      <Sidebar activeSection={section} onSection={(s) => { setSection(s); setSelectedCandidate(null); }} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: "100vh" }}>
        {renderMain()}
      </div>

      {selectedCandidate && (
        <CandidateDrawer
          candidate={selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
          onStatusChange={handleStatusChange}
          onSubmitToClient={handleSubmitToClient}
        />
      )}

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} onSent={load} />}
      <AskFlyck />
    </div>
  );
}

