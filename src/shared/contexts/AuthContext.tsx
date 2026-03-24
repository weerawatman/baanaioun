'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { UserProfile } from '@/types/database';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isAdmin: false,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let initialLoad = true;
    let cancelled = false;
    let pingIntervalId: ReturnType<typeof setInterval> | null = null;

    const fetchProfile = async (userId: string) => {
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (!cancelled) setProfile(data ?? null);
    };

    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchProfile(session.user.id);
      }

      if (!cancelled) {
        setLoading(false);
        initialLoad = false;
      }
    };

    // Keepalive: lightweight ping every 4 minutes while tab is visible.
    // Prevents Supabase free-tier connection pool from going cold, so the
    // first user action after being idle never hits a 30-90s warm-up delay.
    const PING_INTERVAL_MS = 4 * 60 * 1000;

    const ping = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        await supabase.from('assets').select('id', { count: 'exact', head: true });
      } catch {
        // Silent — keepalive failures are non-critical
      }
    };

    const startKeepalive = () => {
      if (pingIntervalId) clearInterval(pingIntervalId);
      pingIntervalId = setInterval(ping, PING_INTERVAL_MS);
    };

    const stopKeepalive = () => {
      if (pingIntervalId) {
        clearInterval(pingIntervalId);
        pingIntervalId = null;
      }
    };

    // Shared refresh logic: called when tab regains visibility OR window focus.
    // getSession() auto-refreshes the access token if it has expired, using
    // the refresh token in the cookie — no manual token management needed.
    const refreshOnReturn = async () => {
      if (document.visibilityState !== 'visible' || cancelled) {
        stopKeepalive();
        return;
      }
      startKeepalive();
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!cancelled) setUser(session?.user ?? null);
      } catch {
        // Silent — auth refresh failure is handled by onAuthStateChange
      }
    };

    // Page Visibility: tab switching (e.g. Cmd+Tab in same browser window)
    const handleVisibilityChange = () => { refreshOnReturn(); };

    // Window Focus: returning from another app entirely (e.g. Alt+Tab OS-level).
    // visibilitychange may not fire in this scenario on some browsers/OS.
    const handleWindowFocus = () => { refreshOnReturn(); };

    getSession();
    if (document.visibilityState === 'visible') startKeepalive();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Skip the initial INITIAL_SESSION event to avoid double fetch
        if (initialLoad || cancelled) return;

        // Handle explicit sign-out first — clear state immediately
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          return;
        }

        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      stopKeepalive();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin: profile?.role === 'admin',
        loading,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
