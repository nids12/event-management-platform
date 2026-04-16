import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import API from "../api/axios";
import { showToast } from "../lib/toast";
import "./Login.css";

function Register() {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get("role");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(
    initialRole === "organizer" || initialRole === "admin"
      ? initialRole
      : "participant"
  );

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    if (name.trim().length < 2) {
      showToast("Name must be at least 2 characters.", "error");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast("Enter a valid email address.", "error");
      return;
    }

    if (password.length < 6) {
      showToast("Password must be at least 6 characters.", "error");
      return;
    }

    try {
      await API.post("/users", {
        name,
        email,
        password,
        role,
      });

      showToast("Registration successful. Please login.", "success");
      navigate("/login");
    } catch (err) {
      showToast(err.response?.data?.detail || "Registration failed.", "error");
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleRegister}>
        <h1 className="auth-title">
          SmartEvent <span>Platform</span>
        </h1>

        <p className="auth-subtitle">Create your account to get started</p>

        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="auth-input"
        >
          <option value="participant">Participant</option>
          <option value="organizer">Organizer</option>
          <option value="admin">Admin</option>
        </select>

        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="auth-input"
        />

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
          Register
        </button>

        <p className="switch-auth">
          Already have an account?{" "}
          <span onClick={() => navigate("/login")}>Login</span>
        </p>
      </form>
    </div>
  );
}

export default Register;
