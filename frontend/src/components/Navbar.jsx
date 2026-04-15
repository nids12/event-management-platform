import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();

  const role = localStorage.getItem("role");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  return (
    <nav style={styles.navbar}>
      <div style={styles.logoSection}>
        <h2 style={styles.logo}>⚡ SmartEvent</h2>
      </div>

      <div style={styles.links}>
        {role === "participant" && (
          <>
            <Link to="/events" style={styles.link}>Browse Events</Link>
            <Link to="/my-registrations" style={styles.link}>My Registrations</Link>
            <Link to="/notifications" style={styles.link}>🔔 Notifications</Link>
          </>
        )}

        {role === "organizer" && (
          <>
            <Link to="/organizer-dashboard" style={styles.link}>Dashboard</Link>
            <Link to="/events" style={styles.link}>Browse Events</Link>
            <Link to="/notifications" style={styles.link}>🔔 Notifications</Link>
          </>
        )}

        {role === "admin" && (
          <>
            <Link to="/admin-dashboard" style={styles.link}>Admin Dashboard</Link>
            <Link to="/notifications" style={styles.link}>🔔 Notifications</Link>
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
    padding: "18px 45px",
    background: "rgba(79, 70, 229, 0.95)",
    backdropFilter: "blur(12px)",
    color: "white",
    boxShadow: "0 8px 25px rgba(0,0,0,0.12)",
    borderBottom: "1px solid rgba(255,255,255,0.15)",
  },

  logoSection: {
    display: "flex",
    alignItems: "center",
  },

  logo: {
    margin: 0,
    fontSize: "28px",
    fontWeight: "700",
    letterSpacing: "0.5px",
    cursor: "pointer",
  },

  links: {
    display: "flex",
    alignItems: "center",
    gap: "24px",
  },

  link: {
    color: "white",
    textDecoration: "none",
    fontWeight: "500",
    fontSize: "15px",
    transition: "0.3s ease",
    padding: "8px 12px",
    borderRadius: "8px",
  },

  logoutBtn: {
    background: "white",
    color: "#4f46e5",
    border: "none",
    padding: "10px 18px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    transition: "0.3s ease",
    boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
  },
};

export default Navbar;