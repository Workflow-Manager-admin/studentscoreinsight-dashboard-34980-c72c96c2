import React from "react";
import "./SideNav.css";

/**
 * PUBLIC_INTERFACE
 * Side navigation component for routing/navigation.
 * @param {object} props - { onNavigate, current, theme, onToggleTheme, authed, onLogout }
 */
function SideNav({ onNavigate, current, theme, onToggleTheme, authed, onLogout }) {
  // Sidebar links and active highlighting
  const links = [
    { label: "Dashboard", value: "dashboard", icon: "📊" },
    { label: "Students", value: "students", icon: "🧑‍🎓" },
    { label: "Scores", value: "scores", icon: "📝" },
    { label: "Analytics", value: "analytics", icon: "📈" },
    { label: "Performance", value: "performance", icon: "✨" },
  ];
  return (
    <nav className="sidenav">
      <div className="sidenav-brand">ScoreInsight</div>
      <ul className="sidenav-links">
        {authed &&
          links.map((l) => (
            <li
              key={l.value}
              className={`sidenav-link${current === l.value ? " active" : ""}`}
              onClick={() => onNavigate(l.value)}
              tabIndex={0}
              aria-label={l.label}
            >
              <span className="sidenav-icon">{l.icon}</span> {l.label}
            </li>
          ))}
      </ul>
      <div className="sidenav-bottom">
        <button className="sidenav-theme-btn" onClick={onToggleTheme}>
          {theme === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>
        {authed ? (
          <button className="sidenav-logout-btn" onClick={onLogout}>
            Logout
          </button>
        ) : null}
      </div>
    </nav>
  );
}
export default SideNav;
