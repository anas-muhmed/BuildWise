"use client";
import { useEffect } from "react";
import { useAuth } from "@/lib/authContext";

/**
 * useRequireAuth — drop this into any protected page.
 * If the user is not logged in, the global auth modal opens automatically.
 * 
 * Usage:
 *   const { isAuthenticated, isLoading } = useRequireAuth();
 *   if (isLoading) return <Spinner />;
 *   if (!isAuthenticated) return null; // modal is shown globally
 */
export function useRequireAuth() {
  const { isAuthenticated, isLoading, openAuthModal } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      openAuthModal();
    }
  }, [isAuthenticated, isLoading, openAuthModal]);

  return { isAuthenticated, isLoading };
}
