import { useEffect, useState } from "react";
import {
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import API from "../api/axios";
import { showToast } from "../lib/toast";
import {
  consumeAuthMessage,
  getDefaultRouteForRole,
  getRole,
  hasValidSession,
  setSession,
} from "../utils/auth";
import "./Login.css";

function Login() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const initialRole = searchParams.get("role");
  const [selectedRole, setSelectedRole] = useState(
    initialRole === "organizer" || initialRole === "admin"
      ? initialRole
      : "participant"
  );

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const authMessage = consumeAuthMessage();
    if (authMessage) {
      showToast(authMessage, "error");
    }
  }, [location.key]);

  useEffect(() => {
    if (hasValidSession()) {
      navigate(getDefaultRouteForRole(getRole()), { replace: true });
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const params = new URLSearchParams();
      params.append("username", email);
      params.append("password", password);
      params.append("grant_type", "password");

      const response = await API.post("/login", params, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      const token = response.data.access_token;
      const role = response.data.role;
      const userId = response.data.user_id;

      if (!token) {
        showToast("No token received from the server.", "error");
        return;
      }

      if (role !== selectedRole) {
        showToast(`You are not registered as ${selectedRole}.`, "error");
        return;
      }

      setSession(token, role, userId);
      showToast("Login successful.", "success");

      if (role === "organizer") {
        navigate("/organizer-dashboard");
      } else if (role === "admin") {
        navigate("/admin-dashboard");
      } else {
        navigate("/events");
      }
    } catch (error) {
      showToast(error.response?.data?.detail || "Login failed.", "error");
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleLogin}>
        <h1 className="auth-title">
          SmartEvent <span>Platform</span>
        </h1>

        <p className="auth-subtitle">Welcome back! Please login.</p>

        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="auth-input"
        >
          <option value="participant">Participant</option>
          <option value="organizer">Organizer</option>
          <option value="admin">Admin</option>
        </select>

        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="auth-input"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="auth-input"
        />

        <button type="submit" className="auth-button">
          Login
        </button>

        <p className="switch-auth">
          Don't have an account?{" "}
          <span onClick={() => navigate("/register")}>Sign Up</span>
        </p>
      </form>
    </div>
  );
}

export default Login;
