"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types";
import { ShieldAlert, Loader2 } from "lucide-react";

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      } else if (!allowedRoles.includes(user.role)) {
        // Redirect to their respective dashboard
        if (user.role === "ADMIN") router.push("/admin/dashboard");
        else if (user.role === "FRANCHISE") router.push("/franchise/dashboard");
        else if (user.role === "DOCTOR") router.push("/doctor/dashboard");
      }
    }
  }, [user, loading, allowedRoles, router, pathname]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-cmgc-primary border-t-transparent" />
          <p className="text-sm font-medium text-slate-600">Verifying authorized access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (user.status !== "ACTIVE") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
        <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-lg border border-red-200">
          <ShieldAlert className="mx-auto h-12 w-12 text-red-600" />
          <h2 className="mt-4 text-xl font-bold text-slate-800">Account Deactivated</h2>
          <p className="mt-2 text-sm text-slate-600">
            Your CMGC account has been deactivated. Please contact Chennai Medical Guidance Centre administration for assistance.
          </p>
        </div>
      </div>
    );
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow border border-amber-200">
          <ShieldAlert className="mx-auto h-12 w-12 text-amber-600" />
          <h2 className="mt-4 text-xl font-bold text-slate-800">403 — Access Restricted</h2>
          <p className="mt-2 text-sm text-slate-600">
            You do not have permission to view this section of the CMGC portal.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
