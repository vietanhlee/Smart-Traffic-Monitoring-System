import { Navigate, Outlet } from "react-router-dom";

// You may want to add authentication logic here
const authed = Boolean(localStorage.getItem("access_token"));

export default function ProtectedRoute() {
  return authed ? <Outlet /> : <Navigate to="/login" replace />;
}
