import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute({ authed }: { authed: boolean }) {
  return authed ? <Outlet /> : <Navigate to="/login" replace />;
}
