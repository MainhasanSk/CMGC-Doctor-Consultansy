import React from "react";
import { RoleGuard } from "@/components/layout/RoleGuard";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { FranchiseSidebar } from "@/components/layout/FranchiseSidebar";
import { Outlet } from "react-router-dom";

export default function FranchiseLayout({ children }: { children?: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={["FRANCHISE"]}>
      <div className="min-h-screen bg-slate-50">
        <AppNavbar />
        <div className="flex">
          <FranchiseSidebar />
          <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
            {children || <Outlet />}
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}

