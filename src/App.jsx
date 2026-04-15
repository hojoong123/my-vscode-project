import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import Layout from "./components/Layout";
import DashboardPage from "./pages/DashboardPage";
import DeviceListPage from "./pages/DeviceListPage";
import DeviceDetailPage from "./pages/DeviceDetailPage";
import LogsPage from "./pages/LogsPage";
import ErrorsPage from "./pages/ErrorsPage";

function PrivateRoute({ children }) {
  return localStorage.getItem("token") ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="devices" element={<DeviceListPage />} />
          <Route path="devices/:id" element={<DeviceDetailPage />} />
          <Route path="logs" element={<LogsPage />} />
          <Route path="errors" element={<ErrorsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}