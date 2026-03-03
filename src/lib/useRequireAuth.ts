"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/authContext";

/**
 * useRequireAuth — drop this into any protected page.
 * If the user is not logged in, redirects to /login?redirect=<current_path>
 * After login, the login page sends them back here.
 *
 * Usage:
 *   const { isAuthenticated, isLoading } = useRequireAuth();
 *   if (isLoading) return <Spinner />;
 *   if (!isAuthenticated) return null; // redirecting
 */
export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isAuthenticated, isLoading, router, pathname]);

  return { isAuthenticated, isLoading };
}
