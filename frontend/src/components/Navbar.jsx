import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import API from "../api/axios";
import { showToast } from "../lib/toast";
import { clearSession, getRole } from "../utils/auth";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const role = getRole();

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await API.get("/notifications/unread-count");
        setUnreadCount(res.data.unread_count);
      } catch {
        setUnreadCount(0);
      }
    };

    const handleRefresh = () => {
      fetchUnreadCount();
    };

    fetchUnreadCount();
    window.addEventListener("notifications:refresh", handleRefresh);

    return () => {
      window.removeEventListener("notifications:refresh", handleRefresh);
    };
  }, [location.pathname]);

  const handleLogout = () => {
    clearSession();
    showToast("Logged out successfully.", "info");
    navigate("/login");
  };

  const roleLabel =
    role === "organizer"
      ? "Organizer"
      : role === "admin"
        ? "Admin"
        : "Participant";

  return (
    <nav style={styles.navbar}>
      <div style={styles.brandBlock}>
        <button style={styles.brandButton} onClick={() => navigate("/")}>
          SmartEvent
        </button>
        <span style={styles.rolePill}>{roleLabel}</span>
      </div>

      <div style={styles.links}>
        {role === "participant" && (
          <>
            <Link to="/events" style={styles.link}>
              Explore Events
            </Link>
            <Link to="/my-registrations" style={styles.link}>
              My Plans
            </Link>
            <Link to="/notifications" style={styles.link}>
              Notifications{unreadCount > 0 ? ` (${unreadCount})` : ""}
            </Link>
          </>
        )}

        {role === "organizer" && (
          <>
            <Link to="/organizer-dashboard" style={styles.link}>
              Control Center
            </Link>
            <Link to="/events" style={styles.link}>
              Public Events
            </Link>
            <Link to="/notifications" style={styles.link}>
              Notifications{unreadCount > 0 ? ` (${unreadCount})` : ""}
            </Link>
          </>
        )}

        {role === "admin" && (
          <>
            <Link to="/admin-dashboard" style={styles.link}>
              Admin Overview
            </Link>
            <Link to="/notifications" style={styles.link}>
              Notifications{unreadCount > 0 ? ` (${unreadCount})` : ""}
            </Link>
          </>
        )}

        <button onClick={handleLogout} style={styles.logoutBtn}>
          Logout
        </button>
      </div>
    </nav>
  );
}

const styles = {
  navbar: {
    position: "sticky",
    top: 0,
    zIndex: 1000,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "18px 32px",
    background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
    color: "white",
    boxShadow: "0 8px 25px rgba(15, 23, 42, 0.24)",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    gap: "20px",
    flexWrap: "wrap",
  },
  brandBlock: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  brandButton: {
    background: "transparent",
    border: "none",
    color: "white",
    fontSize: "26px",
    fontWeight: "800",
    letterSpacing: "0.4px",
    cursor: "pointer",
  },
  rolePill: {
    padding: "6px 10px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.12)",
    color: "#e2e8f0",
    fontSize: "12px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  links: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  link: {
    color: "white",
    textDecoration: "none",
    fontWeight: "600",
    fontSize: "14px",
    padding: "10px 14px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.08)",
  },
  logoutBtn: {
    background: "#f8fafc",
    color: "#1e293b",
    border: "none",
    padding: "10px 16px",
    borderRadius: "999px",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "14px",
  },
};

export default Navbar;
