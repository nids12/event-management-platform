import { BrowserRouter, Routes, Route } from "react-router-dom";

import Register from "./pages/Register";
import Login from "./pages/Login";
import Events from "./pages/Events";
import EventDetails from "./pages/EventDetails";
import Dashboard from "./pages/Dashboard";
import MyRegistrations from "./pages/MyRegistrations";
import AdminDashboard from "./pages/AdminDashboard";
import EditEvent from "./pages/EditEvent";
import CreateEvent from "./pages/CreateEvent";
import Notifications from "./pages/Notifications";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Events (participant + organizer) */}
        <Route
          path="/events"
          element={
            <ProtectedRoute allowedRoles={["participant", "organizer"]}>
              <Events />
            </ProtectedRoute>
          }
        />

        <Route
          path="/events/:id"
          element={
            <ProtectedRoute allowedRoles={["participant", "organizer"]}>
              <EventDetails />
            </ProtectedRoute>
          }
        />

        {/* Participant */}
        <Route
          path="/my-registrations"
          element={
            <ProtectedRoute allowedRoles={["participant"]}>
              <MyRegistrations />
            </ProtectedRoute>
          }
        />

        {/* Organizer */}
        <Route
          path="/organizer-dashboard"
          element={
            <ProtectedRoute allowedRoles={["organizer"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/create-event"
          element={
            <ProtectedRoute allowedRoles={["organizer"]}>
              <CreateEvent />
            </ProtectedRoute>
          }
        />

        <Route
          path="/edit-event/:id"
          element={
            <ProtectedRoute allowedRoles={["organizer"]}>
              <EditEvent />
            </ProtectedRoute>
          }
        />

        {/* Admin */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Notifications (all logged users) */}
        <Route
          path="/notifications"
          element={
            <ProtectedRoute allowedRoles={["participant", "organizer", "admin"]}>
              <Notifications />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;