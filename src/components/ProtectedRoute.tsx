import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions, type Feature } from '@/hooks/usePermissions';
import { Loader2 } from 'lucide-react';

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
  const { user, loading } = useAuth();
  const { hasPermission, canAccessDashboard } = usePermissions();

  if (loading) {
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
