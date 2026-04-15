import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import Navbar from "../components/Navbar";
import "./CreateEvent.css";

function CreateEvent() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [capacity, setCapacity] = useState("");

  const navigate = useNavigate();

  const handleCreateEvent = async () => {
    try {
      await API.post("/events", {
        title,
        description,
        date,
        capacity: parseInt(capacity),
      });

      alert("Event created successfully!");

      navigate("/organizer-dashboard");
    } catch (err) {
      console.log(err);
      alert("Failed to create event");
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

          <button onClick={handleCreateEvent}>
            Create Event
          </button>
        </div>
      </div>
    </>
  );
}

export default CreateEvent;