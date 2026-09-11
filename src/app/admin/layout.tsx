import React from "react";
import { RoleGuard } from "@/components/layout/RoleGuard";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Outlet } from "react-router-dom";

export default function AdminLayout({ children }: { children?: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <div className="min-h-screen bg-slate-50">
        <AppNavbar />
        <div className="flex">
          <AdminSidebar />
          <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
            {children || <Outlet />}
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}

