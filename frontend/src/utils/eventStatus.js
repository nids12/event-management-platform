export function getEventStatusMeta(status) {
  if (status === "full") {
    return {
      label: "Full",
      className: "status-badge-full",
    };
  }

  if (status === "completed") {
    return {
      label: "Completed",
      className: "status-badge-completed",
    };
  }

  return {
    label: "Upcoming",
    className: "status-badge-upcoming",
  };
}

export function getRegistrationStatusMeta(status) {
  if (status === "confirmed") {
    return { label: "Confirmed", className: "status-badge-confirmed" };
  }

  if (status === "waitlist") {
    return { label: "Waitlist", className: "status-badge-waitlist" };
  }

  return { label: "Cancelled", className: "status-badge-cancelled" };
}
