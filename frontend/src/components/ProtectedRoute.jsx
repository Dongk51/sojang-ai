import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { token, initializing } = useAuth();

  if (initializing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-sm text-gray-400">
        불러오는 중...
      </div>
    );
  }
  if (!token) return <Navigate to="/login" replace />;
  return children;
}
