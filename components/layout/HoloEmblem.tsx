// Decorative holographic "system hub" emblem used in the app header.
// Center orb + dashed orbit ring + four connected nodes (cloud / security /
// cost trend / engine) — the shared visual motif tying the header to the
// sidebar's active-nav ring and the KPI highlight on the Executive page.
export function HoloEmblem({ className }: { className?: string }) {
  return (
    <div className={className} style={{ position: "relative", width: 152, height: 152 }} aria-hidden="true">
      <div
        style={{
          position: "absolute",
          inset: -16,
          borderRadius: "9999px",
          background: "radial-gradient(circle, rgba(56,214,255,0.55), transparent 68%)",
          filter: "blur(14px)",
        }}
      />

      {/* spokes */}
      <div style={{ position: "absolute", left: 76, top: 76, width: 47, height: 1, background: "linear-gradient(90deg, rgba(56,214,255,0.35), transparent)", transformOrigin: "0 50%", transform: "rotate(-45deg)" }} />
      <div style={{ position: "absolute", left: 76, top: 76, width: 47, height: 1, background: "linear-gradient(90deg, rgba(59,130,246,0.45), transparent)", transformOrigin: "0 50%", transform: "rotate(45deg)" }} />
      <div style={{ position: "absolute", left: 76, top: 76, width: 47, height: 1, background: "linear-gradient(90deg, rgba(56,214,255,0.35), transparent)", transformOrigin: "0 50%", transform: "rotate(135deg)" }} />
      <div style={{ position: "absolute", left: 76, top: 76, width: 47, height: 1, background: "linear-gradient(90deg, rgba(59,130,246,0.45), transparent)", transformOrigin: "0 50%", transform: "rotate(-135deg)" }} />

      {/* rings */}
      <div style={{ position: "absolute", inset: 9, borderRadius: "9999px", border: "1px dashed rgba(56,214,255,0.35)" }} />
      <div style={{ position: "absolute", inset: 29, borderRadius: "9999px", border: "1px solid rgba(59,130,246,0.3)" }} />

      {/* center orb */}
      <div
        style={{
          position: "absolute",
          inset: 50,
          borderRadius: "9999px",
          background: "linear-gradient(135deg, #38d6ff, #3b82f6)",
          boxShadow: "0 0 26px rgba(56,214,255,0.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#050b14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      </div>

      {/* orbit nodes: cloud / lock / cost trend / engine */}
      <div style={{ position: "absolute", left: 98, top: 32, width: 23, height: 23, borderRadius: 7, background: "rgba(7,17,29,0.9)", border: "1px solid rgba(56,214,255,0.35)", boxShadow: "0 0 10px rgba(56,214,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#67e8f9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.5 19a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.4-1.5A4.5 4.5 0 0 0 6.5 19h11z" />
        </svg>
      </div>
      <div style={{ position: "absolute", left: 98, top: 98, width: 23, height: 23, borderRadius: 7, background: "rgba(7,17,29,0.9)", border: "1px solid rgba(59,130,246,0.4)", boxShadow: "0 0 10px rgba(59,130,246,0.16)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="10" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>
      <div style={{ position: "absolute", left: 32, top: 98, width: 23, height: 23, borderRadius: 7, background: "rgba(7,17,29,0.9)", border: "1px solid rgba(56,214,255,0.35)", boxShadow: "0 0 10px rgba(56,214,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#67e8f9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 17l6-6 4 4 8-8" />
          <path d="M21 7v6h-6" />
        </svg>
      </div>
      <div style={{ position: "absolute", left: 32, top: 32, width: 23, height: 23, borderRadius: 7, background: "rgba(7,17,29,0.9)", border: "1px solid rgba(59,130,246,0.4)", boxShadow: "0 0 10px rgba(59,130,246,0.16)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.9 2.9l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.9-2.9l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.9-2.9l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.9 2.9l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.6 1H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.6 1z" />
        </svg>
      </div>
    </div>
  );
}
