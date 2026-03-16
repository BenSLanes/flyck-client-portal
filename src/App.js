/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { useRealtimeCandidates } from "./hooks/useRealtimeCandidates";
import { NotificationBell } from "./components/NotificationBell";
// ══════════════════════════════════════════
// SUPABASE CONFIG
// ══════════════════════════════════════════
const SUPABASE_URL = "https://dvalaiouqrvwtvdcqkiz.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2YWxhaW91cXJ2d3R2ZGNxa2l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwOTg1MjIsImV4cCI6MjA4ODY3NDUyMn0.xvCccRZHLTtgFDoU9lE5Gql64wRSE8fQwtW6ubGp9yg";

async function setHiddenStatus(supabaseId, action) {
  // action: "archived" | "deleted"
  // Upsert into hidden_candidates table
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/hidden_candidates`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
      },
      body: JSON.stringify({ candidate_id: supabaseId, action }),
    });
  } catch(e) { console.error("Hidden status error", e); }
}

async function fetchHiddenCandidates() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/hidden_candidates`, {
      headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` },
    });
    if (!res.ok) return { deleted: [], archived: [] };
    const rows = await res.json();
    return {
      deleted: rows.filter(r => r.action === "deleted").map(r => r.candidate_id),
      archived: rows.filter(r => r.action === "archived").map(r => r.candidate_id),
    };
  } catch(e) { return { deleted: [], archived: [] }; }
}

async function fetchCandidatesFromSupabase() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/candidates?submitted_to_client=eq.true&select=*&order=submitted_at.desc`, {
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
      },
    });
    console.log("Supabase status:", res.status);
    if (!res.ok) { console.error("Supabase error:", res.status); return []; }
    const rows = await res.json();
    console.log("Supabase rows:", rows.length, rows);
    return rows.map((r) => {
      let rawData = {};
      try { rawData = r.raw_data ? JSON.parse(r.raw_data) : {}; } catch(e) {}
      return ({
      id: r.id,
      supabaseId: r.id,
      rawData,
      name: `${r.first_name || ""} ${r.last_name || ""}`.trim() || r.email,
      initials: `${(r.first_name||"?")[0]}${(r.last_name||"?")[0]}`.toUpperCase(),
      role: r.role || "Candidate",
      email: r.email || "",
      phone: r.phone || "",
      status: "Submitted",
      statusColor: "#2A5A8A",
      pct: ((r.registered ? 25 : 0) + (r.id_verified ? 25 : 0) + (r.hmrc_verified ? 25 : 0) + (r.dbs_verified ? 25 : 0)),
      dob: r.dob || "",
      ni: r.ni_number || "",
      city: r.city || "",
      address: r.address || "",
      postcode: r.postcode || "",
      nationality: r.nationality || "",
      idVerified: false,
      hmrcVerified: false,
      dbsVerified: false,
      gaps: 0,
      registered: true,
      docs: [],
      submittedAt: r.submitted_at,
      isLive: true,
    })});
  } catch (e) {
    console.error("Supabase fetch error:", e);
    return [];
  }
}



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
  slack: "#4A154B",
  teal: "#1A6A6A",
  tealBg: "#1A6A6A14",
};

const BODY_FONT = "'Figtree', 'DM Sans', sans-serif";
const MONO_FONT = "'DM Mono', monospace";
const LOGO_SERIF = "'DM Serif Display', serif";

// ── SHARED UI ──
function Badge({ label, color }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 10px",
        borderRadius: 4,
        background: color + "14",
        border: `1px solid ${color}40`,
        color,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: "nowrap",
        fontFamily: BODY_FONT,
      }}
    >
      {label}
    </span>
  );
}
function Card({ children, style = {}, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: C.bgCard,
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        padding: "18px 20px",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
function Label({ children }) {
  return (
    <label
      style={{
        fontSize: 12,
        color: C.textMid,
        fontFamily: BODY_FONT,
        fontWeight: 500,
        display: "block",
        marginBottom: 5,
      }}
    >
      {children}
    </label>
  );
}
function Input({ placeholder, value, onChange, type = "text", readOnly }) {
  const [f, setF] = useState(false);
  return (
    <input
      readOnly={readOnly}
      type={type}
      placeholder={placeholder}
      value={value || ""}
      onChange={onChange || (() => {})}
      onFocus={() => setF(true)}
      onBlur={() => setF(false)}
      style={{
        width: "100%",
        background: readOnly ? C.bgPanel : C.bgInput,
        border: `1px solid ${f && !readOnly ? C.text : C.border}`,
        borderRadius: 6,
        color: C.text,
        fontSize: 14,
        padding: "9px 12px",
        outline: "none",
        fontFamily: BODY_FONT,
      }}
    />
  );
}
function Sel({ children, value, onChange }) {
  const [f, setF] = useState(false);
  return (
    <select
      value={value || ""}
      onChange={onChange}
      onFocus={() => setF(true)}
      onBlur={() => setF(false)}
      style={{
        width: "100%",
        background: C.bgInput,
        border: `1px solid ${f ? C.text : C.border}`,
        borderRadius: 6,
        color: value ? C.text : C.textFaint,
        fontSize: 14,
        padding: "9px 12px",
        outline: "none",
        fontFamily: BODY_FONT,
        appearance: "none",
      }}
    >
      {children}
    </select>
  );
}
function Textarea({ placeholder, value, onChange, rows = 3 }) {
  const [f, setF] = useState(false);
  return (
    <textarea
      placeholder={placeholder}
      value={value || ""}
      onChange={onChange || (() => {})}
      rows={rows}
      onFocus={() => setF(true)}
      onBlur={() => setF(false)}
      style={{
        width: "100%",
        background: C.bgInput,
        border: `1px solid ${f ? C.text : C.border}`,
        borderRadius: 6,
        color: C.text,
        fontSize: 14,
        padding: "9px 12px",
        outline: "none",
        resize: "vertical",
        fontFamily: BODY_FONT,
        lineHeight: 1.6,
      }}
    />
  );
}
function Btn({ children, onClick, primary, small, disabled, style: ex = {} }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: small ? "5px 14px" : "9px 20px",
        borderRadius: 6,
        border: `1px solid ${primary ? C.text : C.border}`,
        background: primary ? C.text : "transparent",
        color: primary ? "#FAF8F4" : C.textMid,
        fontSize: small ? 12 : 13,
        fontWeight: primary ? 600 : 500,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: BODY_FONT,
        opacity: disabled ? 0.4 : 1,
        ...ex,
      }}
    >
      {children}
    </button>
  );
}
function Divider({ label }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        margin: "20px 0 14px",
      }}
    >
      <div style={{ flex: 1, height: 1, background: C.border }} />
      {label && (
        <span
          style={{
            fontSize: 10,
            color: C.textFaint,
            fontFamily: MONO_FONT,
            letterSpacing: "0.08em",
          }}
        >
          {label}
        </span>
      )}
      <div style={{ flex: 1, height: 1, background: C.border }} />
    </div>
  );
}
function StatCard({ label, value, color, sub }) {
  return (
    <Card style={{ padding: "14px 18px" }}>
      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: color || C.text,
          fontFamily: BODY_FONT,
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 12,
          color: C.textFaint,
          fontFamily: BODY_FONT,
          fontWeight: 500,
          marginTop: 2,
        }}
      >
        {label}
      </div>
      {sub && (
        <div
          style={{
            fontSize: 11,
            color: C.green,
            fontFamily: BODY_FONT,
            marginTop: 3,
          }}
        >
          {sub}
        </div>
      )}
    </Card>
  );
}
function InfoRow({ label, value }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          fontSize: 10,
          color: C.textFaint,
          fontFamily: MONO_FONT,
          letterSpacing: "0.05em",
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 14,
          color: C.text,
          fontFamily: BODY_FONT,
          fontWeight: 500,
        }}
      >
        {value || "—"}
      </div>
    </div>
  );
}
function APIBadge({ status }) {
  const cfg = {
    live: { label: "API Live", col: C.green },
    pending: { label: "Pending", col: C.amber },
    error: { label: "Error", col: C.red },
  };
  const { label, col } = cfg[status] || cfg.pending;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px",
        borderRadius: 20,
        background: col + "18",
        border: `1px solid ${col}40`,
        fontSize: 11,
        color: col,
        fontFamily: MONO_FONT,
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: col,
          display: "inline-block",
        }}
      />
      {label}
    </span>
  );
}
function RadioRow({ q, value, onChange }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontSize: 14,
          color: C.text,
          fontFamily: BODY_FONT,
          marginBottom: 6,
        }}
      >
        {q}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {["Yes", "No"].map((opt) => (
          <label
            key={opt}
            onClick={() => onChange && onChange(opt)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
              padding: "5px 16px",
              background: value === opt ? C.text : C.bgPanel,
              border: `1px solid ${value === opt ? C.text : C.border}`,
              borderRadius: 6,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                border: `1.5px solid ${value === opt ? "#fff" : C.textFaint}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {value === opt && (
                <div
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    background: "#fff",
                  }}
                />
              )}
            </div>
            <span
              style={{
                fontSize: 14,
                color: value === opt ? "#fff" : C.textMid,
                fontFamily: BODY_FONT,
              }}
            >
              {opt}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
function CheckRow({ label, checked, sub }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        padding: "10px 14px",
        background: checked ? C.text : C.bgPanel,
        border: `1px solid ${checked ? C.text : C.border}`,
        borderRadius: 6,
        marginBottom: 7,
      }}
    >
      <div
        style={{
          width: 15,
          height: 15,
          borderRadius: 3,
          border: `1.5px solid ${checked ? "#fff" : C.borderDk}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 9,
          color: "#fff",
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        {checked ? "✓" : ""}
      </div>
      <div>
        <div
          style={{
            fontSize: 13,
            color: checked ? "#fff" : C.textMid,
            fontFamily: BODY_FONT,
            lineHeight: 1.4,
          }}
        >
          {label}
        </div>
        {sub && (
          <div
            style={{
              fontSize: 12,
              color: checked ? "#ffffff90" : C.textFaint,
              fontFamily: BODY_FONT,
              marginTop: 2,
            }}
          >
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

// ── CLIENT DATA ──
const CLIENT_NAME = "BRS Transport";
const CLIENT_COLOR = "#1A5C1A";

const CLIENT_CANDIDATES_INIT = [
  {
    id: "c1",
    name: "Marcus Thompson",
    initials: "MT",
    role: "Ground Staff Supervisor",
    email: "m.thompson@brstransport.co.uk",
    phone: "+44 7700 901001",
    status: "Fully Cleared",
    statusColor: C.green,
    pct: 100,
    dob: "4 Feb 1985",
    ni: "MT 12 34 56 A",
    city: "Heathrow",
    idVerified: true,
    hmrcVerified: true,
    dbsVerified: true,
    gaps: 0,
    registered: true,
    docs: [
      {
        name: "Passport Scan",
        date: "14 Jan 2025",
        status: "Verified",
        icon: "🪪",
      },
      {
        name: "DBS Basic Certificate",
        date: "16 Jan 2025",
        status: "Verified",
        icon: "✅",
      },
      {
        name: "HMRC Employment History PDF",
        date: "15 Jan 2025",
        status: "Verified",
        icon: "📋",
      },
    ],
  },
  {
    id: "c2",
    name: "Jade Okonkwo",
    initials: "JO",
    role: "Ramp Agent",
    email: "j.okonkwo@brstransport.co.uk",
    phone: "+44 7700 902002",
    status: "HMRC Needed",
    statusColor: C.purple,
    pct: 55,
    dob: "19 Aug 1997",
    ni: "JO 56 78 90 B",
    city: "Heathrow",
    idVerified: true,
    hmrcVerified: false,
    dbsVerified: false,
    gaps: 0,
    registered: true,
    docs: [
      {
        name: "Passport Scan",
        date: "20 Jan 2025",
        status: "Verified",
        icon: "🪪",
      },
    ],
  },
  {
    id: "c3",
    name: "Oliver Hartley",
    initials: "OH",
    role: "Airside Driver",
    email: "o.hartley@brstransport.co.uk",
    phone: "+44 7700 903003",
    status: "Gap Flagged",
    statusColor: C.amber,
    pct: 68,
    dob: "30 May 1991",
    ni: "OH 90 12 34 C",
    city: "Heathrow",
    idVerified: true,
    hmrcVerified: false,
    dbsVerified: false,
    gaps: 2,
    registered: true,
    docs: [
      {
        name: "Passport Scan",
        date: "22 Jan 2025",
        status: "Verified",
        icon: "🪪",
      },
      {
        name: "Driving Licence",
        date: "22 Jan 2025",
        status: "Verified",
        icon: "🚗",
      },
    ],
  },
  {
    id: "c4",
    name: "Fatima Al-Rashid",
    initials: "FA",
    role: "Cabin Crew Coordinator",
    email: "f.alrashid@brstransport.co.uk",
    phone: "+44 7700 904004",
    status: "Not Started",
    statusColor: C.textFaint,
    pct: 10,
    dob: "11 Nov 2000",
    ni: "FA 34 56 78 D",
    city: "Gatwick",
    idVerified: false,
    hmrcVerified: false,
    dbsVerified: false,
    gaps: 0,
    registered: false,
    docs: [],
  },
];

// ── AGENCIES DATA ──
const AGENCIES = [
  {
    id: "a1",
    name: "The Lanes Group",
    initials: "TL",
    color: "#2A5A8A",
    contact: "Rachel Simmons",
    contactRole: "Account Manager",
    contactEmail: "r.simmons@lanesgroup.co.uk",
    contactPhone: "+44 7911 100200",
    address: "12 Aviation House, Heathrow, TW6 2AQ",
    since: "March 2021",
    contractEnd: "March 2026",
    sla: "48hr turnaround",
    candidates: [
      {
        id: 101,
        name: "Daniel Fraser",
        initials: "DF",
        role: "Ground Staff",
        email: "d.fraser@email.com",
        phone: "+44 7800 111222",
        status: "Fully Cleared",
        statusColor: C.green,
        pct: 100,
        dob: "12 Jun 1990",
        ni: "AB 12 34 56 C",
        city: "London",
        idVerified: true,
        hmrcVerified: true,
        dbsVerified: true,
        gaps: 0,
        docs: [
          {
            name: "Passport Scan",
            date: "10 Mar 2024",
            status: "Verified",
            icon: "🪪",
          },
          {
            name: "DBS Basic Certificate",
            date: "12 Mar 2024",
            status: "Verified",
            icon: "✅",
          },
          {
            name: "HMRC Employment History PDF",
            date: "11 Mar 2024",
            status: "Verified",
            icon: "📋",
          },
        ],
      },
      {
        id: 102,
        name: "Priya Nair",
        initials: "PN",
        role: "Cabin Crew",
        email: "p.nair@email.com",
        phone: "+44 7800 222333",
        status: "Gap Flagged",
        statusColor: C.amber,
        pct: 65,
        dob: "5 Feb 1994",
        ni: "CD 56 78 90 A",
        city: "London",
        idVerified: true,
        hmrcVerified: false,
        dbsVerified: false,
        gaps: 1,
        docs: [
          {
            name: "Passport Scan",
            date: "8 Mar 2024",
            status: "Verified",
            icon: "🪪",
          },
        ],
      },
      {
        id: 103,
        name: "Ben Okafor",
        initials: "BO",
        role: "Security Officer",
        email: "b.okafor@email.com",
        phone: "+44 7800 333444",
        status: "Fully Cleared",
        statusColor: C.green,
        pct: 100,
        dob: "20 Sep 1988",
        ni: "EF 90 12 34 B",
        city: "Heathrow",
        idVerified: true,
        hmrcVerified: true,
        dbsVerified: true,
        gaps: 0,
        docs: [
          {
            name: "Passport Scan",
            date: "5 Mar 2024",
            status: "Verified",
            icon: "🪪",
          },
          {
            name: "DBS Basic Certificate",
            date: "7 Mar 2024",
            status: "Verified",
            icon: "✅",
          },
        ],
      },
      {
        id: 104,
        name: "Chloe Barnes",
        initials: "CB",
        role: "Gate Agent",
        email: "c.barnes@email.com",
        phone: "+44 7800 444555",
        status: "HMRC Needed",
        statusColor: C.purple,
        pct: 55,
        dob: "3 Nov 1997",
        ni: "GH 34 56 78 C",
        city: "London",
        idVerified: true,
        hmrcVerified: false,
        dbsVerified: false,
        gaps: 0,
        docs: [
          {
            name: "Passport Scan",
            date: "14 Mar 2024",
            status: "Verified",
            icon: "🪪",
          },
        ],
      },
    ],
  },
  {
    id: "a2",
    name: "Team Logistics",
    initials: "TM",
    color: "#3A7055",
    contact: "James Whitfield",
    contactRole: "Operations Director",
    contactEmail: "j.whitfield@teamlogistics.co.uk",
    contactPhone: "+44 7922 200300",
    address: "Unit 4 Cargo Way, Manchester Airport, M90 1QX",
    since: "January 2022",
    contractEnd: "January 2027",
    sla: "72hr turnaround",
    candidates: [
      {
        id: 201,
        name: "Leah Summers",
        initials: "LS",
        role: "Cargo Handler",
        email: "l.summers@email.com",
        phone: "+44 7810 555666",
        status: "Fully Cleared",
        statusColor: C.green,
        pct: 100,
        dob: "14 Apr 1991",
        ni: "IJ 78 90 12 A",
        city: "Manchester",
        idVerified: true,
        hmrcVerified: true,
        dbsVerified: true,
        gaps: 0,
        docs: [
          {
            name: "Passport Scan",
            date: "20 Jan 2024",
            status: "Verified",
            icon: "🪪",
          },
          {
            name: "DBS Basic Certificate",
            date: "22 Jan 2024",
            status: "Verified",
            icon: "✅",
          },
        ],
      },
      {
        id: 202,
        name: "Ryan Moss",
        initials: "RM",
        role: "Ground Staff",
        email: "r.moss@email.com",
        phone: "+44 7810 666777",
        status: "DBS Flagged",
        statusColor: C.red,
        pct: 45,
        dob: "8 Jul 1986",
        ni: "KL 12 34 56 B",
        city: "Manchester",
        idVerified: true,
        hmrcVerified: true,
        dbsVerified: false,
        gaps: 0,
        docs: [
          {
            name: "Passport Scan",
            date: "18 Jan 2024",
            status: "Verified",
            icon: "🪪",
          },
          {
            name: "DBS Certificate (Disclosed)",
            date: "25 Jan 2024",
            status: "Under Review",
            icon: "⚠️",
          },
        ],
      },
      {
        id: 203,
        name: "Aisha Mwangi",
        initials: "AM",
        role: "Cabin Crew",
        email: "a.mwangi@email.com",
        phone: "+44 7810 777888",
        status: "Refs Pending",
        statusColor: C.blue,
        pct: 70,
        dob: "22 Dec 1993",
        ni: "MN 56 78 90 C",
        city: "Manchester",
        idVerified: true,
        hmrcVerified: true,
        dbsVerified: false,
        gaps: 0,
        docs: [
          {
            name: "Passport Scan",
            date: "16 Jan 2024",
            status: "Verified",
            icon: "🪪",
          },
          {
            name: "HMRC Employment History PDF",
            date: "18 Jan 2024",
            status: "Verified",
            icon: "📋",
          },
        ],
      },
      {
        id: 204,
        name: "Tom Keane",
        initials: "TK",
        role: "Ramp Agent",
        email: "t.keane@email.com",
        phone: "+44 7810 888999",
        status: "Not Started",
        statusColor: C.textFaint,
        pct: 10,
        dob: "30 Mar 2000",
        ni: "OP 90 12 34 A",
        city: "Manchester",
        idVerified: false,
        hmrcVerified: false,
        dbsVerified: false,
        gaps: 0,
        docs: [],
      },
    ],
  },
  {
    id: "a3",
    name: "AeroStaffing",
    initials: "AS",
    color: "#A0700A",
    contact: "Nina Patel",
    contactRole: "Compliance Lead",
    contactEmail: "n.patel@aerostaffing.co.uk",
    contactPhone: "+44 7933 300400",
    address: "Skyway House, Birmingham Airport, B26 3QJ",
    since: "June 2020",
    contractEnd: "June 2025",
    sla: "24hr turnaround",
    candidates: [
      {
        id: 301,
        name: "Femi Adeyemi",
        initials: "FA",
        role: "Security Officer",
        email: "f.adeyemi@email.com",
        phone: "+44 7820 100200",
        status: "Fully Cleared",
        statusColor: C.green,
        pct: 100,
        dob: "17 Aug 1985",
        ni: "QR 34 56 78 B",
        city: "Birmingham",
        idVerified: true,
        hmrcVerified: true,
        dbsVerified: true,
        gaps: 0,
        docs: [
          {
            name: "Passport Scan",
            date: "5 Jun 2023",
            status: "Verified",
            icon: "🪪",
          },
          {
            name: "DBS Basic Certificate",
            date: "7 Jun 2023",
            status: "Verified",
            icon: "✅",
          },
          {
            name: "HMRC Employment History PDF",
            date: "6 Jun 2023",
            status: "Verified",
            icon: "📋",
          },
        ],
      },
      {
        id: 302,
        name: "Sophie Clarke",
        initials: "SC",
        role: "Gate Agent",
        email: "s.clarke@email.com",
        phone: "+44 7820 200300",
        status: "Gap Flagged",
        statusColor: C.amber,
        pct: 60,
        dob: "11 Jan 1996",
        ni: "ST 78 90 12 A",
        city: "Birmingham",
        idVerified: true,
        hmrcVerified: false,
        dbsVerified: false,
        gaps: 2,
        docs: [
          {
            name: "Passport Scan",
            date: "3 Jun 2023",
            status: "Verified",
            icon: "🪪",
          },
        ],
      },
      {
        id: 303,
        name: "Marcus Bell",
        initials: "MB",
        role: "Cargo Handler",
        email: "m.bell@email.com",
        phone: "+44 7820 300400",
        status: "Fully Cleared",
        statusColor: C.green,
        pct: 100,
        dob: "28 May 1989",
        ni: "UV 12 34 56 C",
        city: "Birmingham",
        idVerified: true,
        hmrcVerified: true,
        dbsVerified: true,
        gaps: 0,
        docs: [
          {
            name: "Passport Scan",
            date: "1 Jun 2023",
            status: "Verified",
            icon: "🪪",
          },
          {
            name: "DBS Basic Certificate",
            date: "4 Jun 2023",
            status: "Verified",
            icon: "✅",
          },
        ],
      },
      {
        id: 304,
        name: "Yemi Osei",
        initials: "YO",
        role: "Ground Staff",
        email: "y.osei@email.com",
        phone: "+44 7820 400500",
        status: "HMRC Needed",
        statusColor: C.purple,
        pct: 50,
        dob: "4 Sep 1992",
        ni: "WX 56 78 90 B",
        city: "Birmingham",
        idVerified: true,
        hmrcVerified: false,
        dbsVerified: false,
        gaps: 0,
        docs: [
          {
            name: "Passport Scan",
            date: "8 Jun 2023",
            status: "Verified",
            icon: "🪪",
          },
        ],
      },
    ],
  },
  {
    id: "a4",
    name: "AviationMate",
    initials: "AV",
    color: "#6A4A8A",
    contact: "Chris Huang",
    contactRole: "Senior Partner",
    contactEmail: "c.huang@aviationmate.co.uk",
    contactPhone: "+44 7944 400500",
    address: "Terminal House, Gatwick, RH6 0NP",
    since: "September 2023",
    contractEnd: "September 2026",
    sla: "96hr turnaround",
    candidates: [
      {
        id: 401,
        name: "Grace Adkins",
        initials: "GA",
        role: "Cabin Crew",
        email: "g.adkins@email.com",
        phone: "+44 7830 500600",
        status: "Fully Cleared",
        statusColor: C.green,
        pct: 100,
        dob: "9 Mar 1995",
        ni: "YZ 90 12 34 A",
        city: "Gatwick",
        idVerified: true,
        hmrcVerified: true,
        dbsVerified: true,
        gaps: 0,
        docs: [
          {
            name: "Passport Scan",
            date: "15 Sep 2023",
            status: "Verified",
            icon: "🪪",
          },
          {
            name: "DBS Basic Certificate",
            date: "18 Sep 2023",
            status: "Verified",
            icon: "✅",
          },
        ],
      },
      {
        id: 402,
        name: "Oliver Webb",
        initials: "OW",
        role: "Ground Staff",
        email: "o.webb@email.com",
        phone: "+44 7830 600700",
        status: "Not Started",
        statusColor: C.textFaint,
        pct: 10,
        dob: "21 Jul 1999",
        ni: "AB 34 56 78 C",
        city: "Gatwick",
        idVerified: false,
        hmrcVerified: false,
        dbsVerified: false,
        gaps: 0,
        docs: [],
      },
      {
        id: 403,
        name: "Fatou Diallo",
        initials: "FD",
        role: "Security Officer",
        email: "f.diallo@email.com",
        phone: "+44 7830 700800",
        status: "Refs Pending",
        statusColor: C.blue,
        pct: 65,
        dob: "18 Nov 1990",
        ni: "CD 78 90 12 B",
        city: "Gatwick",
        idVerified: true,
        hmrcVerified: true,
        dbsVerified: false,
        gaps: 0,
        docs: [
          {
            name: "Passport Scan",
            date: "12 Sep 2023",
            status: "Verified",
            icon: "🪪",
          },
          {
            name: "HMRC Employment History PDF",
            date: "14 Sep 2023",
            status: "Verified",
            icon: "📋",
          },
        ],
      },
      {
        id: 404,
        name: "Theo Morgan",
        initials: "TM",
        role: "Ramp Agent",
        email: "t.morgan@email.com",
        phone: "+44 7830 800900",
        status: "DBS Flagged",
        statusColor: C.red,
        pct: 40,
        dob: "7 Feb 1988",
        ni: "EF 12 34 56 A",
        city: "Gatwick",
        idVerified: true,
        hmrcVerified: true,
        dbsVerified: false,
        gaps: 0,
        docs: [
          {
            name: "Passport Scan",
            date: "10 Sep 2023",
            status: "Verified",
            icon: "🪪",
          },
          {
            name: "DBS Certificate (Disclosed)",
            date: "20 Sep 2023",
            status: "Under Review",
            icon: "⚠️",
          },
        ],
      },
    ],
  },
];

function agencyStats(agency) {
  const cs = agency.candidates;
  const total = cs.length;
  const cleared = cs.filter((c) => c.pct >= 90).length;
  const flagged = cs.filter(
    (c) => c.statusColor === C.red || c.statusColor === C.amber
  ).length;
  const pending = cs.filter((c) => c.pct < 90 && c.pct > 15).length;
  return { total, cleared, flagged, pending };
}

// ── SLACK MODAL ──
function SlackModal({ onClose }) {
  const [events, setEvents] = useState({
    gap: true,
    dbs: true,
    clear: true,
    hmrc: false,
    id: false,
  });
  const [saved, setSaved] = useState(false);
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        zIndex: 300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 500,
          background: C.bgCard,
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            background: C.slack,
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span style={{ fontSize: 24 }}>💬</span>
          <div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#fff",
                fontFamily: BODY_FONT,
              }}
            >
              Slack Integration
            </div>
            <div
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.7)",
                fontFamily: BODY_FONT,
              }}
            >
              Real-time compliance notifications
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              marginLeft: "auto",
              background: "rgba(255,255,255,0.15)",
              border: "none",
              borderRadius: 6,
              width: 28,
              height: 28,
              cursor: "pointer",
              color: "#fff",
              fontSize: 14,
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: 24 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: C.greenBg,
              border: `1px solid ${C.green}40`,
              borderRadius: 7,
              padding: "10px 14px",
              marginBottom: 18,
            }}
          >
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: C.green,
              }}
            />
            <span
              style={{
                fontSize: 13,
                color: C.green,
                fontFamily: BODY_FONT,
                fontWeight: 600,
              }}
            >
              Connected · #compliance-alerts · Flyck.ai workspace
            </span>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              marginBottom: 18,
            }}
          >
            <div>
              <Label>Bot Token</Label>
              <Input value="xoxb-••••••••••••" readOnly />
            </div>
            <div>
              <Label>Channel</Label>
              <Input value="#compliance-alerts" readOnly />
            </div>
          </div>
          <Divider label="TRIGGERS" />
          {[
            ["gap", "Employment gap > 28 days"],
            ["dbs", "DBS flagged / disclosed"],
            ["clear", "Candidate fully cleared"],
            ["hmrc", "HMRC data extracted"],
            ["id", "ID verification done"],
          ].map(([k, label]) => (
            <div
              key={k}
              onClick={() => setEvents((e) => ({ ...e, [k]: !e[k] }))}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 12px",
                background: events[k] ? C.purpleBg : C.bgPanel,
                border: `1px solid ${events[k] ? C.purple + "40" : C.border}`,
                borderRadius: 6,
                marginBottom: 6,
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 3,
                  border: `1.5px solid ${events[k] ? C.purple : C.borderDk}`,
                  background: events[k] ? C.purple : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 9,
                  color: "#fff",
                }}
              >
                {events[k] ? "✓" : ""}
              </div>
              <span
                style={{ fontSize: 13, color: C.text, fontFamily: BODY_FONT }}
              >
                {label}
              </span>
            </div>
          ))}
          <Divider label="RECENT SENT" />
          {[
            ["John Smith fully cleared", "Today 14:32", C.green],
            ["Sarah Khan — 182-day gap", "Today 11:15", C.amber],
            ["Ahmed Rahman — DBS disclosed", "Yesterday 09:44", C.red],
          ].map(([m, t, col], i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 8,
                padding: "7px 0",
                borderBottom: i < 2 ? `1px solid ${C.border}` : "none",
              }}
            >
              <div
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: col,
                  marginTop: 5,
                  flexShrink: 0,
                }}
              />
              <div>
                <div
                  style={{
                    fontSize: 13,
                    color: C.textMid,
                    fontFamily: BODY_FONT,
                  }}
                >
                  {m}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: C.textFaint,
                    fontFamily: MONO_FONT,
                  }}
                >
                  {t}
                </div>
              </div>
            </div>
          ))}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 18,
            }}
          >
            <Btn onClick={onClose}>Close</Btn>
            <Btn
              primary
              onClick={() => {
                setSaved(true);
                setTimeout(() => {
                  setSaved(false);
                  onClose();
                }, 1300);
              }}
            >
              {saved ? "✓ Saved" : "Save Settings"}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── PERSONAL PROFILE PANEL ──
