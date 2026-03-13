// ════════════════════════════════════════════════════════════
// useRealtimeCandidates.js — copy into src/hooks/ of CLIENT PORTAL
// Replaces the manual fetchCandidatesFromSupabase() call.
// Candidates update live when agency submits or edits them.
// ════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from "react";
import { supabase, fetchClientCandidates } from "../supabaseClient";

function mapRow(r) {
  let rawData = {};
  try { rawData = r.raw_data ? JSON.parse(r.raw_data) : {}; } catch (e) {}
  return {
    id: r.id,
    supabaseId: r.id,
    rawData,
    name: `${r.first_name || ""} ${r.last_name || ""}`.trim() || r.email,
    initials: `${(r.first_name || "?")[0]}${(r.last_name || "?")[0]}`.toUpperCase(),
    role: r.role || "Candidate",
    email: r.email || "",
    phone: r.phone || "",
    status: r.compliance_status || "Submitted",
    statusColor: r.status_color || "#2A5A8A",
    pct: r.compliance_pct || 25,
    dob: r.dob || "",
    ni: r.ni_number || "",
    city: r.city || "",
    address: r.address || "",
    postcode: r.postcode || "",
    nationality: r.nationality || "",
    idVerified: r.id_verified || false,
    hmrcVerified: r.hmrc_verified || false,
    dbsVerified: r.dbs_verified || false,
    gaps: r.gap_count || 0,
    registered: true,
    docs: [],
    submittedAt: r.submitted_at,
    isLive: true,
  };
}

export function useRealtimeCandidates() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const rows = await fetchClientCandidates();
    setCandidates(rows.map(mapRow));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();

    // Live updates from Supabase Realtime
    const channel = supabase
      .channel("client-candidates-live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "candidates",
          filter: "submitted_to_client=eq.true",
        },
        (payload) => {
          const { eventType, new: newRow, old: oldRow } = payload;
          if (eventType === "INSERT" || eventType === "UPDATE") {
            const mapped = mapRow(newRow);
            setCandidates((prev) => {
              const exists = prev.find((c) => c.id === mapped.id);
              return exists
                ? prev.map((c) => (c.id === mapped.id ? mapped : c))
                : [mapped, ...prev];
            });
            setLastUpdate({ type: eventType, candidate: mapped, at: new Date() });
          }
          if (eventType === "DELETE") {
            setCandidates((prev) => prev.filter((c) => c.id !== oldRow.id));
            setLastUpdate({ type: "DELETE", at: new Date() });
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [load]);

  return { candidates, setCandidates, loading, lastUpdate, reload: load };
}
