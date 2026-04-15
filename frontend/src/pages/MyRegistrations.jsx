import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";
import Navbar from "../components/Navbar";
import "./MyRegistrations.css";

function MyRegistrations() {
  const [registrations, setRegistrations] = useState([]);
  const [events, setEvents] = useState([]);

  const fetchRegistrations = async () => {
    try {
      const res = await API.get("/registrations/my");
      setRegistrations(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchEvents = async () => {
    try {
      // fetch many events so pagination doesn't hide them
      const res = await API.get("/events?limit=1000");
      setEvents(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchRegistrations();
    fetchEvents();
  }, []);

  const getEventTitle = (eventId) => {
    const event = events.find((e) => e.id === eventId);
    return event ? event.title : "Deleted/Unknown Event";
  };

  return (
    <>
      <Navbar />

      <div className="registrations-container">
        <h2 className="registrations-title">My Registrations</h2>

        {registrations.length === 0 && <p>No registrations yet</p>}

        {registrations.map((r) => (
          <Link
            to={`/events/${r.event_id}`}
            key={r.id}
            style={{ textDecoration: "none" }}
          >
            <div className="registration-box">
              <p>
                <strong>Event:</strong> {getEventTitle(r.event_id)}
              </p>

              <p>
                <strong>Status:</strong>{" "}
                <span className={`status ${r.status}`}>
                  {r.status}
                </span>
              </p>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}

export default MyRegistrations;