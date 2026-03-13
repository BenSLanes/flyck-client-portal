// ════════════════════════════════════════════════════════════
// useNotifications.js — copy into src/hooks/ of ALL THREE portals
// Pass portalTarget: "client" | "agency" | "candidate"
// ════════════════════════════════════════════════════════════
import { useState, useEffect } from "react";
import { supabase, markNotificationsRead } from "../supabaseClient";

export function useNotifications(portalTarget) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Load existing unread notifications
    const load = async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .or(`portal_target.eq.${portalTarget},portal_target.eq.both`)
        .eq("read", false)
        .order("created_at", { ascending: false })
        .limit(50);
      if (!error && data) {
        setNotifications(data);
        setUnreadCount(data.length);
      }
    };
    load();

    // Listen for new notifications in real-time
    const channel = supabase
      .channel(`notifications-${portalTarget}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const n = payload.new;
          if (n.portal_target === portalTarget || n.portal_target === "both") {
            setNotifications((prev) => [n, ...prev]);
            setUnreadCount((c) => c + 1);
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [portalTarget]);

  const markRead = async () => {
    await markNotificationsRead(portalTarget);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const dismiss = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  return { notifications, unreadCount, markRead, dismiss };
}
