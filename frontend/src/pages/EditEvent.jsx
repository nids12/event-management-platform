import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../api/axios";
import Navbar from "../components/Navbar";
import { showToast } from "../lib/toast";
import { toDateTimeLocalValue } from "../utils/date";
import "./EditEvent.css";

function EditEvent() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [capacity, setCapacity] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const res = await API.get(`/events/${id}`);
      setTitle(res.data.title);
      setDescription(res.data.description);
      setDate(toDateTimeLocalValue(res.data.date));
      setCapacity(String(res.data.capacity));
    } catch {
      showToast("Failed to fetch event.", "error");
    }
  };

  const handleUpdate = async () => {
    if (submitting) {
      return;
    }

    if (!title.trim() || !description.trim() || !date || !capacity) {
      showToast("Please complete all fields before updating.", "error");
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
      await API.put(`/events/${id}`, {
        title: title.trim(),
        description: description.trim(),
        date,
        capacity: parseInt(capacity, 10),
      });

      showToast("Event updated successfully.", "success");
      navigate("/organizer-dashboard");
    } catch (err) {
      showToast(err.response?.data?.detail || "Update failed.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />

      <div className="edit-container">
        <div className="edit-card">
          <h2>Edit Event</h2>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
          />

          <input
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            placeholder="Date"
          />

          <input
            type="number"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            placeholder="Capacity"
          />

          <button onClick={handleUpdate} disabled={submitting}>
            {submitting ? "Updating..." : "Update Event"}
          </button>
        </div>
      </div>
    </>
  );
}

export default EditEvent;
