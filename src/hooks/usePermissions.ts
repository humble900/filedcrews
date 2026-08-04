import { useAuth } from './useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Global Role Hierarchy (company-wide access):
 *   Owner > Admin > Finance | Dispatcher > Field Crew
 *
 * Role assignment rules:
 *   - The business Owner (companies.auth_user_id) can ALWAYS assign roles and toggle can_manage_roles
 *   - Staff with can_manage_roles = true can assign global_role to other staff (but NOT to themselves,
 *     and cannot grant/revoke can_manage_roles — only the Owner can do that)
 *   - All other staff cannot change any roles
 */

export type GlobalRole = 'Owner' | 'Admin' | 'Finance' | 'Dispatcher' | 'Field Crew';

export type Feature =
  | 'overview'
  | 'projects'
  | 'jobs'
  | 'map'
  | 'schedule'
  | 'crm'
  | 'staff'
  | 'invoices'
  | 'estimates'
  | 'change-orders'
  | 'safety'
  | 'reports'
  | 'tracker'
  | 'billing'
  | 'memberships'
  | 'timesheets'
  | 'compliance'
  | 'settings'
  | 'inventory'
  | 'marketplace'
  | 'ai-agent';

/**
 * Permission matrix: which roles can access which features.
 * true = full access, 'read' = read-only access, false = no access
 */
const PERMISSION_MATRIX: Record<Feature, Record<GlobalRole, boolean | 'read'>> = {
  'overview':       { Owner: true,  Admin: true,  Finance: true,   Dispatcher: true,  'Field Crew': false },
  'projects':       { Owner: true,  Admin: true,  Finance: 'read', Dispatcher: true,  'Field Crew': false },
  'jobs':           { Owner: true,  Admin: true,  Finance: false,  Dispatcher: true,  'Field Crew': false },
  'map':            { Owner: true,  Admin: true,  Finance: false,  Dispatcher: true,  'Field Crew': false },
  'schedule':       { Owner: true,  Admin: true,  Finance: false,  Dispatcher: true,  'Field Crew': false },
  'crm':            { Owner: true,  Admin: true,  Finance: true,   Dispatcher: false, 'Field Crew': false },
  'staff':          { Owner: true,  Admin: true,  Finance: false,  Dispatcher: false, 'Field Crew': false },
  'invoices':       { Owner: true,  Admin: true,  Finance: true,   Dispatcher: false, 'Field Crew': false },
  'estimates':      { Owner: true,  Admin: true,  Finance: true,   Dispatcher: false, 'Field Crew': false },
  'change-orders':  { Owner: true,  Admin: true,  Finance: true,   Dispatcher: false, 'Field Crew': false },
  'safety':         { Owner: true,  Admin: true,  Finance: false,  Dispatcher: true,  'Field Crew': false },
  'reports':        { Owner: true,  Admin: true,  Finance: true,   Dispatcher: false, 'Field Crew': false },
  'tracker':        { Owner: true,  Admin: true,  Finance: false,  Dispatcher: true,  'Field Crew': false },
  'billing':        { Owner: true,  Admin: true,  Finance: true,   Dispatcher: false, 'Field Crew': false },
  'memberships':    { Owner: true,  Admin: true,  Finance: true,   Dispatcher: false, 'Field Crew': false },
  'timesheets':     { Owner: true,  Admin: true,  Finance: true,   Dispatcher: true,  'Field Crew': true },
  'compliance':     { Owner: true,  Admin: true,  Finance: false,  Dispatcher: true,  'Field Crew': false },
  'settings':       { Owner: true,  Admin: true,  Finance: true,   Dispatcher: true,  'Field Crew': false },
  'inventory':      { Owner: true,  Admin: true,  Finance: true,   Dispatcher: false, 'Field Crew': false },
  'marketplace':    { Owner: true,  Admin: true,  Finance: false,  Dispatcher: false, 'Field Crew': false },
  'ai-agent':       { Owner: true,  Admin: true,  Finance: false,  Dispatcher: false, 'Field Crew': false },
};

