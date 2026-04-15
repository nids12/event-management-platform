import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("participant");

  const navigate = useNavigate();

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

      if (!token) {
        alert("No token received");
        return;
      }

      if (role !== selectedRole) {
        alert(`You are not registered as ${selectedRole}`);
        return;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("role", role);

      if (role === "organizer") {
        navigate("/organizer-dashboard");
      } else if (role === "admin") {
        navigate("/admin-dashboard");
      } else {
        navigate("/events");
      }
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.detail || "Login failed");
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
