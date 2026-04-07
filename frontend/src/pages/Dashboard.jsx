import { useEffect, useState } from "react";
import API from "../api/axios";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import "./Dashboard.css";
function Dashboard() {
  // 🎨 Improved card style
  const cardStyle = {
    padding: "15px",
    borderRadius: "12px",
    width: "140px",
    textAlign: "center",
    background: "#ffffff",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  };

  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [registrations, setRegistrations] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);

  // ✅ fetch my events
  const fetchMyEvents = async () => {
    try {
      const res = await API.get("/events/my-events");
      setEvents(res.data);
      console.log("Events:", res.data); // debug
    } catch (err) {
      console.log("Error fetching my events", err);
    }
  };

  // ✅ fetch registrations
  const fetchRegistrations = async (eventId) => {
    try {
      const res = await API.get(`/events/${eventId}/registrations`);
      setRegistrations(res.data);
    } catch (err) {
      alert("Error fetching registrations");
    }
  };

  // ✅ fetch analytics
  const fetchAnalytics = async (eventId) => {
    try {
      setLoading(true);
      const res = await API.get(`/events/${eventId}/analytics`);
      setAnalytics(res.data);
    } catch (err) {
      alert("Error fetching analytics");
    } finally {
      setLoading(false);
    }
  };

  // ✅ handle dropdown select (FIXED: parseInt)
  const handleSelect = (e) => {
    const eventId = parseInt(e.target.value);
    setSelectedEvent(eventId);

    if (eventId) {
      fetchRegistrations(eventId);
      fetchAnalytics(eventId);
    } else {
      setRegistrations([]);
      setAnalytics(null);
    }
  };

  useEffect(() => {
    fetchMyEvents();
  }, []);

  // ✅ get selected event object
  const selectedEventObj = events.find((e) => e.id === selectedEvent);
  const chartData = analytics
  ? [
      { name: "Confirmed", value: analytics.confirmed },
      { name: "Waitlist", value: analytics.waitlist },
      { name: "Cancelled", value: analytics.cancelled },
    ]
  : [];

 return (
  <div className="container">
    <h1 className="title">Organizer Dashboard</h1>

    {/* Event Selector */}
    <select
      value={selectedEvent}
      onChange={(e) => setSelectedEvent(e.target.value)}
      className="dropdown"
    >
      <option value="">Select Event</option>
      {events.map((event) => (
        <option key={event.id} value={event.id}>
          {event.title}
        </option>
      ))}
    </select>

    {/* Analytics Cards */}
    {analytics && (
      <div className="card-container">
        <div className="card">
          <h3>Confirmed</h3>
          <p>{analytics.confirmed}</p>
        </div>

        <div className="card">
          <h3>Waitlist</h3>
          <p>{analytics.waitlist}</p>
        </div>

        <div className="card">
          <h3>Cancelled</h3>
          <p>{analytics.cancelled}</p>
        </div>

        <div className="card">
          <h3>Remaining</h3>
          <p>{analytics.remaining}</p>
        </div>
      </div>
    )}

    {/* Chart */}
    {analytics && (
      <div className="chart-box">
        <BarChart width={500} height={300} data={[
          { name: "Confirmed", value: analytics.confirmed },
          { name: "Waitlist", value: analytics.waitlist },
          { name: "Cancelled", value: analytics.cancelled },
        ]}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" />
        </BarChart>
      </div>
    )}

    {/* Registrations */}
    <div className="registrations">
      <h2>Registrations</h2>

      {registrations.length === 0 ? (
        <p>No registrations yet</p>
      ) : (
        registrations.map((r) => (
          <div key={r.id} className="registration-card">
            <p>{r.user.username}</p>
            <span>{r.status}</span>
          </div>
        ))
      )}
    </div>
  </div>
  );
}

export default Dashboard;