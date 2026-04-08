import React, { useContext, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  useEffect(() => {
    if (!user?._id) return;

    fetchNotifications();

    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, [user?._id]);
  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data || []);
    } catch (err) {
      console.error("Failed to fetch notifications");
    }
  };

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      console.error("Failed to delete notification");
    }
  };

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <div className="navbar-brand-icon">🌐</div>
        CollabSphere
      </Link>
      <div className="navbar-links">
        <button
          onClick={toggleTheme}
          className="btn btn-ghost btn-icon"
          style={{ fontSize: "1.2rem", padding: "0.4rem" }}
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDarkMode ? "☀️" : "🌙"}
        </button>
        {user ? (
          <>
            <Link to="/dashboard" className="nav-link">
              Dashboard
            </Link>

            {/* NOTIFICATION BELL */}
            <div style={{ position: "relative" }}>
              <button
                className="btn btn-ghost btn-icon"
                onClick={() => setShowNotifs(!showNotifs)}
                style={{
                  fontSize: "1.2rem",
                  padding: "0.4rem",
                  position: "relative",
                }}
              >
                🔔
                {notifications.length > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-2px",
                      right: "-2px",
                      background: "var(--danger)",
                      color: "white",
                      fontSize: "0.65rem",
                      padding: "1px 5px",
                      borderRadius: "10px",
                      border: "2px solid var(--bg-primary)",
                    }}
                  >
                    {notifications.length}
                  </span>
                )}
              </button>

              {showNotifs && (
                <div
                  className="card"
                  style={{
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    marginTop: "0.75rem",
                    width: "320px",
                    zIndex: 1000,
                    padding: "1rem",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
                    maxHeight: "400px",
                    overflowY: "auto",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "1rem",
                      alignItems: "center",
                    }}
                  >
                    <h4 style={{ fontSize: "0.9rem", fontWeight: "700" }}>
                      Notifications
                    </h4>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setShowNotifs(false)}
                      style={{ padding: "0.2rem" }}
                    >
                      ✕
                    </button>
                  </div>
                  {notifications.length === 0 ? (
                    <p
                      style={{
                        color: "var(--text-muted)",
                        fontSize: "0.8rem",
                        textAlign: "center",
                        padding: "1rem",
                      }}
                    >
                      No new messages
                    </p>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                      }}
                    >
                      {notifications.map((n) => (
                        <div
                          key={n._id}
                          className="file-item"
                          style={{ padding: "0.75rem", cursor: "default" }}
                        >
                          <div
                            style={{
                              fontSize: "0.8rem",
                              color: "var(--text-primary)",
                            }}
                          >
                            {n.message}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              marginTop: "0.5rem",
                              alignItems: "center",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "0.65rem",
                                color: "var(--text-muted)",
                              }}
                            >
                              {new Date(n.createdAt).toLocaleDateString()}
                            </span>
                            <div style={{ display: "flex", gap: "0.3rem" }}>
                              {n.project && (
                                <Link
                                  to={`/project/${n.project._id || n.project}`}
                                  onClick={() => setShowNotifs(false)}
                                  className="btn btn-secondary btn-sm"
                                  style={{
                                    padding: "2px 6px",
                                    fontSize: "0.65rem",
                                  }}
                                >
                                  View
                                </Link>
                              )}
                              <button
                                onClick={(e) => handleMarkAsRead(n._id, e)}
                                className="btn btn-sm"
                                style={{
                                  background: "rgba(255,255,255,0.05)",
                                  padding: "2px 6px",
                                  fontSize: "0.65rem",
                                }}
                              >
                                Dismiss
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
              👤 {user.name}
            </span>
            <button
              onClick={handleLogout}
              className="btn btn-ghost btn-sm"
              onMouseEnter={e => {
                e.currentTarget.style.background = '#ef4444';
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.borderColor = '#ef4444';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '';
                e.currentTarget.style.color = '';
                e.currentTarget.style.borderColor = '';
              }}
            >
              Sign Out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">
              Sign In
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm">
              Get Started
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
