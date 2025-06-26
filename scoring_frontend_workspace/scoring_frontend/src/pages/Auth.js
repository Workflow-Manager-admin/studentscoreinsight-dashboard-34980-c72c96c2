import React, { useState } from "react";
import { apiLogin, apiRegister } from "../utils/api";

/**
 * PUBLIC_INTERFACE
 * Auth page for login and (demo) admin registration.
 */
const Auth = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // PUBLIC_INTERFACE
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isLogin) {
        const res = await apiLogin(username, password);
        onLogin(res.access_token);
      } else {
        await apiRegister(username, password);
        setIsLogin(true);
      }
    } catch (err) {
      setError(
        err?.detail ||
          err?.message ||
          "Authentication failed. Please check credentials."
      );
    }
    setLoading(false);
  };

  return (
    <div style={{
      maxWidth: 390,
      margin: "auto",
      marginTop: 110,
      background: "var(--bg-secondary)",
      borderRadius: 12,
      boxShadow: "0 2px 10px rgba(60,60,80,.06)",
      padding: 36,
      minHeight: 300
    }}>
      <h2>{isLogin ? "Login" : "Register Admin (Demo)"}</h2>
      <form onSubmit={handleSubmit} style={{marginTop: 24, display: "flex", flexDirection: "column", gap: 18}}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          autoFocus
          onChange={e => setUsername(e.target.value)}
          style={{padding: 10, borderRadius: 6, border: "1px solid var(--border-color)", fontSize: 17}}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{padding: 10, borderRadius: 6, border: "1px solid var(--border-color)", fontSize: 17}}
          required
        />
        {error && <div style={{color: "#d32f2f"}}>{error}</div>}
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: 13,
            borderRadius: 7,
            marginTop: 10,
            fontWeight: 700,
            fontSize: "1.1em",
            background: "#1976d2",
            color: "white",
            border: "none",
            boxShadow: "0 2px 6px rgba(30,40,60,.06)"
          }}
        >
          {loading ? "..." : isLogin ? "Login" : "Register"}
        </button>
      </form>
      <button
        type="button"
        disabled={loading}
        style={{
          background: "none",
          color: "#424242",
          fontWeight: 600,
          marginTop: 24,
          border: "none",
          cursor: "pointer"
        }}
        onClick={() => setIsLogin(l => !l)}
      >
        {isLogin ? "Create new admin (demo only!)" : "Have an account? Login"}
      </button>
    </div>
  );
};

export default Auth;
