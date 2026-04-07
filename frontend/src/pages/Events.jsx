import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

function Events() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const limit = 5;
  const [events, setEvents] = useState([]);

  const navigate = useNavigate();

  // ✅ Fetch events (fixed)
  const fetchEvents = async () => {
    try {
      const res = await API.get("/events", {
        params: {
          search: search,
          skip: page * limit,
          limit: limit,
        },
      });

      setEvents(res.data);
    } catch (error) {
      console.log("❌ Error fetching events", error);
    }
  };

  // ✅ useEffect
  useEffect(() => {
    fetchEvents();
  }, [search, page]);

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "auto" }}>
      <h2>Events</h2>

      {/* 🔍 Search */}
      <input
        type="text"
        placeholder="Search events..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(0);
        }}
        style={{
          padding: "10px",
          width: "100%",
          marginBottom: "15px",
          borderRadius: "8px",
        }}
      />

      {/* 📄 Events */}
      {events.length === 0 ? (
        <p>No events found</p>
      ) : (
        events.map((event) => (
          <div
            key={event.id}
            onClick={() => navigate(`/events/${event.id}`)}
            style={{
              border: "1px solid #eee",
              padding: "15px",
              marginBottom: "10px",
              borderRadius: "10px",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <h3>{event.title}</h3>
            <p>{event.description}</p>
            <p><strong>Date:</strong> {event.date}</p>
          </div>
        ))
      )}

      {/* 📄 Pagination */}
      <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
        <button
          onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
          disabled={page === 0}
        >
          Previous
        </button>

        <button
          onClick={() => setPage((prev) => prev + 1)}
          disabled={events.length < limit}
        >
          Next
        </button>
      </div>

      <p>Page: {page + 1}</p>
    </div>
  );
}

export default Events;