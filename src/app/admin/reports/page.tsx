"use client";

import React, { useState, useEffect } from "react";
import { Consultation } from "@/types";
import { getAllConsultations } from "@/services/consultationService";
import { formatINR } from "@/utils/formatters";
import { formatISTDate } from "@/utils/date";
import { BarChart3, Download, TrendingUp, Calendar, CheckCircle2 } from "lucide-react";

export default function AdminReportsPage() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const list = await getAllConsultations();
        setConsultations(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const completed = consultations.filter((c) => c.status === "COMPLETED");
  const rescheduled = consultations.filter((c) => c.rescheduled);
  const totalRevenue = completed.reduce((sum, c) => sum + (c.consultationFee || 0), 0);

  const handleExportCSV = () => {
    const headers = [
      "Consultation ID",
      "Patient Name",
      "Patient Age",
      "Doctor ID",
      "Franchise ID",
      "Disease",
      "Requested Time",
      "Confirmed Time",
      "Fee (INR)",
      "Status",
      "Rescheduled",
      "Reschedule Reason",
    ];

    const rows = consultations.map((c) => [
      c.consultationId,
      `"${c.patientNameSnapshot}"`,
      c.patientAgeSnapshot,
      c.doctorId,
      c.franchiseId,
      `"${c.disease}"`,
      `"${c.requestedDate} ${c.requestedTime}"`,
      `"${c.consultationDate} ${c.consultationTime}"`,
      c.consultationFee,
      c.status,
      c.rescheduled ? "YES" : "NO",
      `"${c.rescheduleReason || ""}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `CMGC_Consultations_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cmgc-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Financial & Clinical Reports</h1>
          <p className="text-xs text-slate-500 mt-1">
            Revenue audits, consultation volume metrics, and CSV data export.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
        >
          <Download className="h-4 w-4" /> Export CSV Report
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-emerald-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Gross Realized Revenue
          </span>
          <div className="mt-1 text-2xl font-extrabold text-emerald-700">
            {formatINR(totalRevenue)}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">From completed consultations</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Total Consultations
          </span>
          <div className="mt-1 text-2xl font-extrabold text-slate-900">
            {consultations.length}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">All recorded bookings</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Completed Consultations
          </span>
          <div className="mt-1 text-2xl font-extrabold text-blue-700">
            {completed.length}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Concluded medical visits</p>
        </div>

        <div className="rounded-xl border border-purple-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 block">
            Rescheduled Bookings
          </span>
          <div className="mt-1 text-2xl font-extrabold text-purple-900">
            {rescheduled.length}
          </div>
          <p className="mt-1 text-[11px] text-purple-600">Preserved historical times</p>
        </div>
      </div>
    </div>
  );
}
