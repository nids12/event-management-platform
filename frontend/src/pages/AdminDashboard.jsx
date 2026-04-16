import { useEffect, useState } from "react";
import API from "../api/axios";
import Navbar from "../components/Navbar";
import PageHeader from "../components/PageHeader";
import { showToast } from "../lib/toast";
import { formatEventDate } from "../utils/date";
import { getEventStatusMeta } from "../utils/eventStatus";
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
    } catch {
      showToast("Failed to load admin data.", "error");
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  return (
    <>
      <Navbar />

      <div className="admin-container">
        <PageHeader
          eyebrow="Administration"
          title="Platform Overview"
          subtitle="Monitor users, events, and registration volume across the entire SmartEvent platform."
        />

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

        <div className="section">
          <h2>All Users</h2>

          {users.map((user) => (
            <div key={user.id} className="list-card">
              <p>
                <strong>{user.name}</strong>
              </p>
              <p>{user.email}</p>
              <p>Role: {user.role}</p>
            </div>
          ))}
        </div>

        <div className="section">
          <h2>All Events</h2>

          {events.map((event) => {
            const statusMeta = getEventStatusMeta(event.status);

            return (
              <div key={event.id} className="list-card">
                <p>
                  <strong>{event.title}</strong>
                </p>
                <p>{formatEventDate(event.date)}</p>
                <p>
                  Seats: {event.confirmed_count}/{event.capacity}
                </p>
                <span className={`status-badge ${statusMeta.className}`}>
                  {statusMeta.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

export default AdminDashboard;