function PersonalProfilePanel({ candidate, onClose }) {
  const [tab, setTab] = useState("profile");
  const tabs = [
    { id: "profile", label: "Personal Details" },
    { id: "health", label: "Health Questionnaire" },
    { id: "consent", label: "Consent & Declarations" },
  ];
  const isJohn = candidate.id === 1;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.3)",
        zIndex: 200,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "flex-end",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 640,
          height: "100vh",
          background: C.bgCard,
          borderLeft: `1px solid ${C.border}`,
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: "18px 24px",
            borderBottom: `1px solid ${C.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: C.bgCard,
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: C.text,
                fontFamily: BODY_FONT,
              }}
            >
              Personal Profile
            </div>
            <div
              style={{
                fontSize: 12,
                color: C.textFaint,
                fontFamily: BODY_FONT,
                marginTop: 1,
              }}
            >
              {candidate.name}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              width: 32,
              height: 32,
              cursor: "pointer",
              color: C.textMid,
              fontSize: 14,
            }}
          >
            ✕
          </button>
        </div>
        <div
          style={{
            display: "flex",
            borderBottom: `1px solid ${C.border}`,
            background: C.bgPanel,
            flexShrink: 0,
          }}
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1,
                padding: "11px 8px",
                background: "none",
                border: "none",
                borderBottom:
                  tab === t.id
                    ? `2px solid ${C.text}`
                    : "2px solid transparent",
                color: tab === t.id ? C.text : C.textFaint,
                fontSize: 13,
                cursor: "pointer",
                fontFamily: BODY_FONT,
                fontWeight: tab === t.id ? 600 : 400,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          {tab === "profile" && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  marginBottom: 22,
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    background: C.bgPanel,
                    border: `2px solid ${C.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    fontWeight: 700,
                    color: C.text,
                    fontFamily: MONO_FONT,
                  }}
                >
                  {candidate.initials}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: C.text,
                      fontFamily: BODY_FONT,
                    }}
                  >
                    {candidate.name}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 7,
                      marginTop: 5,
                      flexWrap: "wrap",
                    }}
                  >
                    <Badge label={candidate.role} color={C.blue} />
                    <Badge
                      label={candidate.status}
                      color={candidate.statusColor}
                    />
                  </div>
                </div>
              </div>
              <Divider label="PERSONAL DETAILS" />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0 24px",
                }}
              >
                <InfoRow label="DATE OF BIRTH" value={candidate.dob} />
                <InfoRow label="NATIONAL INSURANCE" value={candidate.ni} />
                <InfoRow label="EMAIL" value={candidate.email} />
                <InfoRow label="MOBILE" value={candidate.phone} />
              </div>
              {candidate.address && (
                <>
                  <Divider label="HOME ADDRESS" />
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "0 24px",
                    }}
                  >
                    <InfoRow label="ADDRESS" value={candidate.address} />
                    <InfoRow label="CITY" value={candidate.city} />
                    <InfoRow label="POSTCODE" value={candidate.postcode} />
                    <InfoRow label="COUNTRY" value={candidate.country} />
                  </div>
                </>
              )}
              <Divider label="IDENTITY & DIVERSITY" />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0 24px",
                }}
              >
                <InfoRow label="SEX" value={candidate.sex} />
                <InfoRow label="NATIONALITY" value={candidate.nationality} />
                <InfoRow label="ETHNICITY" value={candidate.ethnicity} />
              </div>
            </div>
          )}
          {tab === "health" && (
            <div>
              <div
                style={{
                  background: C.bgPanel,
                  border: `1px solid ${C.border}`,
                  borderRadius: 7,
                  padding: "10px 14px",
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    color: C.textFaint,
                    fontFamily: BODY_FONT,
                    lineHeight: 1.5,
                  }}
                >
                  Strictly Confidential — Medical information is not used in
                  compliance or recruitment decisions.
                </div>
              </div>
              {isJohn ? (
                <div>
                  <div
                    style={{
                      background: C.greenBg,
                      border: `1px solid ${C.green}40`,
                      borderRadius: 8,
                      padding: "12px 16px",
                      marginBottom: 18,
                      display: "flex",
                      gap: 10,
                      alignItems: "center",
                    }}
                  >
                    <span style={{ color: C.green }}>✓</span>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: C.green,
                        fontFamily: BODY_FONT,
                      }}
                    >
                      Health Questionnaire Completed · 20 Apr 2024
                    </div>
                  </div>
                  {[
                    ["Do you have any medical conditions?", "No"],
                    ["Are you taking prescribed medication?", "No"],
                    ["Are you able to stand for extended periods?", "Yes"],
                  ].map(([q, a]) => (
                    <div
                      key={q}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 0",
                        borderBottom: `1px solid ${C.border}`,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 14,
                          color: C.text,
                          fontFamily: BODY_FONT,
                        }}
                      >
                        {q}
                      </div>
                      <Badge label={a} color={a === "Yes" ? C.green : C.text} />
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    fontSize: 13,
                    color: C.textFaint,
                    fontFamily: BODY_FONT,
                    padding: "20px 0",
                    textAlign: "center",
                  }}
                >
                  Health questionnaire not yet completed by candidate.
                </div>
              )}
            </div>
          )}
          {tab === "consent" && (
            <div>
              <Divider label="CONSENTS" />
              <CheckRow
                label="I consent to a DBS Basic Disclosure criminal record check"
                sub="Required for all airside and security-designated roles under CAP 2330"
                checked={isJohn}
              />
              <CheckRow
                label="I consent to my employment history being verified via HMRC records"
                checked={isJohn}
              />
              <CheckRow
                label="I consent to employment references being requested from previous employers"
                checked={isJohn}
              />
              <CheckRow
                label="I consent to my personal data being processed for pre-employment screening under UK GDPR"
                checked={isJohn}
              />
              <Divider label="ACCURACY DECLARATION" />
              <CheckRow
                label="I declare that all information provided is accurate, true and complete"
                checked={isJohn}
              />
            </div>
          )}
        </div>
        <div
          style={{
            padding: "14px 24px",
            borderTop: `1px solid ${C.border}`,
            background: C.bgCard,
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            position: "sticky",
            bottom: 0,
          }}
        >
          <Btn onClick={onClose}>Close</Btn>
          <Btn primary>Edit Profile</Btn>
        </div>
      </div>
    </div>
  );
}

// ── ID PANEL ──

function DocViewer({ file, label }) {
  if (!file || !file.data) return (
    <div style={{ background: C.bgPanel, border: `1px dashed ${C.border}`, borderRadius: 8, padding: "16px", textAlign: "center", color: C.textFaint, fontSize: 13, fontFamily: BODY_FONT }}>
      No document uploaded
    </div>
  );
  const isImage = file.type && file.type.startsWith("image/");
  const isPDF = file.type === "application/pdf" || (file.name && file.name.endsWith(".pdf"));
  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden", marginBottom: 12 }}>
      <div style={{ padding: "10px 14px", background: C.bgPanel, borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: BODY_FONT }}>📄 {label || file.name}</div>
        <a href={file.data} download={file.name} style={{ fontSize: 12, color: C.blue, fontFamily: BODY_FONT, textDecoration: "none", fontWeight: 600 }}>⬇ Download</a>
      </div>
      {isImage && <img src={file.data} alt={label} style={{ width: "100%", display: "block", maxHeight: 400, objectFit: "contain", background: "#000" }} />}
      {isPDF && <iframe src={file.data} style={{ width: "100%", height: 400, border: "none", display: "block" }} title={label} />}
      {!isImage && !isPDF && (
        <div style={{ padding: 16, color: C.textMid, fontSize: 13, fontFamily: BODY_FONT }}>
          {file.name} — <a href={file.data} download={file.name} style={{ color: C.blue }}>Click to download</a>
        </div>
      )}
    </div>
  );
}

