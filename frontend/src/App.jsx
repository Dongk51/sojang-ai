import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import VatCalculatorPage from './pages/VatCalculatorPage';
import OrderMemoPage from './pages/OrderMemoPage';
import AiAnalyzePage from './pages/AiAnalyzePage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vat-calculator"
            element={
              <ProtectedRoute>
                <VatCalculatorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/order-memo"
            element={
              <ProtectedRoute>
                <OrderMemoPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai-analyze"
            element={
              <ProtectedRoute>
                <AiAnalyzePage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
