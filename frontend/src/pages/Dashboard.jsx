import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import Navbar from "../components/Navbar";
import "./Dashboard.css";

function Dashboard() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Fetch organizer events
  const fetchMyEvents = async () => {
    try {
      const res = await API.get("/events/my-events");
      setEvents(res.data);
    } catch (err) {
      console.log(err);
      alert("Error fetching events");
    }
  };

  // Fetch registrations
  const fetchRegistrations = async (eventId) => {
    try {
      const res = await API.get(`/events/${eventId}/registrations`);
      setRegistrations(res.data);
    } catch (err) {
      alert("Error fetching registrations");
    }
  };

  // Fetch analytics
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

  // On clicking event card
  const handleEventClick = (eventId) => {
    setSelectedEvent(eventId);

    fetchRegistrations(eventId);
    fetchAnalytics(eventId);
  };

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const chartData = analytics
    ? [
        { name: "Confirmed", value: analytics.confirmed },
        { name: "Waitlist", value: analytics.waitlist },
        { name: "Cancelled", value: analytics.cancelled },
      ]
    : [];
    const handleDeleteEvent = async (eventId) => {
  try {
    await API.delete(`/events/${eventId}`);

    alert("Event deleted successfully");

    fetchMyEvents();

    if (selectedEvent === eventId) {
      setSelectedEvent(null);
      setAnalytics(null);
      setRegistrations([]);
    }

  } catch (err) {
    alert("Failed to delete event");
  }
};

  return (
    <>
      <Navbar />

      <div className="container">
        <h1 className="title">Organizer Dashboard</h1>

        <button
          className="create-btn"
          onClick={() => navigate("/create-event")}
        >
          + Create Event
        </button>

        {/* Event Cards */}
        <div className="events-grid">
          {events.map((event) => (
            <div
              key={event.id}
              className={`event-card ${
                selectedEvent === event.id ? "active-card" : ""
              }`}
            >
              <h3>{event.title}</h3>
              <p>{event.description}</p>
              <p>Date: {event.date}</p>
              <p>Capacity: {event.capacity}</p>

               <button onClick={() => handleEventClick(event.id)}>
  View Details
</button>

<button
  onClick={() => navigate(`/edit-event/${event.id}`)}
>
  Edit Event
</button>

<button
  className="delete-btn"
  onClick={() => handleDeleteEvent(event.id)}
>
  Delete Event
</button>
            </div>
          ))}
        </div>

        {/* Loading */}
        {loading && <p>Loading analytics...</p>}

        {/* Analytics */}
        {analytics && (
          <>
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
                <p>{analytics.remaining_spots}</p>
              </div>
            </div>

            {/* Chart */}
            <div className="chart-box">
              <BarChart width={500} height={300} data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#667eea" />
              </BarChart>
            </div>
          </>
        )}

        {/* Registrations */}
        {selectedEvent && (
          <div className="registrations">
            <h2>Registrations</h2>

            {registrations.length === 0 ? (
              <p>No registrations yet</p>
            ) : (
              registrations.map((r) => (
                <div key={r.id} className="registration-card">
                  <p>User ID: {r.user_id}</p>
                  <span>{r.status}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default Dashboard;