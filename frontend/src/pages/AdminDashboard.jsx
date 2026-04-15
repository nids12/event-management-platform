import { useEffect, useState } from "react";
import API from "../api/axios";
import Navbar from "../components/Navbar";
import "./AdminDashboard.css";

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);

  const fetchAdminData = async () => {
    try {
      const statsRes = await API.get("/admin/stats");
      const usersRes = await API.get("/admin/users");
      const eventsRes = await API.get("/admin/events");

      setStats(statsRes.data);
      setUsers(usersRes.data);
      setEvents(eventsRes.data);
    } catch (err) {
      console.log(err);
      alert("Failed to load admin data");
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  return (
    <>
      <Navbar />

      <div className="admin-container">
        <h1 className="admin-title">Admin Dashboard</h1>

        {/* Stats */}
        {stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Users</h3>
              <p>{stats.total_users}</p>
            </div>

            <div className="stat-card">
              <h3>Total Events</h3>
              <p>{stats.total_events}</p>
            </div>

            <div className="stat-card">
              <h3>Total Registrations</h3>
              <p>{stats.total_registrations}</p>
            </div>
          </div>
        )}

        {/* Users */}
        <div className="section">
          <h2>All Users</h2>

          {users.map((user) => (
            <div key={user.id} className="list-card">
              <p><strong>{user.username}</strong></p>
              <p>Role: {user.role}</p>
            </div>
          ))}
        </div>

        {/* Events */}
        <div className="section">
          <h2>All Events</h2>

          {events.map((event) => (
            <div key={event.id} className="list-card">
              <p><strong>{event.title}</strong></p>
              <p>{event.date}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default AdminDashboard;