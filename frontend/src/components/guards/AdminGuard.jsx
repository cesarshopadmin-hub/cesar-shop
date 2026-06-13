import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function AdminGuard({ children }) {
  const { token, user } = useAuth();
  
  const currentUser = user?.name ? user : user?.user;

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}