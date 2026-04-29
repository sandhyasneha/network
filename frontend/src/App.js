import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Dashboard from "@/pages/Dashboard";
import RackDetail from "@/pages/RackDetail";
import CameraAudit from "@/pages/CameraAudit";
import DriftResult from "@/pages/DriftResult";
import Login from "@/pages/Login";
import AuthCallback from "@/pages/AuthCallback";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AuthProvider } from "@/lib/auth";

function AppRouter() {
  const location = useLocation();

  // CRITICAL synchronous check: if returning from Emergent OAuth, handle session_id BEFORE
  // any other route or auth check runs. This prevents race conditions.
  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/rack/:rackId" element={<RackDetail />} />
        <Route path="/audit/:rackId" element={<CameraAudit />} />
        <Route path="/result/:auditId" element={<DriftResult />} />
      </Route>
    </Routes>
  );
}

function App() {
  // Register service worker (PWA offline)
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return (
    <div className="App min-h-screen bg-navy-950 text-slate-100">
      <BrowserRouter>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
