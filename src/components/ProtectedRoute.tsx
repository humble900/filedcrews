import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions, type Feature } from '@/hooks/usePermissions';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  /** The feature this route requires access to */
  feature: Feature;
  children: ReactNode;
}

/**
 * ProtectedRoute — wraps a page route to enforce:
 *  1. User must be authenticated
 *  2. User must have the required role/permission for this feature
 *
 * Unauthorized users are redirected to "/" (which handles landing/login/staff routing).
 */
export default function ProtectedRoute({ feature, children }: ProtectedRouteProps) {
  const { user, company, loading } = useAuth();
  const { hasPermission, canAccessDashboard } = usePermissions();

  // Check if current user is listed in platform_admins
  const { data: isSuperadmin = false, isLoading: loadingAdmin } = useQuery({
    queryKey: ["is_superadmin_route", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data, error } = await supabase
        .from("platform_admins")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) return false;
      return !!data;
    },
    enabled: !!user?.id
  });

  if (loading || (user && loadingAdmin)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not logged in → send to home (which shows landing page)
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // If platform superadmin, redirect to superadmin console
  if (isSuperadmin) {
    return <Navigate to="/superadmin" replace />;
  }

  // If company is waiting for waitlist approval, redirect to /wizard
  if (company?.subscription_status === 'pending_approval') {
    return <Navigate to="/wizard" replace />;
  }

  // Logged in but cannot access the dashboard at all (Field Crew)
  if (!canAccessDashboard) {
    return <Navigate to="/" replace />;
  }

  // Logged in, has dashboard access, but not authorized for THIS feature
  if (!hasPermission(feature)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

