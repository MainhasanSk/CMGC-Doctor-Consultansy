"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Inbox,
  CalendarClock,
  CheckCircle2,
  Users,
  FileSignature,
  UserCheck,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/doctor/dashboard", icon: LayoutDashboard },
  { label: "Requests Queue", href: "/doctor/requests", icon: Inbox },
  { label: "Upcoming Consultations", href: "/doctor/upcoming", icon: CalendarClock },
  { label: "Completed Consultations", href: "/doctor/completed", icon: CheckCircle2 },
  { label: "My Patients", href: "/doctor/patients", icon: Users },
  { label: "Prescriptions", href: "/doctor/prescriptions", icon: FileSignature },
  { label: "Profile & Availability", href: "/doctor/profile", icon: UserCheck },
];

export const DoctorSidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-white min-h-[calc(100vh-4rem)] p-4 hidden md:block">
      <div className="mb-4 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Doctor Console
      </div>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/doctor/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "bg-cmgc-primary text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
