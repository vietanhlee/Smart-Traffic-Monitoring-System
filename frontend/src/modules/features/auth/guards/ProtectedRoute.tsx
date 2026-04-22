import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
  const authed = Boolean(localStorage.getItem("access_token"));
  return authed ? <Outlet /> : <Navigate to="/login" replace />;
}