function DocSection({ title, files }) {
  const fileList = Array.isArray(files) ? files : (files ? [files] : []);
  const validFiles = fileList.filter(f => f && f.data);
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: BODY_FONT, marginBottom: 10, paddingBottom: 6, borderBottom: `1px solid ${C.border}` }}>
        {title} {validFiles.length > 0 ? <span style={{ color: C.green, fontWeight: 400 }}>({validFiles.length} file{validFiles.length !== 1 ? "s" : ""})</span> : <span style={{ color: C.textFaint, fontWeight: 400 }}>(none uploaded)</span>}
      </div>
      {validFiles.length === 0 
        ? <div style={{ color: C.textFaint, fontSize: 12, fontFamily: BODY_FONT }}>No documents uploaded for this section.</div>
        : validFiles.map((f, i) => <DocViewer key={i} file={f} label={f.name || `${title} ${i+1}`} />)
      }
    </div>
  );
}

function IDPanel({ candidate, onClose }) {
  const hasPP = !!candidate.passportNum;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.3)",
        zIndex: 200,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "flex-end",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 560,
          height: "100vh",
          background: C.bgCard,
          borderLeft: `1px solid ${C.border}`,
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: "18px 24px",
            borderBottom: `1px solid ${C.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: C.bgCard,
            position: "sticky",
            top: 0,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: C.text,
                fontFamily: BODY_FONT,
              }}
            >
              ID Verification
            </div>
            <div
              style={{
                fontSize: 12,
                color: C.textFaint,
                fontFamily: BODY_FONT,
              }}
            >
              {candidate.name}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              width: 32,
              height: 32,
              cursor: "pointer",
              color: C.textMid,
              fontSize: 14,
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: 24 }}>
          {candidate.idVerified ? (
            <div
              style={{
                background: C.greenBg,
                border: `1px solid ${C.green}40`,
                borderRadius: 8,
                padding: "12px 16px",
                marginBottom: 20,
                display: "flex",
                gap: 10,
                alignItems: "center",
              }}
            >
              <span style={{ color: C.green, fontSize: 18 }}>✓</span>
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: C.green,
                    fontFamily: BODY_FONT,
                  }}
                >
                  Identity Verified via Onfido
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: C.textMid,
                    fontFamily: MONO_FONT,
                  }}
                >
                  Trust Score 4.7/5 · e-KYC passed
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                background: C.amberBg,
                border: `1px solid ${C.amber}40`,
                borderRadius: 8,
                padding: "12px 16px",
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  color: C.amber,
                  fontFamily: BODY_FONT,
                  fontWeight: 600,
                }}
              >
                ⚠ ID verification not yet completed
              </div>
            </div>
          )}
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: C.text,
              fontFamily: BODY_FONT,
              marginBottom: 12,
            }}
          >
            Passport
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              marginBottom: 18,
            }}
          >
            {[
              ["Number", hasPP ? candidate.passportNum : "Not provided"],
              ["Issuing Country", hasPP ? candidate.passportCountry : "—"],
              ["Expiry", hasPP ? candidate.passportExpiry : "—"],
              [
                "Right to Work",
                candidate.rightToWork || "British or Irish Citizen",
              ],
            ].map(([k, v]) => (
              <div
                key={k}
                style={{
                  background: C.bgPanel,
                  border: `1px solid ${C.border}`,
                  borderRadius: 7,
                  padding: "10px 12px",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: C.textFaint,
                    fontFamily: MONO_FONT,
                    marginBottom: 2,
                  }}
                >
                  {k}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color:
                      v === "—" || v === "Not provided" ? C.textFaint : C.text,
                    fontFamily: BODY_FONT,
                    fontWeight: 500,
                  }}
                >
                  {v}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: "0 24px 24px" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: BODY_FONT, marginBottom: 14 }}>📁 Uploaded Documents</div>
          {(() => {
            const rd = candidate.rawData || {};
            return (<>
              <DocSection title="Passport" files={rd.passport} />
              <DocSection title="Driving Licence" files={rd.drivingLicence || rd.dvlaDocument} />
              <DocSection title="NI Proof" files={rd.niProof} />
              <DocSection title="Proof of Address" files={rd.proofOfAddress} />
              <DocSection title="Residence Permit" files={rd.residencePermit} />
              <DocSection title="Visa" files={rd.visaDoc} />
              <DocSection title="Selfie / Liveness" files={rd.selfie} />
            </>);
          })()}
        </div>
        <div
          style={{
            padding: "14px 24px",
            borderTop: `1px solid ${C.border}`,
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            background: C.bgCard,
            position: "sticky",
            bottom: 0,
          }}
        >
          <Btn onClick={onClose}>Close</Btn>
        </div>
      </div>
    </div>
  );
}

// ── REFERENCE REMINDER SECTION ──
function ReferenceReminderSection({ candidate }) {
  const [reminderSent, setReminderSent] = useState(false);
  const [sending, setSending] = useState(false);
  const gap = candidate.gap;
  if (!gap) return null;
  return (
    <div
      style={{
        background: C.bgPanel,
        border: `1px solid ${C.border}`,
        borderRadius: 9,
        overflow: "hidden",
        marginBottom: 12,
      }}
    >
      <div
        style={{
          background: C.purpleBg,
          borderBottom: `1px solid ${C.purple}30`,
          padding: "10px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: C.purple,
            fontFamily: BODY_FONT,
          }}
        >
          Personal Reference · Auto-Reminder Active
        </div>
        <Badge
          label={reminderSent ? "Reminder Sent" : "Email Opened"}
          color={reminderSent ? C.green : C.amber}
        />
      </div>
      <div style={{ padding: "14px 16px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            marginBottom: 14,
          }}
        >
          {[
            ["Name", gap.refName],
            ["Relationship", gap.refRelation],
            ["Email", gap.refEmail],
            ["Phone", gap.refPhone],
          ].map(([k, v]) => (
            <div
              key={k}
              style={{
                background: C.bgCard,
                border: `1px solid ${C.border}`,
                borderRadius: 6,
                padding: "8px 12px",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: C.textFaint,
                  fontFamily: MONO_FONT,
                }}
              >
                {k}
              </div>
              <div
                style={{ fontSize: 13, color: C.text, fontFamily: BODY_FONT }}
              >
                {v}
              </div>
            </div>
          ))}
        </div>
        {reminderSent && (
          <div
            style={{
              background: C.greenBg,
              border: `1px solid ${C.green}40`,
              borderRadius: 7,
              padding: "10px 14px",
              marginBottom: 12,
            }}
          >
            <div
              style={{
                fontSize: 13,
                color: C.green,
                fontFamily: BODY_FONT,
                fontWeight: 600,
              }}
            >
              ✓ Manual reminder sent successfully
            </div>
          </div>
        )}
        <div
          style={{
            display: "flex",
            gap: 8,
            borderTop: `1px solid ${C.border}`,
            paddingTop: 12,
          }}
        >
          <button
            onClick={() => {
              if (sending || reminderSent) return;
              setSending(true);
              setTimeout(() => {
                setSending(false);
                setReminderSent(true);
              }, 1400);
            }}
            disabled={sending || reminderSent}
            style={{
              flex: 1,
              padding: "9px 0",
              background: C.purple,
              border: "none",
              borderRadius: 6,
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: sending || reminderSent ? "not-allowed" : "pointer",
              fontFamily: BODY_FONT,
              opacity: sending || reminderSent ? 0.5 : 1,
            }}
          >
            {sending
              ? "Sending…"
              : reminderSent
              ? "✓ Reminder Sent"
              : "📧 Send Manual Reminder"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── HMRC PANEL ──
function HMRCPanel({ candidate, onClose }) {
  const [apiState, setApiState] = useState(
    candidate.hmrcVerified ? "connected" : "idle"
  );
  const [_querying, setQuerying] = useState(false);
  const [queryDone, setQueryDone] = useState(candidate.hmrcVerified);
  const handleAPIQuery = () => {
    setQuerying(true);
    setApiState("loading");
    setTimeout(() => {
      setQuerying(false);
      setApiState("connected");
      setQueryDone(true);
    }, 2200);
  };
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.3)",
        zIndex: 200,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "flex-end",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 640,
          height: "100vh",
          background: C.bgCard,
          borderLeft: `1px solid ${C.border}`,
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: "18px 24px",
            borderBottom: `1px solid ${C.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: C.bgCard,
            position: "sticky",
            top: 0,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: C.text,
                fontFamily: BODY_FONT,
              }}
            >
              HMRC Tax Reference
            </div>
            <div
              style={{
                fontSize: 12,
                color: C.textFaint,
                fontFamily: BODY_FONT,
              }}
            >
              {candidate.name}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              width: 32,
              height: 32,
              cursor: "pointer",
              color: C.textMid,
              fontSize: 14,
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: 24 }}>
          {(() => {
            const rd = candidate.rawData || {};
            const parsed = rd.hmrcParsed || null;
            const employments = parsed?.employments || [];
            const gaps = parsed?.gaps || [];
            const gapData = rd.gapData || {};
            const hasData = employments.length > 0;

            return (<>
              {/* Status banner */}
              {hasData ? (
                <div style={{ background: C.greenBg, border: `1px solid ${C.green}40`, borderRadius: 8, padding: "12px 16px", marginBottom: 20, display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ color: C.green, fontSize: 18 }}>✓</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.green, fontFamily: BODY_FONT }}>HMRC Document Verified · {employments.length} employment records found</div>
                    <div style={{ fontSize: 11, color: C.textMid, fontFamily: MONO_FONT }}>{gaps.length} gap{gaps.length !== 1 ? "s" : ""} detected · CAP 2330 screening complete</div>
                  </div>
                </div>
              ) : (
                <div style={{ background: C.amberBg, border: `1px solid ${C.amber}40`, borderRadius: 8, padding: "12px 16px", marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.amber, fontFamily: BODY_FONT }}>⚠ No HMRC document uploaded yet</div>
                  <div style={{ fontSize: 12, color: C.textMid, fontFamily: BODY_FONT, marginTop: 2 }}>The candidate has not yet submitted their HMRC employment history PDF.</div>
                </div>
              )}

              {/* Employment history */}
              {hasData && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: BODY_FONT, marginBottom: 12 }}>📋 Employment History · HMRC Verified</div>
                  {employments.map((emp, i) => {
                    // Find gap after this employment
                    const gapAfter = gaps.find(g => g.afterEmployer === emp.employer || (emp.endDate && g.from === emp.endDate));
                    const gapKey = gapAfter ? `gap_${i}` : null;
                    const gapExplained = gapKey && gapData[gapKey]?.gapType;
                    return (
                      <div key={i}>
                        <div style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 7, padding: "12px 16px", marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <div style={{ fontSize: 14, color: C.text, fontWeight: 600, fontFamily: BODY_FONT }}>{emp.employer}</div>
                            <div style={{ fontSize: 11, color: C.textFaint, fontFamily: MONO_FONT, marginTop: 2 }}>
                              {emp.payeRef && `PAYE: ${emp.payeRef} · `}{emp.startDate} — {emp.endDate || "Present"}
                            </div>
                          </div>
                          <Badge label={emp.endDate ? "Ended" : "Current"} color={emp.endDate ? C.textMid : C.green} />
                        </div>
                        {gapAfter && (
                          <div style={{
                            margin: "4px 0 6px 16px",
                            padding: "8px 14px",
                            borderRadius: 6,
                            background: gapExplained ? C.greenBg : C.redBg || "#FFF5F5",
                            border: `1px solid ${gapExplained ? C.green : C.red}40`,
                            display: "flex", justifyContent: "space-between", alignItems: "center"
                          }}>
                            <div style={{ fontSize: 12, fontFamily: BODY_FONT, color: gapExplained ? C.green : C.red, fontWeight: 600 }}>
                              {gapExplained ? "✅" : "🚨"} Gap · {gapAfter.days} days · {gapAfter.from} → {gapAfter.to}
                            </div>
                            <div style={{ fontSize: 11, color: C.textMid, fontFamily: BODY_FONT }}>
                              {gapExplained ? `Explained: ${gapData[gapKey].gapType}` : "Explanation required"}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Gaps summary */}
              {gaps.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: BODY_FONT, marginBottom: 10 }}>⚠ Gaps Requiring Explanation</div>
                  {gaps.map((g, i) => {
                    const key = `gap_${i}`;
                    const gd = gapData[key] || {};
                    const explained = !!gd.gapType;
                    return (
                      <div key={i} style={{ background: explained ? C.greenBg : "#FFF5F5", border: `1px solid ${explained ? C.green : C.red}40`, borderRadius: 8, padding: "12px 16px", marginBottom: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: explained ? C.green : C.red, fontFamily: BODY_FONT }}>{explained ? "✅ Explained" : "🚨 Unresolved"} · {g.days} days</div>
                            <div style={{ fontSize: 12, color: C.textMid, fontFamily: MONO_FONT }}>{g.from} → {g.to}</div>
                            {g.afterEmployer && <div style={{ fontSize: 11, color: C.textFaint, fontFamily: BODY_FONT, marginTop: 2 }}>After: {g.afterEmployer}</div>}
                          </div>
                          {explained && <div style={{ fontSize: 12, color: C.green, fontFamily: BODY_FONT, fontWeight: 600 }}>{gd.gapType}</div>}
                        </div>
                        {explained && gd.refName && (
                          <div style={{ marginTop: 8, fontSize: 12, color: C.textMid, fontFamily: BODY_FONT }}>
                            Reference: {gd.refName} {gd.refEmail && `· ${gd.refEmail}`}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>);
          })()}
          <div style={{ padding: "0 24px 24px" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: BODY_FONT, marginBottom: 14 }}>📁 HMRC & Gap Documents</div>
            {(() => {
              const rd = candidate.rawData || {};
              const gapData = rd.gapData || {};
              const gapDocs = Object.values(gapData).map(g => g.bankStatement).filter(Boolean);
              return (<>
                <DocSection title="HMRC Employment History PDF" files={rd.hmrcFile} />
                {gapDocs.length > 0 && <DocSection title="Gap Presence Documents" files={gapDocs} />}
              </>);
            })()}
          </div>
        </div>
        <div
          style={{
            padding: "14px 24px",
            borderTop: `1px solid ${C.border}`,
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            background: C.bgCard,
            position: "sticky",
            bottom: 0,
          }}
        >
          <Btn onClick={onClose}>Close</Btn>
          <Btn primary>Save Record</Btn>
        </div>
      </div>
    </div>
  );
}

// ── DBS PANEL ──
function DBSPanel({ candidate, onClose }) {
  const [apiState, setApiState] = useState(
    candidate.dbsVerified ? "connected" : "idle"
  );
  const [_querying, setQuerying] = useState(false);
  const handleAPICheck = () => {
    setQuerying(true);
    setApiState("loading");
    setTimeout(() => {
      setQuerying(false);
      setApiState(candidate.status === "DBS Flagged" ? "flagged" : "connected");
    }, 2400);
  };
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.3)",
        zIndex: 200,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "flex-end",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 580,
          height: "100vh",
          background: C.bgCard,
          borderLeft: `1px solid ${C.border}`,
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: "18px 24px",
            borderBottom: `1px solid ${C.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: C.bgCard,
            position: "sticky",
            top: 0,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: C.text,
                fontFamily: BODY_FONT,
              }}
            >
              DBS Check
            </div>
            <div
              style={{
                fontSize: 12,
                color: C.textFaint,
                fontFamily: BODY_FONT,
              }}
            >
              {candidate.name}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              width: 32,
              height: 32,
              cursor: "pointer",
              color: C.textMid,
              fontSize: 14,
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: 24 }}>
          <div
            style={{
              background: "#1A1208",
              borderRadius: 10,
              padding: "18px 20px",
              marginBottom: 22,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#FAF8F4",
                  fontFamily: BODY_FONT,
                }}
              >
                DBS API Integration
              </div>
              <APIBadge
                status={
                  apiState === "connected"
                    ? "live"
                    : apiState === "flagged"
                    ? "error"
                    : "pending"
                }
              />
            </div>
            {apiState === "idle" && (
              <button
                onClick={handleAPICheck}
                style={{
                  width: "100%",
                  padding: "10px",
                  background: "#FAF8F4",
                  border: "none",
                  borderRadius: 7,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#1A1208",
                  cursor: "pointer",
                  fontFamily: BODY_FONT,
                }}
              >
                → Submit DBS Application via API
              </button>
            )}
            {apiState === "loading" && (
              <div style={{ textAlign: "center", padding: "10px 0" }}>
                <div
                  style={{
                    fontSize: 13,
                    color: "#C99A4A",
                    fontFamily: BODY_FONT,
                  }}
                >
                  Submitting to DBS e-Bulk Service…
                </div>
              </div>
            )}
            {apiState === "connected" && (
              <div
                style={{
                  background: "rgba(58,112,85,0.25)",
                  border: "1px solid rgba(58,112,85,0.5)",
                  borderRadius: 7,
                  padding: "10px 14px",
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                }}
              >
                <span style={{ color: "#6EBF99", fontSize: 16 }}>✓</span>
                <div
                  style={{
                    fontSize: 13,
                    color: "#6EBF99",
                    fontFamily: BODY_FONT,
                    fontWeight: 600,
                  }}
                >
                  DBS check returned — No information disclosed
                </div>
              </div>
            )}
            {apiState === "flagged" && (
              <div
                style={{
                  background: "rgba(160,48,48,0.25)",
                  border: "1px solid rgba(160,48,48,0.5)",
                  borderRadius: 7,
                  padding: "10px 14px",
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                }}
              >
                <span style={{ color: "#E07070", fontSize: 16 }}>⚠</span>
                <div
                  style={{
                    fontSize: 13,
                    color: "#E07070",
                    fontFamily: BODY_FONT,
                    fontWeight: 600,
                  }}
                >
                  DBS returned — Information disclosed · Requires suitability
                  assessment
                </div>
              </div>
            )}
          </div>
          {(candidate.dbsVerified || apiState === "connected") &&
            candidate.dbsCert && (
              <div
                style={{
                  background: "#F8F5EE",
                  border: "3px solid #8B6914",
                  borderRadius: 8,
                  padding: 20,
                  fontFamily: "Georgia,serif",
                  marginBottom: 16,
                }}
              >
                <div style={{ textAlign: "center", marginBottom: 14 }}>
                  <div
                    style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a" }}
                  >
                    Basic Certificate
                  </div>
                  <div style={{ fontSize: 9, color: "#666" }}>
                    Disclosure & Barring Service
                  </div>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                    fontSize: 12,
                    marginBottom: 14,
                  }}
                >
                  {[
                    ["Cert No", candidate.dbsCert || "Pending"],
                    ["DBS Ref", candidate.dbsRef || "Pending"],
                    ["Issued", candidate.dbsIssued || "Today"],
                    ["Outcome", "No information disclosed"],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div style={{ color: "#888", fontSize: 9 }}>{k}</div>
                      <div
                        style={{
                          fontWeight: 700,
                          color: k === "Outcome" ? "#2e7d32" : "#1a1a1a",
                        }}
                      >
                        {v}
                      </div>
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    padding: "8px",
                    background: "#e8f5e9",
                    border: "1px solid #4CAF50",
                    borderRadius: 4,
                    textAlign: "center",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#2e7d32",
                  }}
                >
                  ✓ No information disclosed
                </div>
              </div>
            )}
        </div>
        <div style={{ padding: "0 24px 24px" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: BODY_FONT, marginBottom: 14 }}>📁 DBS Certificate</div>
          {(() => {
            const rd = candidate.rawData || {};
            return <DocSection title="DBS Certificate" files={rd.dbsFile} />;
          })()}
        </div>
        <div
          style={{
            padding: "14px 24px",
            borderTop: `1px solid ${C.border}`,
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            background: C.bgCard,
            position: "sticky",
            bottom: 0,
          }}
        >
          <Btn onClick={onClose}>Close</Btn>
        </div>
      </div>
    </div>
  );
}

// ── DOCUMENTS CARD ──
const DOC_PRESETS = [
  { label: "Passport Scan", icon: "🪪" },
  { label: "Driving Licence", icon: "🚗" },
  { label: "Selfie / Liveness Photo", icon: "📸" },
  { label: "HMRC Employment History PDF", icon: "📋" },
  { label: "DBS Basic Certificate", icon: "✅" },
  { label: "Health Questionnaire", icon: "🏥" },
  { label: "Consent & Declarations Form", icon: "📝" },
  { label: "Right to Work Confirmation", icon: "🇬🇧" },
  { label: "Bank Statements (Gap Evidence)", icon: "🏦" },
  { label: "Reference Letter", icon: "📨" },
  { label: "Visa / Immigration Document", icon: "🌐" },
  { label: "Proof of Address", icon: "🏠" },
  { label: "Training Certificate", icon: "🎓" },
  { label: "Medical Certificate", icon: "🩺" },
  { label: "Custom / Other…", icon: "📄" },
];
const DOC_GROUPS = [
  {
    id: "id",
    label: "ID Verification",
    icon: "🪪",
    color: C.blue,
    names: [
      "Passport Scan",
      "Driving Licence",
      "Selfie / Liveness Photo",
      "Right to Work Confirmation",
      "Visa / Immigration Document",
      "Proof of Address",
    ],
  },
  {
    id: "employment",
    label: "Employment History",
    icon: "📋",
    color: C.amber,
    names: [
      "HMRC Employment History PDF",
      "Bank Statements (Gap Evidence)",
      "Reference Letter",
    ],
  },
  {
    id: "dbs",
    label: "DBS & Criminal Record",
    icon: "✅",
    color: C.green,
    names: ["DBS Basic Certificate", "DBS Certificate (Disclosed)"],
  },
  {
    id: "health",
    label: "Health & Compliance",
    icon: "🏥",
    color: C.purple,
    names: [
      "Health Questionnaire",
      "Medical Certificate",
      "Consent & Declarations Form",
      "Training Certificate",
    ],
  },
  {
    id: "other",
    label: "Other Documents",
    icon: "📁",
    color: C.textMid,
    names: [],
  },
];
function getDocGroup(docName) {
  for (const g of DOC_GROUPS) {
    if (g.id === "other") continue;
    if (
      g.names.some(
        (n) =>
          docName.toLowerCase().includes(n.toLowerCase()) ||
          n.toLowerCase().includes(docName.toLowerCase())
      )
    )
      return g.id;
  }
  return "other";
}
function DocGroupedList({ docs }) {
  const grouped = {};
  DOC_GROUPS.forEach((g) => {
    grouped[g.id] = [];
  });
  docs.forEach((doc) => {
    const gid = getDocGroup(doc.name);
    grouped[gid].push(doc);
  });
  const defaultOpen = {};
  DOC_GROUPS.forEach((g) => {
    defaultOpen[g.id] = grouped[g.id].length > 0;
  });
  const [open, setOpen] = useState(defaultOpen);
  const toggle = (id) => setOpen((o) => ({ ...o, [id]: !o[id] }));
  const populatedGroups = DOC_GROUPS.filter((g) => grouped[g.id].length > 0);
  return (
    <div>
      {populatedGroups.map((group, gi) => {
        const groupDocs = grouped[group.id];
        const isOpen = open[group.id];
        const allVerified = groupDocs.every((d) => d.status === "Verified");
        const hasFlagged = groupDocs.some((d) => d.status === "Under Review");
        const groupStatusColor = hasFlagged
          ? C.amber
          : allVerified
          ? C.green
          : C.textFaint;
        const groupStatusLabel = hasFlagged
          ? "Review"
          : allVerified
          ? "All Verified"
          : "Pending";
        return (
          <div
            key={group.id}
            style={{ marginBottom: gi < populatedGroups.length - 1 ? 8 : 0 }}
          >
            <div
              onClick={() => toggle(group.id)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 12px",
                background: C.bgPanel,
                border: `1px solid ${C.border}`,
                borderRadius: isOpen ? "7px 7px 0 0" : 7,
                cursor: "pointer",
                userSelect: "none",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#EDE9E0")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = C.bgPanel)
              }
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span
                  style={{
                    fontSize: 10,
                    color: C.textFaint,
                    display: "inline-block",
                    transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                  }}
                >
                  ▶
                </span>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background: group.color + "18",
                    border: `1px solid ${group.color}30`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 15,
                  }}
                >
                  {group.icon}
                </div>
                <div>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: C.text,
                      fontFamily: BODY_FONT,
                    }}
                  >
                    {group.label}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: C.textFaint,
                      fontFamily: MONO_FONT,
                      marginLeft: 8,
                    }}
                  >
                    {groupDocs.length} doc{groupDocs.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              <Badge label={groupStatusLabel} color={groupStatusColor} />
            </div>
            {isOpen && (
              <div
                style={{
                  border: `1px solid ${C.border}`,
                  borderTop: "none",
                  borderRadius: "0 0 7px 7px",
                  overflow: "hidden",
                }}
              >
                {groupDocs.map((doc, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "11px 14px",
                      background: C.bgCard,
                      borderBottom:
                        i < groupDocs.length - 1
                          ? `1px solid ${C.border}`
                          : "none",
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 12 }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 40,
                          background: C.bgPanel,
                          border: `1px solid ${C.border}`,
                          borderRadius: 6,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 18,
                          flexShrink: 0,
                        }}
                      >
                        {doc.icon || "📄"}
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 13,
                            color: C.text,
                            fontWeight: 500,
                            fontFamily: BODY_FONT,
                          }}
                        >
                          {doc.name}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: C.textFaint,
                            fontFamily: MONO_FONT,
                          }}
                        >
                          Uploaded {doc.date}
                        </div>
                      </div>
                    </div>
                    <Badge
                      label={doc.status}
                      color={
                        doc.status === "Verified"
                          ? C.green
                          : doc.status === "Under Review"
                          ? C.amber
                          : doc.status === "Pending Upload"
                          ? C.textFaint
                          : C.blue
                      }
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
function DocumentsCard({ candidate }) {
  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const [docs, setDocs] = useState(candidate.docs);
  const [dropOpen, setDropOpen] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const [customLabel, setCustomLabel] = useState("");
  const [customIcon, setCustomIcon] = useState("📄");
  const [added, setAdded] = useState(null);
  const handlePresetSelect = (preset) => {
    if (preset.label === "Custom / Other…") {
      setCustomMode(true);
      setDropOpen(false);
      return;
    }
    setDocs((d) => [
      ...d,
      {
        name: preset.label,
        icon: preset.icon,
        date: today,
        status: "Pending Upload",
      },
    ]);
    setAdded(preset.label);
    setDropOpen(false);
    setTimeout(() => setAdded(null), 2500);
  };
  const handleCustomAdd = () => {
    if (!customLabel.trim()) return;
    setDocs((d) => [
      ...d,
      {
        name: customLabel.trim(),
        icon: customIcon,
        date: today,
        status: "Pending Upload",
      },
    ]);
    setAdded(customLabel.trim());
    setCustomLabel("");
    setCustomMode(false);
    setTimeout(() => setAdded(null), 2500);
  };
  const ICON_OPTIONS = [
    "📄",
    "📋",
    "🪪",
    "🚗",
    "📸",
    "✅",
    "🏥",
    "📝",
    "🇬🇧",
    "🏦",
    "📨",
    "🌐",
    "🏠",
    "🎓",
    "🩺",
    "⚠️",
    "🔒",
    "📁",
  ];
  return (
    <Card>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: C.text,
              fontFamily: BODY_FONT,
            }}
          >
            Documents
          </div>
          <span
            style={{ fontSize: 12, color: C.textFaint, fontFamily: BODY_FONT }}
          >
            {docs.length} file{docs.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div style={{ position: "relative" }}>
          <button
            onClick={() => {
              setDropOpen((o) => !o);
              setCustomMode(false);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "7px 14px",
              borderRadius: 6,
              border: `1px solid ${dropOpen ? C.text : C.border}`,
              background: dropOpen ? C.text : "transparent",
              color: dropOpen ? "#FAF8F4" : C.textMid,
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: BODY_FONT,
            }}
          >
            <span style={{ fontSize: 13 }}>+</span> Add Document{" "}
            <span style={{ fontSize: 10, marginLeft: 2, opacity: 0.7 }}>
              {dropOpen ? "▲" : "▼"}
            </span>
          </button>
          {dropOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                right: 0,
                width: 260,
                background: C.bgCard,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                zIndex: 50,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "8px 12px",
                  background: C.bgPanel,
                  borderBottom: `1px solid ${C.border}`,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: C.textFaint,
                    fontFamily: MONO_FONT,
                    letterSpacing: "0.07em",
                  }}
                >
                  SELECT DOCUMENT TYPE
                </div>
              </div>
              <div style={{ maxHeight: 280, overflowY: "auto" }}>
                {DOC_PRESETS.map((p, i) => (
                  <div
                    key={p.label}
                    onClick={() => handlePresetSelect(p)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "9px 14px",
                      cursor: "pointer",
                      borderBottom:
                        i < DOC_PRESETS.length - 1
                          ? `1px solid ${C.border}`
                          : "none",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = C.bgPanel)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <span style={{ fontSize: 16, flexShrink: 0 }}>
                      {p.icon}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        color: p.label === "Custom / Other…" ? C.blue : C.text,
                        fontFamily: BODY_FONT,
                        fontWeight: p.label === "Custom / Other…" ? 600 : 400,
                      }}
                    >
                      {p.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {customMode && (
        <div
          style={{
            background: C.bgPanel,
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            padding: "14px 16px",
            marginBottom: 14,
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: C.textFaint,
              fontFamily: MONO_FONT,
              letterSpacing: "0.06em",
              marginBottom: 10,
            }}
          >
            CUSTOM DOCUMENT
          </div>
          <div style={{ marginBottom: 10 }}>
            <Label>Document Label</Label>
            <input
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCustomAdd()}
              placeholder="e.g. Airside Security Clearance…"
              style={{
                width: "100%",
                background: C.bgInput,
                border: `1px solid ${C.border}`,
                borderRadius: 6,
                padding: "9px 12px",
                fontSize: 13,
                fontFamily: BODY_FONT,
                color: C.text,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <Label>Icon</Label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {ICON_OPTIONS.map((ico) => (
                <button
                  key={ico}
                  onClick={() => setCustomIcon(ico)}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 6,
                    border: `1.5px solid ${
                      customIcon === ico ? C.text : C.border
                    }`,
                    background: customIcon === ico ? C.text : "transparent",
                    fontSize: 16,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {ico}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => {
                setCustomMode(false);
                setCustomLabel("");
              }}
              style={{
                padding: "7px 16px",
                borderRadius: 6,
                border: `1px solid ${C.border}`,
                background: "transparent",
                color: C.textMid,
                fontSize: 12,
                cursor: "pointer",
                fontFamily: BODY_FONT,
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleCustomAdd}
              disabled={!customLabel.trim()}
              style={{
                padding: "7px 16px",
                borderRadius: 6,
                border: "none",
                background: customLabel.trim() ? C.text : "#ccc",
                color: "#FAF8F4",
                fontSize: 12,
                fontWeight: 600,
                cursor: customLabel.trim() ? "pointer" : "not-allowed",
                fontFamily: BODY_FONT,
              }}
            >
              Add Document
            </button>
          </div>
        </div>
      )}
      {added && (
        <div
          style={{
            background: C.greenBg,
            border: `1px solid ${C.green}40`,
            borderRadius: 7,
            padding: "9px 14px",
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ color: C.green }}>✓</span>
          <span
            style={{
              fontSize: 13,
              color: C.green,
              fontFamily: BODY_FONT,
              fontWeight: 600,
            }}
          >
            "{added}" added to documents
          </span>
        </div>
      )}
      {docs.length === 0 ? (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div
            style={{ fontSize: 13, color: C.textFaint, fontFamily: BODY_FONT }}
          >
            No documents uploaded yet
          </div>
        </div>
      ) : (
        <DocGroupedList docs={docs} />
      )}
    </Card>
  );
}

// ── PERSISTENT SIDEBAR ──
// The sidebar is now shared across all views. The active section is tracked in the root state.
function Sidebar({ activeSection, onSection, onSlack, clientCandidates }) {
  return (
    <div
      style={{
        width: 215,
        background: C.bgPanel,
        borderRight: `1px solid ${C.border}`,
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        position: "sticky",
        top: 0,
        height: "100vh",
      }}
    >
      <div
        style={{
          padding: "24px 18px 16px",
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <div
          style={{
            fontSize: 38,
            fontWeight: 700,
            color: C.text,
            fontFamily: LOGO_SERIF,
            letterSpacing: "-0.02em",
            lineHeight: 1,
          }}
        >
          Flyck<span style={{ fontStyle: "italic" }}>.ai</span>
        </div>
      </div>
      <nav style={{ flex: 1, padding: "10px 8px" }}>
        {[
          { id: "home", label: "BRS Transport" },
          { id: "agencies", label: "Agencies" },
          { id: "training", label: "Training" },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => onSection(item.id)}
            style={{
              width: "100%",
              padding: "9px 12px",
              background: activeSection === item.id ? "#fff" : "transparent",
              border: `1px solid ${
                activeSection === item.id ? C.border : "transparent"
              }`,
              borderRadius: 6,
              cursor: "pointer",
              marginBottom: 2,
              color: activeSection === item.id ? C.text : C.textMid,
              fontSize: 13,
              fontFamily: BODY_FONT,
              fontWeight: activeSection === item.id ? 600 : 400,
              textAlign: "left",
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div style={{ padding: "10px 10px 12px" }}>
        <button
          onClick={onSlack}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "9px 12px",
            background: C.slack + "18",
            border: `1px solid ${C.slack}30`,
            borderRadius: 6,
            cursor: "pointer",
            color: C.slack,
          }}
        >
          <span style={{ fontSize: 14 }}>💬</span>
          <span
            style={{ fontSize: 13, fontFamily: BODY_FONT, fontWeight: 500 }}
          >
            Slack Alerts
          </span>
        </button>
      </div>
      <NotificationBell portalTarget="client" />
      <div
        style={{ padding: "8px 16px 18px", borderTop: `1px solid ${C.border}` }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: CLIENT_COLOR + "22",
            border: `2px solid ${CLIENT_COLOR}40`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 700,
            color: CLIENT_COLOR,
            fontFamily: MONO_FONT,
            marginBottom: 6,
          }}
        >
          BRS
        </div>
        <div
          style={{
            fontSize: 13,
            color: C.text,
            fontFamily: BODY_FONT,
            fontWeight: 600,
          }}
        >
          {CLIENT_NAME}
        </div>
        <div
          style={{ fontSize: 10, color: C.textFaint, fontFamily: MONO_FONT }}
        >
          Client Account
        </div>
      </div>
    </div>
  );
}

// ── CANDIDATE PROFILE ──
function CandidateProfile({
  candidate,
  onBack,
  onSlack,
  onAudit,
  isAgencyView,
  agencyName,
  backLabel,
}) {
  const [panel, setPanel] = useState(null);
  const [restrictModal, setRestrictModal] = useState(false);
  const [restrictNote, setRestrictNote] = useState("");
  const [restrictSent, setRestrictSent] = useState(false);
  const QUICK_ACCESS = [
    {
      id: "profile",
      label: "Personal Profile",
      icon: "👤",
      done: true,
      color: C.purple,
    },
    {
      id: "id",
      label: "ID Verification",
      icon: "🪪",
      done: candidate.idVerified,
      color: C.blue,
    },
    {
      id: "hmrc",
      label: "HMRC History",
      icon: "📋",
      done: candidate.hmrcVerified,
      color: C.amber,
    },
    {
      id: "dbs",
      label: "DBS Check",
      icon: "✅",
      done: candidate.dbsVerified,
      color: C.green,
    },
  ];
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          background: C.bgCard,
          borderBottom: `1px solid ${C.border}`,
          padding: "14px 26px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={onBack}
            style={{
              background: "none",
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              padding: "5px 14px",
              fontSize: 13,
              color: C.textMid,
              cursor: "pointer",
              fontFamily: BODY_FONT,
            }}
          >
            ← {backLabel || CLIENT_NAME}
          </button>
          <span style={{ color: C.borderDk }}>/</span>
          <span
            style={{
              fontSize: 14,
              color: C.text,
              fontFamily: BODY_FONT,
              fontWeight: 500,
            }}
          >
            {candidate.name}
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {isAgencyView && (
            <button
              onClick={() => { setRestrictModal(true); setRestrictSent(false); setRestrictNote(""); }}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "7px 14px",
                background: C.red + "12",
                border: `1px solid ${C.red}40`,
                borderRadius: 6, cursor: "pointer",
                color: C.red, fontFamily: BODY_FONT, fontSize: 13, fontWeight: 600,
              }}
            >
              🚫 Restrict
            </button>
          )}
          {onSlack && (
            <button
              onClick={onSlack}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "7px 14px",
                background: C.slack + "15",
                border: `1px solid ${C.slack}40`,
                borderRadius: 6,
                cursor: "pointer",
                color: C.slack,
                fontFamily: BODY_FONT,
                fontSize: 13,
              }}
            >
              💬 Slack
            </button>
          )}
          {onAudit && (
            <Btn primary onClick={onAudit}>
              Generate Audit Pack
            </Btn>
          )}
        </div>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "24px 28px" }}>
        <Card
          style={{
            marginBottom: 18,
            display: "flex",
            gap: 18,
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: "50%",
              background: candidate.pct === 100 ? C.greenBg : C.bgPanel,
              border: `2px solid ${candidate.pct === 100 ? C.green : C.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              fontWeight: 700,
              color: C.text,
              fontFamily: MONO_FONT,
              flexShrink: 0,
            }}
          >
            {candidate.initials}
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 7,
              }}
            >
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: C.text,
                  fontFamily: BODY_FONT,
                }}
              >
                {candidate.name}
              </span>
              <Badge label={candidate.status} color={candidate.statusColor} />
              {candidate.pct === 100 && (
                <Badge label="100% Compliant" color={C.green} />
              )}
              {isAgencyView && <Badge label={agencyName} color={C.teal} />}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4,auto)",
                gap: "5px 26px",
              }}
            >
              {[
                ["Role", candidate.role],
                ["DOB", candidate.dob],
                ["NI", candidate.ni],
                ["Email", candidate.email],
              ].map(([k, v]) => (
                <div key={k}>
                  <div
                    style={{
                      fontSize: 9,
                      color: C.textFaint,
                      fontFamily: MONO_FONT,
                      letterSpacing: "0.05em",
                    }}
                  >
                    {k}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: C.text,
                      fontFamily: BODY_FONT,
                      fontWeight: 500,
                      marginTop: 1,
                    }}
                  >
                    {v || "—"}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div
              style={{
                fontSize: 36,
                fontWeight: 700,
                color:
                  candidate.pct === 100
                    ? C.green
                    : candidate.pct >= 70
                    ? C.amber
                    : C.red,
                fontFamily: BODY_FONT,
                lineHeight: 1,
              }}
            >
              {candidate.pct}%
            </div>
            <div
              style={{
                fontSize: 9,
                color: C.textFaint,
                fontFamily: MONO_FONT,
                marginTop: 3,
              }}
            >
              COMPLIANCE
            </div>
          </div>
        </Card>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: 14,
            marginBottom: 18,
          }}
        >
          {QUICK_ACCESS.map((item) => (
            <div
              key={item.id}
              onClick={() => setPanel(item.id)}
              style={{
                background: C.bgCard,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: "18px 16px",
                cursor: "pointer",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.boxShadow =
                  "0 2px 12px rgba(0,0,0,0.08)")
              }
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    background: item.color + "15",
                    border: `1px solid ${item.color}30`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                  }}
                >
                  {item.icon}
                </div>
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: item.done ? C.greenBg : C.bgPanel,
                    border: `1.5px solid ${item.done ? C.green : C.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    color: item.done ? C.green : C.textFaint,
                  }}
                >
                  {item.done ? "✓" : ""}
                </div>
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: C.text,
                  fontFamily: BODY_FONT,
                  marginBottom: 4,
                }}
              >
                {item.label}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: item.done ? C.green : C.textFaint,
                  fontFamily: BODY_FONT,
                }}
              >
                {item.done ? "Verified" : "Pending"}
              </div>
            </div>
          ))}
        </div>
        <DocumentsCard candidate={candidate} />
      </div>
      {restrictModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setRestrictModal(false)}
        >
          <div
            style={{ background: C.bgCard, borderRadius: 12, padding: 32, width: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}
            onClick={e => e.stopPropagation()}
          >
            {restrictSent ? (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: C.text, fontFamily: BODY_FONT, marginBottom: 8 }}>Restriction Sent</div>
                <div style={{ fontSize: 14, color: C.textMid, fontFamily: BODY_FONT, marginBottom: 24 }}>
                  {agencyName} has been notified that <strong>{candidate.name}</strong> has been restricted.
                </div>
                <button onClick={() => setRestrictModal(false)} style={{ padding: "10px 28px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.textMid, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: BODY_FONT }}>Close</button>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                  <div style={{ fontSize: 28 }}>🚫</div>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: C.text, fontFamily: BODY_FONT }}>Restrict Worker</div>
                    <div style={{ fontSize: 13, color: C.textFaint, fontFamily: BODY_FONT }}>This will notify {agencyName} that {candidate.name} has been restricted.</div>
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.textMid, fontFamily: BODY_FONT, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Reason / Comments</div>
                  <textarea
                    value={restrictNote}
                    onChange={e => setRestrictNote(e.target.value)}
                    placeholder="Add a reason or note for the agency — e.g. 'Worker failed DBS check' or 'Conduct issue on site'..."
                    rows={5}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bgPanel, color: C.text, fontFamily: BODY_FONT, fontSize: 13, resize: "vertical", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <div style={{ background: C.amberBg, border: `1px solid ${C.amber}30`, borderRadius: 8, padding: "10px 14px", marginBottom: 20, fontSize: 12, color: C.amber, fontFamily: BODY_FONT }}>
                  ⚠ This will send an email notification to {agencyName}. The worker will be marked as restricted on their records.
                </div>
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <button onClick={() => setRestrictModal(false)} style={{ padding: "10px 22px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.textMid, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: BODY_FONT }}>Cancel</button>
                  <button
                    onClick={() => setRestrictSent(true)}
                    style={{ padding: "10px 22px", borderRadius: 8, border: "none", background: C.red, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: BODY_FONT }}
                  >
                    🚫 Send Restriction Notice
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {panel === "profile" && (
        <PersonalProfilePanel
          candidate={candidate}
          onClose={() => setPanel(null)}
        />
      )}
      {panel === "id" && (
        <IDPanel candidate={candidate} onClose={() => setPanel(null)} />
      )}
      {panel === "hmrc" && (
        <HMRCPanel candidate={candidate} onClose={() => setPanel(null)} />
      )}
      {panel === "dbs" && (
        <DBSPanel candidate={candidate} onClose={() => setPanel(null)} />
      )}
    </div>
  );
}

// ── AGENCY DETAIL VIEW ──
function AgencyDetailView({ agency, onBack, onSelectCandidate }) {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("candidates");
  const [sendingReminder, setSendingReminder] = useState(false);
  const [reminderSent, setReminderSent] = useState(false);
  const [workStatus, setWorkStatus] = useState(() => {
    const m = {};
    agency.candidates.forEach((c) => {
      m[c.id] = "Working";
    });
    return m;
  });
  const [openDropdown, setOpenDropdown] = useState(null);
  const WORK_OPTIONS = [
    { label: "Working", color: C.green, dot: "#3A7055" },
    { label: "Not Working", color: C.amber, dot: "#A0700A" },
    { label: "Restricted", color: C.red, dot: "#A03030" },
  ];
  const visible = agency.candidates.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.role.toLowerCase().includes(q) ||
      c.status.toLowerCase().includes(q);
    if (!matchSearch) return false;
    if (filter === "Restricted")
      return (
        c.statusColor === C.red ||
        c.statusColor === C.amber ||
        workStatus[c.id] === "Restricted"
      );
    if (filter === "Cleared") return c.pct >= 90;
    if (filter === "Pending") return c.pct < 90 && c.pct > 15;
    return true;
  });
  const complianceRate = Math.round(
    (agencyStats(agency).cleared / agencyStats(agency).total) * 100
  );
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <div
        style={{
          background: C.bgCard,
          borderBottom: `1px solid ${C.border}`,
          padding: "14px 26px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={onBack}
            style={{
              background: "none",
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              padding: "5px 14px",
              fontSize: 13,
              color: C.textMid,
              cursor: "pointer",
              fontFamily: BODY_FONT,
            }}
          >
            ← Agencies
          </button>
          <span style={{ color: C.borderDk }}>/</span>
          <span
            style={{
              fontSize: 14,
              color: C.text,
              fontFamily: BODY_FONT,
              fontWeight: 500,
            }}
          >
            {agency.name}
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => {
              setSendingReminder(true);
              setTimeout(() => {
                setSendingReminder(false);
                setReminderSent(true);
                setTimeout(() => setReminderSent(false), 3000);
              }, 1600);
            }}
            style={{
              padding: "7px 16px",
              borderRadius: 6,
              border: `1px solid ${C.border}`,
              background: "transparent",
              color: C.textMid,
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: BODY_FONT,
            }}
          >
            {sendingReminder
              ? "Sending…"
              : reminderSent
              ? "✓ Nudge Sent"
              : "📧 Send Agency Nudge"}
          </button>
          <Btn primary>Generate Agency Report</Btn>
        </div>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "24px 28px" }}>
        {/* Sub-nav tabs for agency sections */}
        <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
          {[
            ["candidates", "Candidates"],
            ["details", "Agency Details"],
            ["report", "Compliance Report"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                padding: "7px 16px",
                borderRadius: 6,
                border: `1px solid ${tab === key ? C.text : C.border}`,
                background: tab === key ? C.text : "transparent",
                color: tab === key ? "#FAF8F4" : C.textMid,
                fontSize: 13,
                cursor: "pointer",
                fontFamily: BODY_FONT,
                fontWeight: tab === key ? 600 : 400,
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <Card
          style={{
            marginBottom: 18,
            display: "flex",
            gap: 20,
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 12,
              background: agency.color + "18",
              border: `2px solid ${agency.color}40`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              fontWeight: 700,
              color: agency.color,
              fontFamily: MONO_FONT,
              flexShrink: 0,
            }}
          >
            {agency.initials}
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 6,
              }}
            >
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: C.text,
                  fontFamily: BODY_FONT,
                }}
              >
                {agency.name}
              </span>
              <Badge
                label={`${complianceRate}% Compliant`}
                color={
                  complianceRate >= 85
                    ? C.green
                    : complianceRate >= 65
                    ? C.amber
                    : C.red
                }
              />
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4,auto)",
                gap: "5px 26px",
              }}
            >
              {[
                ["Contact", agency.contact],
                ["Role", agency.contactRole],
                ["Email", agency.contactEmail],
                ["Phone", agency.contactPhone],
                ["Since", agency.since],
                ["Contract End", agency.contractEnd],
                ["SLA", agency.sla],
                ["Location", agency.address],
              ].map(([k, v]) => (
                <div key={k}>
                  <div
                    style={{
                      fontSize: 9,
                      color: C.textFaint,
                      fontFamily: MONO_FONT,
                      letterSpacing: "0.05em",
                    }}
                  >
                    {k}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: C.text,
                      fontFamily: BODY_FONT,
                      fontWeight: 500,
                      marginTop: 1,
                    }}
                  >
                    {v || "—"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
        {reminderSent && (
          <div
            style={{
              background: C.greenBg,
              border: `1px solid ${C.green}40`,
              borderRadius: 8,
              padding: "12px 16px",
              marginBottom: 16,
              display: "flex",
              gap: 10,
              alignItems: "center",
            }}
          >
            <span style={{ color: C.green }}>✓</span>
            <div
              style={{
                fontSize: 13,
                color: C.green,
                fontFamily: BODY_FONT,
                fontWeight: 600,
              }}
            >
              Nudge sent to {agency.contact} at {agency.contactEmail}
            </div>
          </div>
        )}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: 10,
            marginBottom: 20,
          }}
        >
          {[
            {
              label: "Total Candidates",
              value: agencyStats(agency).total,
              color: C.text,
              filterKey: "All",
              sub: null,
            },
            {
              label: "Fully Cleared",
              value: agencyStats(agency).cleared,
              color: C.green,
              filterKey: "Cleared",
              sub: "CAP 2330 compliant",
            },
            {
              label: "Pending",
              value: agencyStats(agency).pending,
              color: C.amber,
              filterKey: "Pending",
              sub: null,
            },
            {
              label: "Restricted",
              value: agencyStats(agency).flagged,
              color: C.red,
              filterKey: "Restricted",
              sub: null,
            },
          ].map(({ label, value, color, filterKey, sub }) => {
            const isActive = filter === filterKey && tab === "candidates";
            return (
              <div
                key={filterKey}
                onClick={() => {
                  setFilter(filterKey);
                  setTab("candidates");
                }}
                style={{
                  background: C.bgCard,
                  border: `2px solid ${isActive ? color : C.border}`,
                  borderRadius: 8,
                  padding: "14px 18px",
                  cursor: "pointer",
                  boxShadow: isActive ? `0 0 0 3px ${color}18` : "none",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = color;
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${color}18`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = isActive
                    ? color
                    : C.border;
                  e.currentTarget.style.boxShadow = isActive
                    ? `0 0 0 3px ${color}18`
                    : "none";
                }}
              >
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color,
                    fontFamily: BODY_FONT,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {value}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: C.textFaint,
                    fontFamily: BODY_FONT,
                    marginTop: 2,
                  }}
                >
                  {label}
                </div>
                {sub && (
                  <div
                    style={{
                      fontSize: 11,
                      color: C.green,
                      fontFamily: BODY_FONT,
                      marginTop: 3,
                    }}
                  >
                    {sub}
                  </div>
                )}
                {isActive && (
                  <div
                    style={{
                      fontSize: 10,
                      color,
                      fontFamily: MONO_FONT,
                      marginTop: 5,
                      letterSpacing: "0.05em",
                    }}
                  >
                    ● FILTERED
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {tab === "candidates" && (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <div style={{ position: "relative", flex: 1 }}>
                <span
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: 14,
                    color: C.textFaint,
                  }}
                >
                  🔍
                </span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search candidates…"
                  style={{
                    width: "100%",
                    background: C.bgCard,
                    border: `1px solid ${C.border}`,
                    borderRadius: 7,
                    padding: "9px 12px 9px 36px",
                    fontSize: 13,
                    fontFamily: BODY_FONT,
                    color: C.text,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {["All", "Pending", "Restricted", "Cleared"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    style={{
                      padding: "5px 16px",
                      borderRadius: 5,
                      border: `1px solid ${filter === f ? C.text : C.border}`,
                      background: filter === f ? C.text : "transparent",
                      color: filter === f ? "#FAF8F4" : C.textMid,
                      fontSize: 13,
                      cursor: "pointer",
                      fontFamily: BODY_FONT,
                      fontWeight: filter === f ? 600 : 400,
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <Card style={{ padding: 0, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: C.bgPanel }}>
                    {[
                      "Candidate",
                      "Status",
                      "ID",
                      "HMRC",
                      "DBS",
                      "Score",
                      "Employment Status",
                      "",
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "10px 14px",
                          textAlign: "left",
                          fontSize: 10,
                          color: C.textFaint,
                          fontFamily: MONO_FONT,
                          letterSpacing: "0.07em",
                          borderBottom: `1px solid ${C.border}`,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.map((c, i) => {
                    const ws = workStatus[c.id] || "Working";
                    const wsOpt =
                      WORK_OPTIONS.find((o) => o.label === ws) ||
                      WORK_OPTIONS[0];
                    const isDropOpen = openDropdown === c.id;
                    return (
                      <tr
                        key={c.id}
                        style={{
                          borderBottom:
                            i < visible.length - 1
                              ? `1px solid ${C.border}`
                              : "none",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = C.bgPanel)
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <td
                          style={{ padding: "13px 14px" }}
                          onClick={() => onSelectCandidate(c, agency)}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                            }}
                          >
                            <div
                              style={{
                                width: 30,
                                height: 30,
                                borderRadius: "50%",
                                background: c.statusColor + "15",
                                border: `1px solid ${c.statusColor}40`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 11,
                                fontWeight: 700,
                                color: c.statusColor,
                                fontFamily: MONO_FONT,
                              }}
                            >
                              {c.initials}
                            </div>
                            <div>
                              <div
                                style={{
                                  fontSize: 14,
                                  color: C.text,
                                  fontWeight: 600,
                                  fontFamily: BODY_FONT,
                                }}
                              >
                                {c.name}
                              </div>
                              <div
                                style={{
                                  fontSize: 11,
                                  color: C.textFaint,
                                  fontFamily: MONO_FONT,
                                }}
                              >
                                {c.role}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td
                          style={{ padding: "13px 14px" }}
                          onClick={() => onSelectCandidate(c, agency)}
                        >
                          <Badge label={c.status} color={c.statusColor} />
                        </td>
                        <td style={{ padding: "13px 14px" }}>
                          <span
                            style={{
                              fontSize: 12,
                              color: c.idVerified ? C.green : C.textFaint,
                              fontFamily: MONO_FONT,
                            }}
                          >
                            {c.idVerified ? "✓" : "—"}
                          </span>
                        </td>
                        <td style={{ padding: "13px 14px" }}>
                          <span
                            style={{
                              fontSize: 12,
                              color: c.hmrcVerified ? C.green : C.textFaint,
                              fontFamily: MONO_FONT,
                            }}
                          >
                            {c.hmrcVerified ? "✓" : "—"}
                          </span>
                        </td>
                        <td style={{ padding: "13px 14px" }}>
                          <span
                            style={{
                              fontSize: 12,
                              color: c.dbsVerified
                                ? C.green
                                : c.status === "DBS Flagged"
                                ? C.red
                                : C.textFaint,
                              fontFamily: MONO_FONT,
                            }}
                          >
                            {c.dbsVerified
                              ? "✓"
                              : c.status === "DBS Flagged"
                              ? "!"
                              : "—"}
                          </span>
                        </td>
                        <td
                          style={{ padding: "13px 14px" }}
                          onClick={() => onSelectCandidate(c, agency)}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <div
                              style={{
                                width: 52,
                                height: 4,
                                background: C.bgPanel,
                                borderRadius: 2,
                                overflow: "hidden",
                                border: `1px solid ${C.border}`,
                              }}
                            >
                              <div
                                style={{
                                  height: "100%",
                                  width: `${c.pct}%`,
                                  background:
                                    c.pct === 100
                                      ? C.green
                                      : c.pct >= 70
                                      ? C.amber
                                      : C.red,
                                  borderRadius: 2,
                                }}
                              />
                            </div>
                            <span
                              style={{
                                fontSize: 12,
                                color: c.pct === 100 ? C.green : C.textMid,
                                fontFamily: MONO_FONT,
                                fontWeight: c.pct === 100 ? 700 : 400,
                              }}
                            >
                              {c.pct}%
                            </span>
                          </div>
                        </td>
                        <td
                          style={{ padding: "13px 14px" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div
                            style={{
                              position: "relative",
                              display: "inline-block",
                            }}
                          >
                            <button
                              onClick={() =>
                                setOpenDropdown(isDropOpen ? null : c.id)
                              }
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "5px 10px",
                                borderRadius: 6,
                                border: `1px solid ${wsOpt.color}50`,
                                background: wsOpt.color + "12",
                                color: wsOpt.color,
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: "pointer",
                                fontFamily: BODY_FONT,
                                whiteSpace: "nowrap",
                              }}
                            >
                              <span
                                style={{
                                  width: 7,
                                  height: 7,
                                  borderRadius: "50%",
                                  background: wsOpt.dot,
                                  display: "inline-block",
                                  flexShrink: 0,
                                }}
                              />
                              {ws}
                              <span style={{ fontSize: 9, opacity: 0.7 }}>
                                {isDropOpen ? "▲" : "▼"}
                              </span>
                            </button>
                            {isDropOpen && (
                              <div
                                style={{
                                  position: "absolute",
                                  top: "calc(100% + 4px)",
                                  left: 0,
                                  width: 148,
                                  background: C.bgCard,
                                  border: `1px solid ${C.border}`,
                                  borderRadius: 7,
                                  boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
                                  zIndex: 100,
                                  overflow: "hidden",
                                }}
                              >
                                {WORK_OPTIONS.map((opt, oi) => (
                                  <div
                                    key={opt.label}
                                    onClick={() => {
                                      setWorkStatus((s) => ({
                                        ...s,
                                        [c.id]: opt.label,
                                      }));
                                      setOpenDropdown(null);
                                    }}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 9,
                                      padding: "9px 13px",
                                      cursor: "pointer",
                                      background:
                                        ws === opt.label
                                          ? opt.color + "14"
                                          : "transparent",
                                      borderBottom:
                                        oi < WORK_OPTIONS.length - 1
                                          ? `1px solid ${C.border}`
                                          : "none",
                                    }}
                                    onMouseEnter={(e) =>
                                      (e.currentTarget.style.background =
                                        opt.color + "14")
                                    }
                                    onMouseLeave={(e) =>
                                      (e.currentTarget.style.background =
                                        ws === opt.label
                                          ? opt.color + "14"
                                          : "transparent")
                                    }
                                  >
                                    <span
                                      style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: "50%",
                                        background: opt.dot,
                                        display: "inline-block",
                                        flexShrink: 0,
                                      }}
                                    />
                                    <span
                                      style={{
                                        fontSize: 12,
                                        color: opt.color,
                                        fontFamily: BODY_FONT,
                                        fontWeight:
                                          ws === opt.label ? 700 : 400,
                                      }}
                                    >
                                      {opt.label}
                                    </span>
                                    {ws === opt.label && (
                                      <span
                                        style={{
                                          fontSize: 10,
                                          color: opt.color,
                                          marginLeft: "auto",
                                        }}
                                      >
                                        ✓
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        <td
                          style={{ padding: "13px 14px" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Btn
                            small
                            onClick={() => onSelectCandidate(c, agency)}
                          >
                            View →
                          </Btn>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          </div>
        )}
        {tab === "details" && (
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            <Card>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: C.text,
                  fontFamily: BODY_FONT,
                  marginBottom: 16,
                }}
              >
                Agency Contact
              </div>
              <InfoRow label="PRIMARY CONTACT" value={agency.contact} />
              <InfoRow label="ROLE" value={agency.contactRole} />
              <InfoRow label="EMAIL" value={agency.contactEmail} />
              <InfoRow label="PHONE" value={agency.contactPhone} />
              <InfoRow label="OFFICE ADDRESS" value={agency.address} />
            </Card>
            <Card>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: C.text,
                  fontFamily: BODY_FONT,
                  marginBottom: 16,
                }}
              >
                Contract Details
              </div>
              <InfoRow label="CLIENT SINCE" value={agency.since} />
              <InfoRow label="CONTRACT END" value={agency.contractEnd} />
              <InfoRow label="SLA TURNAROUND" value={agency.sla} />
              <InfoRow
                label="ACTIVE CANDIDATES"
                value={String(agencyStats(agency).total)}
              />
              <Divider label="SLA STATUS" />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: C.greenBg,
                  border: `1px solid ${C.green}40`,
                  borderRadius: 7,
                  padding: "10px 14px",
                }}
              >
                <span style={{ color: C.green }}>✓</span>
                <span
                  style={{
                    fontSize: 13,
                    color: C.green,
                    fontFamily: BODY_FONT,
                    fontWeight: 600,
                  }}
                >
                  SLA met for last 30 days
                </span>
              </div>
            </Card>
            <Card style={{ gridColumn: "1 / -1" }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: C.text,
                  fontFamily: BODY_FONT,
                  marginBottom: 16,
                }}
              >
                Compliance Agreement
              </div>
              <CheckRow
                label="Agency has signed CAP 2330 compliance agreement"
                sub="Signed April 2024 · Valid until contract end"
                checked={true}
              />
              <CheckRow
                label="Agency uses Flyck.ai for all pre-employment screening"
                checked={true}
              />
              <CheckRow
                label="Agency compliance officer designated and trained"
                checked={true}
              />
              <CheckRow
                label="Annual compliance audit scheduled"
                sub={
                  agency.id === "a4"
                    ? "Audit due September 2025"
                    : "Completed · Next due in 12 months"
                }
                checked={agency.id !== "a4"}
              />
            </Card>
          </div>
        )}
        {tab === "report" && (
          <div>
            <Card style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: C.text,
                  fontFamily: BODY_FONT,
                  marginBottom: 16,
                }}
              >
                Compliance Summary — {agency.name}
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3,1fr)",
                  gap: 12,
                  marginBottom: 20,
                }}
              >
                {[
                  {
                    label: "ID Verification Rate",
                    value: `${Math.round(
                      (agency.candidates.filter((c) => c.idVerified).length /
                        agency.candidates.length) *
                        100
                    )}%`,
                    color: C.blue,
                  },
                  {
                    label: "HMRC Verified Rate",
                    value: `${Math.round(
                      (agency.candidates.filter((c) => c.hmrcVerified).length /
                        agency.candidates.length) *
                        100
                    )}%`,
                    color: C.amber,
                  },
                  {
                    label: "DBS Cleared Rate",
                    value: `${Math.round(
                      (agency.candidates.filter((c) => c.dbsVerified).length /
                        agency.candidates.length) *
                        100
                    )}%`,
                    color: C.green,
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    style={{
                      background: C.bgPanel,
                      border: `1px solid ${C.border}`,
                      borderRadius: 8,
                      padding: "16px 18px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 28,
                        fontWeight: 700,
                        color: stat.color,
                        fontFamily: BODY_FONT,
                      }}
                    >
                      {stat.value}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: C.textFaint,
                        fontFamily: BODY_FONT,
                        marginTop: 2,
                      }}
                    >
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
              <Divider label="CANDIDATE BREAKDOWN" />
              {agency.candidates.map((c, i) => (
                <div
                  key={c.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 0",
                    borderBottom:
                      i < agency.candidates.length - 1
                        ? `1px solid ${C.border}`
                        : "none",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: c.statusColor + "15",
                        border: `1px solid ${c.statusColor}40`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 700,
                        color: c.statusColor,
                        fontFamily: MONO_FONT,
                      }}
                    >
                      {c.initials}
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 13,
                          color: C.text,
                          fontFamily: BODY_FONT,
                          fontWeight: 500,
                        }}
                      >
                        {c.name}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: C.textFaint,
                          fontFamily: MONO_FONT,
                        }}
                      >
                        {c.role}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    <div style={{ display: "flex", gap: 5 }}>
                      {[
                        ["ID", c.idVerified],
                        ["HMRC", c.hmrcVerified],
                        ["DBS", c.dbsVerified],
                      ].map(([k, v]) => (
                        <span
                          key={k}
                          style={{
                            fontSize: 10,
                            padding: "2px 7px",
                            borderRadius: 3,
                            background: v ? C.greenBg : C.bgPanel,
                            border: `1px solid ${
                              v ? C.green + "40" : C.border
                            }`,
                            color: v ? C.green : C.textFaint,
                            fontFamily: MONO_FONT,
                          }}
                        >
                          {k} {v ? "✓" : "—"}
                        </span>
                      ))}
                    </div>
                    <Badge label={c.status} color={c.statusColor} />
                    <span
                      style={{
                        fontSize: 12,
                        color: c.pct === 100 ? C.green : C.textMid,
                        fontFamily: MONO_FONT,
                        fontWeight: 700,
                        minWidth: 30,
                        textAlign: "right",
                      }}
                    >
                      {c.pct}%
                    </span>
                  </div>
                </div>
              ))}
            </Card>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn primary style={{ flex: 1 }}>
                ↓ Download Compliance Report PDF
              </Btn>
              <Btn style={{ flex: 1 }}>📧 Email Report to {agency.contact}</Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── AGENCIES VIEW ──
function AgenciesView({
  onSelectAgency,
  selectedAgency,
  onCandidateFromAgency,
}) {
  const totalCandidates = AGENCIES.reduce(
    (s, a) => s + agencyStats(a).total,
    0
  );
  const totalCleared = AGENCIES.reduce((s, a) => s + agencyStats(a).cleared, 0);
  const totalFlagged = AGENCIES.reduce((s, a) => s + agencyStats(a).flagged, 0);

  if (selectedAgency) {
    return (
      <AgencyDetailView
        agency={selectedAgency}
        onBack={() => onSelectAgency(null)}
        onSelectCandidate={onCandidateFromAgency}
      />
    );
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <div
        style={{
          background: C.bgCard,
          borderBottom: `1px solid ${C.border}`,
          padding: "14px 26px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: C.text,
              fontFamily: BODY_FONT,
            }}
          >
            Agency Portal
          </div>
          <div
            style={{ fontSize: 12, color: C.textFaint, fontFamily: BODY_FONT }}
          >
            Manage your staffing agencies & their candidate compliance
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <APIBadge status="live" />
          <Btn primary>+ Onboard Agency</Btn>
        </div>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "24px 28px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: 10,
            marginBottom: 24,
          }}
        >
          <StatCard
            label="Total Agency Candidates"
            value={totalCandidates}
            sub="Across all agencies"
          />
          <StatCard
            label="Fully Cleared"
            value={totalCleared}
            color={C.green}
            sub={`${Math.round(
              (totalCleared / totalCandidates) * 100
            )}% clearance rate`}
          />
          <StatCard
            label="Flagged / Issues"
            value={totalFlagged}
            color={C.red}
            sub="Require attention"
          />
          <StatCard
            label="Active Agencies"
            value={AGENCIES.length}
            color={C.blue}
            sub="All contracts active"
          />
        </div>
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: C.text,
            fontFamily: BODY_FONT,
            marginBottom: 14,
          }}
        >
          Staffing Agencies
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2,1fr)",
            gap: 16,
            marginBottom: 28,
          }}
        >
          {AGENCIES.map((agency) => {
            const rate = Math.round(
              (agencyStats(agency).cleared / agencyStats(agency).total) * 100
            );
            return (
              <div
                key={agency.id}
                onClick={() => onSelectAgency(agency)}
                style={{
                  background: C.bgCard,
                  border: `1px solid ${C.border}`,
                  borderRadius: 10,
                  overflow: "hidden",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 4px 20px rgba(0,0,0,0.10)";
                  e.currentTarget.style.borderColor = agency.color + "60";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.borderColor = C.border;
                }}
              >
                <div style={{ height: 5, background: agency.color }} />
                <div style={{ padding: "18px 20px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 14,
                    }}
                  >
                    <div
                      style={{ display: "flex", gap: 12, alignItems: "center" }}
                    >
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 10,
                          background: agency.color + "18",
                          border: `2px solid ${agency.color}30`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 15,
                          fontWeight: 700,
                          color: agency.color,
                          fontFamily: MONO_FONT,
                        }}
                      >
                        {agency.initials}
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 16,
                            fontWeight: 700,
                            color: C.text,
                            fontFamily: BODY_FONT,
                          }}
                        >
                          {agency.name}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: C.textFaint,
                            fontFamily: BODY_FONT,
                          }}
                        >
                          {agency.contact} · {agency.contactRole}
                        </div>
                      </div>
                    </div>
                    <Badge
                      label={`${rate}% Compliant`}
                      color={
                        rate >= 85 ? C.green : rate >= 65 ? C.amber : C.red
                      }
                    />
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 5,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          color: C.textFaint,
                          fontFamily: MONO_FONT,
                        }}
                      >
                        COMPLIANCE RATE
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color:
                            rate >= 85 ? C.green : rate >= 65 ? C.amber : C.red,
                          fontFamily: MONO_FONT,
                          fontWeight: 700,
                        }}
                      >
                        {rate}%
                      </span>
                    </div>
                    <div
                      style={{
                        height: 6,
                        background: C.bgPanel,
                        borderRadius: 4,
                        overflow: "hidden",
                        border: `1px solid ${C.border}`,
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${rate}%`,
                          background:
                            rate >= 85 ? C.green : rate >= 65 ? C.amber : C.red,
                          borderRadius: 4,
                        }}
                      />
                    </div>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3,1fr)",
                      gap: 8,
                      marginBottom: 14,
                    }}
                  >
                    {[
                      ["Total", agencyStats(agency).total, C.text],
                      ["Cleared", agencyStats(agency).cleared, C.green],
                      ["Flagged", agencyStats(agency).flagged, C.red],
                    ].map(([k, v, col]) => (
                      <div
                        key={k}
                        style={{
                          background: C.bgPanel,
                          border: `1px solid ${C.border}`,
                          borderRadius: 6,
                          padding: "8px 12px",
                          textAlign: "center",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 20,
                            fontWeight: 700,
                            color: col,
                            fontFamily: BODY_FONT,
                          }}
                        >
                          {v}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            color: C.textFaint,
                            fontFamily: MONO_FONT,
                          }}
                        >
                          {k}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderTop: `1px solid ${C.border}`,
                      paddingTop: 12,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        color: C.textFaint,
                        fontFamily: MONO_FONT,
                      }}
                    >
                      SLA: {agency.sla} · Since {agency.since}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: agency.color,
                        fontFamily: BODY_FONT,
                        fontWeight: 600,
                      }}
                    >
                      View Agency →
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <Card>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: C.text,
              fontFamily: BODY_FONT,
              marginBottom: 14,
            }}
          >
            Cross-Agency Compliance Overview
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: C.bgPanel }}>
                {[
                  "Agency",
                  "Candidates",
                  "Cleared",
                  "Pending",
                  "Flagged",
                  "Rate",
                  "SLA",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 14px",
                      textAlign: "left",
                      fontSize: 10,
                      color: C.textFaint,
                      fontFamily: MONO_FONT,
                      letterSpacing: "0.07em",
                      borderBottom: `1px solid ${C.border}`,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {AGENCIES.map((a, i) => {
                const rate = Math.round(
                  (agencyStats(a).cleared / agencyStats(a).total) * 100
                );
                return (
                  <tr
                    key={a.id}
                    onClick={() => onSelectAgency(a)}
                    style={{
                      borderBottom:
                        i < AGENCIES.length - 1
                          ? `1px solid ${C.border}`
                          : "none",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = C.bgPanel)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <td style={{ padding: "12px 14px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: a.color,
                          }}
                        />
                        <span
                          style={{
                            fontSize: 14,
                            color: C.text,
                            fontWeight: 600,
                            fontFamily: BODY_FONT,
                          }}
                        >
                          {a.name}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span
                        style={{
                          fontSize: 13,
                          color: C.text,
                          fontFamily: BODY_FONT,
                        }}
                      >
                        {agencyStats(a).total}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span
                        style={{
                          fontSize: 13,
                          color: C.green,
                          fontFamily: BODY_FONT,
                          fontWeight: 600,
                        }}
                      >
                        {agencyStats(a).cleared}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span
                        style={{
                          fontSize: 13,
                          color: C.amber,
                          fontFamily: BODY_FONT,
                        }}
                      >
                        {agencyStats(a).pending}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span
                        style={{
                          fontSize: 13,
                          color:
                            agencyStats(a).flagged > 0 ? C.red : C.textFaint,
                          fontFamily: BODY_FONT,
                          fontWeight: agencyStats(a).flagged > 0 ? 700 : 400,
                        }}
                      >
                        {agencyStats(a).flagged}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            width: 60,
                            height: 4,
                            background: C.bgPanel,
                            borderRadius: 2,
                            overflow: "hidden",
                            border: `1px solid ${C.border}`,
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${rate}%`,
                              background:
                                rate >= 85
                                  ? C.green
                                  : rate >= 65
                                  ? C.amber
                                  : C.red,
                              borderRadius: 2,
                            }}
                          />
                        </div>
                        <span
                          style={{
                            fontSize: 12,
                            color:
                              rate >= 85
                                ? C.green
                                : rate >= 65
                                ? C.amber
                                : C.red,
                            fontFamily: MONO_FONT,
                            fontWeight: 700,
                          }}
                        >
                          {rate}%
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span
                        style={{
                          fontSize: 11,
                          color: C.textFaint,
                          fontFamily: MONO_FONT,
                        }}
                      >
                        {a.sla}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

