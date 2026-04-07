import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../api/axios";

// 🎨 Button Style Helper
const buttonStyle = (color) => ({
  padding: "10px 15px",
  border: "none",
  borderRadius: "8px",
  backgroundColor: color === "green" ? "#4CAF50" : "#f44336",
  color: "white",
  cursor: "pointer",
  marginTop: "10px",
});

function EventDetails() {
  const { id } = useParams();

  const [event, setEvent] = useState(null);
  const [registrationStatus, setRegistrationStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  // ✅ Fetch event details
  const fetchEvent = async () => {
    try {
      const response = await API.get(`/events/${id}`);
      setEvent(response.data);
    } catch (error) {
      console.log("Error fetching event", error);
    }
  };

  // ✅ Fetch registration status (FINAL CLEAN VERSION)
  const fetchRegistrationStatus = async () => {
    try {
      const res = await API.get(`/events/${id}/my-registration`);

      if (res.data && res.data.status) {
        setRegistrationStatus(res.data.status);
      } else {
        setRegistrationStatus(null);
      }

    } catch (error) {
      console.log("Error fetching registration status", error);
    }
  };

  // ✅ Register
  const handleRegister = async () => {
    try {
      setLoading(true);
      await API.post(`/events/${id}/register`);

      alert("Registered successfully ✅");

      fetchRegistrationStatus();
    } catch (error) {
      alert(error.response?.data?.detail || "Register failed");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Cancel
  const handleCancel = async () => {
    try {
      setLoading(true);
      await API.delete(`/events/${id}/cancel`);

      alert("Registration cancelled ❌");

      fetchRegistrationStatus();
    } catch (error) {
      alert(error.response?.data?.detail || "Cancel failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
    fetchRegistrationStatus();
  }, [id]);

  if (!event) return <p>Loading...</p>;

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "auto" }}>
      <div
        style={{
          border: "1px solid #eee",
          borderRadius: "12px",
          padding: "20px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        <h2>{event.title}</h2>

        <p><strong>Description:</strong> {event.description}</p>
        <p><strong>Date:</strong> {event.date}</p>
        <p><strong>Capacity:</strong> {event.capacity}</p>

        <hr />

        {/* ✅ Loading */}
        {loading && <p>Processing...</p>}

        {/* ✅ Confirmed */}
        {registrationStatus === "confirmed" && (
          <>
            <p style={{ color: "green", fontWeight: "bold" }}>
              ✅ Confirmed Registration
            </p>
            <button
              onClick={handleCancel}
              disabled={loading}
              style={buttonStyle("red")}
            >
              Cancel Registration
            </button>
          </>
        )}

        {/* ✅ Waitlist */}
        {registrationStatus === "waitlist" && (
          <>
            <p style={{ color: "orange", fontWeight: "bold" }}>
              🕐 Waitlisted
            </p>
            <button
              onClick={handleCancel}
              disabled={loading}
              style={buttonStyle("red")}
            >
              Cancel Registration
            </button>
          </>
        )}

        {/* ✅ Not Registered */}
        {registrationStatus === null && (
          <button
            onClick={handleRegister}
            disabled={loading}
            style={buttonStyle("green")}
          >
            Register
          </button>
        )}
      </div>
    </div>
  );
}

export default EventDetails;