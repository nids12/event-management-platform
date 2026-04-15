import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import Navbar from "../components/Navbar";
import "./Events.css";

function Events() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const limit = 5;
  const [events, setEvents] = useState([]);

  const navigate = useNavigate();

  const fetchEvents = async () => {
    try {
      const res = await API.get("/events", {
        params: {
          search,
          skip: page * limit,
          limit,
        },
      });

      setEvents(res.data);
    } catch (error) {
      console.log("Error fetching events", error);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [search, page]);

  return (
    <>
      <Navbar />

      <div className="events-container">
        <div className="events-header">
          <h2 className="events-title">Discover Amazing Events</h2>
          <p className="events-subtitle">
            Find and join exciting experiences happening around you 🚀
          </p>
        </div>

        <input
          type="text"
          placeholder="🔍 Search events by title..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          className="search-input"
        />

        {events.length === 0 ? (
          <p className="no-events">No events found.</p>
        ) : (
          <div className="events-list">
            {events.map((event) => (
              <div
                key={event.id}
                className="event-box"
                onClick={() => navigate(`/events/${event.id}`)}
              >
                <div className="event-top">
                  <h3>{event.title}</h3>
                  <span className="event-badge">Live</span>
                </div>

                <p className="event-description">{event.description}</p>

                <div className="event-footer">
                  <p>
                    📅 <strong>{event.date}</strong>
                  </p>

                  <button className="view-btn">View Details →</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pagination">
          <button
            onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
            disabled={page === 0}
          >
            ← Previous
          </button>

          <span className="page-number">Page {page + 1}</span>

          <button
            onClick={() => setPage((prev) => prev + 1)}
            disabled={events.length < limit}
          >
            Next →
          </button>
        </div>
      </div>
    </>
  );
}

export default Events;