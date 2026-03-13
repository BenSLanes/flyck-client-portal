// ════════════════════════════════════════════════════════════
// NotificationBell.jsx — copy into src/components/ of ALL THREE portals
// Usage:  <NotificationBell portalTarget="client" />
//         <NotificationBell portalTarget="agency" />
//         <NotificationBell portalTarget="candidate" />
// ════════════════════════════════════════════════════════════
import { useState } from "react";
import { useNotifications } from "../hooks/useNotifications";

const ICONS = {
  new_candidate:      "👤",
  candidate_submitted:"📤",
  candidate_cleared:  "✅",
  gap_flagged:        "⚠️",
  dbs_flagged:        "🚨",
  default:            "🔔",
};

const COLORS = {
  new_candidate:      "#2A5A8A",
  candidate_submitted:"#3A7055",
  candidate_cleared:  "#3A7055",
  gap_flagged:        "#A0700A",
  dbs_flagged:        "#A03030",
  default:            "#5A5040",
};

export function NotificationBell({ portalTarget }) {
  const { notifications, unreadCount, markRead, dismiss } = useNotifications(portalTarget);
  const [open, setOpen] = useState(false);

  const toggle = () => {
    setOpen((o) => !o);
    if (!open && unreadCount > 0) markRead();
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Bell button */}
      <button
        onClick={toggle}
        style={{
          position: "relative",
          background: open ? "#1A1208" : "transparent",
          border: "1px solid #E2DDD5",
          borderRadius: 6,
          width: 36,
          height: 36,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              background: "#A03030",
              color: "#fff",
              borderRadius: "50%",
              width: 16,
              height: 16,
              fontSize: 9,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 340,
            background: "#FFFFFF",
            border: "1px solid #E2DDD5",
            borderRadius: 10,
            boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
            zIndex: 999,
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "12px 16px",
              background: "#F4F1EB",
              borderBottom: "1px solid #E2DDD5",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1A1208", fontFamily: "sans-serif" }}>
              Notifications
            </span>
            {notifications.length > 0 && (
              <button
                onClick={markRead}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 11,
                  color: "#2A5A8A",
                  cursor: "pointer",
                  fontFamily: "sans-serif",
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: 380, overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: "24px 16px",
                  textAlign: "center",
                  color: "#9A8F7E",
                  fontSize: 13,
                  fontFamily: "sans-serif",
                }}
              >
                No notifications
              </div>
            ) : (
              notifications.map((n, i) => {
                const icon = ICONS[n.type] || ICONS.default;
                const color = COLORS[n.type] || COLORS.default;
                const time = new Date(n.created_at).toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return (
                  <div
                    key={n.id || i}
                    style={{
                      display: "flex",
                      gap: 12,
                      padding: "12px 16px",
                      borderBottom: i < notifications.length - 1 ? "1px solid #F4F1EB" : "none",
                      background: n.read ? "transparent" : "#F9F7FF",
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: color + "18",
                        border: `1px solid ${color}30`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                        flexShrink: 0,
                      }}
                    >
                      {icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1208", fontFamily: "sans-serif" }}>
                        {n.title}
                      </div>
                      <div style={{ fontSize: 12, color: "#5A5040", fontFamily: "sans-serif", marginTop: 2 }}>
                        {n.body}
                      </div>
                      <div style={{ fontSize: 10, color: "#9A8F7E", fontFamily: "monospace", marginTop: 3 }}>
                        {time}
                      </div>
                    </div>
                    <button
                      onClick={() => dismiss(n.id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#9A8F7E",
                        cursor: "pointer",
                        fontSize: 12,
                        alignSelf: "flex-start",
                        padding: 0,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
