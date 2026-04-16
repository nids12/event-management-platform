import { Navigate } from "react-router-dom";
import {
  clearSession,
  getDefaultRouteForRole,
  getRole,
  getToken,
  isTokenExpired,
  queueAuthMessage,
} from "../utils/auth";

function ProtectedRoute({ children, allowedRoles }) {
  const token = getToken();
  const role = getRole();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (isTokenExpired(token)) {
    clearSession();
    queueAuthMessage("Your session expired. Please login again.");
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={getDefaultRouteForRole(role)} replace />;
  }

  return children;
}

export default ProtectedRoute;
