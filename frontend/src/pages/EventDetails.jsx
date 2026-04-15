import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../api/axios";
import Navbar from "../components/Navbar";
import "./EventDetails.css";

function EventDetails() {
  const { id } = useParams();

  const [event, setEvent] = useState(null);
  const [registrationStatus, setRegistrationStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [eventNotFound, setEventNotFound] = useState(false);

  // Fetch event details
  const fetchEvent = async () => {
    try {
      const response = await API.get(`/events/${id}`);
      setEvent(response.data);
      setEventNotFound(false);
    } catch (error) {
      console.log("Error fetching event", error);
      setEventNotFound(true);
    }
  };

  // Fetch registration status
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

  // Register
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

  // Cancel
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

  if (eventNotFound) {
    return (
      <>
        <Navbar />
        <div className="details-container">
          <h2>Event not found or may have been deleted.</h2>
        </div>
      </>
    );
  }

  if (!event) return <p>Loading...</p>;

  return (
    <>
      <Navbar />

      <div className="details-container">
        <div className="details-card">
          <h2>{event.title}</h2>

          <p>
            <strong>Description:</strong> {event.description}
          </p>

          <p>
            <strong>Date:</strong> {event.date}
          </p>

          <p>
            <strong>Capacity:</strong> {event.capacity}
          </p>

          <hr />

          {loading && <p>Processing...</p>}

          {registrationStatus === "confirmed" && (
            <>
              <p className="status confirmed">Confirmed Registration</p>

              <button
                onClick={handleCancel}
                disabled={loading}
                className="cancel-btn"
              >
                Cancel Registration
              </button>
            </>
          )}

          {registrationStatus === "waitlist" && (
            <>
              <p className="status waitlist">Waitlisted</p>

              <button
                onClick={handleCancel}
                disabled={loading}
                className="cancel-btn"
              >
                Cancel Registration
              </button>
            </>
          )}

          {registrationStatus === null && (
            <button
              onClick={handleRegister}
              disabled={loading}
              className="register-btn"
            >
              Register
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export default EventDetails;