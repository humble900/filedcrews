import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface Company {
  id: string;
  name: string;
  prefix: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  company: Company | null;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    company: null,
    loading: true,
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          // Fetch company in a setTimeout to avoid Supabase deadlock
          setTimeout(async () => {
            const { data: company } = await supabase
              .from('companies')
              .select('id, name, prefix')
              .eq('auth_user_id', session.user.id)
              .maybeSingle();
            setState({
              user: session.user,
              session,
              company: company ?? null,
              loading: false,
            });
          }, 0);
        } else {
          setState({ user: null, session: null, company: null, loading: false });
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        supabase
          .from('companies')
          .select('id, name, prefix')
          .eq('auth_user_id', session.user.id)
          .maybeSingle()
          .then(({ data: company }) => {
            setState({
              user: session.user,
              session,
              company: company ?? null,
              loading: false,
            });
          });
      } else {
        setState({ user: null, session: null, company: null, loading: false });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const createCompany = async (name: string, prefix: string) => {
    if (!state.user) return { error: new Error('Not authenticated') };
    const { data, error } = await supabase
      .from('companies')
      .insert({ auth_user_id: state.user.id, name, prefix: prefix.toUpperCase() })
      .select('id, name, prefix')
      .single();
    if (!error && data) {
      setState((prev) => ({ ...prev, company: data }));
    }
    return { data, error };
  };

  const refetchCompany = async () => {
    if (!state.user) return;
    const { data } = await supabase
      .from('companies')
      .select('id, name, prefix')
      .eq('auth_user_id', state.user.id)
      .maybeSingle();
    setState((prev) => ({ ...prev, company: data ?? null }));
  };

  return {
    ...state,
    signUp,
    signIn,
    signOut,
    createCompany,
    refetchCompany,
  };
}
