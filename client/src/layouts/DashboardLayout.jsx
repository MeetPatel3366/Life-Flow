import { useState } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import Sidebar from "../components/common/Sidebar";
import Header from "../components/common/Header";
import ErrorBoundary from "../components/common/ErrorBoundary";
import { useAuth } from "../hooks/useAuth";
import { useSocket } from "../hooks/useSocket";

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isHospital } = useAuth();
  const location = useLocation();

  useSocket();

  if (isHospital && !user?.isHospitalVerified) {
    const allowedPaths = ['/dashboard', '/dashboard/hospital-profile', '/dashboard/profile'];
    if (!allowedPaths.includes(location.pathname)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return (
    <div className="flex h-screen bg-surface-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMenuToggle={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}