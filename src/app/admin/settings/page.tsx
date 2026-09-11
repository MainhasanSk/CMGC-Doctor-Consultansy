"use client";

import React from "react";
import Link from "next/link";
import { Settings, BadgePercent, ShieldCheck, Database } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">System Settings</h1>
        <p className="text-xs text-slate-500 mt-1">
          CMGC platform configuration, timezone specifications, and operational parameters.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/admin/pricing"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-cmgc-primary transition block group"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-2 text-purple-700 group-hover:bg-purple-200 transition">
              <BadgePercent className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Pricing Configuration</h2>
              <p className="text-xs text-slate-500">Configure consultation fee snapshot</p>
            </div>
          </div>
        </Link>

        <Link
          href="/seed"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-cmgc-primary transition block group"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700 group-hover:bg-emerald-200 transition">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Database Initializer</h2>
              <p className="text-xs text-slate-500">Seed test accounts & acceptance data</p>
            </div>
          </div>
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4 text-xs text-slate-700">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-cmgc-primary" /> Platform Core Specifications (V1)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Default Timezone</span>
            <span className="font-semibold text-slate-900">Asia/Kolkata (IST, UTC+05:30)</span>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Consultation Duration</span>
            <span className="font-semibold text-slate-900">30 Minutes</span>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Meeting Join Window</span>
            <span className="font-semibold text-slate-900">10 Minutes before start time</span>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Currency</span>
            <span className="font-semibold text-slate-900">INR (₹)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
