import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface RoleBasedAccessProps {
  allowedRoles: ('admin' | 'member')[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * RBAC Component - Renders content based on user role
 *
 * Usage:
 * <RoleBasedAccess allowedRoles={['admin']}>
 *   <AdminOnlyComponent />
 * </RoleBasedAccess>
 *
 * <RoleBasedAccess allowedRoles={['admin', 'member']}>
 *   <AccessibleToAll />
 * </RoleBasedAccess>
 */
export const RoleBasedAccess: React.FC<RoleBasedAccessProps> = ({
  allowedRoles,
  children,
  fallback = null,
}) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <>{fallback}</>;
  }

  const hasAccess = allowedRoles.includes(user.role as 'admin' | 'member');

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

/**
 * Admin Only Component - Shorthand for admin-only access
 */
export const AdminOnly: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => (
  <RoleBasedAccess allowedRoles={['admin']} fallback={fallback}>
    {children}
  </RoleBasedAccess>
);

/**
 * Authenticated Only Component - For any logged-in user
 */
export const AuthenticatedOnly: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => (
  <RoleBasedAccess allowedRoles={['admin', 'member']} fallback={fallback}>
    {children}
  </RoleBasedAccess>
);

/**
 * Role Badge Component - Shows user's role
 */
export const RoleBadge: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { user } = useAuth();

  if (!user) return null;

  const roleStyles = {
    admin: 'bg-red-100 text-red-800 border-red-200',
    member: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        roleStyles[user.role as keyof typeof roleStyles] || 'bg-gray-100 text-gray-800 border-gray-200'
      } ${className}`}
    >
      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
    </span>
  );
};

/**
 * Hook to check user permissions
 */
export const usePermissions = () => {
  const { user, isAuthenticated } = useAuth();

  const hasRole = (role: 'admin' | 'member') => {
    return isAuthenticated && user?.role === role;
  };

  const hasAnyRole = (roles: ('admin' | 'member')[]) => {
    return isAuthenticated && user && roles.includes(user.role as 'admin' | 'member');
  };

  const isAdmin = () => hasRole('admin');
  const isMember = () => hasRole('member');
  const canInviteUsers = () => isAdmin(); // Only admins can invite
  const canDeleteUsers = () => isAdmin(); // Only admins can delete
  const canViewAnalytics = () => isAuthenticated; // Both can view basic analytics
  const canManageSubscription = () => isAdmin(); // Only admins can manage subscription

  return {
    hasRole,
    hasAnyRole,
    isAdmin,
    isMember,
    canInviteUsers,
    canDeleteUsers,
    canViewAnalytics,
    canManageSubscription,
  };
};