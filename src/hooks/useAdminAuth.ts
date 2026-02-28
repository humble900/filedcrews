import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

interface AdminAuthState {
  isAuthenticated: boolean;
  loading: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
}

const STORED_KEY = 'admin_authenticated';

export const useAdminAuth = create<AdminAuthState>((set) => ({
  isAuthenticated: localStorage.getItem(STORED_KEY) === 'true',
  loading: false,
  login: async (password: string) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.functions.invoke('admin_verify_password', {
        body: { password },
      });
      if (error || !data?.ok) {
        set({ loading: false });
        return false;
      }
      localStorage.setItem(STORED_KEY, 'true');
      set({ isAuthenticated: true, loading: false });
      return true;
    } catch {
      set({ loading: false });
      return false;
    }
  },
  logout: () => {
    localStorage.removeItem(STORED_KEY);
    set({ isAuthenticated: false });
  },
}));
