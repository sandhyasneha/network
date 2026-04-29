import { Radar, ShieldCheck, Eye, Lock } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/",
      },
    });
  };

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 relative overflow-hidden flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-grid opacity-50 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-navy-950/80 via-transparent to-navy-950 pointer-events-none" />

      <div className="relative w-full max-w-md">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 border border-signal-blue/60 bg-signal-blue/10 flex items-center justify-center">
            <Radar className="w-5 h-5 text-signal-cyan" />
          </div>
          <div>
            <div className="font-mono text-base font-bold tracking-[0.2em]">NEXPLAN</div>
            <div className="text-[10px] text-slate-500 font-mono tracking-[0.2em]">VISUAL DRIFT v1.0</div>
          </div>
        </div>

        <div className="border border-slate-800 bg-navy-900 p-6 md:p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-signal-cyan/40" />
          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-signal-cyan/40" />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-signal-cyan/40" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-signal-cyan/40" />

          <div className="text-[10px] font-mono tracking-[0.3em] text-signal-cyan">SECURE ACCESS</div>
          <h1 className="mt-3 text-3xl md:text-4xl font-mono font-bold tracking-tight leading-[1.05]">
            Sign in to your<br />
            <span className="text-signal-cyan">Drift Console</span>
          </h1>
          <p className="mt-3 text-sm text-slate-400">
            Access continuous visual verification across every rack at every site.
          </p>

          <button
            data-testid="google-login-btn"
            onClick={handleGoogle}
            className="mt-7 w-full min-h-[52px] bg-white text-navy-950 font-mono text-xs tracking-[0.18em] font-bold flex items-center justify-center gap-3 hover:bg-slate-100 transition-colors border border-white"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            CONTINUE WITH GOOGLE
          </button>

          <div className="mt-7 grid grid-cols-3 gap-2 text-center">
            {[
              { icon: ShieldCheck, label: "AI VERIFIED" },
              { icon: Eye, label: "VISUAL DRIFT" },
              { icon: Lock, label: "ENCRYPTED" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="border border-slate-800 bg-navy-950/60 p-2 flex flex-col items-center gap-1">
                <Icon className="w-4 h-4 text-signal-cyan" />
                <span className="text-[9px] font-mono text-slate-500 tracking-wider">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 text-[10px] font-mono text-slate-600 tracking-[0.18em] text-center">
          PROTECTED BY SUPABASE AUTH · TLS 1.3 · SOC2 READY
        </div>
      </div>
    </div>
  );
}
