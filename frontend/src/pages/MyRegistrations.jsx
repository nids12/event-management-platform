import { useEffect, useState } from "react";
import API from "../api/axios";

function MyRegistrations() {
  const [registrations, setRegistrations] = useState([]);
  const [events, setEvents] = useState([]);

  // ✅ Fetch registrations
  const fetchRegistrations = async () => {
    try {
      const res = await API.get("/registrations/my");
      setRegistrations(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  // ✅ Fetch all events (to map event names)
  const fetchEvents = async () => {
    try {
      const res = await API.get("/events");
      setEvents(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchRegistrations();
    fetchEvents();
  }, []);

  // 🎯 helper to get event title
  const getEventTitle = (eventId) => {
    const event = events.find((e) => e.id === eventId);
    return event ? event.title : "Unknown Event";
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "auto" }}>
      <h2>My Registrations</h2>

      {registrations.length === 0 && <p>No registrations yet</p>}

      {registrations.map((r) => (
        <div
          key={r.id}
          style={{
            border: "1px solid #eee",
            padding: "15px",
            borderRadius: "10px",
            marginBottom: "10px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <p><strong>Event:</strong> {getEventTitle(r.event_id)}</p>

          <p>
            <strong>Status:</strong>{" "}
            <span
              style={{
                color:
                  r.status === "confirmed"
                    ? "green"
                    : r.status === "waitlist"
                    ? "orange"
                    : "red",
                fontWeight: "bold",
              }}
            >
              {r.status}
            </span>
          </p>
        </div>
      ))}
    </div>
  );
}

export default MyRegistrations;