// Supabase handles the OAuth redirect via PKCE in the URL automatically.
// detectSessionInUrl: true (set in supabase client) consumes the access_token from the URL.
// We just navigate to / once the session is detected by the AuthProvider.
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Activity } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // After Supabase parses the URL hash and stores the session, redirect home.
    const t = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      navigate(data?.session ? "/" : "/login", { replace: true });
    }, 200);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-navy-950 text-slate-300">
      <Activity className="w-6 h-6 animate-pulse text-signal-cyan mb-3" />
      <span className="font-mono text-xs tracking-[0.25em]">AUTHENTICATING…</span>
    </div>
  );
}
