import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../api/axios";
import Navbar from "../components/Navbar";
import { showToast } from "../lib/toast";
import { getRole, getUserId } from "../utils/auth";
import { formatEventDate } from "../utils/date";
import { getEventStatusMeta } from "../utils/eventStatus";
import "./EventDetails.css";

function EventDetails() {
  const { id } = useParams();
  const role = getRole();

  const [event, setEvent] = useState(null);
  const [registrationStatus, setRegistrationStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [eventNotFound, setEventNotFound] = useState(false);

  const fetchEvent = async () => {
    try {
      const response = await API.get(`/events/${id}`);
      setEvent(response.data);
      setEventNotFound(false);
    } catch {
      showToast("Unable to load this event.", "error");
      setEventNotFound(true);
    }
  };

  const fetchRegistrationStatus = async () => {
    try {
      const res = await API.get(`/events/${id}/my-registration`);

      if (res.data && res.data.status) {
        setRegistrationStatus(res.data.status);
      } else {
        setRegistrationStatus(null);
      }
    } catch {
      setRegistrationStatus(null);
    }
  };

  const handleRegister = async () => {
    if (loading) {
      return;
    }

    try {
      setLoading(true);
      await API.post(`/events/${id}/register`);
      showToast("Registered successfully.", "success");
      fetchRegistrationStatus();
    } catch (error) {
      showToast(error.response?.data?.detail || "Register failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (loading) {
      return;
    }

    try {
      setLoading(true);
      await API.delete(`/events/${id}/cancel`);
      showToast("Registration cancelled.", "info");
      fetchRegistrationStatus();
    } catch (error) {
      showToast(error.response?.data?.detail || "Cancel failed.", "error");
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

  if (!event) {
    return <p>Loading...</p>;
  }

  const statusMeta = getEventStatusMeta(event.status);
  const currentUserId = parseInt(getUserId());
  const isEventOrganizer = event.organizer_id === currentUserId;
  const canManageRegistration = ["participant", "organizer", "admin"].includes(role) && !isEventOrganizer;

  return (
    <>
      <Navbar />

      <div className="details-container">
        <div className="details-card">
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center" }}>
            <h2>{event.title}</h2>
            <span className={`status-badge ${statusMeta.className}`}>
              {statusMeta.label}
            </span>
          </div>

          <p>
            <strong>Description:</strong> {event.description}
          </p>

          <p>
            <strong>Date:</strong> {formatEventDate(event.date)}
          </p>

          {role !== "participant" && (
            <>
              <p>
                <strong>Capacity:</strong> {event.capacity}
              </p>

              <p>
                <strong>Confirmed Seats:</strong> {event.confirmed_count}
              </p>
            </>
          )}

          {role === "participant" && (
            <p>
              <strong>Available Seats:</strong> {event.capacity - event.confirmed_count}
            </p>
          )}

          <hr />

          {loading && <p>Processing...</p>}

          {!canManageRegistration && (
            <p className="status confirmed">
              {isEventOrganizer
                ? "You are the organizer of this event."
                : `This page is view-only for ${role}. Participants can register from here.`
              }
            </p>
          )}

          {canManageRegistration && registrationStatus === "confirmed" && (
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

          {canManageRegistration && registrationStatus === "waitlist" && (
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

          {canManageRegistration && registrationStatus === null && (
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
