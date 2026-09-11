"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Stethoscope,
  Users,
  PlusCircle,
  CalendarDays,
  FileSignature,
  Building2,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/franchise/dashboard", icon: LayoutDashboard },
  { label: "Assigned Doctors", href: "/franchise/doctors", icon: Stethoscope },
  { label: "Patients", href: "/franchise/patients", icon: Users },
  { label: "Book Consultation", href: "/franchise/consultations/new", icon: PlusCircle },
  { label: "Consultations", href: "/franchise/consultations", icon: CalendarDays },
  { label: "Prescriptions", href: "/franchise/prescriptions", icon: FileSignature },
  { label: "Franchise Profile", href: "/franchise/profile", icon: Building2 },
];

export const FranchiseSidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-white min-h-[calc(100vh-4rem)] p-4 hidden md:block">
      <div className="mb-4 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Franchise Portal
      </div>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/franchise/dashboard" && pathname.startsWith(item.href));
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
