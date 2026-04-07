import { useEffect, useState } from "react";
import API from "../api/axios";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

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
    <div style={{ padding: "20px" }}>
      <h2>Organizer Dashboard</h2>

      {/* Dropdown */}
      <select
        value={selectedEvent}
        onChange={handleSelect}
        style={{
          padding: "10px",
          borderRadius: "8px",
          marginTop: "10px",
        }}
      >
        <option value="">Select your event</option>

        {events.map((event) => (
          <option key={event.id} value={event.id}>
            {event.title}
          </option>
        ))}
      </select>

      {selectedEventObj && (
        <h3 style={{ marginTop: "20px" }}>
          {selectedEventObj.title}
        </h3>
      )}

      <hr />

      {loading && <p>Loading analytics...</p>}

      {/* Registrations */}
      <h3>Registrations</h3>

      {registrations.length === 0 && !loading && (
        <p>No registrations yet</p>
      )}

      {registrations.map((r) => (
        <div
          key={r.id}
          style={{
            border: "1px solid #eee",
            padding: "10px",
            borderRadius: "8px",
            marginBottom: "10px",
          }}
        >
          <p><strong>User:</strong> {r.user_id}</p>
          <p><strong>Status:</strong> {r.status}</p>
        </div>
      ))}

      {/* Analytics Cards */}
      {analytics && (
        <div style={{ marginTop: "20px" }}>
          <h3>Analytics</h3>

          <div style={{ display: "flex", gap: "20px" }}>
            <div style={cardStyle}>
              <h4>Confirmed</h4>
              <p>{analytics.confirmed}</p>
            </div>

            <div style={cardStyle}>
              <h4>Waitlist</h4>
              <p>{analytics.waitlist}</p>
            </div>

            <div style={cardStyle}>
              <h4>Cancelled</h4>
              <p>{analytics.cancelled}</p>
            </div>

            <div style={cardStyle}>
              <h4>Remaining</h4>
              <p>{analytics.remaining_spots}</p>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Chart (NOW INSIDE MAIN DIV) */}
      {analytics && (
        <div style={{ marginTop: "30px" }}>
          <h3>Analytics Chart</h3>

          <BarChart width={400} height={300} data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" />
          </BarChart>
        </div>
      )}
    </div>
  );
}

export default Dashboard;