import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface Company {
  id: string;
  name: string;
  prefix: string;
  subscription_tier?: string;
  subscription_status?: string;
  max_field_crew_seats?: number;
  max_admin_seats?: number;
  currency?: string;
  [key: string]: any;
}

interface StaffProfile {
  id: string;
  username: string;
  full_name: string;
  company_id: string;
  is_active: boolean;
  global_role: string;
  can_manage_roles: boolean;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  job_title?: string | null;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  company: Company | null;
  staffProfile: StaffProfile | null;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  isTrialExpired: boolean;
  daysRemaining: number;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  createCompany: (name: string, prefix: string) => Promise<{ data?: any; error?: any }>;
  refetchCompany: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    company: null,
    staffProfile: null,
    loading: true,
  });

  // Track whether initial session has been resolved to prevent double-loading
  const initializedRef = useRef(false);

  const fetchUserData = useCallback(async (session: Session) => {
    try {
      // Try to find the user as a company owner first
      const { data: company, error: companyErr } = await supabase
        .from('companies')
        .select('*')
        .eq('auth_user_id', session.user.id)
        .maybeSingle();

      if (companyErr) {
        console.warn('[Auth] Company query error:', companyErr.message);
      }

      if (company) {
        setState({
          user: session.user,
          session,
          company,
          staffProfile: null,
          loading: false,
        });
        return;
      }

      // Not a company owner — check if they're a staff member
      const { data: staffProfile, error: staffErr } = await supabase
        .from('staff_profiles')
        .select('id, username, full_name, company_id, is_active, global_role, can_manage_roles, first_name, last_name, email, phone, address, job_title')
        .eq('auth_user_id', session.user.id)
        .maybeSingle();

      if (staffErr) {
        console.warn('[Auth] Staff profile query error:', staffErr.message);
      }

      if (staffProfile) {
        const { data: staffCompany } = await supabase
          .from('companies')
          .select('*')
          .eq('id', staffProfile.company_id)
          .maybeSingle();

        setState({
          user: session.user,
          session,
          company: staffCompany ?? null,
          staffProfile,
          loading: false,
        });
        return;
      }

      // User exists but has no company or staff profile (new user, or mid-onboarding)
      setState({
        user: session.user,
        session,
        company: null,
        staffProfile: null,
        loading: false,
      });
    } catch (err) {
      console.error('[Auth] fetchUserData error:', err);
      // Still set loading to false so the app doesn't hang
      setState({
        user: session.user,
        session,
        company: null,
        staffProfile: null,
        loading: false,
      });
    }
  }, []);

  useEffect(() => {
    // Step 1: Bootstrap from existing session (most reliable method)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (initializedRef.current) return; // Already handled by onAuthStateChange
      initializedRef.current = true;

      if (session) {
        fetchUserData(session);
      } else {
        setState(prev => ({ ...prev, loading: false }));
      }
    });

    // Step 2: Listen for auth state changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Skip INITIAL_SESSION if getSession() already handled it
        if (event === 'INITIAL_SESSION') {
          if (initializedRef.current) return;
          initializedRef.current = true;
        }

        if (session?.user) {
          // Use setTimeout to avoid Supabase internal deadlock on token refresh events
          setTimeout(() => fetchUserData(session), 0);
        } else {
          setState({
            user: null,
            session: null,
            company: null,
            staffProfile: null,
            loading: false,
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchUserData]);

  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut({ scope: 'local' });
  }, []);

  const createCompany = useCallback(async (name: string, prefix: string) => {
    if (!state.user) return { error: new Error('Not authenticated') };
    const { data, error } = await supabase
      .from('companies')
      .insert({ auth_user_id: state.user.id, name, prefix: prefix.toUpperCase(), currency: 'USD' })
      .select('*')
      .single();
    if (!error && data) {
      setState((prev) => ({ ...prev, company: data }));
    }
    return { data, error };
  }, [state.user]);

  const refetchCompany = useCallback(async () => {
    if (!state.user) return;
    const { data } = await supabase
      .from('companies')
      .select('*')
      .eq('auth_user_id', state.user.id)
      .maybeSingle();
    setState((prev) => ({ ...prev, company: data ?? null }));
  }, [state.user]);

  const calculateTrialStatus = () => {
    if (!state.company) return { isTrialExpired: false, daysRemaining: 14 };
    const trialDurationDays = 14;
    const createdAtDate = new Date(state.company.created_at);
    const trialEndDate = new Date(createdAtDate.getTime() + trialDurationDays * 24 * 60 * 60 * 1000);
    const now = new Date();
    const timeDiff = trialEndDate.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
    const isTrialExpired = timeDiff <= 0 && state.company.subscription_tier !== 'Founding Partner';
    return { isTrialExpired, daysRemaining };
  };

  const { isTrialExpired, daysRemaining } = calculateTrialStatus();

  const contextValue: AuthContextType = {
    ...state,
    isTrialExpired,
    daysRemaining,
    signUp,
    signIn,
    signOut,
    createCompany,
    refetchCompany,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
