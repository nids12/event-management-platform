import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000",
});

// ✅ Attach token (EXCEPT login)
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");

  // ❌ login request me token mat bhej
  if (token && req.url !== "/login") {
    req.headers.Authorization = `Bearer ${token}`;
  }

  return req;
});

export default API;
