function parseEventDate(value) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  const fallback = new Date(`${value}T00:00`);
  if (!Number.isNaN(fallback.getTime())) {
    return fallback;
  }

  return null;
}

function pad(value) {
  return String(value).padStart(2, "0");
}

export function formatEventDate(value) {
  const date = parseEventDate(value);
  if (!date) {
    return value || "Date not available";
  }

  const hasTime = /T\d{2}:\d{2}| \d{2}:\d{2}/.test(value);

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    ...(hasTime ? { timeStyle: "short" } : {}),
  }).format(date);
}

export function toDateTimeLocalValue(value) {
  const date = parseEventDate(value);
  if (!date) {
    return "";
  }

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
