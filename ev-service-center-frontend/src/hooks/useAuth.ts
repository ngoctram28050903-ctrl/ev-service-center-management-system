import { useState, useEffect } from 'react';
import { IUserRole, User } from '@/types/common';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const storedUser = localStorage.getItem("user");
        const token = localStorage.getItem("token");

        if (!storedUser || !token) {
          setUser(null);
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
        setIsLoading(false);
      } catch (error) {
        console.error("Error checking authentication:", error);
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const hasRole = (requiredRoles: string[]): boolean => {
    if (!user || !user.userRoles) return false;

    const userRoles = user.userRoles.map((ur: IUserRole) => ur.role.name);
    return requiredRoles.some(role => userRoles.includes(role));
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setIsAuthenticated(false);
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    hasRole,
    logout,
  };
};
