import { useNavigate } from "react-router-dom";

function RoleSelect() {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h2>Select Role</h2>

      <h3>Organizer</h3>
      <button onClick={() => navigate("/login?role=organizer")}>
        Login as Organizer
      </button>

      <br /><br />

      <button onClick={() => navigate("/register?role=organizer")}>
        Register as Organizer
      </button>

      <hr />

      <h3>User</h3>
      <button onClick={() => navigate("/login?role=user")}>
        Login as User
      </button>

      <br /><br />

      <button onClick={() => navigate("/register?role=user")}>
        Register as User
      </button>
    </div>
  );
}

export default RoleSelect;