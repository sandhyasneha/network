// frontend/src/lib/auth.js — Supabase Auth replacement for Emergent OAuth.
// Drop in over the existing /app/frontend/src/lib/auth.js when deploying to Vercel.

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      setUser({
        user_id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.full_name || data.user.email.split("@")[0],
        picture: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture,
      });
    } else {
      setUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, _session) => {
      refresh();
    });
    return () => sub.subscription.unsubscribe();
  }, [refresh]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/login";
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, checkAuth: refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

// Login button helper — call this from Login.jsx instead of redirecting to auth.emergentagent.com:
//
//   import { supabase } from "@/lib/supabase";
//   const handleGoogle = () =>
//     supabase.auth.signInWithOAuth({
//       provider: "google",
//       options: { redirectTo: window.location.origin + "/" }
//     });
