"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import AuthLoading from "./AuthLoading";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export default function ProtectedRoute({ 
  children, 
  requiredRoles = [] 
}: ProtectedRouteProps) {
  const { isLoading, isAuthenticated, hasRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        // No user or token, redirect to signin
        router.push("/signin");
        return;
      }

      // Check roles if required
      if (requiredRoles.length > 0 && !hasRole(requiredRoles)) {
        // Missing required role, redirect to home page
        router.push("/");
        return;
      }
    }
  }, [isLoading, isAuthenticated, hasRole, requiredRoles, router]);

  // Show loading while checking authentication
  if (isLoading) {
    return <AuthLoading />;
  }

  // If user exists and passes validation, render children
  if (isAuthenticated && (requiredRoles.length === 0 || hasRole(requiredRoles))) {
    return <>{children}</>;
  }

  // Fallback - render nothing while redirecting
  return null;
}
