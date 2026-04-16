import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import Navbar from "../components/Navbar";
import { showToast } from "../lib/toast";
import "./CreateEvent.css";

function CreateEvent() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [capacity, setCapacity] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  const handleCreateEvent = async () => {
    if (submitting) {
      return;
    }

    if (!title.trim() || !description.trim() || !date || !capacity) {
      showToast("Please fill in all event fields.", "error");
      return;
    }

    if (title.trim().length < 3) {
      showToast("Event title must be at least 3 characters.", "error");
      return;
    }

    if (description.trim().length < 10) {
      showToast("Event description must be at least 10 characters.", "error");
      return;
    }

    if (Number(capacity) <= 0) {
      showToast("Capacity must be greater than 0.", "error");
      return;
    }

    if (new Date(date) <= new Date()) {
      showToast("Event date must be in the future.", "error");
      return;
    }

    try {
      setSubmitting(true);
      await API.post("/events", {
        title: title.trim(),
        description: description.trim(),
        date,
        capacity: parseInt(capacity, 10),
      });

      showToast("Event created successfully.", "success");
      navigate("/organizer-dashboard");
    } catch (err) {
      showToast(err.response?.data?.detail || "Failed to create event.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />

      <div className="create-container">
        <div className="create-card">
          <h2>Create New Event</h2>

          <input
            type="text"
            placeholder="Event Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <input
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <input
            type="number"
            placeholder="Capacity"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
          />

          <button onClick={handleCreateEvent} disabled={submitting}>
            {submitting ? "Creating..." : "Create Event"}
          </button>
        </div>
      </div>
    </>
  );
}

export default CreateEvent;