/** Color map for role badges */
export const ROLE_COLORS: Record<string, string> = {
  Owner:        'bg-amber-500/20 text-amber-400 border-amber-500/30',
  Admin:        'bg-violet-500/20 text-violet-400 border-violet-500/30',
  Finance:      'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  Dispatcher:   'bg-sky-500/20 text-sky-400 border-sky-500/30',
  'Field Crew': 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

export function usePermissions() {
  const { staffProfile, company } = useAuth();

  // Fetch company roles
  const { data: dbRoles = [] } = useQuery({
    queryKey: ['roles_permissions_eval', company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .eq('company_id', company.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!company?.id,
  });

  // Determine effective global role
  let userRole: GlobalRole = 'Field Crew';
  let isCustomRole = false;

  if (company && !staffProfile) {
    // User logged in as the business owner (no staffProfile = owner account)
    userRole = 'Owner';
  } else if (staffProfile) {
    const r = staffProfile.global_role as string;
    if (r === 'Admin' || r === 'Finance' || r === 'Dispatcher' || r === 'Field Crew') {
      userRole = r;
    } else {
      isCustomRole = true;
    }
  }

  // Find matching custom role definition
  const matchedCustomRole = isCustomRole
    ? dbRoles.find((role: any) => role.name === staffProfile?.global_role)
    : null;

  const tier = company?.subscription_tier || 'free_trial';
  const isFoundingPartner = tier === 'founding_partner' || tier === 'Founding Partner';

  /** Check if a feature is unlocked under the company's current subscription tier */
  const canAccessFeatureByTier = (feature: Feature): boolean => {
    // AI Agent requires Growth, Founding Partner, or Enterprise plan
    if (feature === 'ai-agent') {
      return tier === 'growth' || isFoundingPartner || tier === 'enterprise';
    }
    return true;
  };

  /** Full or read-only access to a feature */
  const getPermission = (feature: Feature): boolean | 'read' => {
    if (!canAccessFeatureByTier(feature)) return false;
    if (userRole === 'Owner') return true;
    if (matchedCustomRole) {
      const allowedFeatures = Array.isArray(matchedCustomRole.permissions)
        ? matchedCustomRole.permissions
        : [];
      return allowedFeatures.includes(feature) ? true : false;
    }
    return PERMISSION_MATRIX[feature]?.[userRole] ?? false;
  };

  /** Has any access (full or read) to a feature */
  const hasPermission = (feature: Feature): boolean => {
    const p = getPermission(feature);
    return p === true || p === 'read';
  };

  /** Has full write access to a feature */
  const hasFullAccess = (feature: Feature): boolean =>
    getPermission(feature) === true;

  /** Calculated seat quotas for current company tier */
  const isFreeTrial = tier === 'free_trial' || tier === 'Free';
  const rawMaxAdmin = company?.max_admin_seats;
  const rawMaxCrew = company?.max_field_crew_seats;

  // Strict tier-based seat allocation (Free Trial = 1 Admin, 2 Field Crew)
  const maxAdminSeats = isFreeTrial
    ? 1
    : (rawMaxAdmin ?? (tier === 'growth' ? 3 : (isFoundingPartner ? 20 : (tier === 'enterprise' ? 50 : 1))));

  const maxFieldCrewSeats = isFreeTrial
    ? 2
    : (rawMaxCrew ?? (tier === 'growth' ? 7 : (isFoundingPartner ? 20 : (tier === 'enterprise' ? 100 : 2))));

  /**
   * Whether this user can access the admin dashboard (DashboardLayout)
   * vs being restricted to StaffPortal only.
   */
  const canAccessDashboard = userRole !== 'Field Crew' || matchedCustomRole !== null;

  /** True only for the business owner account */
  const isOwner = userRole === 'Owner';

  /**
   * Can assign global_role to OTHER staff members in the company.
   * True for: business Owner, OR staff with can_manage_roles = true
   */
  const canManageRoles = isOwner || (staffProfile?.can_manage_roles === true);

  /**
   * Can grant/revoke the can_manage_roles flag itself.
   * ONLY the business owner can do this.
   */
  const canDelegateRoleManagement = isOwner;

  return {
    userRole,
    subscriptionTier: tier,
    maxAdminSeats,
    maxFieldCrewSeats,
    isOwner,
    canAccessDashboard,
    canManageRoles,
    canDelegateRoleManagement,
    hasPermission,
    hasFullAccess,
    getPermission,
    canAccessFeatureByTier,
    ROLE_COLORS,
  };
}
