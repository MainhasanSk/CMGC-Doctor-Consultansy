"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { NotificationDropdown } from "../notification/NotificationDropdown";
import { LogOut, Activity, User as UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";

export const AppNavbar: React.FC = () => {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.warn("Logout error:", err);
    }
    window.location.href = "/login";
  };

  const getRoleBadge = () => {
    switch (user?.role) {
      case "ADMIN":
        return <span className="rounded-md bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">Admin</span>;
      case "FRANCHISE":
        return <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">Franchise</span>;
      case "DOCTOR":
        return <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">Doctor</span>;
      default:
        return null;
    }
  };

  const getDashboardHome = () => {
    if (user?.role === "ADMIN") return "/admin/dashboard";
    if (user?.role === "FRANCHISE") return "/franchise/dashboard";
    if (user?.role === "DOCTOR") return "/doctor/dashboard";
    return "/login";
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur px-4 md:px-6 shadow-sm">
      <div className="flex items-center gap-3">
        <Link href={getDashboardHome()} className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white p-1 shadow-xs border border-slate-200 group-hover:border-cmgc-primary transition shrink-0">
            <img src="/logo.png" alt="CMGC Logo" className="h-full w-full object-contain" />
          </div>
          <div>
            <span className="text-base font-bold text-slate-900 tracking-tight block leading-tight">
              CMGC
            </span>
            <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider hidden sm:block">
              Chennai Medical Guidance Centre
            </span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        {user && <NotificationDropdown />}

        {user && (
          <div className="flex items-center gap-3 border-l border-slate-200 pl-3 md:pl-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-slate-800">{user.name}</span>
              <span className="text-[11px] text-slate-500">{user.email}</span>
            </div>
            {getRoleBadge()}

            <button
              onClick={handleLogout}
              title="Sign out"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-red-600 transition"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
