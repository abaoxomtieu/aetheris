import { useAuth } from "@/hooks/use-auth";
import { Redirect, useLocation } from "wouter";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /**
   * If true, the route is only accessible to unauthenticated users
   * If false, the route is only accessible to authenticated users
   */
  isAuthRoute?: boolean;
  /**
   * Where to redirect if the route protection fails
   */
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  isAuthRoute = false,
  redirectTo = isAuthRoute ? "/roles" : "/login"
}: ProtectedRouteProps) {
  const { user } = useAuth();
  const [location] = useLocation();

  // If this is an auth route (login/register) and user is logged in, redirect to dashboard
  if (isAuthRoute && user) {
    return <Redirect to={redirectTo} />;
  }

  // If this is a protected route and user is not logged in, redirect to login
  if (!isAuthRoute && !user) {
    return <Redirect to={redirectTo} />;
  }

  return <>{children}</>;
}