const TOKEN_KEY = "token";
const ROLE_KEY = "role";
const USER_ID_KEY = "user_id";
const AUTH_MESSAGE_KEY = "auth_message";

function parseJwt(token) {
  try {
    const payload = token.split(".")[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );
    return JSON.parse(window.atob(padded));
  } catch {
    return null;
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRole() {
  return localStorage.getItem(ROLE_KEY);
}

export function getUserId() {
  return localStorage.getItem(USER_ID_KEY);
}

export function setSession(token, role, userId) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ROLE_KEY, role);
  localStorage.setItem(USER_ID_KEY, userId);
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(USER_ID_KEY);
}

export function isTokenExpired(token = getToken()) {
  if (!token) {
    return true;
  }

  const payload = parseJwt(token);
  if (!payload) {
    return true;
  }

  if (!payload.exp) {
    return false;
  }

  return payload.exp * 1000 <= Date.now();
}

export function hasValidSession() {
  const token = getToken();
  return Boolean(token) && !isTokenExpired(token);
}

export function queueAuthMessage(message) {
  sessionStorage.setItem(AUTH_MESSAGE_KEY, message);
}

export function consumeAuthMessage() {
  const message = sessionStorage.getItem(AUTH_MESSAGE_KEY);

  if (message) {
    sessionStorage.removeItem(AUTH_MESSAGE_KEY);
  }

  return message;
}

export function getDefaultRouteForRole(role) {
  if (role === "organizer") {
    return "/organizer-dashboard";
  }

  if (role === "admin") {
    return "/admin-dashboard";
  }

  return "/events";
}