// ── AUDIT PACK MODAL ──
function AuditPackModal({ onClose, candidates }) {
  const [selected, setSelected] = useState(new Set([candidates[0]?.id]));
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);
  const toggle = (id) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const generate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setDone(true);
    }, 2200);
  };
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 580,
          background: C.bgCard,
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 24px 80px rgba(0,0,0,0.2)",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            background: C.text,
            padding: "18px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#FAF8F4",
                fontFamily: BODY_FONT,
              }}
            >
              Generate Audit Pack
            </div>
            <div
              style={{
                fontSize: 12,
                color: "rgba(250,248,244,0.6)",
                fontFamily: BODY_FONT,
              }}
            >
              CAP 2330 · Select candidates to include
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "none",
              borderRadius: 6,
              width: 30,
              height: 30,
              cursor: "pointer",
              color: "#FAF8F4",
              fontSize: 14,
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ overflowY: "auto", flex: 1 }}>
          {candidates.map((c, i) => (
            <div
              key={c.id}
              onClick={() => toggle(c.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "13px 24px",
                borderBottom:
                  i < candidates.length - 1 ? `1px solid ${C.border}` : "none",
                cursor: "pointer",
                background: selected.has(c.id) ? C.bgPanel : "transparent",
              }}
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 4,
                  border: `1.5px solid ${
                    selected.has(c.id) ? C.text : C.borderDk
                  }`,
                  background: selected.has(c.id) ? C.text : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  color: "#FAF8F4",
                }}
              >
                {selected.has(c.id) ? "✓" : ""}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 14,
                    color: C.text,
                    fontWeight: 600,
                    fontFamily: BODY_FONT,
                  }}
                >
                  {c.name}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: C.textFaint,
                    fontFamily: MONO_FONT,
                  }}
                >
                  {c.role}
                </div>
              </div>
              <Badge label={c.status} color={c.statusColor} />
            </div>
          ))}
        </div>
        <div
          style={{
            padding: "16px 24px",
            borderTop: `1px solid ${C.border}`,
            background: C.bgPanel,
            flexShrink: 0,
          }}
        >
          {done ? (
            <div
              style={{
                background: C.greenBg,
                border: `1px solid ${C.green}40`,
                borderRadius: 8,
                padding: "12px 16px",
                display: "flex",
                gap: 10,
                alignItems: "center",
              }}
            >
              <span style={{ color: C.green, fontSize: 18 }}>✓</span>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: C.green,
                  fontFamily: BODY_FONT,
                }}
              >
                Audit Pack Generated
              </div>
              <Btn primary style={{ marginLeft: "auto" }}>
                ↓ Download ZIP
              </Btn>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div
                style={{
                  flex: 1,
                  fontSize: 13,
                  color: C.textFaint,
                  fontFamily: BODY_FONT,
                }}
              >
                {selected.size} candidate{selected.size !== 1 ? "s" : ""}{" "}
                selected
              </div>
              <Btn onClick={onClose}>Cancel</Btn>
              <Btn
                primary
                disabled={selected.size === 0 || generating}
                onClick={generate}
              >
                {generating ? "Generating…" : "Generate Pack →"}
              </Btn>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── TRAINING VIEW ──
