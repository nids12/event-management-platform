import { useEffect, useState } from "react";
import API from "../api/axios";
import Navbar from "../components/Navbar";
import PageHeader from "../components/PageHeader";
import { showToast } from "../lib/toast";
import "./Notifications.css";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await API.get("/notifications");
      setNotifications(res.data);
    } catch {
      showToast("Failed to fetch notifications.", "error");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await API.put(`/notifications/${notificationId}/read`);
      setNotifications((current) =>
        current.map((note) =>
          note.id === notificationId ? { ...note, is_read: true } : note
        )
      );
      window.dispatchEvent(new Event("notifications:refresh"));
      showToast("Notification marked as read.", "success");
    } catch {
      showToast("Failed to update the notification.", "error");
    }
  };

  const markAllAsRead = async () => {
    try {
      await API.put("/notifications/read-all");
      setNotifications((current) =>
        current.map((note) => ({ ...note, is_read: true }))
      );
      window.dispatchEvent(new Event("notifications:refresh"));
      showToast("All notifications marked as read.", "success");
    } catch {
      showToast("Failed to mark all notifications as read.", "error");
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await API.delete(`/notifications/${notificationId}`);
      setNotifications((current) =>
        current.filter((note) => note.id !== notificationId)
      );
      window.dispatchEvent(new Event("notifications:refresh"));
      showToast("Notification deleted.", "success");
    } catch {
      showToast("Failed to delete the notification.", "error");
    }
  };

  const deleteAllNotifications = async () => {
    try {
      await API.delete("/notifications");
      setNotifications([]);
      window.dispatchEvent(new Event("notifications:refresh"));
      showToast("All notifications deleted.", "success");
    } catch {
      showToast("Failed to delete all notifications.", "error");
    }
  };

  return (
    <>
      <Navbar />

      <div className="notifications-container">
        <PageHeader
          eyebrow="Inbox"
          title="Your Notifications"
          subtitle="Review updates in one place and clear unread items as you go."
          actions={
            <>
              <button
                className="notifications-action"
                onClick={markAllAsRead}
                disabled={!notifications.some((note) => !note.is_read)}
              >
                Mark all as read
              </button>
              <button
                className="notifications-action delete-all"
                onClick={deleteAllNotifications}
                disabled={notifications.length === 0}
              >
                Delete all
              </button>
            </>
          }
        />

        {loading ? (
          <p>Loading notifications...</p>
        ) : notifications.length === 0 ? (
          <p>No notifications available.</p>
        ) : (
          notifications.map((note) => (
            <div
              key={note.id}
              className={`notification-card ${note.is_read ? "read" : "unread"}`}
            >
              <div>
                <p>{note.message}</p>
                <p className="notification-meta">
                  {note.is_read ? "Read" : "Unread"} update
                </p>
              </div>

              <div className="notification-actions">
                {!note.is_read && (
                  <button
                    className="notifications-action"
                    onClick={() => markAsRead(note.id)}
                  >
                    Mark as read
                  </button>
                )}
                <button
                  className="notifications-action delete"
                  onClick={() => deleteNotification(note.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

export default Notifications;
