import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";
import Navbar from "../components/Navbar";
import PageHeader from "../components/PageHeader";
import { showToast } from "../lib/toast";
import { formatEventDate } from "../utils/date";
import { getRegistrationStatusMeta } from "../utils/eventStatus";
import "./MyRegistrations.css";

function MyRegistrations() {
  const [registrations, setRegistrations] = useState([]);
  const [events, setEvents] = useState([]);

  const fetchRegistrations = async () => {
    try {
      const res = await API.get("/registrations/my");
      setRegistrations(res.data);
    } catch {
      showToast("Failed to load your registrations.", "error");
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await API.get("/events?limit=1000");
      setEvents(res.data);
    } catch {
      showToast("Failed to load events.", "error");
    }
  };

  useEffect(() => {
    fetchRegistrations();
    fetchEvents();
  }, []);

  const getEvent = (eventId) => {
    return events.find((item) => item.id === eventId) || null;
  };

  return (
    <>
      <Navbar />

      <div className="registrations-container">
        <PageHeader
          eyebrow="Participant View"
          title="My Registrations"
          subtitle="Keep track of every event you have joined, along with the latest attendance status."
        />

        {registrations.length === 0 && <p>No registrations yet</p>}

        {registrations.map((registration) => {
          const event = getEvent(registration.event_id);
          const statusMeta = getRegistrationStatusMeta(registration.status);

          return (
            <Link
              to={`/events/${registration.event_id}`}
              key={registration.id}
              style={{ textDecoration: "none" }}
            >
              <div className="registration-box">
                <p>
                  <strong>Event:</strong> {event ? event.title : "Deleted/Unknown Event"}
                </p>

                <p>
                  <strong>Date:</strong>{" "}
                  {event ? formatEventDate(event.date) : "Date unavailable"}
                </p>

                <p>
                  <strong>Status:</strong>{" "}
                  <span className={`status-badge ${statusMeta.className}`}>
                    {statusMeta.label}
                  </span>
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}

export default MyRegistrations;