function TrainingView() {
  const [activeVideo, setActiveVideo] = useState(null);
  const VIDEOS = [
    {
      id: 1,
      title: "Platform Overview",
      duration: "4:32",
      desc: "A complete walkthrough of the Flyck.ai dashboard, candidate pipeline, and CAP 2330 compliance workflow.",
      icon: "🎬",
      color: C.blue,
      chapters: [
        "Dashboard navigation",
        "Candidate pipeline",
        "Compliance scores",
      ],
    },
    {
      id: 2,
      title: "Onboarding a New Candidate",
      duration: "6:15",
      desc: "Step-by-step guide to adding a candidate, completing registration, and initiating ID verification.",
      icon: "👤",
      color: C.green,
      chapters: ["Adding a candidate", "Registration form", "ID & documents"],
    },
    {
      id: 3,
      title: "HMRC API & Employment History",
      duration: "5:48",
      desc: "How to query the HMRC API for employment history, understand the 5-year timeline, and resolve gaps.",
      icon: "📋",
      color: C.amber,
      chapters: [
        "Querying HMRC API",
        "Reading the timeline",
        "Resolving >28 day gaps",
      ],
    },
    {
      id: 4,
      title: "DBS Checks via API",
      duration: "3:20",
      desc: "Submitting DBS applications through the e-Bulk API, reading certificates, and handling disclosures.",
      icon: "✅",
      color: C.purple,
      chapters: [
        "DBS e-Bulk API",
        "Certificate retrieval",
        "Handling disclosures",
      ],
    },
    {
      id: 5,
      title: "Managing Agency Compliance",
      duration: "4:10",
      desc: "How to use the Agency Portal to manage staffing partners, review their candidates and generate compliance reports.",
      icon: "🏢",
      color: C.teal,
      chapters: [
        "Agency portal",
        "Candidate compliance",
        "Sending nudges",
        "Compliance reports",
      ],
    },
    {
      id: 6,
      title: "Generating Audit Packs",
      duration: "2:45",
      desc: "How to select candidates, generate a CAP 2330 audit pack, and share it with the CAA.",
      icon: "📦",
      color: C.text,
      chapters: [
        "Selecting candidates",
        "Generating the pack",
        "Downloading & sharing",
      ],
    },
  ];
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <div
        style={{
          background: C.bgCard,
          borderBottom: `1px solid ${C.border}`,
          padding: "14px 26px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: C.text,
              fontFamily: BODY_FONT,
            }}
          >
            Training Centre
          </div>
          <div
            style={{ fontSize: 12, color: C.textFaint, fontFamily: BODY_FONT }}
          >
            Platform guides & video walkthroughs
          </div>
        </div>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "28px 30px" }}>
        <div
          style={{
            background: C.text,
            borderRadius: 12,
            padding: "32px 36px",
            marginBottom: 28,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "#FAF8F4",
                fontFamily: BODY_FONT,
                marginBottom: 8,
              }}
            >
              Welcome to Flyck.ai Training
            </div>
            <div
              style={{
                fontSize: 14,
                color: "rgba(250,248,244,0.7)",
                fontFamily: BODY_FONT,
                maxWidth: 480,
                lineHeight: 1.6,
              }}
            >
              Step-by-step guides to master the platform and stay CAP 2330
              compliant.
            </div>
          </div>
          <div style={{ fontSize: 80, opacity: 0.15 }}>🎓</div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: 16,
          }}
        >
          {VIDEOS.map((v) => (
            <div
              key={v.id}
              onClick={() => setActiveVideo(v)}
              style={{
                background: C.bgCard,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                overflow: "hidden",
                cursor: "pointer",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.boxShadow =
                  "0 4px 20px rgba(0,0,0,0.10)")
              }
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
            >
              <div
                style={{
                  height: 130,
                  background: `linear-gradient(135deg, ${v.color}22, ${v.color}44)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  borderBottom: `1px solid ${C.border}`,
                }}
              >
                <span style={{ fontSize: 48 }}>{v.icon}</span>
                <div
                  style={{
                    position: "absolute",
                    bottom: 10,
                    right: 10,
                    background: "rgba(0,0,0,0.6)",
                    borderRadius: 4,
                    padding: "2px 8px",
                    fontSize: 11,
                    color: "#fff",
                    fontFamily: MONO_FONT,
                  }}
                >
                  {v.duration}
                </div>
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%,-50%)",
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.9)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
                  }}
                >
                  ▶
                </div>
              </div>
              <div style={{ padding: "14px 16px" }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: C.text,
                    fontFamily: BODY_FONT,
                    marginBottom: 5,
                  }}
                >
                  {v.title}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: C.textFaint,
                    fontFamily: BODY_FONT,
                    lineHeight: 1.5,
                    marginBottom: 10,
                  }}
                >
                  {v.desc}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {v.chapters.map((ch) => (
                    <span
                      key={ch}
                      style={{
                        fontSize: 11,
                        color: v.color,
                        background: v.color + "15",
                        border: `1px solid ${v.color}30`,
                        padding: "2px 8px",
                        borderRadius: 20,
                        fontFamily: BODY_FONT,
                      }}
                    >
                      {ch}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {activeVideo && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            zIndex: 300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setActiveVideo(null)}
        >
          <div
            style={{
              width: 760,
              background: C.bgCard,
              borderRadius: 12,
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                height: 400,
                background: C.text,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 72, marginBottom: 16 }}>
                  {activeVideo.icon}
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#FAF8F4",
                    fontFamily: BODY_FONT,
                    marginBottom: 6,
                  }}
                >
                  {activeVideo.title}
                </div>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.15)",
                    border: "2px solid rgba(255,255,255,0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                    cursor: "pointer",
                    margin: "0 auto",
                  }}
                >
                  ▶
                </div>
              </div>
              <button
                onClick={() => setActiveVideo(null)}
                style={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  background: "rgba(255,255,255,0.15)",
                  border: "none",
                  borderRadius: 6,
                  width: 32,
                  height: 32,
                  cursor: "pointer",
                  color: "#FAF8F4",
                  fontSize: 14,
                }}
              >
                ✕
              </button>
            </div>
            <div
              style={{
                padding: "16px 20px",
                display: "flex",
                gap: 8,
                borderTop: `1px solid ${C.border}`,
              }}
            >
              {activeVideo.chapters.map((ch, i) => (
                <span
                  key={ch}
                  style={{
                    fontSize: 12,
                    color: activeVideo.color,
                    background: activeVideo.color + "15",
                    border: `1px solid ${activeVideo.color}30`,
                    padding: "4px 12px",
                    borderRadius: 20,
                    fontFamily: BODY_FONT,
                  }}
                >{`${i + 1}. ${ch}`}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── ASK FLYCK CHATBOT ──
function AskFlyck() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Hi! I'm Flyck, your compliance assistant. Ask me anything about CAP 2330, candidate checks, HMRC verification, DBS, or agency management.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const QUICK = [
    "What is CAP 2330?",
    "How do I manage an agency?",
    "What is a DBS check?",
    "How do I resolve a gap?",
  ];
  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const userMsg = text.trim();
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
          system:
            "You are Flyck, a helpful compliance assistant built into the Flyck.ai platform. You help HR and compliance teams understand CAP 2330, HMRC employment history verification, DBS checks, employment gap resolution, agency management and compliance. Keep answers concise, friendly and practical.",
          messages: [
            ...messages
              .filter((_, i) => i > 0)
              .map((m) => ({
                role: m.role === "bot" ? "assistant" : "user",
                content: m.text,
              })),
            { role: "user", content: userMsg },
          ],
        }),
      });
      const data = await res.json();
      const reply =
        data.content?.[0]?.text || "Sorry, I couldn't get a response.";
      setMessages((m) => [...m, { role: "bot", text: reply }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          role: "bot",
          text: "Sorry, I'm having trouble connecting right now.",
        },
      ]);
    }
    setLoading(false);
  };
  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: C.text,
          border: "none",
          cursor: "pointer",
          boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
          zIndex: 500,
        }}
      >
        {open ? "✕" : "🤖"}
      </button>
      {!open && (
        <div
          onClick={() => setOpen(true)}
          style={{
            position: "fixed",
            bottom: 32,
            right: 90,
            background: C.bgCard,
            border: `1px solid ${C.border}`,
            borderRadius: 20,
            padding: "6px 14px",
            cursor: "pointer",
            boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
            zIndex: 499,
          }}
        >
          <span
            style={{
              fontSize: 13,
              color: C.text,
              fontFamily: BODY_FONT,
              fontWeight: 600,
            }}
          >
            Ask Flyck
          </span>
        </div>
      )}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 92,
            right: 24,
            width: 380,
            height: 520,
            background: C.bgCard,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            boxShadow: "0 12px 48px rgba(0,0,0,0.18)",
            display: "flex",
            flexDirection: "column",
            zIndex: 500,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              background: C.text,
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
              }}
            >
              🤖
            </div>
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#FAF8F4",
                  fontFamily: BODY_FONT,
                }}
              >
                Ask Flyck
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "rgba(250,248,244,0.6)",
                  fontFamily: MONO_FONT,
                }}
              >
                CAP 2330 Expert
              </div>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px" }}>
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    maxWidth: "82%",
                    padding: "10px 14px",
                    borderRadius:
                      m.role === "user"
                        ? "12px 12px 3px 12px"
                        : "12px 12px 12px 3px",
                    background: m.role === "user" ? C.text : C.bgPanel,
                    border:
                      m.role === "user" ? "none" : `1px solid ${C.border}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      color: m.role === "user" ? "#FAF8F4" : C.text,
                      fontFamily: BODY_FONT,
                      lineHeight: 1.55,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {m.text}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-start",
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    padding: "10px 16px",
                    borderRadius: "12px 12px 12px 3px",
                    background: C.bgPanel,
                    border: `1px solid ${C.border}`,
                  }}
                >
                  <div style={{ display: "flex", gap: 4 }}>
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: C.textFaint,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          {messages.length <= 2 && (
            <div
              style={{
                padding: "0 12px 8px",
                display: "flex",
                flexWrap: "wrap",
                gap: 5,
                flexShrink: 0,
              }}
            >
              {QUICK.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  style={{
                    fontSize: 11,
                    color: C.blue,
                    background: C.blueBg,
                    border: `1px solid ${C.blue}30`,
                    borderRadius: 20,
                    padding: "4px 10px",
                    cursor: "pointer",
                    fontFamily: BODY_FONT,
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}
          <div
            style={{
              padding: "10px 12px",
              borderTop: `1px solid ${C.border}`,
              display: "flex",
              gap: 8,
              flexShrink: 0,
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && !loading && sendMessage(input)
              }
              placeholder="Ask anything about compliance…"
              style={{
                flex: 1,
                background: C.bgInput,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: 13,
                fontFamily: BODY_FONT,
                color: C.text,
                outline: "none",
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: C.text,
                border: "none",
                cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                color: "#FAF8F4",
                fontSize: 16,
                opacity: loading || !input.trim() ? 0.4 : 1,
              }}
            >
              →
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ── BRS TRANSPORT HOME VIEW ──
function BRSHomeView({ onSelectCandidate, onSlack, onAudit, onAgencies, initialCandidates = [], initialArchived = [], onCandidateAction }) {
  const [candidates, setCandidates] = useState(initialCandidates);
  const [archivedCandidates, setArchivedCandidates] = useState(initialArchived);
  const [homeTab, setHomeTab] = useState("active");

  useEffect(() => { setCandidates(initialCandidates); }, [initialCandidates]);
  useEffect(() => { setArchivedCandidates(initialArchived); }, [initialArchived]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [linkModal, setLinkModal] = useState(null);
  const [linkEmail, setLinkEmail] = useState("");
  const [linkSent, setLinkSent] = useState(null);
  const [sending, setSending] = useState(false);
  const [addMode, setAddMode] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("");
  const [addSent, setAddSent] = useState(false);
  const [removeConfirm, setRemoveConfirm] = useState(null); // candidate awaiting remove action

  const handleArchiveCandidate = async (c) => {
    setCandidates(prev => prev.filter(x => x.id !== c.id));
    setArchivedCandidates(prev => [...prev, { ...c }]);
    setRemoveConfirm(null);
    if (c.supabaseId) {
      await setHiddenStatus(c.supabaseId, "archived");
      if (onCandidateAction) onCandidateAction();
    }
  };

  const handleDeleteCandidate = async (c) => {
    setCandidates(prev => prev.filter(x => x.id !== c.id));
    setArchivedCandidates(prev => prev.filter(x => x.id !== c.id));
    setRemoveConfirm(null);
    if (c.supabaseId) {
      await setHiddenStatus(c.supabaseId, "deleted");
      if (onCandidateAction) onCandidateAction();
    }
  };

  const visible = candidates.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.role.toLowerCase().includes(q) ||
      c.status.toLowerCase().includes(q);
    if (!matchSearch) return false;
    if (filter === "Cleared") return c.pct >= 90;
    if (filter === "Pending") return c.pct < 90 && c.pct > 15;
    if (filter === "Not Started") return c.pct <= 15;
    return true;
  });

  const cleared = candidates.filter((c) => c.pct >= 90).length;
  const pending = candidates.filter((c) => c.pct < 90 && c.pct > 15).length;
  const notStarted = candidates.filter((c) => c.pct <= 15).length;

  const handleSendLink = (candidate) => {
    setLinkModal(candidate);
    setLinkEmail(candidate.email || "");
    setLinkSent(null);
  };
  const doSendLink = () => {
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setLinkSent(linkEmail);
      setCandidates((cs) =>
        cs.map((c) =>
          c.id === linkModal.id
            ? {
                ...c,
                registered: false,
                status: c.pct <= 15 ? "Invite Sent" : c.status,
                statusColor: c.pct <= 15 ? C.blue : c.statusColor,
              }
            : c
        )
      );
      setTimeout(() => {
        setLinkModal(null);
        setLinkSent(null);
      }, 2800);
    }, 1500);
  };
  const doAddAndInvite = () => {
    if (!newName.trim() || !newEmail.trim()) return;
    const initials = newName
      .trim()
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
    const newC = {
      id: "c" + Date.now(),
      name: newName.trim(),
      initials,
      role: newRole.trim() || "Staff",
      email: newEmail.trim(),
      phone: "",
      status: "Invite Sent",
      statusColor: C.blue,
      pct: 10,
      dob: "—",
      ni: "—",
      city: "—",
      idVerified: false,
      hmrcVerified: false,
      dbsVerified: false,
      gaps: 0,
      registered: false,
      docs: [],
    };
    setCandidates((cs) => [...cs, newC]);
    setAddSent(true);
    setTimeout(() => {
      setAddMode(false);
      setAddSent(false);
      setNewName("");
      setNewEmail("");
      setNewRole("");
    }, 2500);
  };
  const regLink = (email) =>
    `https://app.flyck.ai/register?ref=${btoa(email)}&client=${btoa(
      CLIENT_NAME
    )}`;

  const totalAgencyCandidates = AGENCIES.reduce(
    (s, a) => s + agencyStats(a).total,
    0
  );
  const totalAgencyCleared = AGENCIES.reduce(
    (s, a) => s + agencyStats(a).cleared,
    0
  );
  const agencyComplianceRate = Math.round(
    (totalAgencyCleared / totalAgencyCandidates) * 100
  );

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <div
        style={{
          background: C.bgCard,
          borderBottom: `1px solid ${C.border}`,
          padding: "14px 26px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: C.text,
              fontFamily: BODY_FONT,
            }}
          >
            {CLIENT_NAME}
          </div>
          <div
            style={{ fontSize: 12, color: C.textFaint, fontFamily: BODY_FONT }}
          >
            Client Candidate Pool · CAP 2330
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: C.green,
              }}
            />
            <span
              style={{ fontSize: 11, color: C.green, fontFamily: MONO_FONT }}
            >
              Live
            </span>
          </div>
          <APIBadge status="live" />
          <button
            onClick={onSlack}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "7px 14px",
              background: C.slack + "15",
              border: `1px solid ${C.slack}40`,
              borderRadius: 6,
              cursor: "pointer",
              color: C.slack,
              fontFamily: BODY_FONT,
              fontSize: 13,
            }}
          >
            💬 Slack
          </button>
          <Btn onClick={onAudit}>📦 Audit Pack</Btn>
          <button
            onClick={() => setAddMode(true)}
            style={{
              padding: "7px 18px",
              borderRadius: 6,
              border: "none",
              background: CLIENT_COLOR,
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: BODY_FONT,
            }}
          >
            + Invite Candidate
          </button>
        </div>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "24px 28px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: 10,
            marginBottom: 20,
          }}
        >
          {[
            {
              label: "Total Candidates",
              value: candidates.length,
              color: C.text,
              filterKey: "All",
            },
            {
              label: "Fully Cleared",
              value: cleared,
              color: C.green,
              filterKey: "Cleared",
            },
            {
              label: "Pending",
              value: pending,
              color: C.amber,
              filterKey: "Pending",
            },
            {
              label: "Not Started",
              value: notStarted,
              color: C.textFaint,
              filterKey: "Not Started",
            },
          ].map(({ label, value, color, filterKey }) => {
            const isActive = filter === filterKey;
            return (
              <div
                key={filterKey}
                onClick={() => setFilter(filterKey)}
                style={{
                  background: C.bgCard,
                  border: `2px solid ${isActive ? color : C.border}`,
                  borderRadius: 8,
                  padding: "14px 18px",
                  cursor: "pointer",
                  boxShadow: isActive ? `0 0 0 3px ${color}18` : "none",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = color;
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${color}18`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = isActive
                    ? color
                    : C.border;
                  e.currentTarget.style.boxShadow = isActive
                    ? `0 0 0 3px ${color}18`
                    : "none";
                }}
              >
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color,
                    fontFamily: BODY_FONT,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {value}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: C.textFaint,
                    fontFamily: BODY_FONT,
                    marginTop: 2,
                  }}
                >
                  {label}
                </div>
                {isActive && (
                  <div
                    style={{
                      fontSize: 10,
                      color,
                      fontFamily: MONO_FONT,
                      marginTop: 4,
                      letterSpacing: "0.05em",
                    }}
                  >
                    ● FILTERED
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div
          onClick={onAgencies}
          style={{
            background: C.bgCard,
            border: `2px solid ${C.teal}30`,
            borderRadius: 10,
            padding: "14px 20px",
            marginBottom: 18,
            cursor: "pointer",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = C.teal + "60";
            e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = C.teal + "30";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: C.teal + "18",
                border: `1px solid ${C.teal}30`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
              }}
            >
              🏢
            </div>
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: C.text,
                  fontFamily: BODY_FONT,
                }}
              >
                Agency Portal
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: C.textFaint,
                  fontFamily: BODY_FONT,
                }}
              >
                {AGENCIES.length} active agencies · {totalAgencyCandidates}{" "}
                candidates · {agencyComplianceRate}% overall compliance rate
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {AGENCIES.map((a) => (
              <div
                key={a.id}
                title={a.name}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  background: a.color + "18",
                  border: `1px solid ${a.color}40`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  color: a.color,
                  fontFamily: MONO_FONT,
                }}
              >
                {a.initials}
              </div>
            ))}
            <div
              style={{
                fontSize: 13,
                color: C.teal,
                fontFamily: BODY_FONT,
                fontWeight: 600,
                marginLeft: 8,
              }}
            >
              Manage Agencies →
            </div>
          </div>
        </div>
        {addMode && (
          <div
            style={{
              background: C.bgCard,
              border: `1px solid ${CLIENT_COLOR}40`,
              borderRadius: 10,
              padding: "18px 20px",
              marginBottom: 18,
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: C.text,
                fontFamily: BODY_FONT,
                marginBottom: 12,
              }}
            >
              Invite New Candidate
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr auto auto",
                gap: 10,
                alignItems: "flex-end",
              }}
            >
              <div>
                <Label>Full Name</Label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Sam Peters"
                  style={{
                    width: "100%",
                    background: C.bgInput,
                    border: `1px solid ${C.border}`,
                    borderRadius: 6,
                    padding: "9px 12px",
                    fontSize: 13,
                    fontFamily: BODY_FONT,
                    color: C.text,
                    outline: "none",
                  }}
                />
              </div>
              <div>
                <Label>Email Address</Label>
                <input
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="candidate@email.com"
                  type="email"
                  style={{
                    width: "100%",
                    background: C.bgInput,
                    border: `1px solid ${C.border}`,
                    borderRadius: 6,
                    padding: "9px 12px",
                    fontSize: 13,
                    fontFamily: BODY_FONT,
                    color: C.text,
                    outline: "none",
                  }}
                />
              </div>
              <div>
                <Label>Role (optional)</Label>
                <input
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  placeholder="e.g. Ground Staff"
                  style={{
                    width: "100%",
                    background: C.bgInput,
                    border: `1px solid ${C.border}`,
                    borderRadius: 6,
                    padding: "9px 12px",
                    fontSize: 13,
                    fontFamily: BODY_FONT,
                    color: C.text,
                    outline: "none",
                  }}
                />
              </div>
              <button
                onClick={doAddAndInvite}
                disabled={!newName.trim() || !newEmail.trim()}
                style={{
                  padding: "9px 18px",
                  borderRadius: 6,
                  border: "none",
                  background:
                    newName.trim() && newEmail.trim() ? CLIENT_COLOR : "#ccc",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor:
                    newName.trim() && newEmail.trim()
                      ? "pointer"
                      : "not-allowed",
                  fontFamily: BODY_FONT,
                  whiteSpace: "nowrap",
                }}
              >
                Send Invite
              </button>
              <button
                onClick={() => {
                  setAddMode(false);
                  setNewName("");
                  setNewEmail("");
                  setNewRole("");
                }}
                style={{
                  padding: "9px 14px",
                  borderRadius: 6,
                  border: `1px solid ${C.border}`,
                  background: "transparent",
                  color: C.textMid,
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: BODY_FONT,
                }}
              >
                Cancel
              </button>
            </div>
            {addSent && (
              <div
                style={{
                  marginTop: 12,
                  background: C.greenBg,
                  border: `1px solid ${C.green}40`,
                  borderRadius: 7,
                  padding: "9px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span style={{ color: C.green }}>✓</span>
                <span
                  style={{
                    fontSize: 13,
                    color: C.green,
                    fontFamily: BODY_FONT,
                    fontWeight: 600,
                  }}
                >
                  Registration link sent to {newEmail}
                </span>
              </div>
            )}
          </div>
        )}
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <div style={{ position: "relative", flex: 1 }}>
            <span
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 14,
                color: C.textFaint,
              }}
            >
              🔍
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidates…"
              style={{
                width: "100%",
                background: C.bgCard,
                border: `1px solid ${C.border}`,
                borderRadius: 7,
                padding: "9px 12px 9px 36px",
                fontSize: 13,
                fontFamily: BODY_FONT,
                color: C.text,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {["All", "Cleared", "Pending", "Not Started"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: "5px 16px",
                  borderRadius: 5,
                  border: `1px solid ${filter === f ? C.text : C.border}`,
                  background: filter === f ? C.text : "transparent",
                  color: filter === f ? "#FAF8F4" : C.textMid,
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: BODY_FONT,
                  fontWeight: filter === f ? 600 : 400,
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        {/* Active / Archived tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
          {[["active", "Active Candidates"], ["archived", `Archived (${archivedCandidates.length})`]].map(([key, label]) => (
            <button key={key} onClick={() => setHomeTab(key)} style={{ padding: "7px 18px", borderRadius: 7, border: `1px solid ${homeTab === key ? C.text : C.border}`, background: homeTab === key ? C.text : "transparent", color: homeTab === key ? "#FAF8F4" : C.textMid, fontSize: 13, fontWeight: homeTab === key ? 600 : 400, cursor: "pointer", fontFamily: BODY_FONT }}>
              {label}
            </button>
          ))}
        </div>
        {homeTab === "archived" ? (
          <Card style={{ padding: 0, overflow: "hidden" }}>
            {archivedCandidates.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: C.textFaint, fontFamily: BODY_FONT, fontSize: 14 }}>No archived candidates.</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: C.bgPanel }}>
                    {["Candidate", "Role", "Archived", ""].map(h => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10, color: C.textFaint, fontFamily: MONO_FONT, letterSpacing: "0.07em", borderBottom: `1px solid ${C.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {archivedCandidates.map((c, i) => (
                    <tr key={c.id} style={{ borderBottom: i < archivedCandidates.length - 1 ? `1px solid ${C.border}` : "none" }}>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: C.text, fontFamily: BODY_FONT }}>{c.name}</div>
                        <div style={{ fontSize: 12, color: C.textFaint, fontFamily: BODY_FONT }}>{c.email}</div>
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: 13, color: C.textMid, fontFamily: BODY_FONT }}>{c.role}</td>
                      <td style={{ padding: "12px 14px", fontSize: 12, color: C.textFaint, fontFamily: MONO_FONT }}>Archived</td>
                      <td style={{ padding: "12px 14px" }}>
                        <button onClick={() => handleDeleteCandidate(c)} style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${C.red}50`, background: C.red + "10", color: C.red, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: BODY_FONT }}>🗑 Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        ) : (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: C.bgPanel }}>
                {[
                  "Candidate",
                  "Status",
                  "ID",
                  "HMRC",
                  "DBS",
                  "Score",
                  "Registration",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 14px",
                      textAlign: "left",
                      fontSize: 10,
                      color: C.textFaint,
                      fontFamily: MONO_FONT,
                      letterSpacing: "0.07em",
                      borderBottom: `1px solid ${C.border}`,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((c, i) => (
                <tr
                  key={c.id}
                  style={{
                    borderBottom:
                      i < visible.length - 1 ? `1px solid ${C.border}` : "none",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = C.bgPanel)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <td
                    style={{ padding: "13px 14px", cursor: "pointer" }}
                    onClick={() => onSelectCandidate(c)}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: "50%",
                          background: c.statusColor + "15",
                          border: `1px solid ${c.statusColor}40`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          fontWeight: 700,
                          color: c.statusColor,
                          fontFamily: MONO_FONT,
                        }}
                      >
                        {c.initials}
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 14,
                            color: C.text,
                            fontWeight: 600,
                            fontFamily: BODY_FONT,
                          }}
                        >
                          {c.name}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: C.textFaint,
                            fontFamily: MONO_FONT,
                          }}
                        >
                          {c.role}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td
                    style={{ padding: "13px 14px", cursor: "pointer" }}
                    onClick={() => onSelectCandidate(c)}
                  >
                    <Badge label={c.status} color={c.statusColor} />
                  </td>
                  <td style={{ padding: "13px 14px" }}>
                    <span
                      style={{
                        fontSize: 12,
                        color: c.idVerified ? C.green : C.textFaint,
                        fontFamily: MONO_FONT,
                      }}
                    >
                      {c.idVerified ? "✓" : "—"}
                    </span>
                  </td>
                  <td style={{ padding: "13px 14px" }}>
                    <span
                      style={{
                        fontSize: 12,
                        color: c.hmrcVerified ? C.green : C.textFaint,
                        fontFamily: MONO_FONT,
                      }}
                    >
                      {c.hmrcVerified ? "✓" : "—"}
                    </span>
                  </td>
                  <td style={{ padding: "13px 14px" }}>
                    <span
                      style={{
                        fontSize: 12,
                        color: c.dbsVerified ? C.green : C.textFaint,
                        fontFamily: MONO_FONT,
                      }}
                    >
                      {c.dbsVerified ? "✓" : "—"}
                    </span>
                  </td>
                  <td
                    style={{ padding: "13px 14px", cursor: "pointer" }}
                    onClick={() => onSelectCandidate(c)}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <div
                        style={{
                          width: 52,
                          height: 4,
                          background: C.bgPanel,
                          borderRadius: 2,
                          overflow: "hidden",
                          border: `1px solid ${C.border}`,
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${c.pct}%`,
                            background:
                              c.pct === 100
                                ? C.green
                                : c.pct >= 70
                                ? C.amber
                                : C.red,
                            borderRadius: 2,
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: 12,
                          color: c.pct === 100 ? C.green : C.textMid,
                          fontFamily: MONO_FONT,
                          fontWeight: c.pct === 100 ? 700 : 400,
                        }}
                      >
                        {c.pct}%
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "13px 14px" }}>
                    {c.status === "Invite Sent" ? (
                      <span
                        style={{
                          fontSize: 11,
                          color: C.blue,
                          fontFamily: MONO_FONT,
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: C.blue,
                            display: "inline-block",
                          }}
                        />
                        Invite Sent
                      </span>
                    ) : c.registered ? (
                      <span
                        style={{
                          fontSize: 11,
                          color: C.green,
                          fontFamily: MONO_FONT,
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: C.green,
                            display: "inline-block",
                          }}
                        />
                        Registered
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: 11,
                          color: C.textFaint,
                          fontFamily: MONO_FONT,
                        }}
                      >
                        —
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "13px 14px" }}>
                    <button
                      onClick={() => handleSendLink(c)}
                      style={{
                        padding: "5px 12px",
                        borderRadius: 6,
                        border: `1px solid ${CLIENT_COLOR}50`,
                        background: CLIENT_COLOR + "12",
                        color: CLIENT_COLOR,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: BODY_FONT,
                        whiteSpace: "nowrap",
                      }}
                    >
                      📧 Send Link
                    </button>
                  </td>
                  <td style={{ padding: "13px 14px" }}>
                    <button
                      onClick={() => setRemoveConfirm(c)}
                      style={{
                        padding: "5px 12px",
                        borderRadius: 6,
                        border: `1px solid ${C.amber}50`,
                        background: C.amber + "12",
                        color: C.amber,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: BODY_FONT,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        )}
      </div>
      {removeConfirm && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setRemoveConfirm(null)}
        >
          <div
            style={{ background: C.bgCard, borderRadius: 12, padding: 32, width: 440, boxShadow: "0 20px 60px rgba(0,0,0,0.25)", textAlign: "center" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 36, marginBottom: 10 }}>👤</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.text, fontFamily: BODY_FONT, marginBottom: 6 }}>Remove {removeConfirm.name}?</div>
            <div style={{ fontSize: 13, color: C.textMid, fontFamily: BODY_FONT, marginBottom: 24 }}>Choose how to remove this candidate from your active list.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
              <button
                onClick={() => handleArchiveCandidate(removeConfirm)}
                style={{ padding: "12px 24px", borderRadius: 8, border: `1px solid ${C.amber}60`, background: C.amber + "15", color: C.amber, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: BODY_FONT, textAlign: "left", display: "flex", flexDirection: "column", gap: 2 }}
              >
                <span>📁 Archive</span>
                <span style={{ fontSize: 12, fontWeight: 400, color: C.textMid }}>Hides from active list but keeps their data. Viewable in Archived tab.</span>
              </button>
              <button
                onClick={() => handleDeleteCandidate(removeConfirm)}
                style={{ padding: "12px 24px", borderRadius: 8, border: `1px solid ${C.red}50`, background: C.red + "10", color: C.red, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: BODY_FONT, textAlign: "left", display: "flex", flexDirection: "column", gap: 2 }}
              >
                <span>🗑 Delete Permanently</span>
                <span style={{ fontSize: 12, fontWeight: 400, color: C.textMid }}>Permanently removes all data. This cannot be undone.</span>
              </button>
            </div>
            <button
              onClick={() => setRemoveConfirm(null)}
              style={{ padding: "8px 24px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.textMid, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: BODY_FONT }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {linkModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            zIndex: 300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => {
            if (!sending) setLinkModal(null);
          }}
        >
          <div
            style={{
              background: C.bgCard,
              borderRadius: 12,
              padding: 28,
              width: 480,
              boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: C.text,
                fontFamily: BODY_FONT,
                marginBottom: 6,
              }}
            >
              Send Registration Link
            </div>
            <div
              style={{
                fontSize: 13,
                color: C.textFaint,
                fontFamily: BODY_FONT,
                marginBottom: 18,
              }}
            >
              Send a personalised compliance registration link to{" "}
              {linkModal.name}
            </div>
            <div
              style={{
                background: C.bgPanel,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: "12px 14px",
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: C.textFaint,
                  fontFamily: MONO_FONT,
                  letterSpacing: "0.06em",
                  marginBottom: 5,
                }}
              >
                REGISTRATION LINK
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: C.blue,
                  fontFamily: MONO_FONT,
                  wordBreak: "break-all",
                  lineHeight: 1.5,
                }}
              >
                {regLink(linkModal.email)}
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <Label>Send to email</Label>
              <input
                value={linkEmail}
                onChange={(e) => setLinkEmail(e.target.value)}
                type="email"
                style={{
                  width: "100%",
                  background: C.bgInput,
                  border: `1px solid ${C.border}`,
                  borderRadius: 6,
                  padding: "9px 12px",
                  fontSize: 13,
                  fontFamily: BODY_FONT,
                  color: C.text,
                  outline: "none",
                }}
              />
            </div>
            <div
              style={{
                background: "#FAFAFA",
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: "12px 14px",
                marginBottom: 18,
                fontSize: 13,
                fontFamily: BODY_FONT,
                color: C.textMid,
                lineHeight: 1.7,
              }}
            >
              <div style={{ fontWeight: 600, color: C.text, marginBottom: 4 }}>
                Email preview
              </div>
              Hi {linkModal.name.split(" ")[0]},<br />
              You have been invited to complete your CAP 2330 compliance
              registration for <strong>{CLIENT_NAME}</strong>.<br />
              Please click the link below to get started — it should take around
              10 minutes.
              <br />
              <br />
              <span style={{ color: C.blue, textDecoration: "underline" }}>
                Complete your registration →
              </span>
            </div>
            {linkSent ? (
              <div
                style={{
                  background: C.greenBg,
                  border: `1px solid ${C.green}40`,
                  borderRadius: 8,
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span style={{ color: C.green, fontSize: 16 }}>✓</span>
                <span
                  style={{
                    color: C.green,
                    fontFamily: BODY_FONT,
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  Registration link sent to {linkSent}
                </span>
              </div>
            ) : (
              <div
                style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}
              >
                <button
                  onClick={() => setLinkModal(null)}
                  style={{
                    padding: "9px 18px",
                    borderRadius: 6,
                    border: `1px solid ${C.border}`,
                    background: "transparent",
                    color: C.textMid,
                    fontSize: 13,
                    cursor: "pointer",
                    fontFamily: BODY_FONT,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={doSendLink}
                  disabled={sending || !linkEmail.trim()}
                  style={{
                    padding: "9px 22px",
                    borderRadius: 6,
                    border: "none",
                    background: linkEmail.trim() ? CLIENT_COLOR : "#ccc",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: linkEmail.trim() ? "pointer" : "not-allowed",
                    fontFamily: BODY_FONT,
                  }}
                >
                  {sending ? "Sending…" : "Send Registration Link"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── ROOT ──
export default function FlyckyPlatform() {
  // Single source of truth for navigation
  const [section, setSection] = useState("home"); // "home" | "agencies" | "training"
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [selectedAgency, setSelectedAgency] = useState(null);
  const [agencyCandidate, setAgencyCandidate] = useState(null); // { candidate, agency }
  const [showSlack, setShowSlack] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [activeCandidates, setActiveCandidates] = useState([]);
  const { candidates: liveCandidates } = useRealtimeCandidates();
useEffect(() => { if (liveCandidates.length > 0) setActiveCandidates(liveCandidates); }, [liveCandidates]);
  const [archivedCandidates, setArchivedCandidates] = useState([]);

  const loadCandidates = () => {
    Promise.all([
      fetchCandidatesFromSupabase(),
      fetchHiddenCandidates().catch(() => ({ deleted: [], archived: [] }))
    ]).then(([all, hidden]) => {
      const deletedIds = hidden.deleted || [];
      const archivedIds = hidden.archived || [];
      setActiveCandidates(all.filter(c => !deletedIds.includes(c.id) && !archivedIds.includes(c.id)));
      setArchivedCandidates(all.filter(c => archivedIds.includes(c.id)));
    }).catch(err => {
      console.error("loadCandidates error:", err);
      // Fallback: show all candidates if hidden table fails
      fetchCandidatesFromSupabase().then(all => setActiveCandidates(all));
    });
  };

  useEffect(() => {
    loadCandidates();
    const interval = setInterval(loadCandidates, 30000);
    return () => clearInterval(interval);
  }, []);

  // When switching top-level sections, clear sub-selections
  const handleSection = (s) => {
    setSection(s);
    setSelectedCandidate(null);
    setSelectedAgency(null);
    setAgencyCandidate(null);
  };


  // Determine what the main content area renders
  const renderMain = () => {
    // Agency candidate profile
    if (agencyCandidate) {
      return (
        <CandidateProfile
          candidate={agencyCandidate.candidate}
          onBack={() => setAgencyCandidate(null)}
          onSlack={() => setShowSlack(true)}
          onAudit={() => setShowAudit(true)}
          isAgencyView={true}
          agencyName={agencyCandidate.agency.name}
          backLabel={agencyCandidate.agency.name}
        />
      );
    }
    // BRS Transport candidate profile
    if (selectedCandidate && section === "home") {
      return (
        <CandidateProfile
          candidate={selectedCandidate}
          onBack={() => setSelectedCandidate(null)}
          onSlack={() => setShowSlack(true)}
          onAudit={() => setShowAudit(true)}
          isAgencyView={false}
          agencyName={CLIENT_NAME}
          backLabel={CLIENT_NAME}
        />
      );
    }
    if (section === "training") return <TrainingView />;
    if (section === "agencies") {
      return (
        <AgenciesView
          onSelectAgency={(a) => setSelectedAgency(a)}
          selectedAgency={selectedAgency}
          onCandidateFromAgency={(c, agency) =>
            setAgencyCandidate({ candidate: c, agency })
          }
        />
      );
    }
    // Default: BRS home
    return (
      <BRSHomeView
        onSelectCandidate={(c) => setSelectedCandidate(c)}
        onSlack={() => setShowSlack(true)}
        onAudit={() => setShowAudit(true)}
        onAgencies={() => handleSection("agencies")}
        initialCandidates={[...activeCandidates, ...CLIENT_CANDIDATES_INIT]}
        initialArchived={archivedCandidates}
        onCandidateAction={loadCandidates}
      />
    );
  };

  // Determine which sidebar item is active
  const activeSidebarSection = agencyCandidate
    ? "agencies"
    : selectedCandidate
    ? "home"
    : section;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Figtree:wght@300;400;500;600;700&family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Figtree','DM Sans',sans-serif;}
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-thumb{background:#D4C9B0;border-radius:4px;}
        select option{background:#fff;color:#1A1208;}
        input::placeholder,textarea::placeholder{color:#9A8F7E;}
        button{transition:all 0.12s;}
        button:hover{opacity:0.84;}
      `}</style>

      {/* Persistent sidebar — always visible */}
      <Sidebar
        activeSection={activeSidebarSection}
        onSection={handleSection}
        onSlack={() => setShowSlack(true)}
      />

      {/* Main content area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minHeight: "100vh",
        }}
      >
        {renderMain()}
      </div>

      {showSlack && <SlackModal onClose={() => setShowSlack(false)} />}
      {showAudit && (
        <AuditPackModal
          onClose={() => setShowAudit(false)}
          />
      )}
      <AskFlyck />
    </div>
  );
}
