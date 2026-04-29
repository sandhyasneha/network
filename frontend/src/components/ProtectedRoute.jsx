import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Activity } from "lucide-react";

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-navy-950 text-slate-400">
        <Activity className="w-6 h-6 animate-pulse text-signal-cyan mb-2" />
        <span className="font-mono text-xs tracking-[0.25em]">VERIFYING SESSION…</span>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}
