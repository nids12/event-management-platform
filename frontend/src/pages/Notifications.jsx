import { useEffect, useState } from "react";
import API from "../api/axios";
import "./Notifications.css";

function Notifications() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await API.get("/notifications");
      setNotifications(res.data);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  return (
    <div className="notifications-container">
      <h2>Your Notifications</h2>

      {notifications.length === 0 ? (
        <p>No notifications available.</p>
      ) : (
        notifications.map((note) => (
          <div key={note.id} className="notification-card">
            <p>{note.message}</p>
          </div>
        ))
      )}
    </div>
  );
}

export default Notifications;