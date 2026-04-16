import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import Navbar from "../components/Navbar";
import PageHeader from "../components/PageHeader";
import { showToast } from "../lib/toast";
import { formatEventDate } from "../utils/date";
import {
  getEventStatusMeta,
  getRegistrationStatusMeta,
} from "../utils/eventStatus";
import "./Dashboard.css";

function Dashboard() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const fetchMyEvents = async () => {
    try {
      const res = await API.get("/events/my-events");
      setEvents(res.data);
    } catch {
      showToast("Error fetching events.", "error");
    }
  };

  const fetchRegistrations = async (eventId) => {
    try {
      const res = await API.get(`/events/${eventId}/registrations`);
      setRegistrations(res.data);
    } catch {
      showToast("Error fetching registrations.", "error");
    }
  };

  const fetchAnalytics = async (eventId) => {
    try {
      setLoading(true);
      const res = await API.get(`/events/${eventId}/analytics`);
      setAnalytics(res.data);
    } catch {
      showToast("Error fetching analytics.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (eventId) => {
    setSelectedEvent(eventId);
    fetchRegistrations(eventId);
    fetchAnalytics(eventId);
  };

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const handleDeleteEvent = async (eventId) => {
    try {
      await API.delete(`/events/${eventId}`);
      showToast("Event deleted successfully.", "success");
      fetchMyEvents();

      if (selectedEvent === eventId) {
        setSelectedEvent(null);
        setAnalytics(null);
        setRegistrations([]);
      }
    } catch (err) {
      showToast(err.response?.data?.detail || "Failed to delete event.", "error");
    }
  };

  const chartData = analytics
    ? [
        { name: "Confirmed", value: analytics.confirmed },
        { name: "Waitlist", value: analytics.waitlist },
        { name: "Cancelled", value: analytics.cancelled },
      ]
    : [];
  const maxChartValue = Math.max(...chartData.map((item) => item.value), 1);

  return (
    <>
      <Navbar />

      <div className="container">
        <PageHeader
          eyebrow="Organizer Workspace"
          title="Event Control Center"
          subtitle="Track registrations, monitor attendance status, and keep every event polished and up to date."
          actions={
            <button className="create-btn" onClick={() => navigate("/create-event")}>
              + Create Event
            </button>
          }
        />

        <div className="events-grid">
          {events.map((event) => {
            const statusMeta = getEventStatusMeta(event.status);

            return (
              <div
                key={event.id}
                className={`event-card ${
                  selectedEvent === event.id ? "active-card" : ""
                }`}
              >
                <div className="event-card-top">
                  <h3>{event.title}</h3>
                  <span className={`status-badge ${statusMeta.className}`}>
                    {statusMeta.label}
                  </span>
                </div>

                <p>{event.description}</p>
                <p>Date: {formatEventDate(event.date)}</p>
                <p>
                  Seats: {event.confirmed_count}/{event.capacity}
                </p>

                <button onClick={() => handleEventClick(event.id)}>View Details</button>
                <button onClick={() => navigate(`/edit-event/${event.id}`)}>
                  Edit Event
                </button>
                <button
                  className="delete-btn"
                  onClick={() => handleDeleteEvent(event.id)}
                >
                  Delete Event
                </button>
              </div>
            );
          })}
        </div>

        {loading && <p>Loading analytics...</p>}

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

            <div className="chart-box">
              <div className="simple-chart">
                {chartData.map((item) => (
                  <div key={item.name} className="simple-chart-row">
                    <span className="simple-chart-label">{item.name}</span>
                    <div className="simple-chart-track">
                      <div
                        className="simple-chart-bar"
                        style={{
                          width: `${(item.value / maxChartValue) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="simple-chart-value">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {selectedEvent && (
          <div className="registrations">
            <h2>Attendee List</h2>

            {registrations.length === 0 ? (
              <p>No registrations yet</p>
            ) : (
              registrations.map((registration) => {
                const statusMeta = getRegistrationStatusMeta(registration.status);

                return (
                  <div key={registration.id} className="registration-card">
                    <div>
                      <p className="registration-name">
                        {registration.user_name || `User ${registration.user_id}`}
                      </p>
                      <p className="registration-email">
                        {registration.user_email || "Email unavailable"}
                      </p>
                    </div>
                    <span className={`status-badge ${statusMeta.className}`}>
                      {statusMeta.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default Dashboard;
