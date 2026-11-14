"use client";

/**
 * Crestix Probe - useRequireAuth Hook
 * Guards protected routes, directing unauthenticated visitors to login
 * while preserving their intended destination.
 */

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export interface UseRequireAuthOptions {
  redirectTo?: string;
  requiredClearance?: string;
}

export function useRequireAuth(options: UseRequireAuthOptions = {}) {
  const { redirectTo = "/login" } = options;
  const { user, session, status, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const search = typeof window !== "undefined" ? window.location.search : "";
      const fullPath = search ? `${pathname}${search}` : pathname;
      const target = `${redirectTo}?redirect=${encodeURIComponent(fullPath || "/dashboard")}`;
      router.replace(target);
    }
  }, [isLoading, isAuthenticated, router, pathname, redirectTo]);

  return {
    user,
    session,
    status,
    isLoading,
    isAuthenticated,
  };
}
