import axios from "axios";
import { showToast } from "../lib/toast";
import {
  clearSession,
  getToken,
  hasValidSession,
  queueAuthMessage,
} from "../utils/auth";

const API = axios.create({
  baseURL: "http://localhost:8000",
});

API.interceptors.request.use((req) => {
  const token = getToken();
  const isPublicAuthRoute = ["/login", "/users"].includes(req.url);

  if (token && !hasValidSession() && !isPublicAuthRoute) {
    clearSession();
    queueAuthMessage("Your session expired. Please login again.");
    showToast("Your session expired. Please login again.", "error");
    window.location.href = "/login";
    throw new Error("Session expired");
  }

  if (token && req.url !== "/login") {
    req.headers.Authorization = `Bearer ${token}`;
  }

  return req;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && error.config?.url !== "/login") {
      clearSession();
      queueAuthMessage("Please login again to continue.");
      showToast("Please login again to continue.", "error");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default API;
