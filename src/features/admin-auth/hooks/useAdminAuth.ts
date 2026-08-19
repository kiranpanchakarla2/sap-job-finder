"use client";

import { useAuth } from "@/auth/AuthContext";
import { isSuperAdminRole } from "@/lib/auth/roles";

export function useAdminAuth() {
  const { user, profile, role, isAuthenticated, isLoading, logout, refreshSession } = useAuth();

  const isSuperAdmin = Boolean(
    isAuthenticated && role && isSuperAdminRole(role)
  );

  return {
    isSuperAdmin,
    adminUser: user,
    profile,
    role,
    isAuthenticated,
    isLoading,
    logout,
    refreshSession,
  };
}
