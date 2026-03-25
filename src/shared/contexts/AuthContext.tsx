'use client';

import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { UserProfile } from '@/types/database';
import { withTimeout } from '@/shared/utils';

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

// Constants for timeout and intervals
const AUTH_TIMEOUT = 10000; // 10s
const PING_INTERVAL_MS = 4 * 60 * 1000; // 4 mins

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Ref to prevent race conditions and concurrent fetch spam
  const isProcessingRef = useRef(false);
  const pingIntervalIdRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchProfile = useCallback(async (userId: string, cancelled: boolean) => {
    try {
      // Strict Rule 1: Always use withTimeout for data fetches
      const { data, error } = await withTimeout(
        supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle(),
        AUTH_TIMEOUT
      );
      
      if (error) console.error('AuthContext: Profile fetch error:', error);
      if (!cancelled) setProfile(data ?? null);
    } catch (err) {
      // Strict Rule 2: Handle rejections gracefully (e.g. timeout)
      console.error('AuthContext: Profile fetch timed out or failed', err);
      if (!cancelled) setProfile(null);
    }
  }, []);

  const getSession = useCallback(async (isInitial = false, cancelled: boolean) => {
    // Prevent concurrent session refreshes (Rule 2/Event Spam Fix)
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    try {
      // Strict Rule 1: Wrap auth session in timeout to prevent infinite UI hangs
      const { data: { session }, error } = await withTimeout(
        supabase.auth.getSession(),
        AUTH_TIMEOUT
      );

      if (error) throw error;
      if (cancelled) return;

      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await fetchProfile(currentUser.id, cancelled);
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error('AuthContext: Session fetch timed out or failed', err);
      if (!cancelled) {
        setUser(null);
        setProfile(null);
      }
    } finally {
      isProcessingRef.current = false;
      // Strict Rule 2: ALWAYS set loading to false in finally
      if (isInitial && !cancelled) {
        setLoading(false);
      }
    }
  }, [fetchProfile]);

  useEffect(() => {
    let cancelled = false;
    let initialLoadComplete = false;

    // Keepalive ping with timeout
    const ping = async () => {
      if (document.visibilityState !== 'visible' || !navigator.onLine) return;
      try {
        await withTimeout(
          supabase.from('assets').select('id', { count: 'exact', head: true }),
          5000
        );
      } catch { /* Silent */ }
    };

    const startKeepalive = () => {
      if (pingIntervalIdRef.current) clearInterval(pingIntervalIdRef.current);
      pingIntervalIdRef.current = setInterval(ping, PING_INTERVAL_MS);
    };

    const stopKeepalive = () => {
      if (pingIntervalIdRef.current) {
        clearInterval(pingIntervalIdRef.current);
        pingIntervalIdRef.current = null;
      }
    };

    // Debounced Refresh logic for Visibility/Focus events
    let refreshTimeout: ReturnType<typeof setTimeout>;
    const debouncedRefresh = () => {
      clearTimeout(refreshTimeout);
      refreshTimeout = setTimeout(() => {
        if (document.visibilityState === 'visible' && !cancelled) {
          startKeepalive();
          getSession(false, cancelled);
        } else {
          stopKeepalive();
        }
      }, 150); // Small debounce to merge focus + visibilitychange events
    };

    // 1. Initial Load
    getSession(true, cancelled).then(() => {
      initialLoadComplete = true;
    });

    // 2. Event Listeners
    if (document.visibilityState === 'visible') startKeepalive();
    document.addEventListener('visibilitychange', debouncedRefresh);
    window.addEventListener('focus', debouncedRefresh);

    // 3. Auth State Subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!initialLoadComplete || cancelled) return;

        if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          return;
        }

        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          await fetchProfile(currentUser.id, cancelled);
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', debouncedRefresh);
      window.removeEventListener('focus', debouncedRefresh);
      stopKeepalive();
      clearTimeout(refreshTimeout);
    };
  }, [getSession, fetchProfile]);

  const signOut = async () => {
    try {
      await withTimeout(supabase.auth.signOut(), 5000);
    } finally {
      setUser(null);
      setProfile(null);
    }
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
