import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../api/axios";
import Navbar from "../components/Navbar";
import "./EditEvent.css";

function EditEvent() {
  const { id } = useParams();

  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [capacity, setCapacity] = useState("");

  useEffect(() => {
    fetchEvent();
  }, []);

  const fetchEvent = async () => {
    try {
      const res = await API.get(`/events/${id}`);

      setTitle(res.data.title);
      setDescription(res.data.description);
      setDate(res.data.date);
      setCapacity(res.data.capacity);

    } catch (err) {
      alert("Failed to fetch event");
    }
  };

  const handleUpdate = async () => {
    try {
      await API.put(`/events/${id}`, {
        title,
        description,
        date,
        capacity,
      });

      alert("Event updated successfully");

      navigate("/organizer-dashboard");

    } catch (err) {
      alert("Update failed");
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
            value={date}
            onChange={(e) => setDate(e.target.value)}
            placeholder="Date"
          />

          <input
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            placeholder="Capacity"
          />

          <button onClick={handleUpdate}>
            Update Event
          </button>
        </div>
      </div>
    </>
  );
}

export default EditEvent;