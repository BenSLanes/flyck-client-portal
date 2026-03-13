// ════════════════════════════════════════════════════════════
// supabaseClient.js — copy into src/ of ALL THREE portals
// ════════════════════════════════════════════════════════════
import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL = "https://dvalaiouqrvwtvdcqkiz.supabase.co";
export const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2YWxhaW91cXJ2d3R2ZGNxa2l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwOTg1MjIsImV4cCI6MjA4ODY3NDUyMn0.xvCccRZHLTtgFDoU9lE5Gql64wRSE8fQwtW6ubGp9yg";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  realtime: { params: { eventsPerSecond: 10 } },
});

// ── Candidate Portal: save/upsert candidate ──────────────────
export async function saveCandidate(data) {
  const { data: result, error } = await supabase
    .from("candidates")
    .upsert(data, { onConflict: "email" })
    .select();
  if (error) { console.error("saveCandidate:", error); return null; }
  await saveNotification({
    type: "new_candidate",
    title: "New Candidate Submitted",
    body: `${data.first_name} ${data.last_name} has completed their application.`,
    candidateEmail: data.email,
    portalTarget: "agency",
  });
  return result;
}

// ── Agency Portal: submit candidate to client ───────────────
export async function submitToClient(candidateId, candidateName) {
  const { data, error } = await supabase
    .from("candidates")
    .update({ submitted_to_client: true, submitted_at: new Date().toISOString() })
    .eq("id", candidateId)
    .select();
  if (error) { console.error("submitToClient:", error); return null; }
  await saveNotification({
    type: "candidate_submitted",
    title: "Candidate Submitted to Client",
    body: `${candidateName} has been submitted for client review.`,
    candidateId,
    portalTarget: "client",
  });
  return data;
}

// ── Agency Portal: update compliance status ──────────────────
export async function updateComplianceStatus(candidateId, candidateName, updates) {
  const { data, error } = await supabase
    .from("candidates")
    .update(updates)
    .eq("id", candidateId)
    .select();
  if (error) { console.error("updateCompliance:", error); return null; }
  if (updates.compliance_pct === 100) {
    await saveNotification({
      type: "candidate_cleared",
      title: "Candidate Fully Cleared ✓",
      body: `${candidateName} has passed all compliance checks.`,
      candidateId,
      portalTarget: "both",
    });
  }
  return data;
}

// ── Client Portal: fetch submitted candidates ────────────────
export async function fetchClientCandidates() {
  const { data, error } = await supabase
    .from("candidates")
    .select("*")
    .eq("submitted_to_client", true)
    .order("submitted_at", { ascending: false });
  if (error) { console.error("fetchClientCandidates:", error); return []; }
  return data || [];
}

// ── Agency Portal: fetch all candidates ─────────────────────
export async function fetchAgencyCandidates() {
  const { data, error } = await supabase
    .from("candidates")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) { console.error("fetchAgencyCandidates:", error); return []; }
  return data || [];
}

// ── Shared: save a notification ──────────────────────────────
export async function saveNotification({ type, title, body, candidateId, candidateEmail, portalTarget }) {
  const { error } = await supabase.from("notifications").insert({
    type,
    title,
    body,
    candidate_id: candidateId || null,
    candidate_email: candidateEmail || null,
    portal_target: portalTarget,
    read: false,
    created_at: new Date().toISOString(),
  });
  if (error) console.error("saveNotification:", error);
}

// ── Shared: mark all notifications read ─────────────────────
export async function markNotificationsRead(portalTarget) {
  await supabase
    .from("notifications")
    .update({ read: true })
    .or(`portal_target.eq.${portalTarget},portal_target.eq.both`)
    .eq("read", false);
}
