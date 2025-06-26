import React, { useState, useEffect } from "react";
import "./App.css";
import SideNav from "./components/SideNav";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Scores from "./pages/Scores";
import Analytics from "./pages/Analytics";
import Performance from "./pages/Performance";
import Auth from "./pages/Auth";
import BulkImport from "./pages/BulkImport";

const getAccessToken = () => localStorage.getItem("access_token");

// PUBLIC_INTERFACE
function App() {
  const [theme, setTheme] = useState("light");
  const [route, setRoute] = useState("dashboard"); // 'dashboard' | 'students' | 'scores' | 'analytics' | 'performance' | 'auth'
  const [authed, setAuthed] = useState(!!getAccessToken());

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // PUBLIC_INTERFACE
  const handleRoute = (val) => {
    setRoute(val);
  };

  // PUBLIC_INTERFACE
  const handleLogin = (token) => {
    // Store JWT and mark as authed
    localStorage.setItem("access_token", token);
    setAuthed(true);
    setRoute("dashboard");
  };

  // PUBLIC_INTERFACE
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    setAuthed(false);
    setRoute("auth");
  };

  let content = null;
  if (!authed) {
    content = <Auth onLogin={handleLogin} />;
  } else {
    if (route === "dashboard") content = <Dashboard />;
    else if (route === "students") content = <Students />;
    else if (route === "scores") content = <Scores />;
    else if (route === "analytics") content = <Analytics />;
    else if (route === "performance") content = <Performance />;
    else if (route === "bulkimport") content = <BulkImport />;
    else content = <Dashboard />;
  }

  return (
    <div className="App">
      <header className="App-header" style={{ minHeight: "100vh", display: "flex", flexDirection: "row", padding: 0 }}>
        <SideNav
          onNavigate={handleRoute}
          current={route}
          theme={theme}
          onToggleTheme={toggleTheme}
          authed={authed}
          onLogout={handleLogout}
        />
        <main className="App-main" style={{ flex: 1, padding: "32px", overflow: "auto" }}>
          {content}
        </main>
      </header>
    </div>
  );
}

export default App;
