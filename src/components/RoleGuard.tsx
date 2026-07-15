import { ReactNode } from 'react';
import { usePermissions, type Feature } from '@/hooks/usePermissions';

interface RoleGuardProps {
  /** The feature to check access for */
  feature?: Feature;
  /** Alternatively, specify allowed roles directly */
  allowedRoles?: string[];
  /** Content to render when access is denied (defaults to nothing) */
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * RoleGuard — conditionally renders children based on the user's role/permissions.
 *
 * Usage:
 *   <RoleGuard feature="invoices">
 *     <InvoicesPage />
 *   </RoleGuard>
 *
 *   <RoleGuard allowedRoles={['Owner', 'Admin']}>
 *     <DeleteButton />
 *   </RoleGuard>
 */
export default function RoleGuard({ feature, allowedRoles, fallback = null, children }: RoleGuardProps) {
  const { hasPermission, userRole } = usePermissions();

  // Check by feature permission
  if (feature) {
    if (!hasPermission(feature)) {
      return <>{fallback}</>;
    }
  }

  // Check by explicit role list
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(userRole)) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}
