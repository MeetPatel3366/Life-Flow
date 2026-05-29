import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function RoleRoute({ allowedRoles, children }) {
  const { role } = useAuth();
  if (!allowedRoles.includes(role)) return <Navigate to="/dashboard" replace />;
  return children;
}
