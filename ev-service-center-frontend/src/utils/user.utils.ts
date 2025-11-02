import { IUserRole, User } from '@/types/common';
import { UserRole } from '@/constants/user.constant';

/**
 * Get the primary role of a user from userRoles array
 */
export const getUserPrimaryRole = (user: User | null): string => {
  if (!user?.userRoles?.length) return 'Student';
  return user.userRoles[0].role.name;
};

/**
 * Check if user has a specific role
 */
export const hasRole = (user: User | null, role: UserRole): boolean => {
  if (!user?.userRoles?.length) return false;
  return user.userRoles.some((ur: IUserRole) => ur.role.name === role);
};

/**
 * Check if user has any of the specified roles
 */
export const hasAnyRole = (user: User | null, roles: UserRole[]): boolean => {
  if (!user?.userRoles?.length) return false;
  return user.userRoles.some((ur: IUserRole) => roles.includes(ur.role.name as UserRole));
};

export const getRolesObject = (roles: IUserRole[]): Record<string, boolean> => {
  const rolesObject: Record<string, boolean> = {};
  roles.forEach(role => {
    rolesObject[role.role.name] = true;
  });
  console.log(rolesObject);
  return rolesObject;
}

